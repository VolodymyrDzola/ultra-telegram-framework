import { Message, SendMessageParams, SendPhotoParams, InputFile, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply, InlineKeyboardButton, SendVideoParams, SendDocumentParams, SendLivePhotoParams, SendGiftParams, AnswerCallbackQueryParams, ReactionType, EditMessageTextParams, MessageId, EditMessageCaptionParams, SendInvoiceParams, AnswerShippingQueryParams, SendPaidMediaParams, InputPaidMediaPhoto, InputPaidMediaVideo, InputPaidMediaLivePhoto, SendMediaGroupParams, InputMediaDocument, InputMediaAudio, InputMediaPhoto, InputMediaVideo, InputMediaLivePhoto, InputPollOption, SendPollParams, InlineQueryResult, AnswerGuestQueryParams, SentGuestMessage, SendGameParams, SetGameScoreParams, GameHighScore, DeleteMessageReactionParams, DeleteAllMessageReactionsParams, SendMessageDraftParams } from "../../types/telegram.js";
import { InlineKeyboard, ReplyKeyboard } from "../keyboard.js";
import { BaseContext } from "./base-context.js";

export abstract class ReplyContext extends BaseContext {


  public async reply(
    text: string,
    options?: Omit<SendMessageParams, "chat_id" | "text">
  ): Promise<Message> {
    const { chatId, messageId } = this.getRequiredIds("reply", false);

    return this.api.sendMessage({
      chat_id: chatId,
      text,
      reply_parameters: messageId ? { message_id: messageId } : undefined,
      ...options,
    });
  }

  /**
   * Reply to the current message with a keyboard (Inline or Reply)
   * @param text - message text
   * @param keyboard - keyboard
   * @param options - parameters object
   * @returns `Promise<Message>`
   */
  public async replyWithKeyboard(
    text: string,
    keyboard: InlineKeyboard | ReplyKeyboard | InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply,
    options?: Omit<SendMessageParams, "chat_id" | "text" | "reply_markup">
  ): Promise<Message> {
    const reply_markup = (keyboard instanceof InlineKeyboard || keyboard instanceof ReplyKeyboard)
      ? keyboard.build()
      : keyboard;

    return this.reply(text, {
      reply_markup: reply_markup,
      ...options,
    });
  }

  /**
 * Quick reply with an Inline keyboard
 * @param text - message text
 * @param buttons - keyboard
 * @param options - parameters object
 * @returns `Promise<Message>`
 */
  public async replyWithInlineKeyboard(
    text: string,
    buttons: InlineKeyboardButton[][] | InlineKeyboard,
    options?: Omit<SendMessageParams, "chat_id" | "text" | "reply_markup">
  ): Promise<Message> {
    const markup = buttons instanceof InlineKeyboard
      ? buttons.build()
      : { inline_keyboard: buttons };

    return this.reply(text, {
      reply_markup: markup,
      ...options,
    });
  }

  /**
   * Reply to the current message with a photo
   * @param photo URL of the image or `file_id`
   * @param options Parameters object or just the notification text
   * @returns `Promise<Message>`
   */
  public async replyWithPhoto(
    photo: string | InputFile,
    options?: Omit<SendPhotoParams, "chat_id" | "photo">
  ): Promise<Message> {
    const { chatId, messageId } = this.getRequiredIds("replyWithPhoto", false);

    return this.api.sendPhoto({
      chat_id: chatId,
      photo: photo,
      reply_parameters: messageId ? { message_id: messageId } : undefined,
      ...options,
    });
  }

  /**
     * Reply to the current message with a video file
     * @param video URL of the video or `file_id`
     * @param options Parameters object or just the notification text
     * @returns `Promise<Message>`
     */
  public async replyWithVideo(
    video: string | InputFile,
    options?: Omit<SendVideoParams, "chat_id" | "video">
  ): Promise<Message> {
    const { chatId, messageId } = this.getRequiredIds("replyWithVideo", false);

    return this.api.sendVideo({
      chat_id: chatId,
      video: video,
      reply_parameters: messageId ? { message_id: messageId } : undefined,
      ...options,
    });
  }
  /**
    * Reply to the current message with a document (file)
    * @param document URL of the file or `file_id`
    * @param options Parameters object or just the notification text
    * @returns `Promise<Message>`
    */
  public async replyWithDocument(
    document: string | InputFile,
    options?: Omit<SendDocumentParams, "chat_id" | "document">
  ): Promise<Message> {
    const { chatId, messageId } = this.getRequiredIds("replyWithDocument", false);

    return this.api.sendDocument({
      chat_id: chatId,
      document: document,
      reply_parameters: messageId ? { message_id: messageId } : undefined,
      ...options,
    });
  }

