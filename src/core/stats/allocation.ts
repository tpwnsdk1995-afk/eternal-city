import type { StatKey } from '@data/schema/enums';
import type { CharacterCore } from './character';
import { statCap } from './levelCurve';

export type AllocationResult = { ok: true; character: CharacterCore } | { ok: false; reason: 'noPoints' | 'capReached' | 'invalid' };

/** Spends `n` unspent points into `stat`, respecting the per-stat cap for the character's rebirth count. */
export function allocateStat(character: CharacterCore, stat: StatKey, n = 1): AllocationResult {
  if (!Number.isInteger(n) || n <= 0) return { ok: false, reason: 'invalid' };
  if (character.unspentPoints < n) return { ok: false, reason: 'noPoints' };
  const cap = statCap(character.rebirth);
  if (character.base[stat] + n > cap) return { ok: false, reason: 'capReached' };

  return {
    ok: true,
    character: {
      ...character,
      unspentPoints: character.unspentPoints - n,
      base: { ...character.base, [stat]: character.base[stat] + n },
    },
  };
}
