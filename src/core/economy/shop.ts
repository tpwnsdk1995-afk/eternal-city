import type { ItemDef, ItemStack } from '@data/schema/item';
import { addItem, getStack, removeQty, removeStack, type Inventory, type ItemLookup } from '../inventory/inventory';
import { weaponPrice } from '../weapons/weaponMath';

/** Shops buy back at this fraction of list price. */
export const SELL_RATIO = 0.4;

export function buyPrice(def: ItemDef, grade?: number): number {
  return def.kind === 'weapon' ? weaponPrice(def, grade ?? def.gradeMin) : def.price;
}

/** Quantity one purchase adds: a full box for ammo, one unit otherwise. */
export const buyQty = (def: ItemDef): number => (def.kind === 'ammo' ? def.boxSize : 1);

/** What the shop pays for a stack (whole stack for gear/ammo, one unit for consumables). */
export function sellPrice(stack: ItemStack, lookup: ItemLookup): number {
  const def = lookup(stack.itemId);
  switch (def.kind) {
    case 'weapon':
      return Math.round(weaponPrice(def, stack.grade ?? def.gradeMin) * SELL_RATIO);
    case 'armor':
      return Math.round(def.price * SELL_RATIO);
    case 'ammo':
      return Math.round(def.price * (stack.qty / def.boxSize) * SELL_RATIO);
    case 'consumable':
    case 'misc':
      return Math.round(def.price * SELL_RATIO);
  }
}

export type BuyResult = { ok: true; inv: Inventory; won: number; cost: number } | { ok: false; reason: 'noMoney' | 'badGrade' };

export function buy(inv: Inventory, won: number, def: ItemDef, lookup: ItemLookup, grade?: number): BuyResult {
  if (def.kind === 'weapon') {
    const g = grade ?? def.gradeMin;
    if (g < def.gradeMin || g > def.gradeMax) return { ok: false, reason: 'badGrade' };
  }
  const cost = buyPrice(def, grade);
  if (won < cost) return { ok: false, reason: 'noMoney' };
  void lookup;
  return { ok: true, inv: addItem(inv, def, buyQty(def), { grade }), won: won - cost, cost };
}

export type SellResult = { ok: true; inv: Inventory; won: number; gained: number } | { ok: false; reason: 'notFound' | 'unsellable' };

export function sell(inv: Inventory, won: number, uid: string, lookup: ItemLookup): SellResult {
  const stack = getStack(inv, uid);
  if (!stack) return { ok: false, reason: 'notFound' };
  const def = lookup(stack.itemId);
  if (def.kind === 'misc' && (def.quest || def.price <= 0)) return { ok: false, reason: 'unsellable' };
  const gained = sellPrice(stack, lookup);
  const next = def.kind === 'consumable' || def.kind === 'misc' ? removeQty(inv, uid, 1) : removeStack(inv, uid);
  return { ok: true, inv: next, won: won + gained, gained };
}
