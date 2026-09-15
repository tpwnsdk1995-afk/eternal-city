import type { CharacterCore, Vitals } from '../stats/character';
import type { Inventory } from '../inventory/inventory';
import type { Equipment } from '../inventory/equipment';
import type { SkillState } from '../skills/skillState';
import type { FireState } from '../weapons/fireController';
import type { QuestState } from '../quest/questState';
import type { ControlScheme } from '@data/schema/enums';

export const CURRENT_SAVE_VERSION = 1 as const;

export interface SaveSettings {
  controlScheme: ControlScheme;
  showFps: boolean;
  showMinimap?: boolean;
}

export interface SaveGameV1 {
  version: 1;
  savedAt: number;
  character: CharacterCore;
  vitals: Vitals;
  inventory: Inventory;
  equipment: Equipment;
  skills: SkillState;
  fire: FireState;
  /** added mid-M2; absent in early v1 rows (treated as empty) */
  quests?: QuestState;
  location: { mapId: string; spawn: string };
  flags: Record<string, boolean | number>;
  settings: SaveSettings;
  playtimeMs: number;
}

export type SaveGame = SaveGameV1;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * Validates + migrates a raw stored object to the current schema. Returns null for anything
 * unrecognisable so a corrupt row can never crash the title screen.
 */
export function migrateSave(raw: unknown): SaveGame | null {
  if (!isObj(raw) || typeof raw.version !== 'number') return null;
  let data: Record<string, unknown> = raw;
  // future: while (data.version < CURRENT_SAVE_VERSION) data = MIGRATIONS[data.version](data)
  if (data.version !== CURRENT_SAVE_VERSION) return null;
  const required = ['character', 'vitals', 'inventory', 'equipment', 'skills', 'fire', 'location', 'settings'];
  for (const k of required) if (!isObj(data[k])) return null;
  const c = data.character as Record<string, unknown>;
  if (typeof c.name !== 'string' || typeof c.level !== 'number' || !isObj(c.base)) return null;
  return data as unknown as SaveGame;
}
