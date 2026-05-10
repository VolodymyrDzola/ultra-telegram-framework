// src/adapters/node.ts
import { BaseTelegramClient, TelegramErrorResponse, TelegramApiResponse } from '../core/base-api';

/**
 * Shape of a captured webhook reply payload.
 */
export interface WebhookReplyPayload {
  method: string;
  [key: string]: unknown;
}

export class NodeApiClient extends BaseTelegramClient {
  /**
   * Stores the first API call as a JSON payload for webhook reply optimization.
   * When set, this payload should be returned as the HTTP response body
   * instead of making a separate fetch request to Telegram.
   */
  private _webhookReply: WebhookReplyPayload | null = null;
  private _useWebhookReply: boolean = false;

  /**
   * Enable webhook reply mode.
   * Call this BEFORE `handleUpdate()` to capture the first text-only API call
   * as a JSON payload instead of sending it via fetch.
   *
   * **⚠️ Important trade-off:** When a call is captured, the corresponding
   * `ctx.reply()` / `ctx.api.*` method returns an **empty object** `{}` instead
   * of the real Telegram response. This means you **cannot** rely on the return
   * value (e.g., `msg.message_id` will be `undefined`).
   *
   * Use this only when you don't need the return value of the first API call.
   *
   * @example
   * ```ts
   * app.post('/webhook', async (req, res) => {
   *   client.enableWebhookReply();
   *   await bot.handleUpdate(req.body);
   *
   *   const reply = client.consumeWebhookReply();
   *   if (reply) {
   *     res.json(reply);
   *   } else {
   *     res.json({ ok: true });
   *   }
   * });
   * ```
   */
  public enableWebhookReply(): void {
    this._useWebhookReply = true;
    this._webhookReply = null;
  }

  /**
   * Retrieve and clear the captured webhook reply payload.
   * Returns `null` if no payload was captured (e.g., the first call had files,
   * or no API calls were made during this update).
   */
  public consumeWebhookReply(): WebhookReplyPayload | null {
    const reply = this._webhookReply;
    this._webhookReply = null;
    this._useWebhookReply = false;
    return reply;
  }

  public async callApi<T>(method: string, payload: Record<string, unknown> = {}): Promise<T> {
    const url = `${this.baseUrl}/${method}`;

    let fileIndex = 0;
    const files: Record<string, Blob> = {};

    const extractFiles = (value: unknown): unknown => {
      if (value == null) return value;

      let isFile = false;
      let blobValue: Blob | null = null;

      if (value instanceof Blob) {
        isFile = true;
        blobValue = value;
      }
      else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
        isFile = true;
        blobValue = new Blob([value as any]);
      }

      if (isFile && blobValue) {
        const attachName = `file_attach_${fileIndex++}`;
        files[attachName] = blobValue;
        return `attach://${attachName}`;
      }

      if (Array.isArray(value)) {
        return value.map(extractFiles);
      }

      if (typeof value === 'object') {
        const processedObj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
          processedObj[k] = extractFiles(v);
        }
        return processedObj;
      }

      return value;
    };

    const processedPayload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      processedPayload[key] = extractFiles(value);
    }

    const hasFiles = Object.keys(files).length > 0;

    // Webhook Reply optimization: capture the first text-only call
    if (this._useWebhookReply && !hasFiles) {
      this._useWebhookReply = false; // Only the first call
      this._webhookReply = { method, ...processedPayload };
      console.warn(
        `[UTF] ⚡ Webhook Reply captured: ${method}. ` +
        `The return value of this API call is an empty object. ` +
        `Do not use the returned value (e.g., msg.message_id will be undefined).`
      );
      return {} as T;
    }

    let requestOptions: RequestInit;

    if (hasFiles) {
      const form = new FormData();

      for (const [key, file] of Object.entries(files)) {
        form.append(key, file, `${key}.file`);
      }

      for (const [key, value] of Object.entries(processedPayload)) {
        if (value == null) continue;
        if (typeof value === 'object') {
          form.append(key, JSON.stringify(value));
        } else {
          form.append(key, String(value));
        }
      }

      requestOptions = {
        method: 'POST',
        body: form,
      };
    } else {
      requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedPayload),
      };
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const textData = await response.text();
      let jsonData: TelegramErrorResponse;
      try {
        jsonData = JSON.parse(textData);
      } catch {
        throw new Error(`Telegram HTTP Error ${response.status}: ${textData}`);
      }
      throw new Error(`Telegram API Error [${method}] ${response.status}: ${jsonData.description}`);
    }

    const data = (await response.json()) as TelegramApiResponse<T>;

    if (!data.ok) {
      throw new Error(`Telegram Logic Error [${method}]: ${data.description}`);
    }

    return data.result as T;
  }
}