import { balance } from '@data/balance';

const S = balance.stats;
const X = balance.xp;

/** XP required to advance from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return Math.floor(X.levelBase * Math.pow(level, X.levelExponent));
}

/** Stat points granted upon reaching `newLevel`. */
export function statPointsGained(newLevel: number): number {
  return S.pointsPerLevel + (S.bonusPointsAtLevels.includes(newLevel) ? S.bonusPoints : 0);
}

/** Per-stat investment cap: 350 until rebirths raise it, 600 at the maximum rebirth count. */
export function statCap(rebirth: number): number {
  if (rebirth >= S.maxRebirth) return S.absoluteCap;
  return Math.min(S.absoluteCap, S.baseCap + S.capPerRebirth * Math.max(0, rebirth));
}

/** 기술등급 — gates skills; derived from 지능. */
export function techGrade(intelligence: number): number {
  return 1 + Math.floor(intelligence / balance.derived.intPerTechGrade);
}
