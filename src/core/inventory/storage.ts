import type { ItemStack } from '@data/schema/item';
import type { Inventory, ItemLookup } from './inventory';

/**
 * 구청 보관함: a second `Inventory` that lives in the save and never counts toward carried weight.
 * Moving is symmetric, so one function serves deposit (inventory → storage) and withdraw.
 */
export type MoveResult = { ok: true; from: Inventory; to: Inventory; moved: ItemStack } | { ok: false; reason: 'notFound' | 'full' };

/** Stackable kinds merge into an existing stack of the same item on the receiving side. */
const stackable = (kind: string): boolean => kind === 'consumable' || kind === 'misc';

/**
 * Moves the whole stack `uid` from `from` to `to`. Weapons/armour/ammo keep every tune field and get
 * a fresh uid on the receiving side; consumables/misc merge. `capacity` caps the number of stacks in
 * `to` (a merge never needs a new slot).
 */
export function moveStack(from: Inventory, to: Inventory, uid: string, lookup: ItemLookup, capacity = Infinity): MoveResult {
  const stack = from.items.find((s) => s.uid === uid);
  if (!stack) return { ok: false, reason: 'notFound' };
  const def = lookup(stack.itemId);
  const nextFrom: Inventory = { ...from, items: from.items.filter((s) => s.uid !== uid) };
  if (stackable(def.kind)) {
    const existing = to.items.find((s) => s.itemId === stack.itemId);
    if (existing) {
      const merged = { ...existing, qty: existing.qty + stack.qty };
      return { ok: true, from: nextFrom, to: { ...to, items: to.items.map((s) => (s.uid === existing.uid ? merged : s)) }, moved: merged };
    }
  }
  if (to.items.length >= capacity) return { ok: false, reason: 'full' };
  const moved: ItemStack = { ...stack, uid: `i${to.nextUid}` };
  return { ok: true, from: nextFrom, to: { items: [...to.items, moved], nextUid: to.nextUid + 1 }, moved };
}

export const storageFree = (storage: Inventory, capacity: number): number => Math.max(0, capacity - storage.items.length);
