import { balance } from '@data/balance';
import type { WeaponDef } from '@data/schema/item';

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

/** Milliseconds between shots given the weapon's rpm and the character's attack-speed multiplier. */
export function cooldownMs(rpm: number, attackSpeedMult: number): number {
  return 60_000 / (rpm * Math.max(0.1, attackSpeedMult));
}
