import type { ItemLookup, Inventory } from './inventory';

export function stackWeightKg(itemId: string, qty: number, lookup: ItemLookup): number {
  const def = lookup(itemId);
  switch (def.kind) {
    case 'weapon':
    case 'armor':
      return def.weightKg * qty;
    case 'ammo':
      return def.weightKgPerRound * qty;
    case 'consumable':
      return def.weightKg * qty;
  }
}

export function totalWeightKg(inv: Inventory, lookup: ItemLookup): number {
  return inv.items.reduce((sum, s) => sum + stackWeightKg(s.itemId, s.qty, lookup), 0);
}

export const isOverweight = (totalKg: number, maxKg: number): boolean => totalKg > maxKg;
