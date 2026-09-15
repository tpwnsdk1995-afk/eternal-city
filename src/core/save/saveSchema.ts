import type { CharacterCore, Vitals } from '../stats/character';
import type { Inventory } from '../inventory/inventory';
import type { Equipment } from '../inventory/equipment';
import type { SkillState } from '../skills/skillState';
import type { FireState } from '../weapons/fireController';
import type { QuestState } from '../quest/questState';
import type { PlayerStats } from '../world/stats';
import type { AchievementState } from '../progress/achievements';
import type { BuffState } from '../combat/buffs';
import type { ControlScheme } from '@data/schema/enums';

export const CURRENT_SAVE_VERSION = 6 as const;

export interface SaveSettings {
  controlScheme: ControlScheme;
  showFps: boolean;
  showMinimap?: boolean;
  touchControls?: 'auto' | 'on' | 'off';
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

/** M3: item stacks may carry 강화/부품/유니크/플러스업 (all optional — the shape is unchanged). */
export interface SaveGameV3 extends SaveCommon {
  version: 3;
  quests: QuestState;
}

/** M4: lifetime stats + achievements (campaign progress lives in flags). */
export interface SaveGameV4 extends SaveCommon {
  version: 4;
  quests: QuestState;
  stats: PlayerStats;
  achievements: AchievementState;
}

/** M5: timed 사이버샵 buffs (wall-clock expiry). */
export interface SaveGameV5 extends SaveCommon {
  version: 5;
  quests: QuestState;
  stats: PlayerStats;
  achievements: AchievementState;
  buffs: BuffState;
}

/** M6: character.race (인간/감염체); older saves are human. */
export interface SaveGameV6 extends SaveCommon {
  version: 6;
  quests: QuestState;
  stats: PlayerStats;
  achievements: AchievementState;
  buffs: BuffState;
}

export type SaveGame = SaveGameV6;

const EMPTY_STATS: PlayerStats = { kills: 0, bossKills: 0, killsByMonster: {}, killsByFaction: {}, assaultClears: {}, assaultFails: 0, questsCompleted: 0, deaths: 0, wonEarned: 0, maxEnhance: 0 };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const MIGRATIONS: Record<number, (d: Record<string, unknown>) => Record<string, unknown>> = {
  1: (d) => ({ ...d, version: 2, quests: { active: [], completed: [] }, flags: isObj(d.flags) ? d.flags : {} }),
  2: (d) => ({ ...d, version: 3 }),
  3: (d) => ({ ...d, version: 4, stats: { ...EMPTY_STATS }, achievements: { unlocked: [], title: null } }),
  4: (d) => ({ ...d, version: 5, buffs: { active: [] } }),
  5: (d) => ({ ...d, version: 6, character: { race: 'human', ...(isObj(d.character) ? d.character : {}) } }),
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
  const required = ['character', 'vitals', 'inventory', 'equipment', 'skills', 'fire', 'location', 'settings', 'quests', 'stats', 'achievements', 'buffs'];
  for (const k of required) if (!isObj(data[k])) return null;
  const c = data.character as Record<string, unknown>;
  if (typeof c.name !== 'string' || typeof c.level !== 'number' || !isObj(c.base)) return null;
  const q = data.quests as Record<string, unknown>;
  if (!Array.isArray(q.active) || !Array.isArray(q.completed)) return null;
  return data as unknown as SaveGame;
}
