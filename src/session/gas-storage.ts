import { Storage } from './storage';

/**
 * Session storage for Google Apps Script based on PropertiesService.
 * Allows storing state between different requests (doPost).
 * 
 * ✅ Pros: reliable, no 6-hour limit, well-suited for large data
 * ❌ Cons: slower than CacheService, has a limit of 500 requests/day
 */
export class PropertiesStorage<T> implements Storage<T> {
  private service: GoogleAppsScript.Properties.Properties;
  private prefix: string;

  /**
   * @param service Which service to use (ScriptProperties by default)
   * @param prefix Prefix for keys in storage (to avoid mixing with other settings)
   */
  constructor(
    service: GoogleAppsScript.Properties.Properties = PropertiesService.getScriptProperties(),
    prefix: string = 'session:'
  ) {
    this.service = service;
    this.prefix = prefix;
  }

  public get(key: string): T | undefined {
    const raw = this.service.getProperty(this.prefix + key);
    if (!raw) return undefined;

    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`Error parsing session for key ${key}:`, e);
      return undefined;
    }
  }

  public set(key: string, value: T): void {
    const raw = JSON.stringify(value);
    this.service.setProperty(this.prefix + key, raw);
  }

  public delete(key: string): void {
    this.service.deleteProperty(this.prefix + key);
  }

  /**
   * Clear ALL sessions with this prefix
   */
  public clearAll(): void {
    const all = this.service.getProperties();
    for (const key in all) {
      if (key.startsWith(this.prefix)) {
        this.service.deleteProperty(key);
      }
    }
  }
}