  /**
   * Reply to the current message with a "live photo" (Live Photo)
   * @param photo URL of the photo or `file_id`
   * @param livePhoto URL of the "live photo" or `file_id`
   * @param options Parameters object or just the notification text
   * @returns `Promise<Message>`
   */
  public async replyWithLivePhoto(
    photo: string | InputFile,
    livePhoto: string | InputFile,
    options?: Omit<SendLivePhotoParams, "chat_id" | "photo" | "live_photo">
  ): Promise<Message> {
    const { chatId, messageId } = this.getRequiredIds("replyWithLivePhoto", false);

    return this.api.sendLivePhoto({
      chat_id: chatId,
      photo,
      live_photo: livePhoto,
      reply_parameters: messageId ? { message_id: messageId } : undefined,
      ...options
    });
  }

  /**
    * Send a gift (Star Gift) to the current user
    * @param giftId Gift ID
    * @param options Parameters object
    * @returns `Promise<boolean>`
    */
  public async sendGift(
    giftId: string,
    options?: Omit<SendGiftParams, "user_id" | "chat_id" | "gift_id">
  ): Promise<boolean> {
    const fromId = this.from?.id;
    if (!fromId) throw new Error("Cannot send gift: user_id not found.");

    return this.api.sendGift({
      user_id: fromId,
      gift_id: giftId,
      ...options
    });
  }

  /**
    * Remove loading indicator from an inline button
    * @param params Parameters object or just the notification text
    * @returns `Promise<boolean>`
    */
  public async answerCbQuery(
    params?: (Omit<AnswerCallbackQueryParams, "callback_query_id">) | string
  ): Promise<boolean> {
    // 1. Отримуємо ID виключно з контексту, бо ми заборонили передавати його в params
    const cbId = this.callbackQuery?.id;

    if (!cbId) {
      throw new Error("Cannot perform answerCbQuery: callback_query_id not found.");
    }

    // 2. If a string is passed, it is shorthand for { text: "..." }
    if (typeof params === "string") {
      return this.api.answerCallbackQuery({
        callback_query_id: cbId,
        text: params,
      });
    }

    // 3. If an object is passed, use it, adding/overriding the ID
    return this.api.answerCallbackQuery({
      ...params,
      callback_query_id: cbId,
    });
  }

  /**
* React to the current message
* @param reactions Array of reactions (e.g.: `[{ type: "emoji", emoji: "👍" }]`)
* @returns `Promise<boolean>`
*/
  public async react(reactions: ReactionType[]): Promise<boolean> {
    const { chatId, messageId } = this.getRequiredIds("react", true);

    return this.api.setMessageReaction({
      chat_id: chatId,
      message_id: messageId,
      reaction: reactions,
    });
  }

  /**
  * Send chat action status to the current chat (e.g., "typing", "upload_photo")
  * @param action Action status (e.g., "typing", "upload_photo")
  * @returns `Promise<boolean>`
  */
  public async replyWithChatAction(
    action: "typing" | "upload_photo" | "record_video" | "upload_video" | "record_voice" | "upload_voice" | "upload_document" | "choose_sticker" | "find_location" | "record_video_note" | "upload_video_note"
  ): Promise<boolean> {
    const { chatId } = this.getRequiredIds("replyWithChatAction", false);

    return this.api.sendChatAction({
      chat_id: chatId,
      action: action,
    });
  }

  /**
    * Delete the current message
    * @returns `Promise<boolean>`
    */
  public async deleteMessage(): Promise<boolean> {
    const { chatId, messageId } = this.getRequiredIds("deleteMessage", true);

    return this.api.deleteMessage({
      chat_id: chatId,
      message_id: messageId,
    });
  }

