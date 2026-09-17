import { describe, expect, it } from 'vitest';
import { WEAPONS } from '@data/weapons';
import { ARMORS } from '@data/armors';
import type { ItemStack, WeaponDef } from '@data/schema/item';
import type { Rng } from '@core/rng';
import { armorDefense, armorLabel, effectiveWeapon, enhanceChancePct, enhanceCost, installPart, partsAllowed, plusUp, tryEnhance, tryUnique, weaponLabel } from '@core/tuning/tuning';
import { balance } from '@data/balance';

const m16 = WEAPONS.find((w) => w.id === 'm16a2')!;
const baton = WEAPONS.find((w) => w.id === 'baton')!;
const glock = WEAPONS.find((w) => w.id === 'glock17')!;
const top = ARMORS.find((a) => a.kind === 'armor' && a.slot === '상의')!;

/** RNG that always succeeds / fails `chance`, and picks the first option in `range`. */
const rng = (roll: number): Rng => ({ chance: (p: number) => roll < p, range: (lo: number) => lo, int: (lo: number) => lo, pick: <T>(xs: readonly T[]) => xs[0], next: () => roll });
const stack = (def: WeaponDef, extra: Partial<ItemStack> = {}): ItemStack => ({ uid: 'w1', itemId: def.id, qty: 1, ...extra });

describe('강화', () => {
  it('follows the 100→80% table and caps at +9', () => {
    let s = stack(m16);
    expect(enhanceChancePct(s)).toBe(100);
    for (let i = 0; i < 9; i++) {
      const r = tryEnhance(m16, s, rng(0.01));
      expect(r.ok && r.success).toBe(true);
      if (r.ok) s = r.stack;
    }
    expect(s.enhance).toBe(9);
    expect(enhanceChancePct(s)).toBeNull();
    expect(tryEnhance(m16, s, rng(0.01))).toEqual({ ok: false, reason: 'maxed' });
  });

  it('failure drops one level, never breaks, never below 0', () => {
    const r = tryEnhance(m16, stack(m16, { enhance: 8 }), rng(0.99)); // +8 is 80%: a 0.99 roll fails
    expect(r.ok && !r.success && r.stack.enhance === 7).toBe(true);
    // +0..+4 are 100% so they never fail; a roll of 1.0 forces the failure branch to prove +0 stays at 0
    const r0 = tryEnhance(m16, stack(m16), rng(1));
    expect(r0.ok && !r0.success && r0.stack.enhance === 0).toBe(true);
    expect(tryEnhance(m16, stack(m16, { enhance: 4 }), rng(0.99))).toMatchObject({ ok: true, success: true });
  });

  it('cost scales with price and level; +N raises damage enhanceDmgPerLevel per level', () => {
    const c0 = enhanceCost(m16, stack(m16));
    const c5 = enhanceCost(m16, stack(m16, { enhance: 5 }));
    expect(c5).toBeGreaterThan(c0 * 3);
    const eff = effectiveWeapon(m16, stack(m16, { enhance: 5 }));
    expect(eff.def.baseDamage).toBeCloseTo(m16.baseDamage * (1 + 5 * balance.tuning.enhanceDmgPerLevel));
    expect(eff.def.rpm).toBe(m16.rpm);
  });
});

describe('부품 개조', () => {
  it('respects the per-class allow table and installs each part once', () => {
    expect(partsAllowed(baton)).toEqual([]);
    expect(partsAllowed(glock)).toEqual(['barrel', 'magazine']);
    expect(partsAllowed(m16)).toEqual(['barrel', 'scope', 'magazine', 'stock']);
    const r1 = installPart(glock, stack(glock), 'barrel');
    expect(r1.ok && r1.stack.parts).toEqual(['barrel']);
    if (!r1.ok) return;
    expect(installPart(glock, r1.stack, 'barrel')).toEqual({ ok: false, reason: 'alreadyInstalled' });
    expect(installPart(glock, r1.stack, 'scope')).toEqual({ ok: false, reason: 'notAllowed' });
  });

  it('effective stats fold parts in: range +15%, acc +5%, rpm +5%, spread −20%', () => {
    const s = stack(m16, { parts: ['barrel', 'scope', 'magazine', 'stock'] });
    const eff = effectiveWeapon(m16, s).def;
    expect(eff.range).toBe(Math.round(m16.range * 1.15));
    expect(eff.baseAccuracy).toBeCloseTo(m16.baseAccuracy + 0.05);
    expect(eff.rpm).toBe(Math.round(m16.rpm * 1.05));
    expect(eff.spreadDeg).toBeCloseTo(m16.spreadDeg * 0.8);
  });
});

describe('유니크 개조', () => {
  it('needs +7, rolls once, and a success adds a suffix with a stat bonus', () => {
    expect(tryUnique(m16, stack(m16, { enhance: 6 }), rng(0.01))).toEqual({ ok: false, reason: 'tooLow' });
    const fail = tryUnique(m16, stack(m16, { enhance: 7 }), rng(0.99));
    expect(fail.ok && !fail.success && fail.stack.unique === undefined).toBe(true);
    const win = tryUnique(m16, stack(m16, { enhance: 7 }), rng(0.01));
    expect(win.ok && win.success && win.stack.unique === 'precision').toBe(true);
    if (!win.ok) return;
    expect(effectiveWeapon(m16, win.stack).critPct).toBeCloseTo(0.05);
    expect(tryUnique(m16, win.stack, rng(0.01))).toEqual({ ok: false, reason: 'hasUnique' });
    expect(weaponLabel(m16, win.stack)).toBe('M16A2 +7 [정밀]');
  });
});

describe('플러스업 / 방어구', () => {
  it('raises defense 10% per level up to +5 and applies 접두', () => {
    let s: ItemStack = { uid: 'a1', itemId: top.id, qty: 1 };
    const base = armorDefense(top, s);
    for (let i = 0; i < 5; i++) {
      const r = plusUp(top, s);
      expect(r.ok).toBe(true);
      if (r.ok) s = r.stack;
    }
    expect(s.plusUp).toBe(5);
    expect(plusUp(top, s)).toEqual({ ok: false, reason: 'maxed' });
    expect(armorDefense(top, s)).toBeCloseTo(base * 1.5);
    expect(armorDefense(top, { ...s, prefix: '전설' })).toBeCloseTo(base * 1.5 * balance.tuning.prefixDefenseMult['전설']);
    expect(armorLabel(top, { ...s, prefix: '고대' })).toBe(`고대 ${top.name} +5`);
  });
});
