# 🚀 Ultra Telegram Framework (UTF)

A modern, lightweight, and fully-typed framework for creating Telegram bots. Built with a focus on speed, flexibility, and out-of-the-box support for the latest Bot API features and serverless environments.

[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue.svg)](https://volodymyrdzola.github.io/tg-framework/) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ⚡️ Why UTF? (The Edge Over Others)

While there are many great frameworks like grammY, UTF is specifically designed to solve the pain points of deploying bots on serverless platforms like **Google Apps Script (GAS)**, while providing a seamless migration path as your bot grows.

* **🥇 Native Google Apps Script Support:** Unlike other frameworks that require complex polyfills to mock `fetch()` on GAS, UTF includes a native `GasApiClient`. It works out of the box using Google's `UrlFetchApp`.
* **🧠 Smart Hybrid Sessions for GAS:** GAS is stateless and has strict limits on `PropertiesService` and `CacheService`. UTF includes a unique `GasHybridStorage` that seamlessly combines both, allowing you to build complex multi-step forms without losing user data or hitting quotas.
* **🔋 Batteries Included:** No need to hunt for external plugins. Advanced features like `WizardScene` (for step-by-step dialogues), `SceneManager`, and interactive `InlineMenu` are built directly into the core.
* **🤖 AI & Monetization Ready:** Native Context helpers designed for modern bots. Use `ctx.replyWithDraft()` to stream "typing" indicators for slow LLM responses, or `ctx.replyWithPaidMedia()` to easily monetize via Telegram Stars ⭐️.
* **🔄 Seamless Scaling:** Start for free on Google Apps Script. When you need more power, move your code to Node.js or Cloudflare Workers and simply change the adapter (`GasApiClient` -> `WebApiClient`) — **zero changes to your business logic required**.

---

## 🏗️ Architecture

The framework is built on principles of scalability and strict typing. It follows a modular structure to ensure easy scaling and dependency injection:

* **Core:** Fundamental classes for interacting with the API and handling events using a Middleware-based approach.
* **Context:** Uses a **hydration** approach where the raw Telegram `Update` is wrapped in a `Context` instance, providing unified methods for quick responses.
* **Adapters:** Environment-specific modules ensuring compatibility with Node.js, GAS, and Web/Fetch environments.
* **Scenes & Stages:** Advanced logic for creating complex multi-step dialogues using `WizardScene` and `SceneManager`.
* **Session:** Persistent user state storage between messages with support for Memory, GAS Cache, and Hybrid backends.

---

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/VolodymyrDzola/tg-framework.git
cd tg-framework
npm install

```

### Example (Node.js / Edge)

```typescript
import { Bot, WebApiClient } from './src';

// Initialize the bot with the appropriate adapter
const bot = new Bot('YOUR_TOKEN', new WebApiClient('YOUR_TOKEN'));

bot.command('start', async (ctx) => {
  await ctx.reply('Hello! I am running on UTF with API 10.0 support 🚀');
});

// AI Streaming Style Example
bot.command('ai', async (ctx) => {
  const draftId = Date.now();
  
  // Show a temporary drafting message (simulating AI thinking)
  await ctx.replyWithDraft(draftId, "Please wait, I'm thinking...");
  
  // Your logic here...
  
  await ctx.reply("Here is your generated response!");
});

bot.launch();

```

---

## 🧰 Context (ctx) Helpers

The `Context` object abstracts raw API calls into elegant methods. Besides standard API calls, it provides powerful high-level helpers:

| Method | Description |
| --- | --- |
| `ctx.reply(text)` | Simple response to the current chat. |
| `ctx.replyWithDraft(id, text)` | Streams a temporary message (AI-style). Lives for 30 seconds. |
| `ctx.replyWithPoll(...)` | Sends advanced polls/quizzes with media and explanations. |
| `ctx.replyWithPaidMedia(...)` | Monetization: send media unlockable by Telegram Stars ⭐️. |
| `ctx.deleteAllReactions()` | Clears all reactions from the current user in the chat. |
| `ctx.scene.enter('name')` | Enters a specific Wizard scene for step-by-step input. |

---

## 📄 License

This project is licensed under the **MIT License**.

## ☕️ Support the Project

If this framework helped you launch your bot faster, consider supporting the developer!

👉 **[Support via Monobank](https://send.monobank.ua/jar/9WEy6keH3v)**

Thank you for your support! ❤️