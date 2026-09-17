import type { ArmorSlot, Race } from '@data/schema/enums';
import type { ItemStack, WeaponDef } from '@data/schema/item';
import { armorDefense, effectiveWeapon, type EffectiveWeapon } from '../tuning/tuning';
import { getStack, type Inventory, type ItemLookup } from './inventory';

export interface Equipment {
  weaponUid: string | null;
  armor: Partial<Record<ArmorSlot, string>>; // slot → stack uid
}

export const emptyEquipment = (): Equipment => ({ weaponUid: null, armor: {} });

export type EquipResult = { ok: true; equipment: Equipment } | { ok: false; reason: 'notFound' | 'notEquippable' | 'levelTooLow' | 'techGradeTooLow' | 'race' };

/** guns are human-only, 변이무기 infected-only */
export const weaponUsableBy = (def: WeaponDef, race: Race): boolean => (def.race ?? 'human') === race;

export function equipStack(eq: Equipment, inv: Inventory, lookup: ItemLookup, uid: string, char: { level: number; techGrade: number; race?: Race }): EquipResult {
  const stack = getStack(inv, uid);
  if (!stack) return { ok: false, reason: 'notFound' };
  const def = lookup(stack.itemId);

  if (def.kind === 'weapon') {
    if (!weaponUsableBy(def, char.race ?? 'human')) return { ok: false, reason: 'race' };
    if (char.level < def.reqLevel) return { ok: false, reason: 'levelTooLow' };
    if (def.reqTechGrade && char.techGrade < def.reqTechGrade) return { ok: false, reason: 'techGradeTooLow' };
    return { ok: true, equipment: { ...eq, weaponUid: uid } };
  }
  if (def.kind === 'armor') {
    if (char.level < def.reqLevel) return { ok: false, reason: 'levelTooLow' };
    return { ok: true, equipment: { ...eq, armor: { ...eq.armor, [def.slot]: uid } } };
  }
  return { ok: false, reason: 'notEquippable' };
}

export const unequipWeapon = (eq: Equipment): Equipment => ({ ...eq, weaponUid: null });

export function unequipArmor(eq: Equipment, slot: ArmorSlot): Equipment {
  const armor = { ...eq.armor };
  delete armor[slot];
  return { ...eq, armor };
}

/** Drops equipment references to stacks that no longer exist (e.g. after selling). */
export function pruneEquipment(eq: Equipment, inv: Inventory): Equipment {
  const has = (uid: string | undefined | null) => !!uid && !!getStack(inv, uid);
  const armor: Equipment['armor'] = {};
  for (const [slot, uid] of Object.entries(eq.armor) as [ArmorSlot, string][]) if (has(uid)) armor[slot] = uid;
  return { weaponUid: has(eq.weaponUid) ? eq.weaponUid : null, armor };
}

export interface EquippedWeapon {
  /** base definition (names, class, caliber, requirements) */
  def: WeaponDef;
  uid: string;
  stack: ItemStack;
  /** numbers with 강화/부품/유니크 applied — combat reads these */
  eff: EffectiveWeapon;
}

export function equippedWeapon(eq: Equipment, inv: Inventory, lookup: ItemLookup): EquippedWeapon | null {
  if (!eq.weaponUid) return null;
  const stack = getStack(inv, eq.weaponUid);
  if (!stack) return null;
  const def = lookup(stack.itemId);
  if (def.kind !== 'weapon') return null;
  return { def, uid: stack.uid, stack, eff: effectiveWeapon(def, stack) };
}

export function totalDefense(eq: Equipment, inv: Inventory, lookup: ItemLookup): number {
  let total = 0;
  for (const uid of Object.values(eq.armor)) {
    const stack = uid ? getStack(inv, uid) : undefined;
    if (!stack) continue;
    const def = lookup(stack.itemId);
    if (def.kind === 'armor') total += armorDefense(def, stack);
  }
  return total;
}
