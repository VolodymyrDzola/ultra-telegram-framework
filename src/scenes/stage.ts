// src/scenes/stage.ts
import { Composer, Middleware } from '../core/composer.js';
import { SceneContext, WizardScene } from './wizard.js';
import { SceneManager } from './scene-manager.js';

export class Stage<C extends SceneContext> extends Composer<C> {
  private scenes: Map<string, WizardScene<C>> = new Map();

  constructor(scenes: WizardScene<C>[] = []) {
    super();
    scenes.forEach(scene => this.register(scene));
  }

  public register(scene: WizardScene<C>): void {
    this.scenes.set(scene.name, scene);
  }

  public middleware(): Middleware<C> {
    const globalHandler = super.middleware();

    return async (ctx, next) => {
      // 1. Hydrate context with scene manager
      ctx.scene = new SceneManager(ctx);

      const activeSceneName = ctx.scene.session.name;

      // 2. If the user is NOT in a scene, pass the event to global bot handlers
      if (!activeSceneName) {
        return globalHandler(ctx, next);
      }

      // 3. If the scene is active, find it
      const scene = this.scenes.get(activeSceneName);

      if (!scene) {
        // Protection against broken sessions: if the scene has been deleted from the code, exit
        ctx.scene.leave();
        return globalHandler(ctx, next);
      }

      // 4. Pass control to the active scene
      await scene.middleware()(ctx, next);
    };
  }
}