import { balance } from '@data/balance';
import type { Rng } from '../rng';

const C = balance.combat;

/** Damage the player takes from a raw enemy hit after armour. */
export function playerDamageTaken(raw: number, defense: number, rng: Rng): number {
  const variance = rng.range(C.varianceMin, C.varianceMax);
  return Math.max(C.minDamage, Math.round((raw * variance * 100) / (100 + Math.max(0, defense))));
}

/** Enemy ranged accuracy: base accuracy tapering with distance, bonus vs a stationary target. */
export function enemyHitChance(accuracy: number, dist: number, range: number, playerMoving: boolean): number {
  const distPenalty = 0.25 * Math.pow(Math.min(1, dist / Math.max(1, range)), 2);
  const raw = accuracy - distPenalty + (playerMoving ? 0 : 0.1);
  return Math.min(0.95, Math.max(0.05, raw));
}
