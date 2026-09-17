import { describe, expect, it } from 'vitest';
import type { Rng } from '@core/rng';
import { ZERO_MODS } from '@data/schema/mods';
import { skinMult } from '@core/combat/ammoSkinTable';
import { computeHit, MISS, type AttackerCtx, type TargetCtx } from '@core/combat/damage';
import { hitChance, spreadOffset, spreadRadians, stanceSpread } from '@core/combat/accuracy';
import { applyBurn, emptyStatus, isBurning, tickBurn } from '@core/combat/statusEffects';
import { rollConsciousness } from '@core/combat/consciousness';

function fakeRng(chances: boolean[], rangeValue = 1): Rng {
  let i = 0;
  return { next: () => 0.5, int: (a) => a, range: () => rangeValue, chance: () => chances[i++] ?? false, pick: (arr) => arr[0] };
}

const attacker = (over: Partial<AttackerCtx> = {}): AttackerCtx => ({
  baseDamage: 10,
  subFire: false,
  subFireDmgMult: 0.5,
  pellets: 1,
  isMelee: false,
  ammoKind: '일반탄',
  baseAccuracy: 0.9,
  range: 400,
  tech: 0,
  statMult: 1,
  critChance: 0,
  critMult: 1.5,
  mods: ZERO_MODS,
  moving: false,
  crouching: false,
  ...over,
});

const target = (over: Partial<TargetCtx> = {}): TargetCtx => ({ skin: '일반', defense: 0, maxHp: 100, burning: false, ...over });

describe('ammo × skin table', () => {
  it('matches the documented multipliers', () => {
    expect(skinMult('일반탄', '중장갑')).toBe(0.4);
    expect(skinMult('철갑탄', '강성')).toBe(1.3);
    expect(skinMult('철갑탄', '일반')).toBe(0.7);
    expect(skinMult('대전차탄', '중장갑')).toBe(1.5);
  });
});

describe('computeHit', () => {
  it('applies base damage on a plain hit', () => {
    const r = computeHit(attacker(), target(), 0, fakeRng([true, false]));
    expect(r).toEqual({ hit: true, crit: false, damage: 10, appliesBurn: false, knockback: false });
  });

  it('returns MISS when the accuracy roll fails', () => {
    expect(computeHit(attacker(), target(), 0, fakeRng([false]))).toEqual(MISS);
  });

  it('reduces damage through defense', () => {
    const r = computeHit(attacker(), target({ defense: 100 }), 0, fakeRng([true, false]));
    expect(r.damage).toBe(5);
  });

  it('applies skin multiplier and crits', () => {
    const r = computeHit(attacker({ ammoKind: '철갑탄' }), target({ skin: '강성' }), 0, fakeRng([true, true]));
    expect(r.crit).toBe(true);
    expect(r.damage).toBe(Math.round(10 * 1.3 * 1.5));
  });

  it('소이탄 ignites only when a hit takes ≥10% of max hp', () => {
    expect(computeHit(attacker({ ammoKind: '소이탄' }), target(), 0, fakeRng([true, false])).appliesBurn).toBe(true);
    expect(computeHit(attacker({ ammoKind: '소이탄', baseDamage: 5 }), target(), 0, fakeRng([true, false])).appliesBurn).toBe(false);
  });

  it('burning targets take 1.5x from non-incendiary rounds only', () => {
    expect(computeHit(attacker(), target({ burning: true }), 0, fakeRng([true, false])).damage).toBe(15);
    expect(computeHit(attacker({ ammoKind: '소이탄' }), target({ burning: true }), 0, fakeRng([true, false])).damage).toBe(10);
  });

  it('splits shotgun damage across pellets and flags Slug knockback', () => {
    const r = computeHit(attacker({ baseDamage: 40, pellets: 4, ammoKind: 'Slug' }), target(), 0, fakeRng([true, false]));
    expect(r.damage).toBe(10);
    expect(r.knockback).toBe(true);
  });

  it('halves damage in sub-fire mode', () => {
    expect(computeHit(attacker({ subFire: true }), target(), 0, fakeRng([true, false])).damage).toBe(5);
  });
});

