# 🚀 Ultra Telegram Framework (UTF)

[![Bot API 10.0](https://img.shields.io/badge/Bot%20API-10.0-blue.svg)](https://core.telegram.org/bots/api)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue.svg)](https://volodymyrdzola.github.io/ultra-tg-framework/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Ultra Telegram Framework (UTF)** is a modern, lightweight, and strongly typed Telegram Bot API framework built for **TypeScript**.

Designed with flexibility in mind, UTF features a unique **adapter-based architecture** that allows your bot to run seamlessly across various environments — from classic Node.js servers to Serverless Edge functions and Google Apps Script — without rewriting your core logic.

---

## ✨ Why Choose UTF?

### 🌍 Write Once, Run Anywhere
UTF provides dedicated API clients optimized for specific runtimes:
- **`NodeApiClient`** — Node.js 18+ with native `fetch` and Webhook Reply optimizations.
- **`WebApiClient`** — Universal client for Edge runtimes (Cloudflare Workers, Vercel Edge, Deno, Bun).
- **`GasApiClient`** — Exclusive adapter for **Google Apps Script** using `UrlFetchApp`.

### 🔘 Declarative Inline Menus
Build interactive, multi-page menus with the page-based `InlineMenu` system. Define pages with `.page()` and button actions with `.action()`, with automatic state management and navigation.

### 🤖 AI-Ready & Streaming Support
The `ctx.replyWithDraft()` method lets you stream "thinking" indicators for LLM responses with built-in rate-limit protection and auto-debouncing.

### 🛡️ 100% Type-Safe
Exhaustive TypeScript typings for **all** Telegram Bot API 10.0 objects, methods, and parameters. Rich IDE autocompletion and compile-time error checking.

### 🎭 Built-in Scenes & Sessions
Manage multi-step flows with `WizardScene`, `Stage`, and `SceneManager`. Multiple session storage adapters included: `MemoryStorage`, `PropertiesStorage`, `CacheStorage`, and the exclusive `GasHybridStorage`.

### 🔋 Batteries Included
No external plugins needed. Scenes, sessions, inline menus, keyboards, and error handling are all part of the core framework.

---

## 📦 Installation

```bash
npm install ultra-tg-framework
```

---

## 🏁 Quick Start

### Example 1: Node.js (Polling)

The fastest way to get started. No server setup required.

```typescript
import { TelegramBot, NodeApiClient } from 'ultra-tg-framework';

const bot = new TelegramBot(new NodeApiClient('YOUR_BOT_TOKEN'));

bot.command('start', async (ctx) => {
  await ctx.reply('Hello! I am an Ultra Telegram Framework bot 🚀');
});

bot.on('text', async (ctx) => {
  await ctx.reply(`You said: ${ctx.text}`);
});

bot.launch()
  .then(() => console.log('Bot is running...'))
  .catch(console.error);
```

### Example 2: Google Apps Script (Webhook)

Deploy your bot for free on Google's infrastructure:

```typescript
import { TelegramBot, GasApiClient } from 'ultra-tg-framework';

const bot = new TelegramBot(new GasApiClient('YOUR_BOT_TOKEN'));

bot.command('start', async (ctx) => {
  await ctx.reply('Hello from Google Apps Script! ☁️');
});

globalThis.doPost = (e: any) => {
  if (e?.postData?.contents) {
    const update = JSON.parse(e.postData.contents);
    bot.handleUpdate(update);
  }
  return ContentService.createTextOutput('OK');
};
```

### Example 3: Cloudflare Workers (Edge)

Global low-latency deployment:

```typescript
import { TelegramBot, WebApiClient } from 'ultra-tg-framework';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    if (request.method !== 'POST') {
      return new Response('Bot is running ⚡');
    }

    const update = await request.json();
    const bot = new TelegramBot(new WebApiClient(env.BOT_TOKEN));

    bot.command('start', async (ctx) => {
      await ctx.reply('Hello from the Edge! 🌍⚡');
    });

    ctx.waitUntil(bot.handleUpdate(update));
    return new Response('OK');
  }
};
```

---

## 🧰 Key Features at a Glance

| Feature | Description |
| :--- | :--- |
| **Context Helpers** | `ctx.reply()`, `ctx.editMessage()`, `ctx.answerCbQuery()`, `ctx.replyWithPhoto()`, and 30+ more. |
| **Smart `ctx.text`** | Returns message text OR media caption — works universally. |
| **`ctx.payload`** | Command arguments (e.g., `/start ref_123` → `"ref_123"`). |
| **InlineKeyboard** | Fluent builder: `.text()`, `.url()`, `.webApp()`, `.menu()`, `.pay()`, `.game()`. |
| **ReplyKeyboard** | `.text()`, `.requestContact()`, `.requestLocation()`, `.oneTime()`, `.resized()`. |
| **InlineMenu** | Page-based menus with automatic navigation, back buttons, and state management. |
| **WizardScene** | Linear step-by-step dialogues with `ctx.scene.next()`, `leave()`, `selectStep()`. |
| **Session Storage** | `MemoryStorage`, `PropertiesStorage`, `CacheStorage`, `GasHybridStorage`. |
| **Error Handling** | Built-in `bot.catch()` and middleware-based error boundaries. |
| **AI Drafts** | `ctx.replyWithDraft()` for streaming LLM responses with rate-limit protection. |
| **Paid Media** | `ctx.replyWithPaidMedia()` for Telegram Stars ⭐️ monetization. |
| **Games** | `ctx.replyWithGame()`, `ctx.setGameScore()`, `ctx.getGameHighScores()`. |
| **Payments** | `ctx.replyWithInvoice()`, `ctx.answerShippingQuery()`, `ctx.answerPreCheckoutQuery()`. |

---

## 📚 Documentation & Guides

Explore the detailed guides in our [Wiki](https://github.com/VolodymyrDzola/ultra-tg-framework/wiki):

### 🚀 Getting Started
- **[Migrating to UTF](./Migrating-to-UTF.md)** — Step-by-step guide for upgrading from grammY, Telegraf, or legacy scripts.
- **[Architecture](./ARCHITECTURE.md)** — Understand the adapter-based design and the four architectural layers.
- **[Local Dev (Polling vs Webhooks)](./Local%20Dev%20Polling%20vs%20Webhooks.md)** — Best practices for running and testing your bot locally.

### ☁️ Deployment
- **[Deploy to GAS](./DEPLOY_GAS.md)** — Comprehensive tutorial for Google Apps Script deployment with `esbuild` and `clasp`.
- **[Deploy to Edge](./Edge%20Computing.md)** — Cloudflare Workers, Deno Deploy, and Bun examples.

### 🧠 Framework Deep Dive
- **[Core (TelegramBot)](./Core.md)** — The bot entry point, lifecycle, and initialization.
- **[Context](./Context.md)** — Complete API reference for the `ctx` object with all 40+ helper methods.
- **[Composer & Routing](./Composer.md)** — `.command()`, `.on()`, `.action()`, type narrowing, and modular sub-routers.
- **[Middleware](./Middleware.md)** — The "onion" model, context hydration, and chain control.
- **[Sessions & Storage](./Session.md)** — Memory, GAS Cache, Hybrid, and custom storage adapters.
- **[Error Handling](./Error_Handling.md)** — `bot.catch()`, middleware boundaries, and Telegram-specific error patterns.

### 🧰 UI & Tools
- **[Inline Menus](./InlineMenu.md)** — Page-based declarative menus with navigation and back buttons.
- **[Wizard Scenes](./Wizard%20Scenes.md)** — Multi-step forms and conversational flows.
- **[Handling Files](./Downloading%20Files.md)** — Working with Telegram files, downloads, and Google Drive integration.

### 🔗 Resources
- **[TypeDoc API Reference](https://volodymyrdzola.github.io/ultra-tg-framework/)** — Auto-generated TypeScript API documentation for all classes, methods, and types.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](https://github.com/VolodymyrDzola/ultra-tg-framework?tab=MIT-1-ov-file) file for details.