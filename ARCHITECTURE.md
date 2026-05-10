# 🏗️ tg-framework Architecture

Ultra Telegram Framework (UTF) is a modern, lightweight, and fully-typed framework for creating Telegram bots. It is built with a focus on speed, flexibility, and support for the latest Bot API features, as well as various server environments.

Its architecture is built on the principles of scalability, strict typing, and the ability to run in various environments (Node.js, Google Apps Script, Web).

## 🗺️ General Structure

The project is divided into several key layers:

1. **Core:** Fundamental classes for interacting with the API and handling events.
2. **Context:** An object that accompanies every update and simplifies interaction with the API.
3. **Scenes & Stages:** Logic for creating complex multi-step dialogues.
4. **Session:** User state storage between messages with support for various storage backends.
5. **Adapters:** Modules ensuring compatibility with different execution platforms.

---

## 🚀 Core Components

### 1. TelegramBot and Composer

The `TelegramBot` class is the entry point to your application. It extends `Composer`, allowing you to organize your code using middlewares.

* **Middleware:** A chain of functions executed sequentially. Each function can process the update or pass it along using `next()`.
* **Flexibility:** You can use `bot.use()`, `bot.command()`, or create separate `Composer` instances to group your logic.

### 2. Context Hydration

Instead of inheriting large classes, the framework uses a **hydration** approach.
The `Context` class wraps the raw Telegram `Update` and provides methods for quick responses (e.g., `ctx.reply()`).

**Context Extension (Generics):**
You can define your own custom context type to add support for sessions or a database:

```typescript
interface MyContext extends Context {
  session: { counter: number };
  db: Database;
}
const bot = new TelegramBot<MyContext>(client);

```

### 3. Scene Management

To implement complex scenarios (e.g., filling out a step-by-step form), `WizardScene` and `SceneManager` are used.

* **Stage:** A container router for all your scenes.
* **Wizard:** A special type of scene for linear, step-by-step processes.

### 4. Session System

Sessions allow the bot to "remember" the user's state. The framework supports various storage types (`Storage`):

* **MemoryStorage:** Temporary in-memory storage (resets on restart).
* **PropertiesStorage / CacheStorage:** Specialized solutions tailored for Google Apps Script.
* **HybridStorage:** Combined solutions for optimal speed and reliability.

---

## 🛠️ Environment Selection (Adapters)

One of the unique features of `tg-framework` is its versatility. By using the appropriate client, your bot can run anywhere:

* **Node.js:** For traditional server environments.
* **Google Apps Script (GAS):** For free hosting within the Google ecosystem.
* **Web/Fetch:** For Cloudflare Workers or modern browser environments.

---

## 🔄 Update Flow

1. **Retrieval:** `TelegramBot` receives an `Update` via Long Polling (`launch()`) or Webhook (`handleUpdate()`).
2. **Context Creation:** A `Context` instance is created, containing a reference to the raw update and API methods.
3. **Middleware Execution:** The update passes through all registered middlewares in the `Composer` chain.
4. **Scene Processing:** If a scene is active, `SceneManager` intercepts the update to execute the current scenario step.
5. **Completion:** The update is either handled by the final handler or ignored if no filters matched.

---

This architecture allows you to start with a simple single-file bot and gradually scale to complex systems with dozens of scenes and database integrations.