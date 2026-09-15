import { describe, expect, it } from 'vitest';
import { MAPS, registry } from '@data/registry';
import { YEARS } from '@data/years';
import { canTravel, hubForYear, unlockText } from '@core/world/parallel';
import { ride, taxiFlag } from '@core/economy/taxi';

describe('패러렐 시스템', () => {
  it('2002 is always open, 2003 needs the permit, and you cannot travel to the year you are in', () => {
    expect(canTravel(2003, { flags: {}, level: 1, currentYear: 2002 })).toEqual({ ok: false, reason: 'permit' });
    expect(canTravel(2003, { flags: { parallelPermit: true }, level: 1, currentYear: 2002 })).toEqual({ ok: true });
    expect(canTravel(2002, { flags: {}, level: 1, currentYear: 2002 })).toEqual({ ok: false, reason: 'same' });
    expect(canTravel(2002, { flags: {}, level: 1, currentYear: 2003 })).toEqual({ ok: true });
    expect(canTravel(1999, { flags: {}, level: 1, currentYear: 2002 })).toEqual({ ok: false, reason: 'unknown' });
  });

  it('2004 opens with the permit plus Lv.25 or the finished 2002 campaign', () => {
    expect(canTravel(2004, { flags: { parallelPermit: true }, level: 10, currentYear: 2002 })).toEqual({ ok: false, reason: 'milestone' });
    expect(canTravel(2004, { flags: { parallelPermit: true }, level: 25, currentYear: 2002 })).toEqual({ ok: true });
    expect(canTravel(2004, { flags: { parallelPermit: true, 'campaign:2002:complete': true }, level: 1, currentYear: 2003 })).toEqual({ ok: true });
    expect(canTravel(2004, { flags: { 'campaign:2002:complete': true }, level: 60, currentYear: 2002 })).toEqual({ ok: false, reason: 'permit' });
    expect(hubForYear(2004)).toBe('technomart-shelter');
  });

  it('every year has a safe-zone hub of that year, used for respawn', () => {
    for (const y of YEARS) {
      const hub = registry.map(y.hubMapId);
      expect(hub.safeZone).toBe(true);
      expect(hub.year).toBe(y.year);
      expect(hubForYear(y.year)).toBe(y.hubMapId);
    }
    expect(hubForYear(2003)).toBe('jongno-shelter');
    expect(hubForYear(2017)).toBe('gwangjin-gucheong-parking'); // unknown years fall back to the start
    expect(YEARS.map((y) => y.year)).toEqual([2002, 2003, 2004]);
    expect(unlockText(YEARS[1])).toContain('허가증');
  });

  it('2003 종로 has a hub ⇄ street link and its own monster set', () => {
    const shelter = registry.map('jongno-shelter');
    const street = registry.map('jongno-street');
    expect(shelter.portals.some((p) => p.toMap === 'jongno-street')).toBe(true);
    expect(street.portals.some((p) => p.toMap === 'jongno-shelter')).toBe(true);
    const ids = new Set(street.spawnZones!.flatMap((z) => z.monsters.map((m) => m.id)));
    for (const id of ['zombie_police', 'zombie_firefighter', 'wito_engineer', 'wito_turret', 'zombie_fire_chief']) {
      expect(ids.has(id), id).toBe(true);
      expect(registry.monster(id).level).toBeGreaterThanOrEqual(25);
    }
    expect(registry.monster('wito_turret').moveSpeed).toBe(0);
  });

  it('taxis never cross years', () => {
    const flags = { [taxiFlag('jongno-street')]: true, [taxiFlag('junggok-dong')]: true, [taxiFlag('jongno-shelter')]: true };
    expect(ride(MAPS, flags, 50_000, 'jongno-street', registry.map('junggok-dong'), 30)).toEqual({ ok: false, reason: 'year' });
    const same = ride(MAPS, flags, 50_000, 'jongno-street', registry.map('jongno-shelter'), 30);
    expect(same.ok).toBe(true);
  });
});
