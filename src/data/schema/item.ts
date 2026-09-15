import type { AmmoKind, ArmorSlot, Caliber, Race, WeaponClass } from './enums';
import type { PartId, UniqueId } from './tuning';
import type { TexKey } from '../textureKeys';

export interface WeaponDef {
  kind: 'weapon';
  id: string;
  name: string; // e.g. 'Glock 17'
  class: WeaponClass;
  caliber: Caliber;
  baseDamage: number;
  rpm: number;
  range: number; // px
  spreadDeg: number;
  baseAccuracy: number; // 0..1
  pellets?: number; // shotguns
  subFire?: { rpm: number; dmgMult: number }; // Ctrl toggle
  /** launchers: slow projectile that explodes with area damage instead of hitscan */
  projectile?: { speed: number; aoeRadius: number; arc: boolean; selfDamage?: boolean };
  /** 변이무기 are infected-only; guns (no race) are human-only */
  race?: Race;
  gradeMin: number;
  gradeMax: number;
  weightKg: number;
  reqLevel: number;
  reqTechGrade?: number;
  illegal?: boolean; // 불법무기
  price: number; // ₩ at grade 1; grade multiplies
  tex: TexKey;
  iconTex: TexKey;
}

export interface AmmoDef {
  kind: 'ammo';
  id: string;
  name: string;
  ammoKind: AmmoKind;
  caliber: Caliber;
  boxSize: number; // rounds per box
  weightKgPerRound: number;
  price: number; // ₩ per box
  iconTex: TexKey;
}

export interface ArmorDef {
  kind: 'armor';
  id: string;
  name: string;
  slot: ArmorSlot;
  defense: number;
  weightKg: number;
  reqLevel: number;
  price: number;
  cl?: boolean; // CL 방어구: x1.5 defense
  iconTex: TexKey;
}

export interface ConsumableDef {
  kind: 'consumable';
  id: string;
  name: string;
  effect: { hp?: number; stamina?: number; ap?: number; buff?: string; enhanceBonusPct?: number };
  weightKg: number;
  price: number;
  iconTex: TexKey;
}

/** Quest items, documents, keys — stackable, no direct use. */
export interface MiscDef {
  kind: 'misc';
  id: string;
  name: string;
  desc: string;
  weightKg: number;
  price: number; // 0 = cannot be sold
  quest?: boolean;
  iconTex: TexKey;
}

export type ItemDef = WeaponDef | AmmoDef | ArmorDef | ConsumableDef | MiscDef;

/** A concrete stack in an inventory. For ammo, `qty` is rounds left in the box. */
export interface ItemStack {
  uid: string;
  itemId: string;
  qty: number;
  grade?: number;
  /** 강화 +0..+9 (weapons) */
  enhance?: number;
  /** 부품 개조 installed on this weapon */
  parts?: PartId[];
  /** 유니크 개조 suffix (weapons, +7 이상) */
  unique?: UniqueId;
  /** 플러스업 +0..+5 (armor) */
  plusUp?: number;
  prefix?: '고대' | '전설';
}
