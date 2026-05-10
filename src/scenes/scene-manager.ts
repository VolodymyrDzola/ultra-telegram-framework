// src/scenes/scene-manager.ts

export interface SceneSessionData {
  name?: string; // Name of the active scene
  step?: number; // Current step (index)
  state?: Record<string, any>; // Temporary data that exists only inside the scene
}

export class SceneManager {
  constructor(private ctx: { session?: Record<string, any> }) { }

  /**
   * Protected access to the system scene session object.
   */
  public get session(): SceneSessionData {
    this.ctx.session ??= {};
    this.ctx.session.__scene ??= {};
    return this.ctx.session.__scene;
  }

  /**
   * Storage for temporary data of a specific scene.
   * Cleared when leaving the scene.
   */
  public get state(): Record<string, any> {
    this.session.state ??= {};
    return this.session.state;
  }

  public set state(value: Record<string, any>) {
    this.session.state = value;
  }

  /**
   * Enter a new scene
   * @param name Scene name
   * @param initialState Initial state (optional)
   */
  public enter(name: string, initialState: Record<string, any> = {}): void {
    this.ctx.session ??= {};
    this.ctx.session.__scene = {
      name,
      step: 0,
      state: initialState,
    };
  }

  /**
   * Leave the current scene (resets FSM)
   */
  public leave(): void {
    if (this.ctx.session && this.ctx.session.__scene) {
      delete this.ctx.session.__scene;
    }
  }

  /**
   * Go to the next step in the Wizard scene
   */
  public next(): void {
    this.session.step = (this.session.step ?? 0) + 1;
  }

  /**
   * Go to a specific step by its index
   */
  public selectStep(index: number): void {
    this.session.step = index;
  }
}