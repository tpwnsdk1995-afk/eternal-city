import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { totalRounds } from '@core/inventory/inventory';
import { gameState } from '../game/state/GameState';
import { BaseWorldScene } from '../game/scenes/BaseWorldScene';

declare global {
  interface Window {
    __ec?: EcDebug;
  }
}

export interface HudSnapshot {
  hp: number;
  hpMax: number;
  stamina: number;
  ap: number;
  level: number;
  xp: number;
  won: number;
  weaponName: string | null;
  ammo: number;
  mapId: string;
  mapName: string;
}

export interface EcDebug {
  game: Phaser.Game;
  scene(): string | null;
  hud(): HudSnapshot;
  fps(): number;
  /** Player world position in the active world scene, or null on non-world scenes. */
  player(): { x: number; y: number } | null;
  /** Jump to another map/spawn (same transition the portals use). */
  warp(mapId: string, spawn?: string): void;
  state: typeof gameState;
}

/** Debug hook used by Playwright specs to inspect game state without reading pixels. */
export function exposeDebug(game: Phaser.Game): void {
  const worldScene = (): BaseWorldScene | null => {
    const s = game.scene.getScenes(true).find((sc) => sc instanceof BaseWorldScene);
    return (s as BaseWorldScene | undefined) ?? null;
  };
  window.__ec = {
    game,
    state: gameState,
    scene: () => {
      const active = game.scene.getScenes(true).filter((s) => s.scene.key !== 'UI');
      return active.length ? active[active.length - 1].scene.key : null;
    },
    player: () => worldScene()?.playerPos() ?? null,
    warp: (mapId, spawn = 'default') => worldScene()?.goToMap(mapId, spawn),
    fps: () => game.loop.actualFps,
    hud: () => {
      const d = gameState.derived();
      const w = gameState.weapon();
      return {
        hp: gameState.vitals.hp,
        hpMax: d.maxHp,
        stamina: gameState.vitals.stamina,
        ap: gameState.vitals.ap,
        level: gameState.character.level,
        xp: gameState.character.xp,
        won: gameState.character.won,
        weaponName: w?.def.name ?? null,
        ammo: w ? totalRounds(gameState.inventory, registry.item, w.def.caliber, gameState.fire.ammoKind) : 0,
        mapId: gameState.currentMapId,
        mapName: registry.map(gameState.currentMapId).name,
      };
    },
  };
}
