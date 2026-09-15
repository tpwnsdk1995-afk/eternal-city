import { balance } from '@data/balance';
import { registry } from '@data/registry';
import { initialFireState } from '@core/weapons/fireController';
import { emptyStatus } from '@core/combat/statusEffects';
import { CURRENT_SAVE_VERSION, migrateSave, type SaveGame } from '@core/save/saveSchema';
import { db, type SaveRow } from './db';
import { gameState } from './GameState';

export const DEFAULT_SLOT = 1;
const AUTOSAVE_MIN_GAP_MS = 4000;
const AUTOSAVE_PERIOD_MS = 60_000;
const SETTINGS_KEY = 'settings';

const ASSAULT_MAP_IDS = new Set(['junggok-blockade']);

/** Where the character should reappear on load: never inside an assault instance. */
export function saveLocation(mapId: string): { mapId: string; spawn: string } {
  if (ASSAULT_MAP_IDS.has(mapId) || !registry.map(mapId)) return { mapId: balance.death.respawnMap, spawn: balance.death.respawnPoint };
  return { mapId, spawn: 'default' };
}

export function takeSnapshot(): SaveGame {
  return {
    version: CURRENT_SAVE_VERSION,
    savedAt: Date.now(),
    character: gameState.character,
    vitals: gameState.vitals,
    inventory: gameState.inventory,
    equipment: gameState.equipment,
    skills: gameState.skills,
    fire: gameState.fire,
    location: saveLocation(gameState.currentMapId),
    flags: { ...gameState.flags, god: false },
    settings: { ...gameState.settings },
    playtimeMs: gameState.playtimeMs,
  };
}

/** Loads a snapshot into the live state (does not change scenes). */
export function applySnapshot(save: SaveGame): void {
  gameState.character = save.character;
  gameState.inventory = save.inventory;
  gameState.equipment = save.equipment;
  gameState.skills = save.skills;
  gameState.fire = { ...initialFireState(), ...save.fire, lastFireAt: -Infinity };
  gameState.status = emptyStatus();
  gameState.consciousness = { lastTriggeredAt: -Infinity };
  gameState.flags = { ...save.flags };
  gameState.playtimeMs = save.playtimeMs ?? 0;
  gameState.currentMapId = save.location.mapId;
  gameState.settings = { ...gameState.settings, ...save.settings };
  const d = gameState.derived();
  gameState.vitals = {
    hp: Math.min(d.maxHp, Math.max(1, save.vitals.hp)),
    stamina: Math.min(d.maxStamina, save.vitals.stamina),
    ap: Math.min(d.maxAp, save.vitals.ap),
  };
  gameState.emitAll();
}

class SaveService {
  private lastAutosaveAt = -Infinity;
  private attached = false;
  private unsubs: (() => void)[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  /** true once a character exists in memory (new game or loaded) */
  hasCharacter = false;

  async save(slot = DEFAULT_SLOT): Promise<SaveRow> {
    const data = takeSnapshot();
    const row: SaveRow = {
      slot,
      name: data.character.name,
      level: data.character.level,
      mapName: registry.map(data.location.mapId).name,
      updatedAt: data.savedAt,
      data,
    };
    await db.saves.put(row);
    this.lastAutosaveAt = performance.now();
    return row;
  }

  async peek(slot = DEFAULT_SLOT): Promise<SaveRow | null> {
    const row = await db.saves.get(slot);
    if (!row || !migrateSave(row.data)) return null;
    return row;
  }

  async load(slot = DEFAULT_SLOT): Promise<SaveGame | null> {
    const row = await db.saves.get(slot);
    const save = row ? migrateSave(row.data) : null;
    if (!save) return null;
    applySnapshot(save);
    this.hasCharacter = true;
    return save;
  }

  async deleteSave(slot = DEFAULT_SLOT): Promise<void> {
    await db.saves.delete(slot);
  }

  /** Autosave: throttled so bursts of events (level-up + loot) write once. */
  autosave(reason: string): void {
    if (!this.hasCharacter) return;
    const now = performance.now();
    if (now - this.lastAutosaveAt < AUTOSAVE_MIN_GAP_MS) return;
    this.lastAutosaveAt = now;
    void this.save().then(() => gameState.message(`자동 저장 (${reason})`, 'system'));
  }

  /** Wires autosave triggers + settings persistence. Idempotent. */
  attach(): void {
    if (this.attached) return;
    this.attached = true;
    const on = gameState.events.on.bind(gameState.events);
    this.unsubs.push(
      on('mapChanged', () => this.autosave('맵 이동')),
      on('skills', () => this.autosave('스킬')),
      on('equipment', () => this.autosave('장비')),
      on('settings', (s) => void db.settings.put({ key: SETTINGS_KEY, value: s })),
    );
    let lastLevel = gameState.character.level;
    this.unsubs.push(
      on('character', (c) => {
        if (c.level !== lastLevel) {
          lastLevel = c.level;
          this.autosave('레벨 업');
        }
      }),
    );
    this.timer = setInterval(() => this.autosave('정기'), AUTOSAVE_PERIOD_MS);
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.hasCharacter) void this.save();
      });
    }
  }

  detach(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.attached = false;
  }

  async loadSettings(): Promise<void> {
    const row = await db.settings.get(SETTINGS_KEY);
    if (row && typeof row.value === 'object' && row.value) gameState.settings = { ...gameState.settings, ...(row.value as Partial<typeof gameState.settings>) };
  }
}

export const saveService = new SaveService();
