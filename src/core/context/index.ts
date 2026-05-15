import { TelegramBotApi, Update } from "../../types/telegram.js";
import { ReplyContext } from "./reply-context.js";

export class Context extends ReplyContext {
  constructor(update: Update, api: TelegramBotApi) {
    super(update, api);
  }
}
