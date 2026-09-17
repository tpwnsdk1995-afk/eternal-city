import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { createInventory, totalRounds } from '@core/inventory/inventory';
import { buy, buyPrice, sell, sellPrice, SELL_RATIO } from '@core/economy/shop';

describe('shop', () => {
  it('weapon price is the list price; short money fails', () => {
    const glock = registry.weapon('glock17');
    expect(buyPrice(glock)).toBe(glock.price);
    expect(buy(createInventory(), glock.price - 1, glock, registry.item)).toEqual({ ok: false, reason: 'noMoney' });
  });

  it('buying ammo adds a full box and buying a weapon adds one stack', () => {
    const ammo = registry.ammo('ammo_9mm_normal');
    const r = buy(createInventory(), 100_000, ammo, registry.item);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(totalRounds(r.inv, registry.item, '9mm', '일반탄')).toBe(ammo.boxSize);
    expect(r.won).toBe(100_000 - ammo.price);

    const g = buy(r.inv, r.won, registry.weapon('glock17'), registry.item);
    expect(g.ok && g.inv.items.filter((s) => s.itemId === 'glock17').length).toBe(1);
  });

  it('sells gear whole at the buy-back ratio and consumables one at a time', () => {
    const glock = registry.weapon('glock17');
    let r = buy(createInventory(), 100_000, glock, registry.item);
    if (!r.ok) throw new Error();
    const uid = r.inv.items[0].uid;
    expect(sellPrice(r.inv.items[0], registry.item)).toBe(Math.round(glock.price * SELL_RATIO));
    const s = sell(r.inv, r.won, uid, registry.item);
    expect(s.ok && s.inv.items.length).toBe(0);
    expect(s.ok && s.won).toBe(r.won + Math.round(glock.price * SELL_RATIO));

    r = buy(createInventory(), 100_000, registry.consumable('bandage'), registry.item);
    if (!r.ok) throw new Error();
    r = buy(r.inv, r.won, registry.consumable('bandage'), registry.item);
    if (!r.ok) throw new Error();
    expect(r.inv.items).toHaveLength(1);
    expect(r.inv.items[0].qty).toBe(2);
    const s2 = sell(r.inv, r.won, r.inv.items[0].uid, registry.item);
    expect(s2.ok && s2.inv.items[0].qty).toBe(1);
    expect(sell(r.inv, r.won, 'nope', registry.item)).toEqual({ ok: false, reason: 'notFound' });
  });
});
