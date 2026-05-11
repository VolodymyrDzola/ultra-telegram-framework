import { Storage } from './storage';
import { PropertiesStorage } from './gas-storage';
import { CacheStorage } from './gas-cache-storage';

/**
 * Hybrid storage for Google Apps Script (CacheService + PropertiesService).
 * Combines cache speed and properties reliability.
 */
export class GasHybridStorage<T> implements Storage<T> {
  private cache: CacheStorage<T>;
  private properties: PropertiesStorage<T>;

  /**
   * Hybrid storage for Google Apps Script (CacheService + PropertiesService).
   * Combines cache speed and properties reliability.
   * @param options Configuration options
   * @param options.cache Which cache service to use (ScriptCache by default)
   * @param options.properties Which properties service to use (ScriptProperties by default)
   * @param options.ttl Time to live in seconds (21600 - 6 hours by default)
   * @param options.prefix Prefix for keys
   */
  constructor(options?: {
    cache?: GoogleAppsScript.Cache.Cache;
    properties?: GoogleAppsScript.Properties.Properties;
    ttl?: number;
    prefix?: string;
  }) {
    this.cache = new CacheStorage<T>(
      options?.cache,
      options?.ttl,
      options?.prefix
    );
    this.properties = new PropertiesStorage<T>(
      options?.properties,
      options?.prefix
    );
  }

  public async get(key: string): Promise<T | undefined> {
    // 1. Try to get from the fast cache
    let data = await Promise.resolve(this.cache.get(key));

    if (data != null) {
      return data;
    }

    // 2. If not in cache, go to slow properties
    data = await Promise.resolve(this.properties.get(key));

    // 3. If found in properties, update cache for next time
    if (data !== null && data !== undefined) {
      this.cache.set(key, data);
    }

    return data;
  }

  public async set(key: string, value: T): Promise<void> {
    // Write to both storages
    await Promise.all([
      Promise.resolve(this.cache.set(key, value)),
      Promise.resolve(this.properties.set(key, value))
    ]);
  }

  public async delete(key: string): Promise<void> {
    // Delete from both places
    await Promise.all([
      Promise.resolve(this.cache.delete(key)),
      Promise.resolve(this.properties.delete(key))
    ]);
  }
}
