import { balance } from '@data/balance';
import type { Rng } from '../rng';

const D = balance.derived;

export interface ConsciousnessState {
  lastTriggeredAt: number; // ms, -Infinity if never
}

export interface ConsciousnessRoll {
  survived: boolean;
  invulnUntil: number;
  state: ConsciousnessState;
}

/**
 * 의식회복: when a hit would be lethal, roll `chance` (from 생명력). On success the character
 * survives at 1 HP with brief invulnerability; an internal cooldown prevents chaining.
 */
export function rollConsciousness(chance: number, state: ConsciousnessState, now: number, rng: Rng): ConsciousnessRoll {
  const onCooldown = now - state.lastTriggeredAt < D.consciousnessCooldownMs;
  if (onCooldown || !rng.chance(chance)) return { survived: false, invulnUntil: 0, state };
  return { survived: true, invulnUntil: now + D.consciousnessInvulnMs, state: { lastTriggeredAt: now } };
}
