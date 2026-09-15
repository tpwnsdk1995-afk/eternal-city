import { describe, expect, it } from 'vitest';
import { MAPS, registry } from '@data/registry';
import { fareFor, hasTaxiStop, portalHops, register, ride, TAXI_BASE_FARE, TAXI_PER_HOP, TAXI_REGISTER_FEE, TAXI_REMOTE_HOPS, taxiFlag } from '@core/economy/taxi';

describe('taxi', () => {
  it('measures portal hops and prices remote stops as far', () => {
    expect(portalHops(MAPS, 'gwangjin-gucheong-parking', 'junggok-dong')).toBe(1);
    expect(portalHops(MAPS, 'gwangjin-gucheong-parking', 'achasan-station')).toBe(3);
    expect(portalHops(MAPS, 'junggok-dong', 'pyeongchang-dong')).toBe(TAXI_REMOTE_HOPS);
    expect(fareFor(1)).toBe(TAXI_BASE_FARE + TAXI_PER_HOP);
  });

  it('registers once per stop and charges the fee', () => {
    const parking = registry.map('gwangjin-gucheong-parking');
    expect(hasTaxiStop(parking)).toBe(true);
    expect(hasTaxiStop(registry.map('sewer'))).toBe(false);
    const r = register(parking, {}, 5000);
    expect(r).toEqual({ ok: true, won: 5000 - TAXI_REGISTER_FEE });
    expect(register(parking, { [taxiFlag(parking.id)]: true }, 5000)).toEqual({ ok: false, reason: 'already' });
    expect(register(parking, {}, 100)).toEqual({ ok: false, reason: 'noMoney' });
    expect(register(registry.map('sewer'), {}, 9999)).toEqual({ ok: false, reason: 'noStop' });
  });

  it('rides only between registered stops with enough money', () => {
    const flags = { [taxiFlag('gwangjin-gucheong-parking')]: true, [taxiFlag('junggok-dong')]: true };
    const to = registry.map('junggok-dong');
    expect(ride(MAPS, flags, 10_000, 'gwangjin-gucheong-parking', to, 1)).toEqual({ ok: true, won: 10_000 - 900, cost: 900 });
    expect(ride(MAPS, flags, 10_000, 'junggok-dong', to, 1)).toEqual({ ok: false, reason: 'sameMap' });
    expect(ride(MAPS, flags, 10_000, 'gwangjin-gucheong-parking', registry.map('hangang-park'), 1)).toEqual({ ok: false, reason: 'notRegistered' });
    expect(ride(MAPS, { [taxiFlag('junggok-dong')]: true }, 10_000, 'gwangjin-gucheong-parking', to, 1)).toEqual({ ok: false, reason: 'hereNotRegistered' });
    expect(ride(MAPS, flags, 100, 'gwangjin-gucheong-parking', to, 1)).toEqual({ ok: false, reason: 'noMoney' });
    const pc = registry.map('pyeongchang-dong');
    const f2 = { ...flags, [taxiFlag(pc.id)]: true };
    expect(ride(MAPS, f2, 10_000, 'junggok-dong', pc, 1)).toEqual({ ok: false, reason: 'level' });
    expect(ride(MAPS, f2, 10_000, 'junggok-dong', pc, 15).ok).toBe(true);
  });
});
