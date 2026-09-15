import { balance } from '@data/balance';
import { clamp } from '../math/vec';

const D = balance.derived;

export interface AccuracyInput {
  baseAccuracy: number; // weapon
  tech: number; // 기술
  accMods: number; // from skills, e.g. 0.05
  dist: number;
  range: number;
  moving: boolean;
  crouching: boolean;
}

export function hitChance(a: AccuracyInput): number {
  const distPenalty = D.accDistancePenalty * Math.pow(Math.min(1, a.dist / Math.max(1, a.range)), 2);
  const raw = a.baseAccuracy + a.tech * D.accPerTech + a.accMods - distPenalty - (a.moving ? D.accMovingPenalty : 0) + (a.crouching ? D.accCrouchBonus : 0);
  return clamp(raw, D.accMin, D.accMax);
}

/** Cone half-angle in radians the shot can deviate by. */
export function spreadRadians(spreadDeg: number, tech: number): number {
  const mult = Math.max(D.spreadMinMult, 1 - tech * D.spreadReductionPerTech);
  return (spreadDeg * mult * Math.PI) / 180;
}
