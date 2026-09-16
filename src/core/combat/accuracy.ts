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

export interface StanceSpreadInput {
  spreadDeg: number;
  tech: number;
  crouching: boolean;
  moving: boolean;
  crouchSpreadMult: number;
  moveSpreadMult: number;
  /** >1 = pellet gun: its wide cone is the point, so the cap does not apply */
  pellets: number;
}

/** Final half-angle for a shot: weapon spread × tech × stance, capped for single-bullet weapons. */
export function stanceSpread(s: StanceSpreadInput): number {
  const base = spreadRadians(s.spreadDeg, s.tech) * (s.crouching ? s.crouchSpreadMult : 1) * (s.moving ? s.moveSpreadMult : 1);
  if (s.pellets > 1) return base;
  return Math.min(base, (D.spreadCapDeg * Math.PI) / 180);
}

/**
 * Angular offset of one bullet inside the cone. Single bullets are centre-weighted (mean of two
 * uniform draws → triangular), so most shots cluster around the cursor and the edge of the cone is
 * rare; pellets stay uniform so a shotgun still fills its cone.
 */
export function spreadOffset(rng: { range(min: number, max: number): number }, halfAngle: number, pellets: number): number {
  if (halfAngle <= 0) return 0;
  if (pellets > 1) return rng.range(-halfAngle, halfAngle);
  return (rng.range(-halfAngle, halfAngle) + rng.range(-halfAngle, halfAngle)) / 2;
}
