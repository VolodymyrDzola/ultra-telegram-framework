
import { TelegramBot, GasApiClient, session, SessionData, GasHybridStorage } from '../src/index';

const TOKEN = 'YOUR_TELEGRAM_TOKEN';

// Initialize with GAS specific adapter
const bot = new TelegramBot(new GasApiClient(TOKEN));

// ALWAYS use GasHybridStorage on Google Apps Script to prevent data loss
bot.use(session({
  storage: new GasHybridStorage<SessionData>(),
  initial: () => ({ calls: 0 })
}));

bot.command('start', async (ctx) => {
  await ctx.reply('Hello from Google Apps Script! 🚀');
});

bot.command('stats', async (ctx) => {
  // Використовуємо !, оскільки ми впевнені, що мідлвар session() встановлений
  ctx.session!.calls = (ctx.session!.calls || 0) + 1;
  await ctx.reply(`You have called this command ${ctx.session!.calls} times.`);
});

// Expose the webhook entry point for GAS
declare const global: any;

global.doPost = (e: any) => {
  try {
    if (e.postData && e.postData.contents) {
      const update = JSON.parse(e.postData.contents);
      bot.handleUpdate(update);
    }
  } catch (error) {
    console.error("Webhook Error:", error);
  }

  // GAS requires returning a 200 OK response
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
};