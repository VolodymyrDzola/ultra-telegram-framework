# 🚀 Deploying to Google Apps Script (GAS)

One of the biggest advantages of the **Ultra Telegram Framework (UTF)** is its native support for Google Apps Script. GAS provides a fantastic, **100% free serverless environment** with direct access to Google Sheets, Drive, and Gmail.

However, deploying modern TypeScript code to GAS requires a specific build process using Google's CLI tool called **`clasp`**. 

This guide will walk you through the process from zero to a fully deployed bot.

---

## 🛠 Prerequisites

Before you start, make sure you have the following installed:
1. **Node.js** (v16 or higher).
2. A Google Account.
3. [clasp](https://github.com/google/clasp) installed globally on your machine:
   ```bash
   npm install -g @google/clasp

```

---

## Step 1: Create the GAS Entry Point

Google Apps Script does not run continuously like a Node.js server. Instead, it listens for HTTP POST requests (Webhooks) via a special global function called `doPost(e)`.

Create a file named `src/index.ts` (or `main.ts`). This will be the entry point for your bot.

```typescript
import { Bot, GasApiClient, session, GasHybridStorage } from 'tg-framework';

// 1. Initialize the bot with GAS-specific adapter
const bot = new Bot('YOUR_TELEGRAM_TOKEN', new GasApiClient('YOUR_TELEGRAM_TOKEN'));

// 2. Enable the GAS Hybrid Storage to prevent data loss!
bot.use(session({
  storage: new GasHybridStorage()
}));

// 3. Add your business logic
bot.command('start', async (ctx) => {
  await ctx.reply("Hello from Google Apps Script! 🚀");
});

// 4. Expose the doPost function globally so GAS can see it
declare const global: any;

global.doPost = (e: any) => {
  if (e.postData && e.postData.contents) {
    const update = JSON.parse(e.postData.contents);
    
    // Pass the update to the framework
    bot.handleUpdate(update);
  }
  
  // GAS requires returning an HTTP 200 OK response
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
};

```

---

## Step 2: Initialize the Clasp Project

1. **Enable the Google Apps Script API:** Go to [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings) and turn the API toggle **ON**.
2. **Login to Clasp:**
```bash
clasp login

```


*This will open your browser and ask you to log in to your Google Account.*
3. **Create a new GAS Project:**
Run this in your project root:
```bash
clasp create --type standalone --title "My-UTF-Bot"

```


*This creates a `.clasp.json` file containing your new Script ID.*

---

## Step 3: Build & Push the Code

GAS cannot run raw TypeScript or read node_modules directly. We must bundle everything into a single JavaScript file. UTF uses `esbuild` for blazingly fast bundling (configured in `build.js`).

1. **Build the project:**
*(Assuming you have a build script in your package.json)*
```bash
npm run build

```


*This compiles your code into the `dist/` directory.*
2. **Push the bundled code to Google:**
```bash
clasp push

```


*This uploads the contents of your `dist/` folder to your Google Apps Script project.*

---

## Step 4: Deploy as a Web App

Now that your code is on Google's servers, you need to expose it as a Web App to get a URL for the Telegram Webhook.

1. Open your project in the browser:
```bash
clasp open

```


2. In the Google Apps Script editor, click **Deploy** (top right) -> **New Deployment**.
3. Click the gear icon ⚙️ and select **Web App**.
4. Set the following parameters:
* **Description:** Initial deployment (or anything you like).
* **Execute as:** `Me` (your email).
* **Who has access:** `Anyone` *(This is strictly required so Telegram can send requests to it!)*


5. Click **Deploy**.
6. **Copy the `Web App URL**` (It ends with `/exec`).

---

## Step 5: Set the Telegram Webhook

Finally, you need to tell Telegram to send all messages to your new Google Apps Script URL.

Open your browser and paste the following URL, replacing the placeholders with your actual Bot Token and the Web App URL you just copied:

```text
[https://api.telegram.org/bot](https://api.telegram.org/bot)<YOUR_TELEGRAM_TOKEN>/setWebhook?url=<YOUR_WEB_APP_URL>

```

**Success!** You should see a JSON response saying `"Webhook was set"`.
Open Telegram, send `/start` to your bot, and watch it reply from Google's servers! 🎉

---

## 💡 Pro Tips for GAS Developers

* **Updating your bot:** Every time you change your code, you must run `npm run build` and `clasp push`. To see the changes live, you must go to **Manage Deployments** in the GAS editor, edit your Web App, and select **New Version**.
* **Quotas:** Google restricts `UrlFetchApp` calls to 20,000 per day. For most starter/medium bots, this is more than enough!
* **Hybrid Storage:** Always use `GasHybridStorage`. Relying solely on `CacheService` will result in randomly dropped sessions, breaking your `WizardScene` flows.

```
***
