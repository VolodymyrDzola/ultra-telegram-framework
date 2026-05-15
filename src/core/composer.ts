// src/core/composer.ts
import { Context } from './context/index.js';
import { PhotoSize, Document, Video, Voice, Location, LivePhoto } from '../types/telegram.js';
/**
 * Type for the error handling function.
 */
export type ErrorHandler<C extends Context = Context> = (err: unknown, ctx: C) => Promise<void> | void;

/**
 * Type for the next() function, which passes control to the next handler in the queue.
 */
export type NextFunction = () => Promise<void>;

/**
 * Strict type for editor autocompletion.
 * Contains Update object keys, Message fields, and entity types (Entities).
 */
export type UpdateFilter =
  // Update types
  | 'message' | 'edited_message' | 'channel_post' | 'edited_channel_post' | 'callback_query'
  | 'business_connection' | 'business_message' | 'edited_business_message' | 'deleted_business_messages'
  | 'message_reaction' | 'message_reaction_count' | 'chat_boost' | 'removed_chat_boost' | 'guest_message'
  // Message fields
  | 'text' | 'photo' | 'document' | 'audio' | 'video' | 'voice' | 'animation' | 'sticker' | 'contact' | 'location' | 'live_photo'
  // Entities and custom type
  | 'command' | 'bot_command' | 'hashtag' | 'url' | 'mention' | 'email' | 'phone_number';

/**
 * Main type of our handler (middleware).
 * It accepts the context (ctx) and the relay function (next).
 */
export type Middleware<C extends Context = Context> = (ctx: C, next: NextFunction) => Promise<unknown> | void;
// ==========================================
// TYPE NARROWING MAGIC
// ==========================================

/**
 * Helper type that guarantees the presence of certain fields in Message
 * depending on the passed filter.
 */
export type NarrowedMessage<F extends UpdateFilter> =
  F extends 'text' ? { text: string } :
  F extends 'photo' ? { photo: PhotoSize[] } :
  F extends 'document' ? { document: Document } :
  F extends 'video' ? { video: Video } :
  F extends 'voice' ? { voice: Voice } :
  F extends 'location' ? { location: Location } :
  F extends 'live_photo' ? { live_photo: LivePhoto, photo: PhotoSize[] } :
  {}; // If the filter is not specific, we don't add anything

/**
 * Main type of the narrowed context.
 * It extends the base context C, making certain fields MANDATORY.
 */
export type NarrowedContext<C extends Context, F extends UpdateFilter> = C & {
  // If the filter is 'callback_query', then ctx.callbackQuery 100% exists
  callbackQuery: F extends 'callback_query'
  ? NonNullable<C['callbackQuery']>
  : C['callbackQuery'];

  // If the filter concerns messages, then ctx.message 100% exists, 
  // and we add specific fields from NarrowedMessage there
  message: F extends 'message' | 'text' | 'photo' | 'document' | 'audio' | 'video' | 'voice' | 'animation' | 'sticker' | 'contact' | 'location' | 'live_photo' | 'guest_message' | 'business_message'
  ? NonNullable<C['message']> & NarrowedMessage<F>
  : C['message'];
};
export class Composer<C extends Context = Context> {
  // Here we store our entire chain of handlers
  private handlers: Middleware<C>[] = [];

  private errorHandler?: ErrorHandler<C>;

  public catch(handler: ErrorHandler<C>): this {
    this.errorHandler = handler;
    return this;
  }
  /**
   * Adds a general handler or an ENTIRE MODULE (another Composer).
   */
  public use(...middlewares: (Middleware<C> | Composer<C>)[]): this {
    middlewares.forEach(middleware => {
      if (middleware instanceof Composer) {
        // If it is a separate file with commands (module), we extract the chain from it
        this.handlers.push(middleware.middleware());
      } else {
        // If it is a regular function
        this.handlers.push(middleware);
      }
    });
    return this;
  }

