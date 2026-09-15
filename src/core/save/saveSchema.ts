import type { CharacterCore, Vitals } from '../stats/character';
import type { Inventory } from '../inventory/inventory';
import type { Equipment } from '../inventory/equipment';
import type { SkillState } from '../skills/skillState';
import type { FireState } from '../weapons/fireController';
import type { QuestState } from '../quest/questState';
import type { ControlScheme } from '@data/schema/enums';

export const CURRENT_SAVE_VERSION = 2 as const;

export interface SaveSettings {
  controlScheme: ControlScheme;
  showFps: boolean;
  showMinimap?: boolean;
}

interface SaveCommon {
  savedAt: number;
  character: CharacterCore;
  vitals: Vitals;
  inventory: Inventory;
  equipment: Equipment;
  skills: SkillState;
  fire: FireState;
  location: { mapId: string; spawn: string };
  flags: Record<string, boolean | number>;
  settings: SaveSettings;
  playtimeMs: number;
}

/** M1 format (no quests). */
export interface SaveGameV1 extends SaveCommon {
  version: 1;
}

/** M2: quest progress + flags (패러렐 허가증, 택시 등록). */
export interface SaveGameV2 extends SaveCommon {
  version: 2;
  quests: QuestState;
}

export type SaveGame = SaveGameV2;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const MIGRATIONS: Record<number, (d: Record<string, unknown>) => Record<string, unknown>> = {
  1: (d) => ({ ...d, version: 2, quests: { active: [], completed: [] }, flags: isObj(d.flags) ? d.flags : {} }),
};

/**
 * Validates + migrates a raw stored object to the current schema. Returns null for anything
 * unrecognisable so a corrupt row can never crash the title screen.
 */
export function migrateSave(raw: unknown): SaveGame | null {
  if (!isObj(raw) || typeof raw.version !== 'number') return null;
  let data: Record<string, unknown> = raw;
  while (typeof data.version === 'number' && data.version < CURRENT_SAVE_VERSION) {
    const step = MIGRATIONS[data.version];
    if (!step) return null;
    data = step(data);
  }
  if (data.version !== CURRENT_SAVE_VERSION) return null;
  const required = ['character', 'vitals', 'inventory', 'equipment', 'skills', 'fire', 'location', 'settings', 'quests'];
  for (const k of required) if (!isObj(data[k])) return null;
  const c = data.character as Record<string, unknown>;
  if (typeof c.name !== 'string' || typeof c.level !== 'number' || !isObj(c.base)) return null;
  const q = data.quests as Record<string, unknown>;
  if (!Array.isArray(q.active) || !Array.isArray(q.completed)) return null;
  return data as unknown as SaveGame;
}
