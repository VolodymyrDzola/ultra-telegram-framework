# ⚡️ Edge Computing (Cloudflare Workers)

While Google Apps Script (GAS) is fantastic for basic bots and deep integration with Google Sheets, it has strict execution timeouts and rate limits. 

If your bot goes viral and starts receiving hundreds of messages per second, the best place to host it for free is on the **Edge** (e.g., Cloudflare Workers). 

Edge environments run your code globally, close to the user, with **zero cold starts** and massive free tiers (Cloudflare offers 100,000 requests per day for free). The **Ultra Telegram Framework (UTF)** is perfectly optimized for these modern environments.

---

## 🏗️ How UTF Works on the Edge

Unlike traditional Node.js servers, Cloudflare Workers do not use the `http` module. Instead, they rely on the standard **Web Fetch API**.

Because UTF abstracts its network layer, you don't need to change any of your scenes, menus, or commands. You simply use the `WebApiClient` and wire your bot to the Cloudflare `fetch` event.

### The Cloudflare Worker Setup

Here is a complete, production-ready example of a UTF bot running on a Cloudflare Worker:

```typescript
import { Bot, WebApiClient, session, MemoryStorage } from 'tg-framework';

// 1. Initialize the bot OUTSIDE the fetch handler
// This allows Cloudflare to cache the instance between warm requests!
const TOKEN = 'YOUR_TELEGRAM_TOKEN';
const bot = new Bot(TOKEN, new WebApiClient(TOKEN));

// 2. Setup your bot logic (Commands, Scenes, Menus)
bot.use(session({ storage: new MemoryStorage() }));

bot.command('start', async (ctx) => {
  await ctx.reply("Hello from the Edge! 🌍⚡️");
});

// 3. The Cloudflare Worker Export
export default {
  async fetch(request: Request, env: any, executionCtx: ExecutionContext) {
    // We only care about POST requests from Telegram
    if (request.method === 'POST') {
      try {
        const update = await request.json();

        // PRO TIP: Use ctx.waitUntil for background execution!
        // This tells Cloudflare to keep the worker alive to finish processing 
        // the bot logic, while immediately returning a 200 OK to Telegram.
        executionCtx.waitUntil(
          bot.handleUpdate(update).catch(console.error)
        );

        return new Response('OK', { status: 200 });
        
      } catch (error) {
        return new Response('Bad Request', { status: 400 });
      }
    }

    // Fallback for browser visits
    return new Response('Telegram Bot is running on Cloudflare Workers.', { status: 200 });
  }
};

```

---

## 🧠 The Magic of `waitUntil()`

Notice the `executionCtx.waitUntil(...)` method in the code above. This is a superpower of Cloudflare Workers.

In a normal serverless environment, if you return an `HTTP 200 OK` response to Telegram, the server instantly kills your script. Any database saves or long API calls (like waiting for ChatGPT to reply via `ctx.replyWithDraft()`) would be interrupted.

By wrapping `bot.handleUpdate()` in `waitUntil()`, you explicitly tell Cloudflare: *"Return the 200 OK to Telegram instantly so they know we got the message, but do not kill the script until the bot finishes processing the logic!"*

---

## 💾 Sessions on Cloudflare Workers

Cloudflare Workers are stateless. While they do keep some memory alive between "warm" invocations, you cannot rely on `MemoryStorage` for long-term data (like multi-day `WizardScene` forms).

If you are using Scenes or need persistent sessions on Cloudflare, you should create a custom Storage adapter that uses **Cloudflare KV** (Key-Value storage).

### Example KV Storage Implementation:

```typescript
import { Storage } from 'tg-framework';

// Assuming you bound a KV namespace called `BOT_SESSIONS` in wrangler.toml
export class CloudflareKVStorage implements Storage {
  constructor(private kv: KVNamespace) {}

  async get(key: string): Promise<any> {
    const data = await this.kv.get(key);
    return data ? JSON.parse(data) : undefined;
  }
  
  async set(key: string, value: any): Promise<void> {
    // Expire sessions after 24 hours to save space
    await this.kv.put(key, JSON.stringify(value), { expirationTtl: 86400 });
  }
  
  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}

```

You can then pass the environment variable from your `fetch` handler into your bot:

```typescript
// Inside the fetch handler:
bot.use(session({ storage: new CloudflareKVStorage(env.BOT_SESSIONS) }));

```

---

## 🚀 Deploying to Cloudflare

Deploying is incredibly easy using Cloudflare's `wrangler` CLI:

1. Create a new worker project: `npm create cloudflare@latest`
2. Install UTF: `npm install tg-framework`
3. Write your code in `src/index.ts`.
4. Deploy to the world:
```bash
npx wrangler deploy
```
5. Set your Webhook to the provided `*.workers.dev` URL:
`https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-bot.your-username.workers.dev`