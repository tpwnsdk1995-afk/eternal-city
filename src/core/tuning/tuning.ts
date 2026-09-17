import { balance } from '@data/balance';
import { PARTS, UNIQUES } from '@data/tuning';
import type { ArmorDef, ItemStack, WeaponDef } from '@data/schema/item';
import { PART_IDS, UNIQUE_IDS, type PartId, type UniqueId } from '@data/schema/tuning';
import type { Rng } from '../rng';

const T = balance.tuning;

export type TuneFail = 'maxed' | 'notAllowed' | 'alreadyInstalled' | 'tooLow' | 'hasUnique' | 'notWeapon' | 'notArmor';
export type TuneResult<Extra = object> = ({ ok: true; stack: ItemStack; success: boolean; cost: number } & Extra) | { ok: false; reason: TuneFail };

// ---------------------------------------------------------------- 강화 (weapons)

export const enhanceLevel = (s: ItemStack): number => s.enhance ?? 0;

/** % chance the next 강화 attempt succeeds (null when maxed). `bonusPct` = 특수 강화권. */
export function enhanceChancePct(s: ItemStack, bonusPct = 0): number | null {
  const lv = enhanceLevel(s);
  if (lv >= T.maxEnhance) return null;
  return Math.min(100, T.enhanceSuccessPct[Math.min(lv, T.enhanceSuccessPct.length - 1)] + bonusPct);
}

export function enhanceCost(def: WeaponDef, s: ItemStack): number {
  return Math.round(def.price * T.enhanceCostBase * (1 + enhanceLevel(s) * T.enhanceCostPerLevel));
}

/**
 * One 강화 attempt. Success: +1. Failure: −1 (weapons never break). The caller pays `cost` first.
 * Pure; the RNG decides the roll so tests can seed it.
 */
export function tryEnhance(def: WeaponDef, s: ItemStack, rng: Rng, bonusPct = 0): TuneResult {
  const chance = enhanceChancePct(s, bonusPct);
  if (chance === null) return { ok: false, reason: 'maxed' };
  const cost = enhanceCost(def, s);
  const lv = enhanceLevel(s);
  if (rng.chance(chance / 100)) return { ok: true, stack: { ...s, enhance: lv + 1 }, success: true, cost };
  const next = lv < T.enhanceSafeBelow ? lv : Math.max(0, lv - 1);
  return { ok: true, stack: { ...s, enhance: next }, success: false, cost };
}

// ---------------------------------------------------------------- 부품 개조 (weapons)

export function partsAllowed(def: WeaponDef): PartId[] {
  return PART_IDS.filter((id) => PARTS[id].allowedClasses.includes(def.class));
}

export const hasPart = (s: ItemStack, id: PartId): boolean => (s.parts ?? []).includes(id);

export function partCost(def: WeaponDef, _s: ItemStack, id: PartId): number {
  return Math.round(def.price * PARTS[id].priceMult);
}

/** Installs a part (always succeeds once allowed). */
export function installPart(def: WeaponDef, s: ItemStack, id: PartId): TuneResult {
  if (!PARTS[id].allowedClasses.includes(def.class)) return { ok: false, reason: 'notAllowed' };
  if (hasPart(s, id)) return { ok: false, reason: 'alreadyInstalled' };
  return { ok: true, stack: { ...s, parts: [...(s.parts ?? []), id] }, success: true, cost: partCost(def, s, id) };
}

// ---------------------------------------------------------------- 유니크 개조 (weapons)

export function uniqueCost(def: WeaponDef, _s: ItemStack): number {
  return Math.round(def.price * T.uniqueCostMult);
}

/** Rolls a random unique suffix on a +7 or better weapon. Failure only costs ₩. */
export function tryUnique(def: WeaponDef, s: ItemStack, rng: Rng): TuneResult<{ unique?: UniqueId }> {
  if (enhanceLevel(s) < T.uniqueMinEnhance) return { ok: false, reason: 'tooLow' };
  if (s.unique) return { ok: false, reason: 'hasUnique' };
  const cost = uniqueCost(def, s);
  if (!rng.chance(T.uniqueSuccessPct / 100)) return { ok: true, stack: s, success: false, cost };
  const unique = UNIQUE_IDS[Math.min(UNIQUE_IDS.length - 1, Math.floor(rng.range(0, UNIQUE_IDS.length)))];
  return { ok: true, stack: { ...s, unique }, success: true, cost, unique };
}

// ---------------------------------------------------------------- 플러스업 (armor)

export const plusUpLevel = (s: ItemStack): number => s.plusUp ?? 0;

export function plusUpCost(def: ArmorDef, s: ItemStack): number {
  return Math.round(def.price * T.plusUpCostBase * (1 + plusUpLevel(s) * T.plusUpCostPerLevel));
}

/** 플러스업 always succeeds up to +5. */
export function plusUp(def: ArmorDef, s: ItemStack): TuneResult {
  const lv = plusUpLevel(s);
  if (lv >= T.maxPlusUp) return { ok: false, reason: 'maxed' };
  return { ok: true, stack: { ...s, plusUp: lv + 1 }, success: true, cost: plusUpCost(def, s) };
}

// ---------------------------------------------------------------- 방어구 조합 (armor)

