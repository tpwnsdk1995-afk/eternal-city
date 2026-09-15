import type Phaser from 'phaser';

declare global {
  interface Window {
    __ec?: EcDebug;
  }
}

export interface EcDebug {
  game: Phaser.Game;
  scene(): string | null;
}

/** DEV-only debug hook used by Playwright specs to inspect game state without reading pixels. */
export function exposeDebug(game: Phaser.Game): void {
  window.__ec = {
    game,
    scene: () => {
      const active = game.scene.getScenes(true);
      return active.length ? active[active.length - 1].scene.key : null;
    },
  };
}
