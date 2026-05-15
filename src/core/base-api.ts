// src/core/base-api.ts
import { TelegramBotApi } from '../types/telegram.js';

/**
 * Shape of a Telegram API error response (non-2xx HTTP status).
 */
export interface TelegramErrorResponse {
  ok: false;
  description: string;
  error_code: number;
}

/**
 * Shape of a successful Telegram API response envelope.
 */
export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  description?: string;
  result: T;
}

/**
 * Abstract core describing the transport layer.
 */
export abstract class BaseTelegramClient {
  protected readonly baseUrl: string;

  /**
   * Creates a new client instance.
   * @param token Your bot's token
   */
  constructor(token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  /**
   * Request method implemented by each platform.
   * @param method Method name
   * @param payload Parameters object
   * @returns `Promise<T>`
   */
  public abstract callApi<T>(method: string, payload?: Record<string, unknown>): Promise<T>;

  /**
   * Proxy that "pretends" to be a full TelegramBotApi implementation.
   * @returns `TelegramBotApi`
   */
  public get raw(): TelegramBotApi {
    return new Proxy({} as TelegramBotApi, {
      get: (target, method: string | symbol) => {
        if (typeof method !== 'string' || method === 'then') {
          return Reflect.get(target, method);
        }
        return (params: Record<string, unknown> = {}) => this.callApi(method, params);
      }
    });
  }
}