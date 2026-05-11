import { TelegramBot, WebApiClient } from '../src/index';


// Replace with your actual bot token
const TOKEN = 'YOUR_TELEGRAM_TOKEN';

// Initialize with WebApiClient for local Node.js environment
const bot = new TelegramBot(new WebApiClient(TOKEN));

// Simple commands
bot.command('start', async (ctx) => {
  await ctx.reply('Hello! I am a basic bot running locally via Long Polling. 💻');
});

bot.command('ping', async (ctx) => {
  await ctx.reply('Pong! 🏓');
});

// Echo text messages
bot.on('text', async (ctx) => {
  await ctx.reply(`You said: ${ctx.text}`);
});

bot.catch(async (error, ctx) => {
  console.error(`Error for ${ctx.from?.first_name}:`, error);
  await ctx.reply("Oops! Something went wrong 🛠️").catch(() => { });
});

// Start polling
bot.launch()
  .then(() => console.log('Bot is running!'))
  .catch((err) => console.error('Failed to start:', err));