  /**
   * Registers a handler for a specific command (or an array of commands).
   * 
   * @param command Command name without the slash (e.g., 'start' or ['start', 'help'])
   * @param middlewares Functions that will be executed if the command matches
   */
  public command(command: string | string[], ...middlewares: Middleware<C>[]): this {
    const commands = Array.isArray(command) ? command : [command];

    // Create a "filter middleware"
    const filterMiddleware: Middleware<C> = async (ctx, next) => {
      const text = ctx.text;

      // If there is no text or it does not start with a slash - it's not a command
      if (!text || !text.startsWith('/')) {
        return next(); // Pass the relay further
      }

      // Extract the clean command name (ignore '@bot_username' if present)
      const cmdText = text.split(' ')[0].split('@')[0].substring(1);

      if (commands.includes(cmdText)) {
        // If the command is ours, run the passed handlers
        await Composer.compose(middlewares)(ctx, next);
      } else {
        // If the command is not ours, proceed further
        await next();
      }
    };

    this.handlers.push(filterMiddleware);
    return this;
  }

  /**
   * Registers a handler for inline button clicks (callback_query).
   * 
   * @param actionName String or regular expression to check callback_data
   * @param middlewares Functions that will be executed on a match
   */
  public action(actionName: string | RegExp, ...middlewares: Middleware<C>[]): this {
    const filterMiddleware: Middleware<C> = async (ctx, next) => {
      // Check if the update contains a callback_query and its data
      const callbackData = ctx.callbackQuery?.data;

      if (!callbackData) {
        return next();
      }

      // Check for a match (if it's a string - exact match, if RegExp - pattern check)
      const isMatch = typeof actionName === 'string'
        ? callbackData === actionName
        : actionName.test(callbackData);

      if (isMatch) {
        await Composer.compose(middlewares)(ctx, next);
      } else {
        await next();
      }
    };

    this.handlers.push(filterMiddleware);
    return this;
  }

  /**
     * Registers a handler that will trigger under certain conditions (update type, presence of a field or entity).
     * @param filter Field name or array of names (e.g., 'photo', 'document', 'callback_query')
     * @param middlewares Handler functions that will be executed on a match
     */
  public on<F extends UpdateFilter>(
    filter: F | F[],
    ...middlewares: Middleware<NarrowedContext<C, F>>[]
  ): this {
    const filters = Array.isArray(filter) ? filter : [filter];

    const filterMiddleware: Middleware<C> = async (ctx, next) => {
      const updateAny = (ctx.update as unknown) as Record<string, unknown>;
      const messageAny = (ctx.message as unknown) as (Record<string, unknown> & { entities?: { type: string }[], caption_entities?: { type: string }[] }) | undefined;

      const isMatch = filters.some(checking => {
        // Merge entities from text and media file captions
        const entities = messageAny?.entities || messageAny?.caption_entities || [];

        // Check for commands
        if (checking === 'command') {
          return entities.some((e: { type: string }) => e.type === 'bot_command');
        }

        // Check for other entities (hashtag, url, mention, etc.)
        const isEntity = entities.some((e: { type: string }) => e.type === checking);
        if (isEntity) return true;

        // Check for the presence of a field (photo, document, text) in the UNIVERSAL message
        if (messageAny && checking in messageAny) return true;

        // Check for the presence of a field in the update root (e.g., callback_query)
        if (checking in updateAny) return true;

        return false;
      });

      if (isMatch) {
        await Composer.compose<NarrowedContext<C, F>>(middlewares)(ctx as NarrowedContext<C, F>, next);
      } else {
        await next();
      }
    };

    this.handlers.push(filterMiddleware);
    return this;
  }

  /**
   * Magic engine: collects an array of middlewares into a single execution chain.
   * When one middleware calls next(), this function triggers the next one.
   */
  public static compose<C extends Context>(middlewares: Middleware<C>[]): Middleware<C> {
    return async (ctx: C, next: NextFunction) => {
      let index = -1;

      const dispatch = async (i: number): Promise<void> => {
        if (i <= index) throw new Error('next() called multiple times in one middleware!');
        index = i;

        const middleware = middlewares[i];
        if (!middleware) {
          // If the handlers are finished, call the final next
          return next();
        }

        // Call the current middleware and pass it the function to call the next one
        await middleware(ctx, () => dispatch(i + 1));
      };

      await dispatch(0);
    };
  }

  /**
   * Returns all handlers registered in this class as one large function.
   * Wrapped in try...catch to intercept errors.
   */
  public middleware(): Middleware<C> {
    const composed = Composer.compose(this.handlers);

    return async (ctx: C, next: NextFunction) => {
      try {
        await composed(ctx, next);
      } catch (err) {
        if (this.errorHandler) {
          await this.errorHandler(err, ctx);
        } else {
          throw err;
        }
      }
    };
  }
}
