// src/scenes/wizard.ts
import { Composer, Middleware } from '../core/composer';
import { Context } from '../core/context';
import { SceneManager } from './scene-manager';
import { SessionData } from '../session';

export interface SceneContext extends Context {
  session: SessionData;
  scene: SceneManager;
}

export class WizardScene<C extends SceneContext> extends Composer<C> {
  public readonly name: string;
  private steps: Middleware<C>[];

  /**
   * @param name Unique name of the scene
   * @param steps Handler functions for each step (Step 0, Step 1, ...)
   */
  constructor(name: string, ...steps: Middleware<C>[]) {
    super();
    this.name = name;
    this.steps = steps;
  }

  public middleware(): Middleware<C> {
    const globalHandler = super.middleware();

    return async (ctx, next) => {
      let handledGlobally = false;
      await globalHandler(ctx, async () => {
        handledGlobally = true;
      });

      if (!handledGlobally) return;

      const currentStepIndex = ctx.scene.session.step ?? 0;
      const stepHandler = this.steps[currentStepIndex];

      if (!stepHandler) {
        ctx.scene.leave();
        return next();
      }

      await stepHandler(ctx, next);
    };
  }
}