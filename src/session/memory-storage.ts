// src/session/memory-storage.ts
import { Storage } from './storage.js';

/**
 * In-memory session storage (Map).
 * Fastest option, but data is lost when the bot restarts.
 *
 * ✅ Pros: very fast, no configuration required
 * ❌ Cons: data is not persistent between restarts
 */
export class MemoryStorage<T> implements Storage<T> {
  private store = new Map<string, T>();

  /**
   * Retrieves a session.
   * @param key Session key
   * @returns `T | undefined`
   */
  public get(key: string): T | undefined {
    return this.store.get(key);
  }

  /**
   * Saves a session.
   * @param key Session key
   * @param value Session value
   */
  public set(key: string, value: T): void {
    this.store.set(key, value);
  }

  /**
   * Deletes a session.
   * @param key Session key
   */
  public delete(key: string): void {
    this.store.delete(key);
  }
}