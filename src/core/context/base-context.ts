import { TelegramBotApi, Update, CallbackQuery, MaybeInaccessibleMessage } from "../../types/telegram.js";

export abstract class BaseContext {
  public readonly update: Update;
  public readonly api: TelegramBotApi;
  public readonly message?: MaybeInaccessibleMessage;
  public readonly callbackQuery?: CallbackQuery;

  constructor(update: Update, api: TelegramBotApi) {
    this.update = update;
    this.api = api;
    this.message =
      update.message ||
      update.edited_message ||
      update.channel_post ||
      update.callback_query?.message ||
      update.business_message ||
      update.guest_message;

    this.callbackQuery = update.callback_query;
  }

  public get chatId(): number | undefined {
    return (
      this.message?.chat?.id ||
      this.update.my_chat_member?.chat.id ||
      this.update.chat_member?.chat.id ||
      this.update.chat_join_request?.chat.id
    );
  }

  public get isMessageAccessible(): boolean {
    return !!this.message && this.message.date !== 0;
  }

  public get from() {
    const msg = this.message;
    if (msg && "from" in msg) return msg.from;
    return this.callbackQuery?.from || this.update.inline_query?.from;
  }

  public get text(): string | undefined {
    const msg = this.message;
    if (!msg) return undefined;
    if ("text" in msg) return msg.text;
    if ("caption" in msg) return msg.caption;
    return undefined;
  }

  // Залишаємо наш універсальний хелпер тут, бо він потрібен скрізь
  protected getRequiredIds(operation: string): { chatId: number; messageId: number };
  protected getRequiredIds(operation: string, force: true): { chatId: number; messageId: number };
  protected getRequiredIds(operation: string, force: false): { chatId: number; messageId: number | undefined };
  protected getRequiredIds(operation: string, force: boolean = true): { chatId: number; messageId: number | undefined } {
    const chatId = this.chatId;
    if (!chatId) throw new Error(`Cannot perform ${operation}: chat_id not found.`);

    if (!force) {
      return { chatId, messageId: this.isMessageAccessible ? this.message?.message_id : undefined };
    }

    const messageId = this.message?.message_id;
    if (!this.isMessageAccessible || !messageId) {
      throw new Error(`Cannot perform ${operation}: message is inaccessible or deleted.`);
    }

    return { chatId, messageId };
  }
}
