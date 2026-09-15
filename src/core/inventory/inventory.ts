import type { ItemDef, ItemStack } from '@data/schema/item';
import type { AmmoKind, Caliber } from '@data/schema/enums';

export type ItemLookup = (id: string) => ItemDef;

export interface Inventory {
  items: ItemStack[];
  nextUid: number;
}

export const createInventory = (): Inventory => ({ items: [], nextUid: 1 });

/**
 * Adds an item. Ammo boxes and weapons/armor are individual stacks (a box's `qty` is rounds left);
 * consumables merge into an existing stack of the same item.
 */
export function addItem(inv: Inventory, def: ItemDef, qty = 1, opts: { grade?: number } = {}): Inventory {
  if (def.kind === 'consumable' || def.kind === 'misc') {
    const existing = inv.items.find((s) => s.itemId === def.id);
    if (existing) {
      return { ...inv, items: inv.items.map((s) => (s.uid === existing.uid ? { ...s, qty: s.qty + qty } : s)) };
    }
  }
  const stack: ItemStack = { uid: `i${inv.nextUid}`, itemId: def.id, qty };
  if (def.kind === 'weapon') stack.grade = opts.grade ?? def.gradeMin;
  return { items: [...inv.items, stack], nextUid: inv.nextUid + 1 };
}

export function removeStack(inv: Inventory, uid: string): Inventory {
  return { ...inv, items: inv.items.filter((s) => s.uid !== uid) };
}

export function removeQty(inv: Inventory, uid: string, n: number): Inventory {
  const stack = inv.items.find((s) => s.uid === uid);
  if (!stack) return inv;
  if (stack.qty - n <= 0) return removeStack(inv, uid);
  return { ...inv, items: inv.items.map((s) => (s.uid === uid ? { ...s, qty: s.qty - n } : s)) };
}

export function getStack(inv: Inventory, uid: string): ItemStack | undefined {
  return inv.items.find((s) => s.uid === uid);
}

/** Ammo boxes matching caliber + kind, smallest first so partial boxes get used up. */
export function findAmmoBoxes(inv: Inventory, lookup: ItemLookup, caliber: Caliber, kind: AmmoKind): ItemStack[] {
  return inv.items
    .filter((s) => {
      const def = lookup(s.itemId);
      return def.kind === 'ammo' && def.caliber === caliber && def.ammoKind === kind && s.qty > 0;
    })
    .sort((a, b) => a.qty - b.qty);
}

export function totalRounds(inv: Inventory, lookup: ItemLookup, caliber: Caliber, kind: AmmoKind): number {
  return findAmmoBoxes(inv, lookup, caliber, kind).reduce((sum, s) => sum + s.qty, 0);
}

export const consumeRound = (inv: Inventory, uid: string): Inventory => removeQty(inv, uid, 1);

/** Total quantity of an item across all stacks. */
export const countItem = (inv: Inventory, itemId: string): number => inv.items.filter((s) => s.itemId === itemId).reduce((n, s) => n + s.qty, 0);

/** Removes `n` units of an item across stacks (smallest stacks first). */
export function removeItemQty(inv: Inventory, itemId: string, n: number): Inventory {
  let left = n;
  let next = inv;
  for (const s of [...inv.items].filter((x) => x.itemId === itemId).sort((a, b) => a.qty - b.qty)) {
    if (left <= 0) break;
    const take = Math.min(left, s.qty);
    next = removeQty(next, s.uid, take);
    left -= take;
  }
  return next;
}
