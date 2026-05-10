# ⛓️ Middleware & Routing

At the core of the **Ultra Telegram Framework (UTF)** lies the **Middleware** pattern. If you have ever used frameworks like Express.js, Koa, or grammY, you will feel right at home. 

The `Composer` and `TelegramBot` classes are built around this pattern. It allows you to process incoming Telegram updates through a sequence of functions (a chain) before they reach their final destination.

---

## 🧐 What is Middleware?

A middleware is simply a function that takes two arguments:
1. `ctx` (Context): The object containing the update data and API helpers.
2. `next`: A function that, when called, passes the execution to the **next** middleware in the chain.

```typescript
bot.use(async (ctx, next) => {
  console.log("1. Received an update!");
  
  // Pass control to the next middleware
  await next();
  
  console.log("4. Finished processing the update!");
});

bot.use(async (ctx) => {
  console.log("2. Processing business logic...");
  await ctx.reply("Hello!");
  console.log("3. Reply sent!");
});

```

**Output in console:**

```text
1. Received an update!
2. Processing business logic...
3. Reply sent!
4. Finished processing the update!

```

---

## 🧅 The "Onion" Architecture

Because `next()` is an asynchronous function (returning a Promise), UTF middlewares execute in a stack-like "onion" model. Code written *before* `await next()` runs on the way "in", and code written *after* `await next()` runs on the way "out".

This is incredibly useful for things like **measuring response times** or **global error handling**:

```typescript
// Response Time Logger Middleware
bot.use(async (ctx, next) => {
  const start = Date.now();
  
  // Wait for all downstream middlewares to finish
  await next();
  
  const ms = Date.now() - start;
  console.log(`Response time: ${ms}ms`);
});

```

### 🛑 Stopping the Chain

If you **do not** call `await next()`, the chain stops. Downstream middlewares will not be executed. This is useful for authorization or ignoring certain users:

```typescript
bot.use(async (ctx, next) => {
  if (ctx.update.message?.from.is_bot) {
    // Ignore updates from other bots by NOT calling next()
    return; 
  }
  await next(); // Proceed for normal users
});

```

---

## 🔀 Routing & Filtering (Composer)

While `bot.use()` catches *every* update, you usually want to execute code only for specific events. UTF's `Composer` provides built-in routing and filtering methods that act as specialized middlewares:

### 1. Commands

Reacts only to messages starting with `/`.

```typescript
bot.command('start', async (ctx) => {
  await ctx.reply("Welcome to UTF!");
});

```

### 2. Callback Queries (Inline Buttons)

Reacts to inline keyboard button presses.

```typescript
// Matches exact string or RegExp
bot.callbackQuery('accept_terms', async (ctx) => {
  await ctx.answerCbQuery("Terms accepted!");
});

```

### 3. Event Listeners

You can filter updates by their type using the `on()` method. UTF provides strict typing for these events:

```typescript
// Only runs if the update contains a message with text
bot.on('message:text', async (ctx) => {
  await ctx.reply(`You said: ${ctx.text}`);
});

// Only runs if the user sent a photo
bot.on('message:photo', async (ctx) => {
  await ctx.reply("Nice picture!");
});

```

---

## 🧬 Context Mutation (Passing Data)

Middlewares are perfect for injecting data into the `Context` so that downstream handlers can use it. Because UTF is strictly typed, you should extend the Context interface:

```typescript
import { Context, Bot } from 'tg-framework';

// 1. Define custom context
interface MyContext extends Context {
  user: { id: number; role: string };
}

const bot = new Bot<MyContext>('TOKEN', client);

// 2. Middleware to fetch user from DB
bot.use(async (ctx, next) => {
  const telegramId = ctx.update.message?.from.id;
  
  if (telegramId) {
    // Simulate DB call
    ctx.user = { id: telegramId, role: 'admin' }; 
  }
  
  await next();
});

// 3. Use the injected data downstream
bot.command('admin', async (ctx) => {
  if (ctx.user?.role === 'admin') {
    await ctx.reply("Welcome to the admin panel!");
  }
});

```

---

## 🛡️ Global Error Handling

You can catch errors globally by wrapping `next()` in a `try/catch` block at the very top of your middleware chain.

```typescript
bot.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error("Global Error Caught:", error);
    
    // Notify the user gracefully without crashing the bot
    await ctx.reply("Oops! Something went wrong on our end.");
  }
});
```