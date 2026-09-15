import type { AmmoKind, Caliber } from '@data/schema/enums';
import type { WeaponDef } from '@data/schema/item';

/** Ammo kinds manufactured for each caliber (in preferred order). Melee has no caliber. */
export const CALIBER_AMMO: Record<Caliber, readonly AmmoKind[]> = {
  '9mm': ['일반탄', '소이탄', '철갑탄'],
  '.45ACP': ['일반탄', '소이탄', '철갑탄'],
  '5.56mm': ['일반탄', '소이탄', '철갑탄'],
  '7.62mm': ['일반탄', '소이탄', '철갑탄'],
  '12ga': ['일반탄', 'Slug'],
  '.50BMG': ['철갑탄', '일반탄'],
  rocket: ['대전차탄'],
  grenade: ['일반탄'],
  none: [],
};

/** A weapon can chamber `kind` when its caliber is made in that kind; shotguns never take 철갑탄. */
export function isAmmoCompatible(weapon: WeaponDef, kind: AmmoKind): boolean {
  if (weapon.class === '산탄총' && kind === '철갑탄') return false;
  return CALIBER_AMMO[weapon.caliber].includes(kind);
}

export const allowedAmmoKinds = (weapon: WeaponDef): AmmoKind[] => CALIBER_AMMO[weapon.caliber].filter((k) => isAmmoCompatible(weapon, k));
