import { balance } from '@data/balance';
import { createCharacter, type CharacterCore } from './character';

const S = balance.stats;

export type RebirthBlock = 'level' | 'max';

/** 환생: allowed at the rebirth level, up to the maximum count. */
export function canRebirth(c: CharacterCore): { ok: true } | { ok: false; reason: RebirthBlock } {
  if (c.rebirth >= S.maxRebirth) return { ok: false, reason: 'max' };
  if (c.level < S.rebirthLevel) return { ok: false, reason: 'level' };
  return { ok: true };
}

/** Bonus creation points a character with `rebirth` rebirths starts over with. */
export const rebirthBonusPoints = (rebirth: number): number => rebirth * S.rebirthBonusPoints;

/**
 * Back to level 1 with the stat cap raised (+15 per rebirth) and extra starting points.
 * Name, ₩ (and, outside this function, inventory/equipment/skills) are kept.
 */
export function rebirth(c: CharacterCore): CharacterCore {
  const next = c.rebirth + 1;
  const fresh = createCharacter(c.name, S.creationPoints + rebirthBonusPoints(next));
  return { ...fresh, rebirth: next, won: c.won };
}
