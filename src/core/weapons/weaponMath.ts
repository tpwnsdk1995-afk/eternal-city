import { balance } from '@data/balance';
import type { WeaponDef } from '@data/schema/item';
import type { WeaponClass } from '@data/schema/enums';

const C = balance.combat;

export function gradeMult(grade: number): number {
  return Math.pow(C.gradeMult, Math.max(1, grade) - 1);
}

export function weaponPrice(def: WeaponDef, grade: number): number {
  return Math.round(def.price * gradeMult(grade));
}

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

const DEFAULT_PROFILE: FireProfile = { crouchSpreadMult: 0.6, moveSpreadMult: 1.4, moveAccPenalty: 0, crouchDmgMult: 1 };

export const CLASS_FIRE_PROFILE: Partial<Record<WeaponClass, FireProfile>> = {
  저격소총: { crouchSpreadMult: 0.25, moveSpreadMult: 3, moveAccPenalty: 0.25, crouchDmgMult: 1.2 },
  기관총: { crouchSpreadMult: 0.5, moveSpreadMult: 2.2, moveAccPenalty: 0.15, crouchDmgMult: 1 },
  산탄총: { crouchSpreadMult: 0.8, moveSpreadMult: 1.2, moveAccPenalty: 0, crouchDmgMult: 1 },
};

export const fireProfile = (cls: WeaponClass): FireProfile => CLASS_FIRE_PROFILE[cls] ?? DEFAULT_PROFILE;

/** Milliseconds between shots given the weapon's rpm and the character's attack-speed multiplier. */
export function cooldownMs(rpm: number, attackSpeedMult: number): number {
  return 60_000 / (rpm * Math.max(0.1, attackSpeedMult));
}
