import type { Race, StatKey, Stats } from '@data/schema/enums';
import { STAT_KEYS } from '@data/schema/enums';

/** Persistent character progression (what gets saved). Vitals live separately in `Vitals`. */
export interface CharacterCore {
  name: string;
  /** 인간 or 감염체 (missing in old saves → human) */
  race: Race;
  level: number;
  xp: number;
  rebirth: number;
  base: Stats;
  unspentPoints: number;
  won: number;
}

export interface Vitals {
  hp: number;
  stamina: number;
  ap: number;
}

export function emptyStats(value = 0): Stats {
  return STAT_KEYS.reduce((acc, k) => ({ ...acc, [k]: value }), {} as Stats);
}

export function createCharacter(name: string, creationPoints: number, race: Race = 'human'): CharacterCore {
  return { name, race, level: 1, xp: 0, rebirth: 0, base: emptyStats(0), unspentPoints: creationPoints, won: 0 };
}

export const statKeys: readonly StatKey[] = STAT_KEYS;
