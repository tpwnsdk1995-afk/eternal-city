import type { WeaponClass } from './enums';

/** 부품 개조 slots — each part installs once per weapon. */
export const PART_IDS = ['barrel', 'scope', 'magazine', 'stock'] as const;
export type PartId = (typeof PART_IDS)[number];

export interface PartDef {
  id: PartId;
  name: string;
  desc: string;
  allowedClasses: readonly WeaponClass[];
  /** multiplicative deltas on the base weapon (0.15 = +15%) */
  rangePct?: number;
  accPct?: number; // flat added to baseAccuracy
  rpmPct?: number;
  spreadPct?: number; // negative tightens
  /** price as a fraction of the weapon's grade price */
  priceMult: number;
}

/** 유니크 개조 suffixes rolled onto +7 or better weapons. */
export const UNIQUE_IDS = ['precision', 'destruction', 'swiftness', 'endurance'] as const;
export type UniqueId = (typeof UNIQUE_IDS)[number];

export interface UniqueDef {
  id: UniqueId;
  /** shown after the weapon name, e.g. "M16A2 [정밀]" */
  name: string;
  desc: string;
  critPct?: number;
  dmgPct?: number;
  rpmPct?: number;
  rangePct?: number;
}
