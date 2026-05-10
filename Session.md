# 💾 Session Management & Storage

In standard Telegram bot development, each update (message, callback query) is completely independent. The bot has no built-in memory of what happened in the previous message.

**Sessions** solve this problem by providing a temporary or persistent state for each user or chat. This is essential for building:

* Step-by-step registration forms (`WizardScene`).
* Shopping carts.
* User language preferences.
* Interactive multi-level menus.

The **Ultra Telegram Framework (UTF)** provides a robust, flexible, and fully-typed session system out of the box, with specialized tools designed specifically for Serverless and Google Apps Script (GAS) environments.

---

## 🚀 How Sessions Work in UTF

To enable sessions, you simply register the `session()` middleware and provide a `Storage` engine. UTF automatically injects the `ctx.session` object into your context.

```typescript
import { Bot, session, MemoryStorage } from 'tg-framework';

// 1. Extend the Context to include your specific session data type
interface MyContext extends Context {
  session: {
    counter: number;
    step?: string;
  };
}

const bot = new Bot<MyContext>('TOKEN', client);

// 2. Connect the session middleware with a storage backend
bot.use(session({
  initial: () => ({ counter: 0 }), // Default state
  storage: new MemoryStorage()     // Storage engine
}));

// 3. Use it in your handlers
bot.command('count', async (ctx) => {
  ctx.session.counter++;
  await ctx.reply(`You called this command ${ctx.session.counter} times!`);
});

```

---

## 📦 Built-in Storage Engines

UTF provides several storage engines tailored to different environments.

### 1. `MemoryStorage` (Node.js / Edge)

Stores session data directly in RAM. It is incredibly fast but **volatile**—all data is lost if the bot script restarts.

* **Best for:** Local development, simple Webhook bots on Node.js, or Deno/Cloudflare workers where long-term persistence isn't required.

### 2. The Google Apps Script Problem

Running stateful bots on Google Apps Script (GAS) is notoriously difficult because GAS is stateless (the script spins up and dies with every webhook). Google provides two services to save data, but both have flaws:

* **`CacheService`:** Very fast, but data can disappear at any time and has a maximum lifespan of 6 hours.
* **`PropertiesService`:** Persistent and reliable, but very slow. It also has strict limits (max 9KB per value, 500KB total per script).

### 3. `GasHybridStorage` (The UTF Native Solution 🌟)

To solve the GAS limitations, UTF includes a unique **Hybrid Storage** system specifically for Google Apps Script.

`GasHybridStorage` elegantly combines both Google services under the hood:

1. **Fast Reads:** It always tries to read the session state from the blazing-fast `CacheService` first.
2. **Reliable Fallback:** If the data was evicted from the cache, it safely falls back to the persistent `PropertiesService`.
3. **Smart Writes:** When saving data, it updates the cache instantly and safely syncs it to the properties.

This allows your GAS bot to handle complex `WizardScene` flows (like 10-step surveys) flawlessly, without hitting Google's execution time limits or quota limits.

```typescript
import { session, GasHybridStorage } from 'tg-framework';

// Perfect setup for a Google Apps Script bot
bot.use(session({
  storage: new GasHybridStorage()
}));

```

### 4. Specialized GAS Storages

If you need specific behavior, you can also use the underlying engines directly:

* `CacheStorage`: Uses only `CacheService`.
* `PropertiesStorage`: Uses only `PropertiesService`.

---

## 🛠 Building Custom Storages (Databases)

UTF's session system is fully abstracted. If your bot scales to thousands of users and you need to move to a real database (like Redis, MongoDB, or PostgreSQL), you can easily create your own storage by implementing the `Storage` interface:

```typescript
import { Storage } from 'tg-framework';

export class RedisStorage implements Storage {
  async get(key: string): Promise<any> {
    // Read from Redis
  }
  
  async set(key: string, value: any): Promise<void> {
    // Save to Redis
  }
  
  async delete(key: string): Promise<void> {
    // Remove from Redis
  }
}

```

Then, simply swap the adapter in your bot initialization:

```typescript
bot.use(session({ storage: new RedisStorage() }));

```

**Zero changes to your bot's business logic or scenes are required!**

---

## 🧹 Session Scopes and Scene State

By default, sessions are isolated per **Chat + User**. This means a user will have different session data in a private chat vs. a group chat.

**Important Note on Scenes:**
If you are using `WizardScene`, the temporary data entered by the user during the wizard steps is stored within `ctx.scene.state` (which lives inside the session). When `ctx.scene.leave()` is called, UTF automatically cleans up this temporary state to ensure your storage doesn't bloat over time.