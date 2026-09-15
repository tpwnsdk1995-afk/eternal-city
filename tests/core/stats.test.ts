import { describe, expect, it } from 'vitest';
import { createCharacter, emptyStats } from '@core/stats/character';
import { statCap, statPointsGained, techGrade, xpToNext } from '@core/stats/levelCurve';
import { derivedStats } from '@core/stats/derived';
import { allocateStat } from '@core/stats/allocation';
import { applyXp, xpForKill } from '@core/world/xp';
import { applyDeathPenalty } from '@core/world/death';
import { registry } from '@data/registry';

describe('level curve', () => {
  it('xpToNext grows by the configured exponent', () => {
    expect(xpToNext(1)).toBe(100);
    expect(xpToNext(2)).toBe(348);
  });

  it('grants 5 points per level and a bonus at 31/41/51…', () => {
    expect(statPointsGained(2)).toBe(5);
    expect(statPointsGained(31)).toBe(10);
    expect(statPointsGained(41)).toBe(10);
  });

  it('caps stats at 350, rising with rebirth to 600', () => {
    expect(statCap(0)).toBe(350);
    expect(statCap(3)).toBe(395);
    expect(statCap(10)).toBe(600);
  });

  it('derives 기술등급 from 지능', () => {
    expect(techGrade(0)).toBe(1);
    expect(techGrade(25)).toBe(3);
  });
});

describe('derived stats', () => {
  it('computes max hp from 체력 and level', () => {
    expect(derivedStats(emptyStats(0), 1).maxHp).toBe(104);
    expect(derivedStats({ ...emptyStats(0), 체력: 10 }, 1).maxHp).toBe(184);
  });

  it('caps 의식회복 at 50%', () => {
    expect(derivedStats({ ...emptyStats(0), 생명력: 300 }, 1).consciousnessChance).toBe(0.5);
    expect(derivedStats({ ...emptyStats(0), 생명력: 100 }, 1).consciousnessChance).toBeCloseTo(0.25);
  });
});

describe('allocation', () => {
  it('spends unspent points into a stat', () => {
    const c = createCharacter('테스터', 5);
    const r = allocateStat(c, '기술', 3);
    expect(r.ok && r.character.base['기술']).toBe(3);
    expect(r.ok && r.character.unspentPoints).toBe(2);
  });

  it('refuses when out of points or at the cap', () => {
    const c = createCharacter('테스터', 5);
    expect(allocateStat(c, '기술', 6)).toEqual({ ok: false, reason: 'noPoints' });
    const capped = { ...c, unspentPoints: 10, base: { ...c.base, 기술: 350 } };
    expect(allocateStat(capped, '기술', 1)).toEqual({ ok: false, reason: 'capReached' });
  });
});

describe('xp', () => {
  it('levels up and awards points', () => {
    const c = createCharacter('테스터', 5);
    const r = applyXp(c, 100);
    expect(r.character.level).toBe(2);
    expect(r.character.xp).toBe(0);
    expect(r.levelUps).toEqual([2]);
    expect(r.pointsGained).toBe(5);
  });

  it('rolls through multiple levels', () => {
    const c = createCharacter('테스터', 5);
    const r = applyXp(c, 100 + 348 + 10);
    expect(r.character.level).toBe(3);
    expect(r.character.xp).toBe(10);
  });

  it('tapers kill xp when out-leveling the monster', () => {
    const m = registry.monster('zombie_casual_f');
    expect(xpForKill(m, 1)).toBe(m.xp);
    expect(xpForKill(m, 16)).toBe(Math.max(1, Math.round(m.xp * 0.1)));
  });
});

describe('death penalty', () => {
  it('takes the configured ₩ share and no xp by default', () => {
    const c = { ...createCharacter('테스터', 5), won: 1000, xp: 50 };
    const r = applyDeathPenalty(c);
    expect(r.won).toBe(950);
    expect(r.xp).toBe(50);
  });
});
