import type { AmmoKind } from '@data/schema/enums';
import type { AmmoDef, WeaponDef } from '@data/schema/item';
import { isMeleeClass } from '@data/schema/enums';
import { findAmmoBoxes, type Inventory, type ItemLookup } from '../inventory/inventory';
import { cooldownMs, effectiveRpm } from './weaponMath';
import { allowedAmmoKinds, isAmmoCompatible } from './ammoCompat';

export interface FireState {
  lastFireAt: number;
  subFire: boolean;
  ammoKind: AmmoKind;
}

export const initialFireState = (): FireState => ({ lastFireAt: -Infinity, subFire: false, ammoKind: '일반탄' });

export type FireAttempt =
  | { ok: true; boxUid: string | null; ammo: AmmoDef | null; cooldownMs: number; pellets: number }
  | { ok: false; reason: 'cooldown' | 'noAmmo' | 'incompatibleAmmo' };

export { isAmmoCompatible } from './ammoCompat';

/** Ammo kind to select when a weapon is equipped: the first allowed kind the character holds, else the caliber's default. */
export function defaultAmmoKind(weapon: WeaponDef, inv: Inventory, lookup: ItemLookup, current: AmmoKind): AmmoKind {
  const allowed = allowedAmmoKinds(weapon);
  if (allowed.length === 0) return current;
  if (allowed.includes(current) && findAmmoBoxes(inv, lookup, weapon.caliber, current).length) return current;
  return allowed.find((k) => findAmmoBoxes(inv, lookup, weapon.caliber, k).length > 0) ?? (allowed.includes(current) ? current : allowed[0]);
}

/**
 * Decides whether a shot can happen right now. Does NOT mutate: on success the caller consumes a
 * round from `boxUid` (if any) and calls `markFired`. Melee weapons never need ammo.
 */
export function tryFire(state: FireState, now: number, weapon: WeaponDef, attackSpeedMult: number, inv: Inventory, lookup: ItemLookup): FireAttempt {
  const cd = cooldownMs(effectiveRpm(weapon, state.subFire), attackSpeedMult);
  if (now - state.lastFireAt < cd) return { ok: false, reason: 'cooldown' };

  if (isMeleeClass(weapon.class)) return { ok: true, boxUid: null, ammo: null, cooldownMs: cd, pellets: 1 };

  if (!isAmmoCompatible(weapon, state.ammoKind)) return { ok: false, reason: 'incompatibleAmmo' };
  const boxes = findAmmoBoxes(inv, lookup, weapon.caliber, state.ammoKind);
  if (boxes.length === 0) return { ok: false, reason: 'noAmmo' };

  const box = boxes[0];
  const ammo = lookup(box.itemId) as AmmoDef;
  return { ok: true, boxUid: box.uid, ammo, cooldownMs: cd, pellets: weapon.pellets ?? 1 };
}

export const markFired = (state: FireState, now: number): FireState => ({ ...state, lastFireAt: now });
export const toggleSubFire = (state: FireState): FireState => ({ ...state, subFire: !state.subFire });
export const selectAmmoKind = (state: FireState, kind: AmmoKind): FireState => ({ ...state, ammoKind: kind });
