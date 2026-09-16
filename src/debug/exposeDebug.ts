import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { addItem, totalRounds } from '@core/inventory/inventory';
import { totalWeightKg } from '@core/inventory/weight';
import { questService } from '../game/state/questService';
import { gameState } from '../game/state/GameState';
import { BaseWorldScene } from '../game/scenes/BaseWorldScene';
import type { UIScene } from '../game/scenes/UIScene';
import { AssaultScene } from '../game/scenes/AssaultScene';
import type { WindowKey } from '../game/ui/WindowManager';
import { weaponLabel } from '@core/tuning/tuning';
import { actions, type Actions } from '../game/state/actions';
import { saveService } from '../game/state/SaveService';
import { cloudSave } from '../game/state/CloudSave';
import { audio } from '../game/audio/AudioManager';

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
  weightKg: number;
  weaponName: string | null;
  weaponLabel: string | null;
  ammo: number;
  ammoKind: string;
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
  /** World → screen pixels for the active world camera. */
  toScreen(x: number, y: number): { x: number; y: number } | null;
  /** Spawn a monster offset from the player (combat maps only). Returns its uid. */
  spawn(monsterId: string, dx?: number, dy?: number): string | null;
  enemies(): { uid: string; id: string; hp: number; x: number; y: number; mode: string }[];
  /** Launcher rounds currently flying. */
  projectiles(): { x: number; y: number; travelled: number; maxDist: number }[];
  god(on: boolean): void;
  teleport(x: number, y: number): void;
  killAll(): void;
  startAssault(assaultId: string): void;
  /** Assault runtime snapshot, or null outside an assault. */
  assault(): ReturnType<AssaultScene['assaultSnapshot']> | null;
  destroyObjectives(): void;
  /** Debug: add an item straight into the inventory (quest progression hooks included). */
  give(itemId: string, qty?: number): void;
  save(): Promise<unknown>;
  hasSave(slot?: number): Promise<boolean>;
  /** Title slot summaries (null = empty). */
  slots(): Promise<({ slot: number; name: string; level: number } | null)[]>;
  deleteSave(slot: number): Promise<void>;
  currentSlot(): number;
  /** Procedural audio: unlocked flag, current ambient bed, and the most recent play names. */
  audio(): { unlocked: boolean; ambient: string; bgm: string; recent: string[]; samples: number };
  /** Cloud-save status (account-bound store on the play page; 'offline' elsewhere). */
  cloud(): { state: string; lastSyncAt: number; text: string };
  /** Portable save text (what 내보내기 writes), or null without a save. */
  exportSave(): Promise<string | null>;
  /** Validate + store exported text into the slot (what 불러오기 does before loading). */
  importSave(text: string): Promise<{ ok: boolean; reason?: string }>;
  /** Open window keys (top last). */
  windows(): string[];
  openWindow(key: WindowKey): void;
  /** Open the quest window on a tab (퀘스트/캠페인/업적). */
  questTab(tab: 'quests' | 'campaign' | 'achievements'): void;
  /** Open the shop window with a specific merchant's stock. */
  openShop(npcId: string): void;
  closeWindows(): void;
  /** Screen centre of a labelled button inside an open window (canvas UI has no DOM to query). */
  buttonPos(key: WindowKey, label: string): { x: number; y: number } | null;
  /** On-screen touch control layout (screen px), or null when the UI scene is not running. */
  touch(): ReturnType<UIScene['touch']['snapshot']> | null;
  /** Same validated player actions the windows use (equip/use/allocate/buy/sell/skills). */
  actions: Actions;
  state: typeof gameState;
}

/** Debug hook used by Playwright specs to inspect game state without reading pixels. */
export function exposeDebug(game: Phaser.Game): void {
  const worldScene = (): BaseWorldScene | null => {
    const s = game.scene.getScenes(true).find((sc) => sc instanceof BaseWorldScene);
    return (s as BaseWorldScene | undefined) ?? null;
  };
  const uiScene = (): UIScene | null => {
    const s = game.scene.getScene('UI') as UIScene | null;
    return s && s.scene.isActive() ? s : null;
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
    toScreen: (x, y) => worldScene()?.toScreen(x, y) ?? null,
    spawn: (monsterId, dx = 120, dy = 0) => {
      const s = worldScene();
      if (!s) return null;
      const p = s.playerPos();
      return s.spawnEnemyAt(monsterId, p.x + dx, p.y + dy)?.uid ?? null;
    },
    enemies: () => worldScene()?.enemiesSnapshot() ?? [],
    projectiles: () => worldScene()?.projectilesSnapshot() ?? [],
    god: (on) => {
      gameState.flags.god = on;
    },
    teleport: (x, y) => worldScene()?.teleport(x, y),
    killAll: () => worldScene()?.killAllEnemies(),
    startAssault: (id) => worldScene()?.startAssault(id),
    assault: () => {
      const s = worldScene();
      return s instanceof AssaultScene ? s.assaultSnapshot() : null;
    },
    destroyObjectives: () => {
      const s = worldScene();
      if (s instanceof AssaultScene) s.destroyAllObjectives();
    },
    give: (itemId, qty = 1) => {
      gameState.setInventory(addItem(gameState.inventory, registry.item(itemId), qty));
      questService.syncCollect(itemId);
    },
    save: () => saveService.save(),
    hasSave: (slot) => saveService.peek(slot ?? saveService.currentSlot).then((r) => !!r),
    slots: () => saveService.peekAll().then((rows) => rows.map((r) => (r ? { slot: r.slot, name: r.name, level: r.level } : null))),
    deleteSave: (slot) => saveService.deleteSave(slot),
    currentSlot: () => saveService.currentSlot,
    audio: () => audio.snapshot(),
    cloud: () => ({ state: cloudSave.state, lastSyncAt: cloudSave.lastSyncAt, text: cloudSave.describe() }),
    exportSave: () => saveService.exportText(),
    importSave: (text) => saveService.importText(text).then((r) => (r.ok ? { ok: true } : { ok: false, reason: r.reason })),
    windows: () => uiScene()?.windows.openKeys() ?? [],
    openWindow: (key) => uiScene()?.windows.open(key),
    questTab: (tab) => uiScene()?.windows.questTab(tab),
    openShop: (npcId) => uiScene()?.windows.openShopFor(npcId),
    closeWindows: () => uiScene()?.windows.closeAll(),
    buttonPos: (key, label) => uiScene()?.windows.buttonPos(key, label) ?? null,
    touch: () => uiScene()?.touch.snapshot() ?? null,
    actions,
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
        weightKg: totalWeightKg(gameState.inventory, registry.item),
        weaponName: w?.def.name ?? null,
        weaponLabel: w ? weaponLabel(w.def, w.stack) : null,
        ammo: w ? totalRounds(gameState.inventory, registry.item, w.def.caliber, gameState.fire.ammoKind) : 0,
        ammoKind: gameState.fire.ammoKind,
        mapId: gameState.currentMapId,
        mapName: registry.map(gameState.currentMapId).name,
      };
    },
  };
}
