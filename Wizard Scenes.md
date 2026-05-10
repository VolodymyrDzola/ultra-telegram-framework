# 🎭 Scenes & Wizards (Step-by-Step Dialogues)

Standard Telegram bot commands are linear: a user sends a command, and the bot replies. But what if you need to collect multiple pieces of information in a specific order? (e.g., a registration form, a quiz, or a shopping cart checkout).

In the **Ultra Telegram Framework (UTF)**, this is solved using **Scenes**. Specifically, UTF provides a highly optimized `WizardScene` class for building linear, step-by-step conversations.

---

## ⚠️ Prerequisite: Sessions
Because Scenes need to "remember" which step the user is currently on, **they rely entirely on the Session system.** You **MUST** register a session middleware (like `MemoryStorage` or `GasHybridStorage`) *before* registering your scenes. Read the [[Sessions & Storage|Sessions-and-Storage]] guide if you haven't yet.

---

## 🚀 Creating a Wizard Scene

Let's build a simple 3-step User Registration flow:
1. Ask for the user's name.
2. Ask for the user's age.
3. Save the data and finish.

### Step 1: Define the WizardScene
A `WizardScene` takes a unique string ID and an array of handler functions (steps).

```typescript
import { WizardScene, SceneContext } from 'tg-framework';

// Create a scene with the ID 'registration'
export const registrationScene = new WizardScene<SceneContext>(
  'registration',
  
  // Step 0: Initial prompt
  async (ctx) => {
    await ctx.reply("Welcome! Let's get you registered. What is your name?");
    
    // Move to the next step and wait for the user's reply
    ctx.scene.next();
  },
  
  // Step 1: Handle Name, Ask for Age
  async (ctx) => {
    // 1. Save the input into the temporary scene state
    ctx.scene.state.name = ctx.text; 
    
    // 2. Ask the next question
    await ctx.reply(`Nice to meet you, ${ctx.scene.state.name}! How old are you?`);
    
    // 3. Move to the next step
    ctx.scene.next();
  },
  
  // Step 2: Final Step
  async (ctx) => {
    const age = parseInt(ctx.text || '');
    
    if (isNaN(age)) {
      // Validation failed! Do NOT call next(), ask again.
      return ctx.reply("Please enter a valid number for your age.");
    }

    // Retrieve the name we saved in Step 1
    const name = ctx.scene.state.name;
    
    await ctx.reply(`Registration complete! Name: ${name}, Age: ${age}.`);
    
    // EXTREMELY IMPORTANT: Leave the scene when finished!
    ctx.scene.leave();
  }
);

```

### Step 2: Register the Stage

Scenes live inside a `Stage`. The Stage acts as a global router that intercepts updates and redirects them to the active scene.

```typescript
import { Bot, session, MemoryStorage, Stage } from 'tg-framework';
import { registrationScene } from './scenes'; // Import the scene from above

const bot = new Bot('TOKEN', client);

// 1. Sessions MUST be registered first
bot.use(session({ storage: new MemoryStorage() }));

// 2. Initialize Stage with an array of all your scenes
const stage = new Stage([registrationScene]);

// 3. Register Stage as global middleware
bot.use(stage.middleware());

```

### Step 3: Enter the Scene

Now, you can trigger this scene from anywhere in your bot using `ctx.scene.enter()`.

```typescript
bot.command('register', async (ctx) => {
  // Puts the user inside the 'registration' scene.
  // The first step (Step 0) will execute automatically!
  ctx.scene.enter('registration');
});

```

---

## 🧰 The SceneManager API (`ctx.scene`)

Whenever a user is inside a scene, the `ctx.scene` object provides powerful methods to control the flow.

| Method / Property | Description |
| --- | --- |
| `ctx.scene.next()` | Advances the pointer to the next step function in the array. |
| `ctx.scene.leave()` | Exits the scene completely and **clears** the temporary state. |
| `ctx.scene.enter('id')` | Exits the current scene and instantly enters another one. |
| `ctx.scene.selectStep(index)` | Jumps to a specific step index. (e.g., `selectStep(0)` restarts the scene). |
| `ctx.scene.state` | An object `{}` used to safely share temporary variables between steps. |

---

## 💡 Best Practices for Wizards

### 1. The Power of `ctx.scene.state`

Do not save partial form data into your global `ctx.session` or database. Use `ctx.scene.state`.
Why? Because if the user cancels the registration halfway through (by calling `ctx.scene.leave()`), the framework automatically destroys `ctx.scene.state`, keeping your database and sessions clean from garbage data.

### 2. Handling Cancellations

Users often change their minds. You should always provide a way out of a scene so they don't get "stuck". You can add a global fallback inside your scenes or check for a specific command at the start of your steps:

```typescript
async (ctx) => {
  if (ctx.text === '/cancel' || ctx.text === '❌ Cancel') {
    await ctx.reply("Registration cancelled.");
    return ctx.scene.leave(); // Stop execution and exit
  }
  
  // ... continue normal step logic
}

```

### 3. Input Validation

If a user enters invalid data (e.g., text instead of an email), **do not call `ctx.scene.next()**`. Simply send an error message. The user will remain on the exact same step, and their next message will hit the same handler again, allowing them to try again.