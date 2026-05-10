# 🧠 Context Layer: Update Hydration

The `Context` class in the **Ultra Telegram Framework (UTF)** implements the **Update Hydration** pattern. When Telegram sends a raw update (JSON), the framework wraps it in a `Context` instance. This object accompanies the event through all middlewares and scenes, providing a unified and convenient interface for API interaction.

## 🎯 The Main Goal: Reducing Boilerplate

In the raw Telegram API, responding to a message requires manually extracting IDs and metadata:

```typescript
api.sendMessage({ 
  chat_id: update.message.chat.id, 
  text: "Hello!" 
});

```

`Context` abstracts this logic. It automatically identifies the source of the update, turning the call into an elegant and concise method:

```typescript
ctx.reply("Hello!");

```

---

## 🧬 Anatomy of the Context Class

The class architecture is logically divided into three key layers:

### 1. Data Layer (Properties)

At its core, `Context` stores two fundamental objects:

* `update`: The original, immutable Telegram update object received from the webhook or long polling.
* `api`: The instance of the Telegram API client (adapter) used to make requests back to Telegram.

### 2. Convenience Layer (Standard Helpers)

This layer provides high-level wrappers for standard Telegram methods. These methods automatically include context-specific data like `chat_id` or `message_id`:

* `ctx.reply(text, extra?)`
* `ctx.replyWithPhoto(photo, extra?)`
* `ctx.editMessage(text, extra?)`
* `ctx.deleteMessage()`
* `ctx.answerCbQuery(text?)`

### 3. Smart Layer (UTF Exclusives)

UTF-specific methods and getters designed for modern bot requirements:

* **`ctx.text`**: A smart getter that returns the message text OR the caption if a photo/video was sent.
* **`ctx.replyWithDraft(id, text)`**: Streams a temporary drafting message (ideal for slow AI/LLM processes).
* **`ctx.replyWithPaidMedia(...)`**: Simplifies sending content that can be unlocked via Telegram Stars ⭐️.

---

## 🎙️ Handling Specific Media Types (Voice, Video Notes, etc.)

UTF's `Context` makes it incredibly easy to work with rich media such as Voice messages, Video Notes (circles), Animations, and Documents.

### 1. Sending Media (Helpers)

Instead of constructing complex JSON payloads, use the built-in media helpers directly from the context:

* `ctx.replyWithVoice(voice, extra?)`
* `ctx.replyWithVideoNote(videoNote, extra?)`
* `ctx.replyWithDocument(document, extra?)`
* `ctx.replyWithAnimation(animation, extra?)`

*Note: You can pass a file ID (string), a URL, or an `InputFile` as the first argument to these methods.*

### 2. Receiving and Processing Media

You can easily check if an incoming update contains a specific media type by accessing the strongly-typed `update` object. Thanks to TypeScript, you get full autocompletion for media properties.

#### Example: Voice & Video Note Echo Bot

```typescript
bot.use(async (ctx) => {
  // Handle Voice Messages
  if (ctx.update.message?.voice) {
    const fileId = ctx.update.message.voice.file_id;
    await ctx.reply("I received your voice message! Here it is back:");
    
    // Echo the voice message back using its file_id
    return ctx.replyWithVoice(fileId);
  }

  // Handle Video Notes (Round videos)
  if (ctx.update.message?.video_note) {
    const fileId = ctx.update.message.video_note.file_id;
    await ctx.reply("Nice video note!");
    
    // Echo the video note back
    return ctx.replyWithVideoNote(fileId);
  }
});

```

---

## 🚀 Extending Context (Generics)

One of UTF's core strengths is its strict typing and extensibility. Developers can define custom interfaces to add sessions, database instances, or localization helpers directly to the context object:

```typescript
import { Context } from 'tg-framework';

interface MyContext extends Context {
  session: { step: string; data: any };
  db: DatabaseInstance;
}

const bot = new TelegramBot<MyContext>(client);

```

---

## 🛠 Usage Examples

### Example 1: Handling Callback Queries

Manage interactions with inline buttons without manually tracking message IDs:

```typescript
bot.callbackQuery('confirm', async (ctx) => {
  // Automatically answers the callback and clears the loading state
  await ctx.answerCbQuery("Action confirmed!");
  
  // Edits the message where the button was pressed
  await ctx.editMessage("Thank you for confirming!");
});

```

### Example 2: Unified Text and Caption Handling

Your bot can react identically to plain text or a photo caption using the smart `ctx.text` property:

```typescript
bot.use(async (ctx) => {
  if (ctx.text === "Secret") {
    await ctx.replyWithPhoto("https://example.com/vault.jpg", {
      caption: "Here is your secret access!"
    });
  }
});

```