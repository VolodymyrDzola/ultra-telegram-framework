# 🔄 Migrating from Telegraf or grammY

If you have experience building bots with **Telegraf** or **grammY**, you will feel right at home with the **Ultra Telegram Framework (UTF)**. 

UTF was heavily inspired by the excellent architectural patterns (Context, Composer, Middleware) popularized by these frameworks, but it was built from the ground up to solve specific pain points—chiefly, the nightmare of deploying stateful bots to Serverless and Google Apps Script (GAS) environments.

This guide highlights the similarities to ease your transition and showcases the UTF-exclusive features you get out of the box.

---

## 🤝 What remains exactly the same?

The core developer experience remains practically identical. If you know how to write a bot in grammY, you already know how to write one in UTF.

### 1. Bot Initialization & Commands
The way you start a bot and register simple commands is the same.

**grammY / Telegraf:**
```typescript
const bot = new Bot('TOKEN');
bot.command('start', async (ctx) => {
  await ctx.reply("Hello!");
});

```

**UTF:**

```typescript
import { Bot, WebApiClient } from 'tg-framework';
const bot = new Bot('TOKEN', new WebApiClient('TOKEN')); // Explicit adapter injected!
bot.command('start', async (ctx) => {
  await ctx.reply("Hello!");
});

```

### 2. Middleware & Next()

The "onion" model middleware architecture works exactly as you expect.

**Both Frameworks:**

```typescript
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next(); // Pass control to the next handler
  console.log(`Time: ${Date.now() - start}ms`);
});

```

### 3. Context Hydration

`ctx.reply`, `ctx.editMessageText`, `ctx.answerCbQuery` — all the standard Context helpers you rely on are present and fully typed in UTF.

---

## ⚡️ What is different? (The UTF Advantage)

### 1. Transport Adapters (No more Fetch Polyfills for GAS!)

**The grammY way:** To run grammY on Google Apps Script, you must install third-party plugins or write complex polyfills to mock the global `fetch` API because GAS only supports `UrlFetchApp`.
**The UTF way:** UTF decouples the network layer. You simply change the Adapter.

```typescript
// For Node.js or Edge:
const bot = new Bot('TOKEN', new WebApiClient('TOKEN'));

// For Google Apps Script:
const bot = new Bot('TOKEN', new GasApiClient('TOKEN'));

```

### 2. Session Management on Serverless

**The grammY way:** Standard `MemorySessionStorage` dies instantly on Serverless (Cloudflare/GAS) because the process does not stay alive. You have to write custom storage adapters. On GAS, relying solely on `CacheService` results in dropped sessions.
**The UTF way:** UTF includes `GasHybridStorage` natively. It combines the speed of Google's Cache with the reliability of Properties, making multi-step wizards possible on free hosting.

```typescript
import { session, GasHybridStorage } from 'tg-framework';

bot.use(session({
  storage: new GasHybridStorage() // Boom! Flawless GAS sessions.
}));

```

### 3. Batteries Included (Scenes & Wizards)

**The grammY way:** If you want step-by-step dialogues, you must install external plugins (like `@grammyjs/scenes` or `@grammyjs/conversations`), read different documentation, and wire them up.
**The UTF way:** `WizardScene`, `Stage`, and `InlineMenu` are built directly into the core library, ensuring they are always compatible and share the exact same Context types.

### 4. Smart Helpers (AI & Monetization)

UTF includes high-level helpers designed for modern use cases that normally require manual API calls in other frameworks.

**Example: Streaming an AI response**

```typescript
// UTF Exclusive: Simulates typing for up to 30 seconds
await ctx.replyWithDraft(Date.now(), "ChatGPT is generating your response...");
// ... wait for API ...
await ctx.reply("Here is the result!");

```

---

## 📝 Cheatsheet: Converting grammY syntax to UTF

| Action | grammY | UTF |
| --- | --- | --- |
| **Filter Text** | `bot.on('message:text')` | `bot.on('message:text')` |
| **Listen to Callback** | `bot.callbackQuery('btn')` | `bot.callbackQuery('btn')` |
| **Interactive Menu** | `new Menu('id')` *(Plugin)* | `new InlineMenu('id')` *(Core)* |
| **Step-by-step flow** | `createConversation()` *(Plugin)* | `new WizardScene('id', ...)` *(Core)* |
| **Send Voice** | `ctx.replyWithVoice(...)` | `ctx.replyWithVoice(...)` |
| **Monetization** | `ctx.api.sendPaidMedia(...)` | `ctx.replyWithPaidMedia(...)` |

## 🚀 Conclusion

Migrating your existing bots to UTF will take minutes, not days. You get the familiar, robust syntax you love, but you gain the superpower to deploy complex, stateful bots to Google Apps Script and Cloudflare Workers instantly.