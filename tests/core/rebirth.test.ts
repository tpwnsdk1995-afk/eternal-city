import { describe, expect, it } from 'vitest';
import { balance } from '@data/balance';
import { createCharacter } from '@core/stats/character';
import { statCap } from '@core/stats/levelCurve';
import { allocateStat } from '@core/stats/allocation';
import { canRebirth, rebirth, rebirthBonusPoints } from '@core/stats/rebirth';

const S = balance.stats;

describe('환생', () => {
  it('is gated on the rebirth level and the maximum count', () => {
    const c = createCharacter('헌터', S.creationPoints);
    expect(canRebirth({ ...c, level: S.rebirthLevel - 1 })).toEqual({ ok: false, reason: 'level' });
    expect(canRebirth({ ...c, level: S.rebirthLevel })).toEqual({ ok: true });
    expect(canRebirth({ ...c, level: 99, rebirth: S.maxRebirth })).toEqual({ ok: false, reason: 'max' });
  });

  it('resets level/xp/stats, keeps name and ₩, raises the cap and grants bonus points', () => {
    let c = createCharacter('헌터', S.creationPoints);
    c = { ...c, level: 55, xp: 1234, won: 777_777 };
    for (let i = 0; i < 5; i++) c = (allocateStat(c, '기술', 1) as { ok: true; character: typeof c }).character;
    expect(c.base['기술']).toBe(5);
    const r = rebirth(c);
    expect(r.level).toBe(1);
    expect(r.xp).toBe(0);
    expect(r.rebirth).toBe(1);
    expect(r.name).toBe('헌터');
    expect(r.won).toBe(777_777);
    expect(r.base['기술']).toBe(0);
    expect(r.unspentPoints).toBe(S.creationPoints + rebirthBonusPoints(1));
    expect(statCap(r.rebirth)).toBe(S.baseCap + S.capPerRebirth);
    const r2 = rebirth({ ...r, level: S.rebirthLevel });
    expect(r2.rebirth).toBe(2);
    expect(r2.unspentPoints).toBe(S.creationPoints + 2 * S.rebirthBonusPoints);
    expect(statCap(S.maxRebirth)).toBe(S.absoluteCap);
  });
});
