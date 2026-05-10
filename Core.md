# 🧠 UTF Core Layer

The **Core** layer of the Ultra Telegram Framework (UTF) provides the fundamental building blocks for bot development. It handles the entire lifecycle of a Telegram Update: from receiving the raw JSON data to executing complex business logic through a chain of middlewares.

---

## 🤖 TelegramBot: The Entry Point

The `TelegramBot` class is the central orchestrator of your application. It manages the connection to Telegram and initializes the processing pipeline.

* **Update Retrieval:** Supports both Long Polling (via `.launch()`) and Webhooks (via `.handleUpdate()`).
* **Adapter Integration:** Connects with environment-specific clients like `GasApiClient` or `WebApiClient` to ensure cross-platform compatibility.
* **Extensibility:** Uses TypeScript Generics to allow developers to define a custom, fully-typed `Context`.

---

## 🏗️ Composer & Middleware System

The `Composer` class is the engine behind UTF's routing and logic organization. It implements a powerful **Middleware** pattern.

### How it Works:

1. **Middleware Chain:** Logic is organized as a sequence of functions that receive the `Context` and a `next()` function.
2. **Sequential Execution:** Each middleware can either handle the update, modify the context, or pass control to the next handler in the chain.
3. **Branching:** Developers can use `Composer` instances to create modular sub-routers, making the codebase clean and maintainable.

---

## 🧬 Context: Update Hydration

The `Context` object is the most frequently used part of the core. Instead of passing raw data around, UTF uses **Update Hydration** to wrap the raw Telegram `Update` into a rich, functional object.

### Key Benefits:

* **Reduced Boilerplate:** Automatically handles `chat_id` and `message_id`, turning complex API calls into simple methods like `ctx.reply()`.
* **Unified Interface:** Provides a consistent way to interact with different types of updates (messages, callback queries, etc.).
* **Smart Helpers:** Includes high-level methods like `ctx.replyWithDraft()` for AI streaming and `ctx.replyWithPaidMedia()` for Telegram Stars ⭐️.

---

## ⌨️ Keyboards & Menus

UTF Core includes built-in tools for creating interactive user interfaces without external dependencies:

* **ReplyKeyboard:** Simplified builder for standard persistent keyboards.
* **InlineKeyboard:** A fluent API for creating buttons attached to messages.
* **InlineMenu:** A high-level abstraction for building interactive, multi-layered menus with callback handling.

---

## 📡 BaseTelegramClient (The API Layer)

At the lowest level, the `BaseTelegramClient` manages the actual HTTP communication with Telegram's servers. It abstracts the transport layer, allowing the same bot logic to run on:

* **Google Apps Script** via `UrlFetchApp`.
* **Node.js** via the standard `fetch` API.
* **Cloudflare Workers** via the Web Fetch API.

---

## 🔄 The Execution Cycle

1. **Incoming Update:** The `Adapter` receives a JSON from Telegram.
2. **Context Creation:** The `Core` hydrants this JSON into a `Context` instance.
3. **Middleware Path:** The `Composer` routes the context through your commands and handlers.
4. **Scene Interception:** If the user is in a `WizardScene`, the `SceneManager` intercepts the flow to handle the next step.
5. **Response:** The bot uses the `api` layer to send a response back to the user.