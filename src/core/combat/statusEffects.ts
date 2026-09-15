import { balance } from '@data/balance';

const C = balance.combat;

export interface StatusState {
  burningUntil: number; // ms timestamp, 0 = not burning
  burnAccumulator: number; // fractional damage carried between ticks
  invulnUntil: number;
}

export const emptyStatus = (): StatusState => ({ burningUntil: 0, burnAccumulator: 0, invulnUntil: 0 });

export const isBurning = (s: StatusState, now: number): boolean => s.burningUntil > now;
export const isInvulnerable = (s: StatusState, now: number): boolean => s.invulnUntil > now;

/** (Re)applies burning for the standard duration — refreshes, never stacks. */
export function applyBurn(s: StatusState, now: number): StatusState {
  return { ...s, burningUntil: now + C.burnDurationMs };
}

/** Advances burning by `dtMs`; returns integer damage to apply this tick (1% maxHp per second). */
export function tickBurn(s: StatusState, now: number, dtMs: number, maxHp: number): { state: StatusState; damage: number } {
  if (!isBurning(s, now)) return { state: s.burnAccumulator ? { ...s, burnAccumulator: 0 } : s, damage: 0 };
  const acc = s.burnAccumulator + maxHp * C.burnPctPerSec * (dtMs / 1000);
  const damage = Math.floor(acc);
  return { state: { ...s, burnAccumulator: acc - damage }, damage };
}
