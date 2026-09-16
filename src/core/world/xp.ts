import { balance } from '@data/balance';
import type { MonsterDef } from '@data/schema/monster';
import type { CharacterCore } from '../stats/character';
import { statPointsGained, xpToNext } from '../stats/levelCurve';

const X = balance.xp;

/** XP for killing `monster` at `playerLevel`, tapering off when the player heavily out-levels it. */
export function xpForKill(monster: MonsterDef, playerLevel: number): number {
  const gap = Math.max(0, playerLevel - monster.level - X.killLevelGapGrace);
  const mult = Math.max(X.killMinMult, Math.min(1, 1 - gap * X.killLevelGapPenaltyPerLevel));
  return Math.max(1, Math.round(monster.xp * X.killMult * mult));
}

export interface XpResult {
  character: CharacterCore;
  levelUps: number[]; // levels reached, in order
  pointsGained: number;
}

/** Adds XP and rolls over as many level-ups as it covers. */
export function applyXp(character: CharacterCore, amount: number): XpResult {
  let { level, xp, unspentPoints } = character;
  xp += Math.max(0, Math.floor(amount));
  const levelUps: number[] = [];
  let pointsGained = 0;

  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    const pts = statPointsGained(level);
    unspentPoints += pts;
    pointsGained += pts;
    levelUps.push(level);
  }

  return { character: { ...character, level, xp, unspentPoints }, levelUps, pointsGained };
}
