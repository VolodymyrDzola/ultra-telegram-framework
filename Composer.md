# 🔀 Composer & Update Routing

While Middlewares allow you to execute code for *every* update, a real-world bot needs to react differently depending on what the user did (e.g., sent a text, pressed a button, or uploaded a photo).

In the **Ultra Telegram Framework (UTF)**, this routing logic is handled by the `Composer` class. 

The main `Bot` class actually extends `Composer`. This means all the routing methods available on a `Composer` are directly available on your `bot` instance.

---

## 🎯 Filtering Updates (`bot.on`)

The most powerful routing method is `.on()`. It allows you to filter incoming updates based on their Telegram API type using an `UpdateFilter` string.

### Strict Typing (Narrowed Context)
UTF uses advanced TypeScript features to automatically narrow down the `Context` type based on your filter. This means you get perfect autocomplete without manual type casting!

```typescript
// ❌ Catching a photo the hard (and unsafe) way
bot.use(async (ctx) => {
  if (ctx.update.message && 'photo' in ctx.update.message) {
    const photo = ctx.update.message.photo; // Manual check required
  }
});

// ✅ The UTF Composer way
bot.on('message:photo', async (ctx) => {
  // TypeScript already KNOWS that ctx.update.message.photo exists here!
  const photoId = ctx.update.message.photo[0].file_id;
  await ctx.reply("What a beautiful photo!");
});

```

### Common Update Filters

You can listen to high-level events or very specific ones:

* `'message'` - Any new message (text, photo, voice, etc.).
* `'message:text'` - Only text messages.
* `'message:voice'` - Only voice messages.
* `'callback_query'` - Any inline button press.
* `'my_chat_member'` - When the bot is added/kicked from a group.

*Tip: You can pass an array of filters to listen to multiple events at once: `bot.on(['message:photo', 'message:video'], handler)`.*

---

## ⌨️ Specific Route Helpers

For the most common bot interactions, `Composer` provides dedicated helper methods that make your code even cleaner.

### 1. Commands (`bot.command`)

Listens for messages starting with a specific `/command`. It automatically ignores the bot's username if the command was sent in a group (e.g., `/start@MyAwesomeBot`).

```typescript
// Listens for /start
bot.command('start', async (ctx) => {
  await ctx.reply("Hello there!");
});

// Multiple commands for the same handler
bot.command(['help', 'info'], async (ctx) => {
  await ctx.reply("Here is how to use this bot...");
});

```

### 2. Callback Queries (`bot.callbackQuery`)

Listens for inline keyboard clicks. You can filter by an exact string or a Regular Expression.

```typescript
// Exact match
bot.callbackQuery('buy_now', async (ctx) => {
  await ctx.answerCbQuery("Adding to cart...");
});

// RegExp match (Useful for dynamic IDs, e.g., "item_123")
bot.callbackQuery(/^item_(\d+)$/, async (ctx) => {
  const itemId = ctx.match[1]; // Extracts "123"
  await ctx.reply(`You selected item #${itemId}`);
  await ctx.answerCbQuery();
});

```

### 3. Custom Filters (`bot.filter`)

Sometimes you need to route an update based on complex business logic (e.g., is the user an admin?). Use `.filter()` to provide a custom boolean function.

```typescript
const isAdmin = (ctx: Context) => ctx.update.message?.from.id === 123456789;

bot.filter(isAdmin, async (ctx) => {
  await ctx.reply("Welcome to the secret admin dashboard.");
});

```

---

## 🧩 Modular Routing (Sub-routers)

As your bot grows, writing all commands in a single `index.ts` file becomes unmanageable.

`Composer` allows you to split your bot into independent modules (sub-routers). You create a new `Composer` instance, define its routes, and then attach it to the main bot.

### Example: Splitting into modules

**`admin.ts`**

```typescript
import { Composer } from 'tg-framework';

// Create an isolated router for admin features
export const adminRouter = new Composer();

adminRouter.command('ban', async (ctx) => {
  await ctx.reply("User banned.");
});

adminRouter.command('stats', async (ctx) => {
  await ctx.reply("Server is running smoothly.");
});

```

**`index.ts`** (Main file)

```typescript
import { Bot } from 'tg-framework';
import { adminRouter } from './admin';

const bot = new Bot('TOKEN', client);

bot.command('start', async (ctx) => {
  await ctx.reply("Normal user start command");
});

// Mount the admin router to the main bot
// Optional: You can wrap it in an admin-check middleware first!
bot.use(adminRouter);

bot.launch();

```

By heavily utilizing `Composer` instances, you can build massive, maintainable Telegram bots with perfectly organized codebases.

```