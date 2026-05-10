// src/session/storage.ts

/**
 * Interface for session storage.
 * T - type of session data we store.
 */
export interface Storage<T> {
  /**
   * Get session data by key.
   */
  get(key: string): Promise<T | undefined> | T | undefined;

  /**
   * Save session data by key.
   */
  set(key: string, value: T): Promise<void> | void;

  /**
   * Delete session (e.g., if the user finished the dialogue).
   */
  delete(key: string): Promise<void> | void;
}