export type CombineFail = TuneFail | 'mismatch' | 'same';

/** Chance (%) that combining two of the same armour upgrades the prefix (없음→고대→전설), null at 전설. */
export function combineChancePct(a: ItemStack): number | null {
  if (a.prefix === '전설') return null;
  return a.prefix === '고대' ? T.combineToLegendPct : T.combineToAncientPct;
}

export function combineCost(def: ArmorDef, a: ItemStack): number {
  return Math.round(def.price * T.combineCostMult * (a.prefix === '고대' ? 2 : 1));
}

/**
 * 방어구 조합: feed a second copy of the same armour (the material, consumed either way) into the
 * first. Success promotes the prefix one step; the higher 플러스업 of the pair always carries over.
 */
export function combineArmor(def: ArmorDef, a: ItemStack, b: ItemStack, rng: Rng): TuneResult | { ok: false; reason: CombineFail } {
  if (a.uid === b.uid) return { ok: false, reason: 'same' };
  if (a.itemId !== b.itemId) return { ok: false, reason: 'mismatch' };
  const chance = combineChancePct(a);
  if (chance === null) return { ok: false, reason: 'maxed' };
  const cost = combineCost(def, a);
  const plus = Math.max(plusUpLevel(a), plusUpLevel(b));
  const base: ItemStack = { ...a, plusUp: plus || undefined };
  if (!rng.chance(chance / 100)) return { ok: true, stack: base, success: false, cost };
  return { ok: true, stack: { ...base, prefix: a.prefix === '고대' ? '전설' : '고대' }, success: true, cost };
}

/** Armor defense with CL, 플러스업 and 접두 applied. */
export function armorDefense(def: ArmorDef, s: ItemStack | null): number {
  let d = def.defense * (def.cl ? 1.5 : 1);
  if (s) {
    d *= 1 + plusUpLevel(s) * T.plusUpDefensePerLevel;
    if (s.prefix) d *= T.prefixDefenseMult[s.prefix];
    if (s.damaged) d *= 1 - balance.death.brokenArmorPenalty;
  }
  return d;
}

// ---------------------------------------------------------------- 파손 / 수리

export function repairCost(def: WeaponDef | ArmorDef, _s: ItemStack): number {
  const base = def.price;
  return Math.max(100, Math.round(base * balance.death.repairCostMult));
}

/** 기술상 수리: clears the 파손 flag (always succeeds; the caller pays). */
export function repair(def: WeaponDef | ArmorDef, s: ItemStack): TuneResult {
  if (!s.damaged) return { ok: false, reason: 'maxed' };
  const { damaged: _d, ...rest } = s;
  return { ok: true, stack: rest, success: true, cost: repairCost(def, s) };
}

// ---------------------------------------------------------------- effective weapon

export interface EffectiveWeapon {
  /** a copy of the def with 강화/부품/유니크 folded into its numbers */
  def: WeaponDef;
  /** extra crit chance from a unique suffix */
  critPct: number;
  /** extra damage % from a unique suffix (강화 is already inside def.baseDamage) */
  dmgPct: number;
}

/** Single entry point for "what does this weapon actually do": base def × tune state. */
export function effectiveWeapon(def: WeaponDef, s: ItemStack | null): EffectiveWeapon {
  if (!s) return { def, critPct: 0, dmgPct: 0 };
  let range = 1;
  let rpm = 1;
  let spread = 1;
  let acc = 0;
  for (const id of s.parts ?? []) {
    const p = PARTS[id];
    range += p.rangePct ?? 0;
    rpm += p.rpmPct ?? 0;
    spread += p.spreadPct ?? 0;
    acc += p.accPct ?? 0;
  }
  const u = s.unique ? UNIQUES[s.unique] : null;
  range += u?.rangePct ?? 0;
  rpm += u?.rpmPct ?? 0;
  const baseDamage = def.baseDamage * (1 + enhanceLevel(s) * T.enhanceDmgPerLevel) * (s.damaged ? 1 - balance.death.brokenWeaponPenalty : 1);
  return {
    def: {
      ...def,
      baseDamage,
      range: Math.round(def.range * range),
      rpm: Math.round(def.rpm * rpm),
      spreadDeg: def.spreadDeg * Math.max(0.2, spread),
      baseAccuracy: Math.min(0.98, def.baseAccuracy + acc),
    },
    critPct: u?.critPct ?? 0,
    dmgPct: u?.dmgPct ?? 0,
  };
}

/** "M16A2 +3 [정밀]" — the label inventory rows, the shop and the HUD share. */
export function weaponLabel(def: WeaponDef, s: ItemStack | null): string {
  let out = def.name;
  if (s && enhanceLevel(s) > 0) out += ` +${enhanceLevel(s)}`;
  if (s?.unique) out += ` [${UNIQUES[s.unique].name}]`;
  if (s?.damaged) out += ' [파손]';
  return out;
}

export function armorLabel(def: ArmorDef, s: ItemStack | null): string {
  let out = def.name;
  if (s?.prefix) out = `${s.prefix} ${out}`;
  if (s && plusUpLevel(s) > 0) out += ` +${plusUpLevel(s)}`;
  if (s?.damaged) out += ' [파손]';
  return out;
}
