import type { ItemDef, ItemStack } from '@data/schema/item';
import type { ItemLookup } from './inventory';
import { stackWeightKg } from './weight';

export type ItemKind = ItemDef['kind'];
export type InventoryFilter = 'all' | ItemKind;
export type SortMode = 'kind' | 'name' | 'weight' | 'price';

export const FILTERS: InventoryFilter[] = ['all', 'weapon', 'armor', 'ammo', 'consumable', 'misc'];
export const SORT_MODES: SortMode[] = ['kind', 'name', 'weight', 'price'];

export const FILTER_LABEL: Record<InventoryFilter, string> = { all: '전체', weapon: '무기', armor: '방어구', ammo: '탄약', consumable: '소모품', misc: '기타' };
export const SORT_LABEL: Record<SortMode, string> = { kind: '분류', name: '이름', weight: '무게', price: '가격' };

const KIND_ORDER: Record<ItemKind, number> = { weapon: 0, armor: 1, ammo: 2, consumable: 3, misc: 4 };

/** Stable uid tiebreak so a re-render never reorders equal rows. */
const byUid = (a: ItemStack, b: ItemStack): number => Number(a.uid.slice(1)) - Number(b.uid.slice(1));

export function filterStacks(items: ItemStack[], lookup: ItemLookup, filter: InventoryFilter): ItemStack[] {
  if (filter === 'all') return items;
  return items.filter((s) => lookup(s.itemId).kind === filter);
}

/** Shop value of a stack: ammo `qty` is rounds, priced per box. */
function stackValue(s: ItemStack, lookup: ItemLookup): number {
  const def = lookup(s.itemId);
  return def.kind === 'ammo' ? def.price * (s.qty / def.boxSize) : def.price * s.qty;
}

/** Returns a new array; the inventory itself is never reordered (uids stay meaningful to saves). */
export function sortStacks(items: ItemStack[], lookup: ItemLookup, mode: SortMode): ItemStack[] {
  const out = [...items];
  switch (mode) {
    case 'kind':
      return out.sort((a, b) => KIND_ORDER[lookup(a.itemId).kind] - KIND_ORDER[lookup(b.itemId).kind] || byUid(a, b));
    case 'name':
      return out.sort((a, b) => lookup(a.itemId).name.localeCompare(lookup(b.itemId).name, 'ko-KR') || byUid(a, b));
    case 'weight':
      return out.sort((a, b) => stackWeightKg(b.itemId, b.qty, lookup) - stackWeightKg(a.itemId, a.qty, lookup) || byUid(a, b));
    case 'price':
      return out.sort((a, b) => stackValue(b, lookup) - stackValue(a, lookup) || byUid(a, b));
  }
}

export const nextSortMode = (mode: SortMode): SortMode => SORT_MODES[(SORT_MODES.indexOf(mode) + 1) % SORT_MODES.length];