  /**
 * Edit the text of the current message
 * @param text Message text
 * @param options Additional parameters
 * @returns `Promise<Message | boolean>`
 */
  public async editMessage(
    text: string,
    options?: Omit<EditMessageTextParams, "chat_id" | "text" | "message_id">
  ): Promise<Message | boolean> {
    const { chatId, messageId } = this.getRequiredIds("editMessage");

    return this.api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options,
    });
  }
  /**
     * Forward the current message to another chat
     * @param toChatId ID of the chat where the message is forwarded
     * @returns `Promise<Message>`
     */
  public async forwardTo(toChatId: string | number): Promise<Message> {
    const { chatId, messageId } = this.getRequiredIds("forwardTo", true);

    return this.api.forwardMessage({
      chat_id: toChatId,
      from_chat_id: chatId,
      message_id: messageId,
    });
  }

  /**
  * Copy the current message to another chat
  * @param toChatId ID of the chat where the message is copied
  * @returns `Promise<MessageId>`
  */
  public async copyTo(toChatId: string | number): Promise<MessageId> {
    const { chatId, messageId } = this.getRequiredIds("copyTo", true);

    return this.api.copyMessage({
      chat_id: toChatId,
      from_chat_id: chatId,
      message_id: messageId,
    });
  }

  /**
   * Returns command arguments (everything that follows the command name).
   * Example: for the message "/start ref_123", it will return "ref_123".
   * If it is just "/start", it will return an empty string.
   * @returns `string`
   */
  public get payload(): string {
    const txt = this.text;
    if (!txt || !txt.startsWith('/')) return '';

    const parts = txt.split(/\s+/); // Split by spaces (one or more)
    if (parts.length <= 1) return '';

    return parts.slice(1).join(' ').trim();
  }

  /**
   * ID of the user who initiated the event
   * @returns `number | undefined`
   */
  public get senderId(): number | undefined {
    return this.from?.id;
  }

  /**
    * Change only the inline keyboard of the current message
    * @param replyMarkup - keyboard
    * @returns `Promise<Message | boolean>`
    */
  public async editReplyMarkup(
    replyMarkup?: InlineKeyboardMarkup
  ): Promise<Message | boolean> {
    const { chatId, messageId } = this.getRequiredIds("editReplyMarkup", true);

    return this.api.editMessageReplyMarkup({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup, // If undefined is passed, the keyboard will disappear
    });
  }

  /**
 * Change the caption of the current media file (photo/video)
 * @param caption - caption
 * @param options - parameters object
 * @returns `Promise<Message | boolean>`
 */
  public async editCaption(
    caption: string,
    options?: Omit<EditMessageCaptionParams, "chat_id" | "message_id" | "caption">
  ): Promise<Message | boolean> {
    const { chatId, messageId } = this.getRequiredIds("editCaption", true);

    return this.api.editMessageCaption({
      chat_id: chatId,
      message_id: messageId,
      caption: caption,
      ...options,
    });
  }
  /**
   * Get the list of administrators of the current chat
   * @returns `Promise<ChatMember[]>`
   */
  public async getAdministrators() {
    const { chatId } = this.getRequiredIds("getAdministrators", false);
    return this.api.getChatAdministrators({ chat_id: chatId });
  }

  /**
   * Get information about a specific member in the current chat
   * @param userId User ID
   * @returns `Promise<ChatMember>`
   */
  public async getMember(userId: number) {
    const { chatId } = this.getRequiredIds("getMember", false);
    return this.api.getChatMember({ chat_id: chatId, user_id: userId });
  }

  /**
   * Leave the current chat (group/channel)
   * @returns `Promise<boolean>`
   */
  public async leaveChat(): Promise<boolean> {
    const { chatId } = this.getRequiredIds("leaveChat", false);
    return this.api.leaveChat({ chat_id: chatId });
  }

  // --- PAYMENTS ---

  /**
   * Send an invoice to the current chat
   * @param params Parameters object
   * @returns `Promise<Message>`
   */
  public async replyWithInvoice(
    params: Omit<SendInvoiceParams, "chat_id">
  ): Promise<Message> {
    const { chatId } = this.getRequiredIds("replyWithInvoice", false);
    return this.api.sendInvoice({
      chat_id: chatId,
      ...params,
    });
  }

  /**
   * Answer a shipping query (Shipping Query)
   * @param ok Is everything okay
   * @param options Additional parameters
   * @returns `Promise<boolean>`
   */
  public async answerShippingQuery(
    ok: boolean,
    options?: Omit<AnswerShippingQueryParams, "shipping_query_id" | "ok">
  ): Promise<boolean> {
    const queryId = this.update.shipping_query?.id;
    if (!queryId) throw new Error("Cannot answer Shipping Query: id not found.");

    return this.api.answerShippingQuery({
      shipping_query_id: queryId,
      ok,
      ...options,
    });
  }

  /**
   * Answer a pre-checkout query (Pre-checkout Query)
   * @param ok Is everything okay
   * @param errorMessage Error message
   * @returns `Promise<boolean>`
   */
  public async answerPreCheckoutQuery(
    ok: boolean,
    errorMessage?: string
  ): Promise<boolean> {
    const queryId = this.update.pre_checkout_query?.id;
    if (!queryId) throw new Error("Cannot answer Pre-checkout Query: id not found.");

    return this.api.answerPreCheckoutQuery({
      pre_checkout_query_id: queryId,
      ok,
      error_message: errorMessage,
    });
  }

  // --- GAMES ---

  /**
   * Send a game to the current chat
   * @param gameShortName - short name of the game
   * @param options - parameters object
   * @returns `Promise<Message>`
   */
  public async replyWithGame(
    gameShortName: string,
    options?: Omit<SendGameParams, "chat_id" | "game_short_name">
  ): Promise<Message> {
    const { chatId } = this.getRequiredIds("replyWithGame", false);
    return this.api.sendGame({
      chat_id: chatId,
      game_short_name: gameShortName,
      ...options,
    });
  }

  /**
   * Set a high score for a player in the game
   * @param score - game score
   * @param options - parameters object
   * @returns `Promise<Message | boolean>`
   */
  public async setGameScore(
    score: number,
    options?: Omit<SetGameScoreParams, "user_id" | "score">
  ): Promise<Message | boolean> {
    const fromId = this.from?.id;
    if (!fromId) throw new Error("Cannot set game score: user_id not found.");

    // Priority is given to inline_message_id, if it exists
    const inlineId = this.callbackQuery?.inline_message_id;
    const { chatId, messageId } = inlineId ? { chatId: undefined, messageId: undefined } : this.getRequiredIds("setGameScore", true);

    return this.api.setGameScore({
      user_id: fromId,
      score,
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineId,
      ...options,
    });
  }

  /**
   * Get high scores table for the game
   * @returns `Promise<GameHighScore[]>`
   */
  public async getGameHighScores(): Promise<GameHighScore[]> {
    const fromId = this.from?.id;
    if (!fromId) throw new Error("Cannot get game high scores: user_id not found.");

    const inlineId = this.callbackQuery?.inline_message_id;
    const { chatId, messageId } = inlineId ? { chatId: undefined, messageId: undefined } : this.getRequiredIds("getGameHighScores", true);

    return this.api.getGameHighScores({
      user_id: fromId,
      chat_id: chatId,
      message_id: messageId,
      inline_message_id: inlineId,
    });
  }

  /**
   * Answer a guest query (Guest Mode)
   * @param result - query result
   * @param options - parameters object
   * @returns `Promise<SentGuestMessage>`
   */
  public async answerGuest(
    result: InlineQueryResult,
    options?: Omit<AnswerGuestQueryParams, "guest_query_id" | "result">
  ): Promise<SentGuestMessage> {
    const msg = this.message as Message | undefined;
    const queryId = this.update.guest_message?.guest_query_id || msg?.guest_query_id;

    if (!queryId) throw new Error("Missing guest_query_id");

    return this.api.answerGuestQuery({
      guest_query_id: queryId,
      result: result,
      ...options
    });
  }

  /**
   * Delete reaction on the current message.
   * By default, deletes the reaction of the user who initiated the event.
   * @param options - parameters object
   * @returns `Promise<boolean>`
   */
  public async deleteReaction(
    options?: Omit<DeleteMessageReactionParams, "chat_id" | "message_id">
  ): Promise<boolean> {
    const { chatId, messageId } = this.getRequiredIds("deleteReaction", true);

    // If the developer did not pass a specific user_id or actor_chat_id, 
    // by default we substitute the ID of the current user
    const defaultOptions = (!options?.user_id && !options?.actor_chat_id)
      ? { user_id: this.from?.id }
      : {};

    return this.api.deleteMessageReaction({
      chat_id: chatId,
      message_id: messageId,
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Delete all reactions of a specific user in the current chat (up to 10,000).
   * By default, deletes the reactions of the user who initiated the event.
   * @param options - parameters object
   * @returns `Promise<boolean>`
   */
  public async deleteAllReactions(
    options?: Omit<DeleteAllMessageReactionsParams, "chat_id">
  ): Promise<boolean> {
    const { chatId } = this.getRequiredIds("deleteAllReactions", false);

    const defaultOptions = (!options?.user_id && !options?.actor_chat_id)
      ? { user_id: this.from?.id }
      : {};

    return this.api.deleteAllMessageReactions({
      chat_id: chatId,
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Send a poll or quiz (Poll / Quiz) to the current chat.
   * Supports new API 10.0 features: media, explanation_media, 1 answer option.
   * @param question - poll text
   * @param pollOptions - answer options
   * @param options - parameters object
   * @returns `Promise<Message>`
   */
  public async replyWithPoll(
    question: string,
    pollOptions: (string | InputPollOption)[],
    options?: Omit<SendPollParams, "chat_id" | "question" | "options">
  ): Promise<Message> {
    const { chatId, messageId } = this.getRequiredIds("replyWithPoll", false);

    const formattedOptions: InputPollOption[] = pollOptions.map(option =>
      typeof option === "string" ? { text: option } : option
    );

    return this.api.sendPoll({
      chat_id: chatId,
      question: question,
      options: formattedOptions,
      reply_parameters: messageId ? { message_id: messageId } : undefined,
      ...options,
    });
  }

  /**
   * Streaming a temporary message (Draft) for generating responses (e.g., AI).
   * This ephemeral message lives for 30 seconds. After completion, it is mandatory to call a regular reply().
   * @param draftId - unique stream identifier (must be > 0). Identical IDs animate changes.
   * @param options - parameters object
   * @returns `Promise<boolean>`
   */
  public async replyWithDraft(
    draftId: number,
    options?: Omit<SendMessageDraftParams, "draft_id">
  ): Promise<boolean> {
    const { chatId } = this.getRequiredIds("replyWithDraft", false);

    return this.api.sendMessageDraft({
      chat_id: chatId,
      draft_id: draftId,
      ...options,
    });
  }

  /**
   * Send a group of media files (album).
   * Supports photos, videos, audio, documents, and new Live Photos (API 10.0).
   * @param media - array of media files
   * @param options - parameters object
   * @returns `Promise<Message[]>`
   */
  public async replyWithMediaGroup(
    media: InputMediaAudio[] | InputMediaDocument[] | Array<InputMediaPhoto | InputMediaVideo | InputMediaLivePhoto>,
    options?: Omit<SendMediaGroupParams, "chat_id" | "media">
  ): Promise<Message[]> {
    const { chatId, messageId } = this.getRequiredIds("replyWithMediaGroup", false);

    return this.api.sendMediaGroup({
      chat_id: chatId,
      media,
      reply_parameters: messageId ? { message_id: messageId } : undefined,
      ...options,
    });
  }

  /**
   * Send paid media, for viewing which the user must pay with Telegram Stars.
   * @param starCount - number of stars the user must pay
   * @param media - array of media files
   * @param options - parameters object
   * @returns `Promise<Message>`
   */
  public async replyWithPaidMedia(
    starCount: number,
    media: (InputPaidMediaPhoto | InputPaidMediaVideo | InputPaidMediaLivePhoto)[],
    options?: Omit<SendPaidMediaParams, "chat_id" | "star_count" | "media">
  ): Promise<Message> {
    const { chatId } = this.getRequiredIds("replyWithPaidMedia", false);

    return this.api.sendPaidMedia({
      chat_id: chatId,
      star_count: starCount,
      media,
      ...options,
    });
  }
}
