import { TelegramBot, session, WebApiClient, MemoryStorage, InlineMenu, InlineKeyboard, SceneContext } from '../src/index';

const bot = new TelegramBot<SceneContext>(new WebApiClient('TOKEN'));
bot.use(session({ storage: new MemoryStorage() }));

// 1. Sub-menu (Language settings)
const languageMenu = new InlineMenu<SceneContext>('lang_menu')
  .page('main', (ctx) => ({
    text: '🌍 Виберіть мову:',
    keyboard: new InlineKeyboard()
      .text('🇬🇧 English', 'lang:en')
      .text('🇺🇦 Українська', 'lang:uk')
  }));

// Обробники кнопок мови
languageMenu.action('lang:en', async (ctx) => {
  await ctx.answerCbQuery('Language set to English');
});

languageMenu.action('lang:uk', async (ctx) => {
  await ctx.answerCbQuery('Мову змінено');
});

// 2. Main menu
const mainMenu = new InlineMenu<SceneContext>('main_menu')
  .page('main', (ctx) => ({
    text: 'Головне меню:',
    keyboard: new InlineKeyboard()
      .text(
        ctx.session?.notifications ? '🔔 Alerts: ON' : '🔕 Alerts: OFF',
        'toggle_alerts'
      )
      .row()
      .text('🌍 Language', 'menu:lang_menu:main')
      .row()
      .url('🌐 Website', 'https://example.com')
  }));

// Обробник кнопки перемикання сповіщень
mainMenu.action('toggle_alerts', async (ctx) => {
  ctx.session!.notifications = !ctx.session?.notifications;
  await ctx.menu?.setPage('main'); // Оновлюємо меню
  await ctx.answerCbQuery();
});

// 3. Register menus globally
bot.use(mainMenu.middleware());
bot.use(languageMenu.middleware());

// 4. Command to trigger the menu
bot.command('menu', async (ctx) => {
  await ctx.menu?.setPage('main');
});

bot.launch().then(() => console.log('Menu example running! 🚀'));