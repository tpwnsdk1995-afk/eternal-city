import type { MonsterDef } from '@data/schema/monster';
import type { Rng } from '../rng';

export interface Loot {
  won: number;
  items: { itemId: string; qty: number }[];
}

/** Rolls ₩ and item drops for a kill. Each drop entry is an independent chance. */
export function rollLoot(def: MonsterDef, rng: Rng): Loot {
  const won = rng.int(def.wonMin, def.wonMax);
  const items: Loot['items'] = [];
  for (const d of def.drops) {
    if (rng.chance(d.chance)) items.push({ itemId: d.itemId, qty: rng.int(d.qtyMin, d.qtyMax) });
  }
  return { won, items };
}
