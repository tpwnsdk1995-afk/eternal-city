import { balance } from '@data/balance';
import type { AssaultDef } from '@data/schema/assault';

export type AssaultGrade = 'S' | 'A' | 'B' | 'C' | 'F';

export interface AssaultScore {
  score: number;
  grade: AssaultGrade;
  /** multiplies the mission's ₩/XP reward (0 on failure) */
  rewardMult: number;
  killPts: number;
  timePts: number;
  clearPts: number;
  /** the "par" clear time the time bonus is measured against */
  parSec: number;
}

export interface AssaultRun {
  success: boolean;
  kills: number;
  timeSec: number;
}

type ScoreDef = Pick<AssaultDef, 'tier' | 'advanced' | 'phases'>;

/** Expected clear time: a base plus a slice per phase, so longer missions are not punished. */
export function parSec(def: Pick<AssaultDef, 'phases'>): number {
  const S = balance.assault.scoring;
  return S.parBaseSec + S.parPerPhaseSec * def.phases.length;
}

/**
 * 원작의 "점수 비례 보상": kills, clear bonus and a time bonus (full when done in half the par time,
 * gone at par) add up to a score; the grade band sets the reward multiplier. Failure keeps the
 * kill points for the record but pays nothing.
 */
export function scoreAssault(def: ScoreDef, run: AssaultRun): AssaultScore {
  const S = balance.assault.scoring;
  const par = parSec(def);
  const killPts = run.kills * S.killPts[def.tier];
  const clearPts = run.success ? S.clearPts : 0;
  const timeFrac = run.success ? Math.max(0, Math.min(1, (par - run.timeSec) / (par / 2))) : 0;
  const timePts = Math.round(S.timePts * timeFrac);
  const raw = (killPts + clearPts + timePts) * (def.advanced ? S.advancedMult : 1);
  const score = Math.round(raw);
  if (!run.success) return { score, grade: 'F', rewardMult: 0, killPts, timePts, clearPts, parSec: par };
  const band = S.grades.find((g) => score >= g.min) ?? S.grades[S.grades.length - 1];
  return { score, grade: band.grade, rewardMult: band.rewardMult, killPts, timePts, clearPts, parSec: par };
}

export const GRADE_COLOR: Record<AssaultGrade, string> = { S: '#ffd166', A: '#7bd88f', B: '#9be7ff', C: '#d6d9e0', F: '#ff6b6b' };
