# 💻 Local Development: Polling vs Webhooks

When building a Telegram bot, your bot needs a way to receive updates (messages, button clicks) from Telegram's servers. There are two ways to do this: **Long Polling** and **Webhooks**.

Because the **Ultra Telegram Framework (UTF)** is heavily optimized for Serverless environments like Google Apps Script (GAS) and Cloudflare Workers, your production bot will almost certainly use Webhooks. 

However, testing Webhooks locally on your computer is frustrating. This guide explains the difference and shows how to set up a seamless local development workflow.

---

## ⚖️ Polling vs. Webhooks

### 1. Long Polling (The "Pull" Method)
Your bot actively connects to Telegram and asks, *"Do you have any new messages for me?"* If there are none, the connection stays open for a few seconds before trying again.
* **Pros:** Works perfectly on your local Wi-Fi. No public IP address, SSL certificate, or router configuration required. Just run your script, and it works.
* **Cons:** Not supported on serverless platforms like GAS or Cloudflare (they cannot keep long-running connections open in the background).

### 2. Webhooks (The "Push" Method)
You give Telegram a public URL (e.g., `https://script.google.com/...`). Whenever a user messages the bot, Telegram immediately sends an HTTP POST request to that URL.
* **Pros:** Instantaneous, highly efficient, and strictly required for Serverless (GAS/Edge) deployments.
* **Cons:** Hard to test locally because your `localhost` is not accessible to Telegram's servers without third-party tunnels.

---

## 🛠️ The UTF Solution: Seamless Switching

UTF makes it incredibly easy to use **Polling for local development** and **Webhooks for production** without changing a single line of your business logic. 

By taking advantage of UTF's decoupled Adapters, you can create a separate entry point file specifically for local development.

### Step 1: Create a Local Entry Point (`dev.ts`)

Instead of using `GasApiClient` and `GasHybridStorage`, you will initialize your bot using the Node.js adapter and `MemoryStorage`.

```typescript
import { Bot, WebApiClient, session, MemoryStorage } from 'tg-framework';

// Optional: Import your modular scenes and routers from other files
// import { registrationScene } from './scenes'; 

const TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';

// 1. Use the WebApiClient for Node.js local development
const bot = new Bot(TOKEN, new WebApiClient(TOKEN));

// 2. Use MemoryStorage (since GAS Cache doesn't exist locally)
bot.use(session({ storage: new MemoryStorage() }));

// 3. Add your logic (or import it from a shared router)
bot.command('start', async (ctx) => {
  await ctx.reply("Hello from localhost! 💻");
});

// 4. Start Long Polling!
bot.launch()
  .then(() => console.log("Bot is running locally via Polling!"))
  .catch(console.error);

```

### Step 2: Run it locally

You can run this file directly using tools like `ts-node` or `tsx` during development. Add this script to your `package.json`:

```json
{
  "scripts": {
    "dev": "ts-node src/dev.ts"
  }
}

```

Run `npm run dev` in your terminal. Your bot will instantly connect to Telegram and start responding to messages right from your computer.

---

## 🚢 Moving to Production (GAS Webhooks)

When you are ready to publish your bot to Google Apps Script, you leave `dev.ts` alone. Instead, your build tool (like `esbuild`) should point to your production entry point (e.g., `index.ts`), which uses the Webhook method (`handleUpdate`).

```typescript
import { Bot, GasApiClient, session, GasHybridStorage } from 'tg-framework';

// Use GAS specific adapter and storage
const bot = new Bot('TOKEN', new GasApiClient('TOKEN'));
bot.use(session({ storage: new GasHybridStorage() }));

// ... SAME shared business logic ...

// Expose the Webhook endpoint for Google Apps Script
declare const global: any;
global.doPost = (e: any) => {
  if (e.postData && e.postData.contents) {
    const update = JSON.parse(e.postData.contents);
    
    // Instead of .launch(), we feed the update directly into the bot
    bot.handleUpdate(update);
  }
  return ContentService.createTextOutput('OK');
};

```

---

## 🚇 Advanced: Testing Webhooks Locally (ngrok)

If you absolutely *must* test Webhooks locally instead of Polling (for example, to test extremely specific HTTP header behavior), you can use a tunneling tool like **ngrok** or **Cloudflare Tunnels**.

1. Install `ngrok` and run: `ngrok http 3000`
2. `ngrok` will give you an HTTPS URL (e.g., `https://abcd.ngrok.app`).
3. Tell Telegram to send updates to this URL:
`https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://abcd.ngrok.app`
4. Write a simple Express server in Node.js on port 3000 that passes the `req.body` into `bot.handleUpdate(req.body)`.

*Note: For 99% of development, the Long Polling method (`bot.launch()`) is much faster, requires zero configuration, and provides the exact same developer experience!*