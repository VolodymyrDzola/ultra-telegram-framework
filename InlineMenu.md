# 🔘 InlineMenu: Interactive UI for Telegram Bots

While the standard `InlineKeyboard` allows you to send static buttons, building complex, interactive interfaces (like settings panels, shopping carts, or multi-level navigation) using raw Telegram API requires manually managing dozens of `callback_query` strings.

The **Ultra Telegram Framework (UTF)** solves this with `InlineMenu` — a powerful, state-aware abstraction built directly into the core. 

## 🎯 Why use InlineMenu?
* **Automatic Routing:** No need to manually write `bot.callbackQuery(...)` and match regular expressions for every single button.
* **Dynamic Rendering:** Buttons can change their text or visibility on the fly based on the user's state (e.g., `ctx.session`).
* **Built-in Navigation:** Easily create sub-menus with automatic "Back" buttons.
* **Auto-Answer:** The framework automatically answers the callback query to remove the loading spinner when a button is pressed.

---

## 🚀 Basic Usage

Creating a working menu involves three simple steps:
1. Define the menu structure.
2. Register it in the bot's middleware chain.
3. Send it to the user.

```typescript
import { Bot, InlineMenu } from 'tg-framework';

// 1. Create a menu instance with a unique ID
const mainMenu = new InlineMenu('main-menu-id')
  .text('📢 Subscribe', async (ctx) => {
    // This handler runs exactly when THIS button is clicked!
    await ctx.reply("You are now subscribed!");
  })
  .row() // Start a new row of buttons
  .url('🌐 Visit Website', '[https://example.com](https://example.com)');

const bot = new Bot('TOKEN', client);

// 2. Register the menu as middleware (CRITICAL)
// This allows the menu to intercept its own callback queries
bot.use(mainMenu.middleware());

// 3. Send the menu
bot.command('menu', async (ctx) => {
  await ctx.reply("Please choose an option:", {
    reply_markup: mainMenu
  });
});

```

---

## 🔄 Dynamic Buttons (State-Aware)

One of the best features of `InlineMenu` is its ability to render dynamically. You can pass a **function** instead of a static string for the button text. The menu will evaluate this function every time it is displayed.

This pairs perfectly with UTF's session system:

```typescript
const settingsMenu = new InlineMenu('settings-menu')
  .text(
    // The text dynamically reads from the session
    (ctx) => ctx.session.notifications ? '🔔 Notifications: ON' : '🔕 Notifications: OFF',
    
    // The handler toggles the state
    async (ctx) => {
      ctx.session.notifications = !ctx.session.notifications;
      
      // Tell the menu to re-render itself to show the new text!
      await ctx.menu.update(); 
    }
  );

```

---

## 🗂️ Multi-Level Menus (Submenus)

You can easily link menus together to create deep navigation trees without getting lost in callback data logic.

```typescript
// 1. Create the child menu
const languageMenu = new InlineMenu('lang-menu')
  .text('🇬🇧 English', (ctx) => ctx.reply("Language set to English!"))
  .text('🇺🇦 Українська', (ctx) => ctx.reply("Мову змінено на українську!"))
  .row()
  .back('🔙 Back to Main'); // Built-in helper to return to the parent menu

// 2. Create the parent menu
const mainMenu = new InlineMenu('main-menu')
  .text('⚙️ Settings', (ctx) => ctx.reply("Settings clicked!"))
  .row()
  .submenu('🌍 Change Language', languageMenu); // Link to the child menu

// 3. Register BOTH menus
bot.use(mainMenu.middleware());
bot.use(languageMenu.middleware());

```

---

## 🛠️ Menu Context Helpers (`ctx.menu`)

When a user interacts with a menu, UTF injects a special `ctx.menu` object into the context, providing helpful methods to manipulate the UI:

* `ctx.menu.update()`: Re-renders the current menu (useful if you changed a variable and want the button text to update instantly).
* `ctx.menu.nav('menu-id')`: Programmatically navigate to another menu without requiring the user to press a specific submenu button.
* `ctx.menu.close()`: Removes the inline keyboard from the message entirely.
* `ctx.menu.back()`: Programmatically triggers the "back" action to return to the parent menu.

---

## 💡 Best Practices

* **Keep IDs Unique:** Every `InlineMenu` must have a completely unique ID string. This is how the framework knows which menu to route the click to.
* **Global Middleware:** Always register your menus globally using `bot.use(menu.middleware())` *before* your fallback handlers, so they can successfully intercept the callback queries.

```