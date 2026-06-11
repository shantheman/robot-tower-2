/** The Game controller: owns the GameState and routes between screens.
 * Phaser runs the battle; every menu/panel is DOM. Screens register
 * themselves here so the controller stays the single flow authority.
 *
 * Flow (same as the original):
 *   HOME -> BATTLE -> (wave cleared) SHOP -> BATTLE ... boss wave -> HOME
 *   BATTLE -> (hp 0) DEAD -> HOME (retry same level at wave 1)
 */

import { GameState } from "./sim/state";

export type Screen = "home" | "battle" | "shop" | "skills" | "pause" | "dead";

export interface ScreenHooks {
  onShow?: (from: Screen) => void;
  onHide?: () => void;
}

export class Game {
  readonly gs: GameState;
  screen: Screen = "home";
  /** Why the shop is open: between waves (cleared) or a mid-wave Tab pause. */
  shopMode: "cleared" | "paused" = "paused";
  private hooks = new Map<Screen, ScreenHooks>();
  /** The battle scene registers these so DOM panels can drive it. */
  battle: {
    startBattle: () => void;      // fresh run at gs.level
    resumeWave: () => void;       // unpause after a shop/pause panel closes
    nextWave: () => void;         // leave the between-waves shop
    setPaused: (p: boolean) => void;
  } | null = null;

  constructor() {
    this.gs = new GameState();
  }

  register(screen: Screen, hooks: ScreenHooks): void {
    this.hooks.set(screen, hooks);
  }

  show(next: Screen): void {
    if (next === this.screen) return;
    const prev = this.screen;
    this.hooks.get(prev)?.onHide?.();
    this.screen = next;
    this.hooks.get(next)?.onShow?.(prev);
  }
}

export const game = new Game();
