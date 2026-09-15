import { describe, expect, it } from 'vitest';
import { ARMORS } from '@data/armors';
import type { ArmorDef, ItemStack } from '@data/schema/item';
import type { Rng } from '@core/rng';
import { armorDefense, combineArmor, combineChancePct, combineCost } from '@core/tuning/tuning';
import { balance } from '@data/balance';

const top = ARMORS.find((a) => a.kind === 'armor' && a.slot === '상의') as ArmorDef;
const pants = ARMORS.find((a) => a.kind === 'armor' && a.slot === '하의') as ArmorDef;
const rng = (roll: number): Rng => ({ chance: (p: number) => roll < p, range: (lo: number) => lo, int: (lo: number) => lo, pick: <T>(xs: readonly T[]) => xs[0], next: () => roll });
const st = (def: ArmorDef, uid: string, extra: Partial<ItemStack> = {}): ItemStack => ({ uid, itemId: def.id, qty: 1, ...extra });

describe('방어구 조합', () => {
  it('needs two different copies of the same armour; 전설 is the cap', () => {
    const a = st(top, 'a');
    expect(combineArmor(top, a, a, rng(0))).toEqual({ ok: false, reason: 'same' });
    expect(combineArmor(top, a, st(pants, 'b'), rng(0))).toEqual({ ok: false, reason: 'mismatch' });
    expect(combineArmor(top, st(top, 'a', { prefix: '전설' }), st(top, 'b'), rng(0))).toEqual({ ok: false, reason: 'maxed' });
    expect(combineChancePct(a)).toBe(balance.tuning.combineToAncientPct);
    expect(combineChancePct(st(top, 'a', { prefix: '고대' }))).toBe(balance.tuning.combineToLegendPct);
    expect(combineChancePct(st(top, 'a', { prefix: '전설' }))).toBeNull();
  });

  it('success steps the prefix up, failure keeps it; the better 플러스업 survives either way', () => {
    const a = st(top, 'a', { plusUp: 1 });
    const b = st(top, 'b', { plusUp: 3 });
    const win = combineArmor(top, a, b, rng(0.01));
    expect(win.ok && win.success).toBe(true);
    if (win.ok) {
      expect(win.stack.prefix).toBe('고대');
      expect(win.stack.plusUp).toBe(3);
      expect(win.stack.uid).toBe('a');
      expect(armorDefense(top, win.stack)).toBeGreaterThan(armorDefense(top, a));
      const legend = combineArmor(top, win.stack, st(top, 'c'), rng(0.01));
      expect(legend.ok && legend.success && legend.stack.prefix).toBe('전설');
    }
    const lose = combineArmor(top, a, b, rng(0.99));
    expect(lose.ok && !lose.success).toBe(true);
    if (lose.ok) {
      expect(lose.stack.prefix).toBeUndefined();
      expect(lose.stack.plusUp).toBe(3);
    }
    expect(combineCost(top, st(top, 'a', { prefix: '고대' }))).toBe(combineCost(top, a) * 2);
  });
});
