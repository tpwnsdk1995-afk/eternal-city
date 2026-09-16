import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { parSec, scoreAssault } from '@core/assault/score';
import { assaultBest, emptyStats, recordAssaultBest } from '@core/world/stats';

const A = registry.assault('assault-a');

describe('어설트 점수 (점수 비례 보상)', () => {
  it('a fast, kill-heavy clear scores S and boosts the reward', () => {
    const par = parSec(A);
    const r = scoreAssault(A, { success: true, kills: 40, timeSec: Math.floor(par / 3) });
    expect(r.grade).toBe('S');
    expect(r.rewardMult).toBe(1.3);
    expect(r.timePts).toBe(2000); // faster than half the par time → full bonus
    expect(r.score).toBe(r.killPts + r.clearPts + r.timePts);
  });

  it('a slow clear with few kills still pays, at a discount', () => {
    const par = parSec(A);
    const r = scoreAssault(A, { success: true, kills: 3, timeSec: par + 60 });
    expect(r.timePts).toBe(0);
    expect(r.grade).toBe('C');
    expect(r.rewardMult).toBe(0.85);
  });

  it('failure keeps the kill points for the record but pays nothing', () => {
    const r = scoreAssault(A, { success: false, kills: 12, timeSec: 90 });
    expect(r.grade).toBe('F');
    expect(r.rewardMult).toBe(0);
    expect(r.clearPts).toBe(0);
    expect(r.score).toBe(r.killPts);
  });

  it('고급 variants multiply the score', () => {
    const base = scoreAssault(A, { success: true, kills: 10, timeSec: 60 });
    const adv = scoreAssault({ ...A, advanced: true }, { success: true, kills: 10, timeSec: 60 });
    expect(adv.score).toBe(Math.round(base.score * 1.5));
  });

  it('par time grows with the number of phases', () => {
    expect(parSec({ phases: [] })).toBeLessThan(parSec(A));
  });
});

describe('어설트 기록판 (recordAssaultBest)', () => {
  const run = (score: number, timeSec: number) => ({ score, grade: 'A', timeSec, kills: 10, at: 1 });

  it('stores the first run, keeps the higher score, and prefers the faster tie', () => {
    let s = emptyStats();
    let r = recordAssaultBest(s, 'assault-a', run(3000, 200));
    expect(r.newRecord).toBe(true);
    s = r.stats;
    r = recordAssaultBest(s, 'assault-a', run(2500, 100));
    expect(r.newRecord).toBe(false);
    expect(assaultBest(r.stats, 'assault-a')?.score).toBe(3000);
    r = recordAssaultBest(s, 'assault-a', run(3000, 150));
    expect(r.newRecord).toBe(true);
    expect(assaultBest(r.stats, 'assault-a')?.timeSec).toBe(150);
  });

  it('works on stats saved before the scoreboard existed', () => {
    const { assaultBest: _b, ...legacy } = emptyStats();
    const r = recordAssaultBest(legacy, 'assault-b', run(1000, 300));
    expect(r.newRecord).toBe(true);
    expect(assaultBest(legacy, 'assault-b')).toBeUndefined();
    expect(assaultBest(r.stats, 'assault-b')?.score).toBe(1000);
  });
});
