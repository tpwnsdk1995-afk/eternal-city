import type { ItemDef, ItemStack } from '@data/schema/item';
import type { Rng } from '../rng';
import type { Equipment } from './equipment';
import { getStack, replaceStack, type Inventory } from './inventory';
import { balance } from '@data/balance';

export interface BreakResult {
  inventory: Inventory;
  /** the stack that broke, or null when nothing did */
  broken: { uid: string; name: string } | null;
  /** why nothing broke */
  spared?: 'protected' | 'roll' | 'nothingEquipped' | 'allDamaged';
}

/**
 * 사망 파손: with `balance.death.breakChance`, one random equipped item (weapon or armour) that is
 * not already damaged gets the 파손 flag. A 파방클 buff (`protectedByBuff`) skips the roll entirely.
 */
export function rollBreak(eq: Equipment, inv: Inventory, lookup: (id: string) => ItemDef, rng: Rng, protectedByBuff: boolean): BreakResult {
  if (protectedByBuff) return { inventory: inv, broken: null, spared: 'protected' };
  const uids = [eq.weaponUid, ...Object.values(eq.armor)].filter((u): u is string => !!u);
  const stacks = uids.map((u) => getStack(inv, u)).filter((s): s is ItemStack => !!s);
  if (stacks.length === 0) return { inventory: inv, broken: null, spared: 'nothingEquipped' };
  if (!rng.chance(balance.death.breakChance)) return { inventory: inv, broken: null, spared: 'roll' };
  const candidates = stacks.filter((s) => !s.damaged);
  if (candidates.length === 0) return { inventory: inv, broken: null, spared: 'allDamaged' };
  const pick = candidates[Math.min(candidates.length - 1, Math.floor(rng.range(0, candidates.length)))];
  return { inventory: replaceStack(inv, { ...pick, damaged: true }), broken: { uid: pick.uid, name: lookup(pick.itemId).name } };
}
