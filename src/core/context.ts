import { TelegramBotApi, Update } from "../types/telegram";
import { ReplyContext } from "./context/reply-context";

export class Context extends ReplyContext {

  constructor(update: Update, api: TelegramBotApi) {
    // Передаємо дані в BaseContext
    super(update, api);
  }

  // Залишаємо специфічні геттери тут
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

  public get payload(): string {
    const txt = this.text;
    if (!txt || !txt.startsWith('/')) return '';
    const parts = txt.split(/\s+/);
    if (parts.length <= 1) return '';
    return parts.slice(1).join(' ').trim();
  }
}