describe('hitChance', () => {
  const base = { baseAccuracy: 0.85, tech: 0, accMods: 0, dist: 0, range: 400, moving: false, crouching: false };
  it('falls off with distance and movement, improves crouched', () => {
    expect(hitChance(base)).toBeCloseTo(0.85);
    expect(hitChance({ ...base, dist: 400 })).toBeCloseTo(0.7);
    expect(hitChance({ ...base, moving: true })).toBeCloseTo(0.82);
    expect(hitChance({ ...base, crouching: true })).toBeCloseTo(0.9);
  });
  it('moving keeps a walking gunfight winnable: mid-range SMG still lands most shots', () => {
    // UZI-ish: baseAccuracy 0.65, half range, no tech
    expect(hitChance({ ...base, baseAccuracy: 0.65, dist: 170, range: 340, moving: true })).toBeGreaterThan(0.55);
  });
  it('clamps to [0.05, 0.98]', () => {
    expect(hitChance({ ...base, baseAccuracy: 0 })).toBe(0.05);
    expect(hitChance({ ...base, baseAccuracy: 2 })).toBe(0.98);
  });
});

describe('spread while moving', () => {
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const smg = { spreadDeg: 6, tech: 0, crouching: false, moving: false, crouchSpreadMult: 0.6, moveSpreadMult: 1.15, pellets: 1 };
  it('widens only mildly on the move and never past the single-bullet cap', () => {
    expect(deg(stanceSpread(smg))).toBeCloseTo(6);
    expect(deg(stanceSpread({ ...smg, moving: true }))).toBeCloseTo(6.9);
    // an MG-class multiplier on an illegal SMG would exceed the cap → clamped to 7°
    expect(deg(stanceSpread({ ...smg, spreadDeg: 8, moving: true, moveSpreadMult: 1.5 }))).toBeCloseTo(7);
    // pellet guns keep their full cone
    expect(deg(stanceSpread({ ...smg, spreadDeg: 16, pellets: 8, moving: true, moveSpreadMult: 1.1 }))).toBeCloseTo(17.6);
    expect(deg(stanceSpread({ ...smg, crouching: true }))).toBeCloseTo(3.6);
  });
  it('single bullets are centre-weighted: averaging two draws halves an edge draw', () => {
    const half = spreadRadians(6, 0);
    const edgeThenCentre = { range: (() => { let n = 0; return (a: number, b: number) => (n++ === 0 ? b : (a + b) / 2); })() };
    expect(spreadOffset(edgeThenCentre, half, 1)).toBeCloseTo(half / 2);
    const edge = { range: (_a: number, b: number) => b };
    expect(spreadOffset(edge, half, 8)).toBeCloseTo(half); // pellets stay uniform
    expect(spreadOffset(edge, 0, 1)).toBe(0);
  });
});

describe('burning status', () => {
  it('deals 1% max hp per second for 13 seconds and refreshes rather than stacking', () => {
    let s = applyBurn(emptyStatus(), 0);
    expect(isBurning(s, 12_999)).toBe(true);
    expect(isBurning(s, 13_001)).toBe(false);
    const t = tickBurn(s, 500, 1000, 100);
    expect(t.damage).toBe(1);
    s = applyBurn(t.state, 5000);
    expect(s.burningUntil).toBe(18_000);
  });

  it('does nothing when not burning', () => {
    expect(tickBurn(emptyStatus(), 0, 1000, 100).damage).toBe(0);
  });
});

describe('의식회복', () => {
  it('survives on a successful roll, then sits on cooldown', () => {
    const first = rollConsciousness(0.5, { lastTriggeredAt: -Infinity }, 1000, fakeRng([true]));
    expect(first.survived).toBe(true);
    expect(first.invulnUntil).toBe(3000);
    const second = rollConsciousness(0.5, first.state, 5000, fakeRng([true]));
    expect(second.survived).toBe(false);
    const later = rollConsciousness(0.5, first.state, 40_000, fakeRng([true]));
    expect(later.survived).toBe(true);
  });
});
