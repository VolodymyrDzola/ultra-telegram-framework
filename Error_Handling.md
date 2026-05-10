# 🚨 Error Handling

When building a production-ready Telegram bot, errors are inevitable. Users might block your bot, messages might get deleted before you can edit them, or external APIs might time out. 

If an error is thrown and not caught, two bad things happen:
1. **Node.js:** Your bot process might crash completely.
2. **Webhooks (GAS / Cloudflare):** Telegram will think your server is down and will **continually retry** sending the same update, creating an infinite loop of errors and draining your server resources.

The **Ultra Telegram Framework (UTF)** handles errors elegantly using the Middleware architecture.

---

## 🛡️ The Global Error Boundary

The best way to handle errors in UTF is to create a "Global Error Boundary". Because middlewares execute in an "onion" model, a `try/catch` block placed at the very top of your middleware chain will catch **any** asynchronous error thrown by downstream scenes, commands, or handlers.

Always register your error handler as the **first** middleware:

```typescript
import { Bot } from 'tg-framework';

const bot = new Bot('TOKEN', client);

// 1. GLOBAL ERROR HANDLER (Must be first!)
bot.use(async (ctx, next) => {
  try {
    // Wait for all other middlewares/handlers to finish
    await next(); 
  } catch (error: any) {
    console.error(`[Error] Update ID: ${ctx.update.update_id}`);
    console.error(error.message || error);

    // Attempt to notify the user gracefully
    try {
      await ctx.reply("Oops! An unexpected error occurred. Please try again later.");
    } catch (innerError) {
      // If we can't even send a message (e.g., user blocked the bot), just ignore it.
      console.log("Could not send error message to user.");
    }
  }
});

// 2. Normal Handlers
bot.command('start', async (ctx) => {
  await ctx.reply("Welcome!");
});

bot.command('fail', async (ctx) => {
  // This error will be safely caught by the middleware above!
  throw new Error("Something went terribly wrong!"); 
});

```

---

## 🚦 Handling Specific Telegram Errors

Telegram's API returns specific HTTP errors when something goes wrong. You can inspect the error message to implement custom logic (for example, removing a user from your database if they blocked the bot).

```typescript
bot.use(async (ctx, next) => {
  try {
    await next();
  } catch (error: any) {
    const errorMessage = String(error.message || error);

    // 1. User blocked the bot
    if (errorMessage.includes('Forbidden: bot was blocked by the user')) {
      const userId = ctx.update.message?.from?.id;
      console.log(`User ${userId} blocked the bot. Removing from DB...`);
      // await db.removeUser(userId);
      return; // Stop execution
    }

    // 2. Message is not modified
    // Happens if you try to edit a message with the exact same text and buttons
    if (errorMessage.includes('message is not modified')) {
      console.log("Ignored: Message was not modified.");
      return; 
    }

    // 3. Message to delete not found
    if (errorMessage.includes('message to delete not found')) {
      console.log("Ignored: Message already deleted.");
      return;
    }

    // Unhandled error fallback
    console.error("Unhandled Bot Error:", error);
  }
});

```

---

## 🎭 Scene Validation Errors

Inside a `WizardScene`, not every mistake is a fatal error. If a user inputs invalid data (e.g., typing letters when you asked for an age), you **should not throw an error**.

Instead, send a warning message and simply **do not call** `ctx.scene.next()`. The framework will wait for the user to try again.

```typescript
async (ctx) => {
  const age = parseInt(ctx.text || '');
  
  if (isNaN(age)) {
    // ❌ DO NOT THROW: throw new Error("Invalid age");
    
    // ✅ DO THIS:
    return ctx.reply("That doesn't look like a number. Please enter your age:");
    // Notice we skipped ctx.scene.next(). The user remains on this step.
  }

  ctx.scene.state.age = age;
  ctx.scene.next();
  await ctx.reply("Thank you!");
}

```

---

## ⚠️ Important Note for Webhooks (GAS / Edge)

When Telegram sends an update to your Google Apps Script (`doPost`), you must return an `HTTP 200 OK` response.

If an uncaught exception breaks your `doPost` function, Google returns a 500 Error to Telegram. Telegram will try to send the exact same message again in a few minutes, leading to duplicate processing.

**By using the Global Error Boundary middleware, the framework safely catches the error, finishes processing, and allows your `doPost` to return a `200 OK`, explicitly telling Telegram: "We handled it, do not send it again."**
