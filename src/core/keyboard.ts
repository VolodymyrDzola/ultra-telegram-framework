// src/core/keyboard.ts
import {
  KeyboardButton,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  ForceReply,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  LoginUrl,
  SwitchInlineQueryChosenChat,
  CopyTextButton,
  CallbackGame,
  KeyboardButtonRequestUsers,
  KeyboardButtonRequestChat,
  KeyboardButtonPollType,
  KeyboardButtonRequestManagedBot
} from '../types/telegram';

/**
 * Base interface for any button (so TypeScript knows about common fields)
 */
export interface CommonButton {
  text: string;
  icon_custom_emoji_id?: string;
  style?: string;
}

/**
 * Abstract class containing common logic for all keyboard types.
 * T is the button type (InlineKeyboardButton or KeyboardButton).
 */
export abstract class BaseKeyboard<T extends CommonButton> {
  // Protected property (available in child classes)
  protected matrix: T[][] = [[]];

  /** Starts a new row */
  public row(): this {
    this.matrix.push([]);
    return this;
  }

  /**
   * Adds a custom emoji to the LAST added button.
   * @param emojiId Unique emoji ID (available for Premium bots)
   */
  public customEmoji(emojiId: string): this {
    const lastButton = this.getLastButton();
    if (lastButton) lastButton.icon_custom_emoji_id = emojiId;
    return this;
  }

  /**
   * Sets the style for the LAST added button.
   * @param style 'danger' (red) | 'success' (green) | 'primary' (blue)
   */
  public style(style: 'danger' | 'success' | 'primary'): this {
    const lastButton = this.getLastButton();
    if (lastButton) lastButton.style = style;
    return this;
  }

  // =====================================
  // INTERNAL HELPERS
  // =====================================

  protected addButton(button: T): this {
    const currentRow = this.matrix[this.matrix.length - 1];
    if (currentRow) {
      currentRow.push(button);
    }
    return this;
  }

  protected getLastButton(): T | undefined {
    const currentRow = this.matrix[this.matrix.length - 1];
    if (!currentRow || currentRow.length === 0) return undefined;
    return currentRow[currentRow.length - 1];
  }
}

// ============================================================================
// INLINE KEYBOARD (Buttons under the message)
// ============================================================================
export class InlineKeyboard extends BaseKeyboard<InlineKeyboardButton> {

  public text(text: string, callback_data: string): this {
    return this.addButton({ text, callback_data });
  }

  public url(text: string, url: string): this {
    return this.addButton({ text, url });
  }

  public webApp(text: string, webAppUrl: string): this {
    return this.addButton({ text, web_app: { url: webAppUrl } });
  }

  public loginUrl(text: string, login_url: LoginUrl): this {
    return this.addButton({ text, login_url });
  }

  public switchInlineQuery(text: string, query: string = ''): this {
    return this.addButton({ text, switch_inline_query: query });
  }

  public switchInlineCurrentChat(text: string, query: string = ''): this {
    return this.addButton({ text, switch_inline_query_current_chat: query });
  }

  public switchInlineChosenChat(text: string, chosen_chat: SwitchInlineQueryChosenChat): this {
    return this.addButton({ text, switch_inline_query_chosen_chat: chosen_chat });
  }

  public copyText(text: string, copy_text: CopyTextButton): this {
    return this.addButton({ text, copy_text });
  }

  public game(text: string, callback_game: CallbackGame = {}): this {
    return this.addButton({ text, callback_game });
  }

  public pay(text: string): this {
    return this.addButton({ text, pay: true });
  }

  /**
   * Special button for switching between InlineMenu pages
   * @param text Button text
   * @param menuId Menu ID
   * @param pageId ID of the page to navigate to
   */
  public menu(text: string, menuId: string, pageId: string): this {
    return this.addButton({ text, callback_data: `menu:${menuId}:${pageId}` });
  }


  /** Builds the final object (uses this.matrix from the base class) */
  public build(): InlineKeyboardMarkup {
    const cleanKeyboard = this.matrix.filter(row => row.length > 0);
    return { inline_keyboard: cleanKeyboard };
  }

  /** Allows automatic serialization of the object to JSON */
  public toJSON(): InlineKeyboardMarkup {
    return this.build();
  }
}

// ============================================================================
// REPLY KEYBOARD (Buttons instead of the phone keyboard)
// ============================================================================
export class ReplyKeyboard extends BaseKeyboard<KeyboardButton> {
  private options: Partial<Omit<ReplyKeyboardMarkup, 'keyboard'>> = {};

  /** Adds a regular text button */
  public text(text: string): this {
    return this.addButton({ text });
  }

  public requestContact(text: string): this {
    return this.addButton({ text, request_contact: true });
  }

  public requestLocation(text: string): this {
    return this.addButton({ text, request_location: true });
  }

  public requestUsers(text: string, request_users: KeyboardButtonRequestUsers): this {
    return this.addButton({ text, request_users });
  }

  public requestChat(text: string, request_chat: KeyboardButtonRequestChat): this {
    return this.addButton({ text, request_chat });
  }

  public requestPoll(text: string, request_poll: KeyboardButtonPollType = {}): this {
    return this.addButton({ text, request_poll });
  }

  public requestManagedBot(text: string, request_managed_bot: KeyboardButtonRequestManagedBot): this {
    return this.addButton({ text, request_managed_bot });
  }

  public webApp(text: string, webAppUrl: string): this {
    return this.addButton({ text, web_app: { url: webAppUrl } });
  }

  // =====================================
  // KEYBOARD SETTINGS
  // =====================================

  public persistent(is_persistent: boolean = true): this {
    this.options.is_persistent = is_persistent;
    return this;
  }

  public selective(is_selective: boolean = true): this {
    this.options.selective = is_selective;
    return this;
  }

  public resized(is_resized: boolean = true): this {
    this.options.resize_keyboard = is_resized;
    return this;
  }

  public oneTime(is_one_time: boolean = true): this {
    this.options.one_time_keyboard = is_one_time;
    return this;
  }

  public placeholder(text: string): this {
    this.options.input_field_placeholder = text;
    return this;
  }

  /** Builds the final object (uses this.matrix from the base class) */
  public build(): ReplyKeyboardMarkup {
    const cleanKeyboard = this.matrix.filter(row => row.length > 0);
    return {
      keyboard: cleanKeyboard,
      ...this.options
    };
  }

  /** Allows automatic serialization of the object to JSON */
  public toJSON(): ReplyKeyboardMarkup {
    return this.build();
  }

  // =====================================
  // STATIC HELPERS
  // =====================================

  public static remove(selective?: boolean): ReplyKeyboardRemove {
    return { remove_keyboard: true, selective };
  }

  public static forceReply(selective?: boolean, placeholder?: string): ForceReply {
    return { force_reply: true, selective, input_field_placeholder: placeholder };
  }
}