import { Context } from './context/index.js';
import { Composer, Middleware } from './composer.js';
import { InlineKeyboard } from './keyboard.js';

declare module './context/index.js' {
  interface Context {
    menu?: InlineMenuManager<any>;
  }
}

export type MenuPageOptions = {
  /** ID of the page the "Back" button leads to. If not specified, the button will not be shown. */
  back?: string;
  /** Text for the "Back" button (default is "⬅️ Back") */
  backText?: string;
};

export type MenuPageRender<C extends Context> = (ctx: C) => Promise<{ text: string; keyboard: InlineKeyboard }> | { text: string; keyboard: InlineKeyboard };

export type PageEntry<C extends Context> = {
  render: MenuPageRender<C>;
  options?: MenuPageOptions;
};

/**
 * Class for creating interactive Inline menus.
 */
export class InlineMenu<C extends Context = Context> extends Composer<C> {
  private pages = new Map<string, PageEntry<C>>();
  private id: string;

  constructor(id: string = 'main') {
    super();
    this.id = id;
  }

  /**
   * Add a page to the menu
   * @param id Unique page ID
   * @param renderer Function that returns text and keyboard
   * @param options Page settings (e.g., Back button)
   */
  public page(id: string, renderer: MenuPageRender<C>, options?: MenuPageOptions): this {
    this.pages.set(id, { render: renderer, options });
    return this;
  }

  /**
   * Main menu middleware
   */
  public middleware(): Middleware<C> {
    const composerHandler = super.middleware();

    return async (ctx, next) => {
      // 1. Hydrate context with the menu manager
      ctx.menu = new InlineMenuManager(ctx, this.pages, this.id);

      // 2. First pass through Composer handlers (.action(), etc.)
      let handledByComposer = false;
      await composerHandler(ctx, async () => {
        handledByComposer = true;
      });

      // If Composer caught the event - do not proceed further
      if (!handledByComposer) return;

      // 3. If no handler found - check page navigation
      if (ctx.callbackQuery?.data?.startsWith(`menu:${this.id}:`)) {
        const pageId = ctx.callbackQuery.data.split(':')[2];
        if (pageId) {
          await ctx.menu!.setPage(pageId);
          return;
        }
      }

      await next();
    };
  }
}

/**
 * Manager for controlling menus inside handlers
 */
export class InlineMenuManager<C extends Context = Context> {
  constructor(
    private ctx: C,
    private pages: Map<string, PageEntry<C>>,
    private menuId: string
  ) { }

  /**
   * Go to the specified menu page
   */
  public async setPage(pageId: string): Promise<void> {
    const entry = this.pages.get(pageId);
    if (!entry) throw new Error(`Menu page "${pageId}" not found.`);

    const { text, keyboard } = await Promise.resolve(entry.render(this.ctx));

    // If a "parent" page is specified in the page settings, add a Back button
    if (entry.options?.back) {
      keyboard.row().menu(entry.options.backText || '⬅️ Back', this.menuId, entry.options.back);
    }

    const rawKeyboard = keyboard.toJSON();

    if (this.ctx.callbackQuery) {
      // answerCbQuery is executed together with editMessage to guarantee removing the loading indicator
      await Promise.all([
        this.ctx.editMessage(text, { reply_markup: rawKeyboard }),
        this.ctx.answerCbQuery()
      ]);
    } else {
      await this.ctx.reply(text, { reply_markup: rawKeyboard });
    }
  }

  public url(pageId: string): string {
    return `menu:${this.menuId}:${pageId}`;
  }
}
