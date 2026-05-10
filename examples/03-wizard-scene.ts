import { TelegramBot, session, WebApiClient, WizardScene, SceneContext, MemoryStorage, Stage } from '../src/index';

const TOKEN = 'YOUR_TELEGRAM_TOKEN';
const bot = new TelegramBot<SceneContext>(new WebApiClient(TOKEN));

// 1. Create the Wizard Scene
const feedbackScene = new WizardScene<SceneContext>(
  'feedback',
  async (ctx) => {
    await ctx.reply("Let's collect some feedback. What is your name?");
    ctx.scene.next();
  },
  async (ctx) => {
    ctx.scene.state.name = ctx.text;
    await ctx.reply(`Thanks, ${ctx.scene.state.name}! Please write your feedback message:`);
    ctx.scene.next();
  },
  async (ctx) => {
    const feedback = ctx.text;
    const name = ctx.scene.state.name;

    await ctx.reply(`Feedback received from ${name}:\n"${feedback}"\n\nThank you!`);

    // Clean up and exit
    ctx.scene.leave();
  }
);

// 2. Setup Session and Stage
bot.use(session({ storage: new MemoryStorage() }));

const stage = new Stage([feedbackScene]);
bot.use(stage.middleware());

// 3. Command to trigger the scene
bot.command('feedback', async (ctx) => {
  ctx.scene.enter('feedback');
});

bot.launch().then(() => console.log('Wizard example running!'));