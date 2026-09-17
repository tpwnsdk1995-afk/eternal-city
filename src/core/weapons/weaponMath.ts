import { balance } from '@data/balance';
import type { WeaponDef } from '@data/schema/item';
import type { WeaponClass } from '@data/schema/enums';

const C = balance.combat;

export function subFireParams(def: WeaponDef): { rpm: number; dmgMult: number } {
  return def.subFire ?? C.defaultSubFire;
}

export function effectiveRpm(def: WeaponDef, subFire: boolean): number {
  return subFire ? subFireParams(def).rpm : def.rpm;
}

/** How each class handles stance: spread while crouched / moving and an extra accuracy penalty on the move. */
export interface FireProfile {
  crouchSpreadMult: number;
  moveSpreadMult: number;
  moveAccPenalty: number;
  /** damage multiplier when crouched (snipers reward stillness) */
  crouchDmgMult: number;
}

// Moving costs a little precision, never the ability to hit what the cursor is on: the cone widens
// mildly and the accuracy roll drops a few points. Snipers/MGs pay more but still land most shots.
const DEFAULT_PROFILE: FireProfile = { crouchSpreadMult: 0.6, moveSpreadMult: 1.15, moveAccPenalty: 0, crouchDmgMult: 1 };

export const CLASS_FIRE_PROFILE: Partial<Record<WeaponClass, FireProfile>> = {
  저격소총: { crouchSpreadMult: 0.25, moveSpreadMult: 2, moveAccPenalty: 0.12, crouchDmgMult: 1.2 },
  기관총: { crouchSpreadMult: 0.5, moveSpreadMult: 1.5, moveAccPenalty: 0.08, crouchDmgMult: 1 },
  산탄총: { crouchSpreadMult: 0.8, moveSpreadMult: 1.1, moveAccPenalty: 0, crouchDmgMult: 1 },
};

export const fireProfile = (cls: WeaponClass): FireProfile => CLASS_FIRE_PROFILE[cls] ?? DEFAULT_PROFILE;

/** Milliseconds between shots given the weapon's rpm and the character's attack-speed multiplier. */
export function cooldownMs(rpm: number, attackSpeedMult: number): number {
  return 60_000 / (rpm * Math.max(0.1, attackSpeedMult));
}
