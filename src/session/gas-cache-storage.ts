import { Storage } from './storage.js';

/**
 * Session storage for Google Apps Script based on CacheService.
 * Fast, but data lives for a maximum of 6 hours (21600 seconds).
 */
export class CacheStorage<T> implements Storage<T> {
  private cache: GoogleAppsScript.Cache.Cache;
  private prefix: string;
  private ttl: number;

  /**
   * Fast session storage for Google Apps Script based on CacheService.
   * Data lives for a maximum of 6 hours (21600 seconds).
   * @param cache Which cache service to use (ScriptCache by default)
   * @param ttl Time to live in seconds (21600 - 6 hours by default)
   * @param prefix Prefix for keys
   */
  constructor(
    cache: GoogleAppsScript.Cache.Cache = CacheService.getScriptCache(),
    ttl: number = 21600,
    prefix: string = 'session:'
  ) {
    this.cache = cache;
    this.ttl = ttl;
    this.prefix = prefix;
  }

  /**
   * Gets the session.
   * @param key Session key
   */
  public get(key: string): T | undefined {
    const raw = this.cache.get(this.prefix + key);
    if (!raw) return undefined;

    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Saves the session.
   * @param key Session key
   * @param value Session value
   */
  public set(key: string, value: T): void {
    const raw = JSON.stringify(value);
    this.cache.put(this.prefix + key, raw, this.ttl);
  }

  /**
   * Deletes the session.
   * @param key Session key
   */
  public delete(key: string): void {
    this.cache.remove(this.prefix + key);
  }
}
