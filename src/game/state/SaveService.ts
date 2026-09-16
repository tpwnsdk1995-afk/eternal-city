import { balance } from '@data/balance';
import { ASSAULTS, registry } from '@data/registry';
import { hubForYear } from '@core/world/parallel';
import { initialFireState } from '@core/weapons/fireController';
import { emptyStatus } from '@core/combat/statusEffects';
import { CURRENT_SAVE_VERSION, migrateSave, type SaveGame } from '@core/save/saveSchema';
import { decodeSaveFile, describeDecodeFail, encodeSaveFile, saveFileName, type DecodeResult } from '@core/save/transfer';
import { db, type SaveRow } from './db';
import { gameState } from './GameState';
import { cloudSave } from './CloudSave';

export const DEFAULT_SLOT = 1;
export const SLOT_COUNT = 3;
export const SLOTS = [1, 2, 3] as const;
const AUTOSAVE_MIN_GAP_MS = 4000;
const AUTOSAVE_PERIOD_MS = 60_000;
const SETTINGS_KEY = 'settings';

const ASSAULT_MAP_IDS = new Set(ASSAULTS.map((a) => a.mapId));

/** Where the character should reappear on load: never inside an assault instance. */
export function saveLocation(mapId: string): { mapId: string; spawn: string } {
  if (!registry.hasMap(mapId)) return { mapId: balance.death.respawnMap, spawn: balance.death.respawnPoint };
  if (ASSAULT_MAP_IDS.has(mapId)) return { mapId: hubForYear(registry.map(mapId).year), spawn: balance.death.respawnPoint };
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
    quests: gameState.quests,
    stats: gameState.stats,
    achievements: gameState.achievements,
    buffs: gameState.buffs,
    guild: gameState.guild,
    storage: gameState.storage,
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
  gameState.quests = save.quests;
  gameState.stats = save.stats;
  gameState.achievements = save.achievements;
  gameState.buffs = save.buffs;
  gameState.guild = save.guild ?? { name: null, contributed: 0, foundedAt: 0 };
  gameState.storage = save.storage ?? { items: [], nextUid: 1 };
  gameState.pruneBuffs();
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
  /** the slot the live character saves to (title selection / last load) */
  currentSlot = DEFAULT_SLOT;

  async save(slot = this.currentSlot): Promise<SaveRow> {
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
    void cloudSave.push(data, slot); // account-bound copy when the play page provides one
    return row;
  }

  async peek(slot = DEFAULT_SLOT): Promise<SaveRow | null> {
    const row = await db.saves.get(slot);
    if (!row || !migrateSave(row.data)) return null;
    return row;
  }

  async load(slot = this.currentSlot): Promise<SaveGame | null> {
    const row = await db.saves.get(slot);
    const save = row ? migrateSave(row.data) : null;
    if (!save) return null;
    // Re-point first and mute autosave: applySnapshot emits equipment/skills events, and an attached
    // listener would otherwise write this character into whatever slot was current before.
    this.hasCharacter = false;
    this.currentSlot = slot;
    applySnapshot(save);
    this.hasCharacter = true;
    return save;
  }

  async deleteSave(slot = this.currentSlot): Promise<void> {
    await db.saves.delete(slot);
    void cloudSave.remove(slot);
  }

  /** All slots, in order (null = empty/corrupt). */
  async peekAll(): Promise<(SaveRow | null)[]> {
    return Promise.all(SLOTS.map((n) => this.peek(n)));
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

  // --- 내보내기 / 불러오기 (move a save between devices) ----------------------------------------

  /** Portable text of the live character (or of the stored slot when no character is loaded). */
  async exportText(slot = this.currentSlot): Promise<string | null> {
    if (this.hasCharacter) return encodeSaveFile(takeSnapshot());
    const row = await db.saves.get(slot);
    const save = row ? migrateSave(row.data) : null;
    return save ? encodeSaveFile(save) : null;
  }

  /** Download the save as a .json file. Returns the file name, or null when nothing to export. */
  async exportToFile(): Promise<string | null> {
    const text = await this.exportText();
    if (!text) return null;
    const save = decodeSaveFile(text);
    const name = save.ok ? saveFileName(save.save) : 'eternal-city_save.json';
    if (typeof document === 'undefined') return name;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1000);
    return name;
  }

  /** Copy the save text to the clipboard (mobile browsers that block downloads). */
  async exportToClipboard(): Promise<boolean> {
    const text = await this.exportText();
    if (!text || typeof navigator === 'undefined' || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate + store an exported save into the slot. Does not touch the live state — callers
   * decide whether to `load()` it right away (title) or travel to its location (in-game).
   */
  async importText(text: string, slot = this.currentSlot): Promise<DecodeResult & { row?: SaveRow }> {
    const r = decodeSaveFile(text);
    if (!r.ok) return r;
    const data = r.save;
    const loc = saveLocation(data.location.mapId);
    const row: SaveRow = {
      slot,
      name: data.character.name,
      level: data.character.level,
      mapName: registry.map(loc.mapId).name,
      updatedAt: Date.now(),
      data: { ...data, location: loc },
    };
    await db.saves.put(row);
    return { ...r, row };
  }

  /** Open the browser file picker and import the chosen .json. Resolves null when cancelled. */
  importFromPicker(): Promise<(DecodeResult & { row?: SaveRow }) | null> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') return resolve(null);
      let input = document.getElementById('ec-import') as HTMLInputElement | null;
      if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'ec-import';
        input.accept = '.json,application/json';
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);
      }
      input.value = '';
      input.onchange = async () => {
        const f = input!.files?.[0];
        if (!f) return resolve(null);
        try {
          resolve(await this.importText(await f.text()));
        } catch {
          resolve({ ok: false, reason: 'parse' });
        }
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  /** Import from the clipboard text (paired with exportToClipboard). */
  async importFromClipboard(): Promise<(DecodeResult & { row?: SaveRow }) | null> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return null;
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return null;
      return await this.importText(text);
    } catch {
      return null;
    }
  }

  describeImportFail(r: DecodeResult): string {
    return r.ok ? '' : describeDecodeFail(r.reason);
  }
}

export const saveService = new SaveService();
