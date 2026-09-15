import type { MonsterDef } from '@data/schema/monster';
import type { ItemDef, ItemStack } from '@data/schema/item';
import { balance } from '@data/balance';
import type { Rng } from '../rng';

export type ArmorPrefix = NonNullable<ItemStack['prefix']>;

export interface LootItem {
  itemId: string;
  qty: number;
  /** 접두 rolled on dropped armour (고대/전설) */
  prefix?: ArmorPrefix;
}

export interface Loot {
  won: number;
  items: LootItem[];
}

/** 접두 roll for a dropped piece of armour: 전설 first, then 고대, else none. */
export function rollPrefix(rng: Rng): ArmorPrefix | undefined {
  const c = balance.loot.prefixChance;
  if (rng.chance(c['전설'])) return '전설';
  if (rng.chance(c['고대'])) return '고대';
  return undefined;
}

/** Rolls ₩ and item drops for a kill. Each drop entry is an independent chance; armour may gain a 접두. */
export function rollLoot(def: MonsterDef, rng: Rng, lookup?: (id: string) => ItemDef): Loot {
  const won = rng.int(def.wonMin, def.wonMax);
  const items: LootItem[] = [];
  for (const d of def.drops) {
    if (!rng.chance(d.chance)) continue;
    const item: LootItem = { itemId: d.itemId, qty: rng.int(d.qtyMin, d.qtyMax) };
    if (lookup && lookup(d.itemId).kind === 'armor') {
      const prefix = rollPrefix(rng);
      if (prefix) item.prefix = prefix;
    }
    items.push(item);
  }
  return { won, items };
}
