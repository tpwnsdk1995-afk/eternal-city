import { describe, expect, it } from 'vitest';
import { BUFFS, registry } from '@data/registry';
import { activeBuffs, aggregateBuffMods, applyBuff, emptyBuffs, extraWeightKg, formatRemaining, hasBuff, pruneExpired, remainingMs, wonMultiplier, xpMultiplier } from '@core/combat/buffs';
import { enhanceChancePct, tryEnhance } from '@core/tuning/tuning';
import { WEAPONS } from '@data/weapons';
import type { Rng } from '@core/rng';

const steroid = registry.buff('buff_steroid');
const ampoule = registry.buff('buff_ampoule');
const premium = registry.buff('buff_premium');

describe('buffs', () => {
  it('applies with a wall-clock expiry, refreshes instead of stacking, and prunes when time is up', () => {
    let s = applyBuff(emptyBuffs(), steroid, 1000);
    expect(hasBuff(s, steroid.id, 1000)).toBe(true);
    expect(remainingMs(s, steroid.id, 61_000)).toBe(steroid.durationMs - 60_000);
    s = applyBuff(s, steroid, 100_000); // re-drink: single entry, timer restarts
    expect(s.active).toHaveLength(1);
    expect(remainingMs(s, steroid.id, 100_000)).toBe(steroid.durationMs);
    expect(hasBuff(s, steroid.id, 100_000 + steroid.durationMs)).toBe(false);
    const pruned = pruneExpired(s, 100_000 + steroid.durationMs + 1);
    expect(pruned.active).toEqual([]);
    expect(pruneExpired(s, 100_001)).toBe(s); // untouched when nothing expired
  });

  it('aggregates stat mods, experience and ₩ multipliers, and carry weight', () => {
    let s = applyBuff(emptyBuffs(), steroid, 0);
    s = applyBuff(s, ampoule, 0);
    s = applyBuff(s, premium, 0);
    expect(activeBuffs(s, 10).map((b) => b.id).sort()).toEqual(['buff_ampoule', 'buff_premium', 'buff_steroid']);
    expect(aggregateBuffMods(s, registry.buff, 10).dmgPct).toBeCloseTo(0.15);
    expect(xpMultiplier(s, registry.buff, 10)).toBeCloseTo(1.5 * 1.3);
    expect(wonMultiplier(s, registry.buff, 10)).toBeCloseTo(1.2);
    expect(extraWeightKg(s, registry.buff, 10)).toBe(10);
    // once the 5-minute steroid runs out only the long buffs remain
    const later = ampoule.durationMs - 1;
    expect(aggregateBuffMods(s, registry.buff, later).dmgPct).toBe(0);
    expect(xpMultiplier(s, registry.buff, later)).toBeCloseTo(1.5 * 1.3);
    expect(xpMultiplier(s, registry.buff, ampoule.durationMs + 1)).toBeCloseTo(1.3);
    expect(BUFFS.length).toBe(11); // 스테로이드·집중 렌즈·경험 앰플·파손 방지 클립·프리미엄 + 경화제·아드레날린·신경 자극제·앰플 XL·₩ 쿠폰·무게 스티커
  });

  it('formats remaining time for the HUD', () => {
    expect(formatRemaining(272_000)).toBe('4:32');
    expect(formatRemaining(2 * 3_600_000 + 5 * 60_000)).toBe('2시간 5분');
    expect(formatRemaining(29 * 86_400_000 + 3 * 3_600_000)).toBe('29일 3시간');
  });

  it('특수 강화권 adds to the success chance for one attempt', () => {
    const m16 = WEAPONS.find((w) => w.id === 'm16a2')!;
    const stack = { uid: 'w', itemId: m16.id, qty: 1, enhance: 8 };
    expect(enhanceChancePct(stack)).toBe(10);
    expect(enhanceChancePct(stack, 20)).toBe(30);
    expect(enhanceChancePct({ ...stack, enhance: 0 }, 60)).toBe(100);
    // a roll of 0.25 fails at 10% but passes at 30%
    const roll = (v: number): Rng => ({ chance: (p: number) => v < p, range: (lo: number) => lo, int: (lo: number) => lo, pick: <T>(xs: readonly T[]) => xs[0], next: () => v });
    expect(tryEnhance(m16, stack, roll(0.25))).toMatchObject({ ok: true, success: false });
    expect(tryEnhance(m16, stack, roll(0.25), 20)).toMatchObject({ ok: true, success: true });
  });
});
