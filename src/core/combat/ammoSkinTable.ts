import type { AmmoKind, Skin } from '@data/schema/enums';

/** Damage multiplier of each ammo kind against each monster skin (rows: kind, cols: 일반/연성/변이/강성/장갑/중장갑). */
export const AMMO_SKIN_MULT: Record<AmmoKind, Record<Skin, number>> = {
  일반탄: { 일반: 1.0, 연성: 1.0, 변이: 1.0, 강성: 0.9, 장갑: 0.6, 중장갑: 0.4 },
  소이탄: { 일반: 1.0, 연성: 1.1, 변이: 1.0, 강성: 0.9, 장갑: 0.7, 중장갑: 0.5 },
  철갑탄: { 일반: 0.7, 연성: 0.7, 변이: 0.7, 강성: 1.3, 장갑: 1.0, 중장갑: 1.0 },
  Slug: { 일반: 1.0, 연성: 1.0, 변이: 1.0, 강성: 0.8, 장갑: 0.7, 중장갑: 0.5 },
  대전차탄: { 일반: 0.6, 연성: 0.6, 변이: 1.2, 강성: 1.2, 장갑: 1.3, 중장갑: 1.5 },
};

export function skinMult(kind: AmmoKind, skin: Skin): number {
  return AMMO_SKIN_MULT[kind][skin];
}

/** Melee (no ammo) uses a flat 1.0 except vs heavy armor. */
export const MELEE_SKIN_MULT: Record<Skin, number> = { 일반: 1.0, 연성: 1.0, 변이: 1.0, 강성: 0.9, 장갑: 0.7, 중장갑: 0.5 };
