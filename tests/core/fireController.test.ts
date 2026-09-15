import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import type { WeaponDef } from '@data/schema/item';
import { addItem, consumeRound, createInventory } from '@core/inventory/inventory';
import { initialFireState, markFired, selectAmmoKind, toggleSubFire, tryFire } from '@core/weapons/fireController';
import { cooldownMs, weaponPrice } from '@core/weapons/weaponMath';

const lookup = registry.item;
const glock = registry.weapon('glock17');

describe('fireController', () => {
  it('fires when a matching ammo box exists, then enforces the rpm cooldown', () => {
    const inv = addItem(createInventory(), lookup('ammo_9mm_normal'), 10);
    let state = initialFireState();
    const first = tryFire(state, 0, glock, 1, inv, lookup);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.boxUid).toBe(inv.items[0].uid);
      expect(first.cooldownMs).toBe(250);
    }
    state = markFired(state, 0);
    expect(tryFire(state, 100, glock, 1, inv, lookup)).toEqual({ ok: false, reason: 'cooldown' });
    expect(tryFire(state, 250, glock, 1, inv, lookup).ok).toBe(true);
  });

  it('reports noAmmo with an empty inventory and chains to the next box', () => {
    expect(tryFire(initialFireState(), 0, glock, 1, createInventory(), lookup)).toEqual({ ok: false, reason: 'noAmmo' });

    let inv = addItem(createInventory(), lookup('ammo_9mm_normal'), 1);
    inv = addItem(inv, lookup('ammo_9mm_normal'), 5);
    const small = inv.items[0].uid;
    const big = inv.items[1].uid;
    const a = tryFire(initialFireState(), 0, glock, 1, inv, lookup);
    expect(a.ok && a.boxUid).toBe(small);
    inv = consumeRound(inv, small);
    const b = tryFire(initialFireState(), 0, glock, 1, inv, lookup);
    expect(b.ok && b.boxUid).toBe(big);
  });

  it('rejects 철갑탄 in shotguns', () => {
    const shotgun: WeaponDef = { ...glock, id: 'test_shotgun', class: '산탄총', caliber: '12ga', pellets: 6 };
    const state = selectAmmoKind(initialFireState(), '철갑탄');
    expect(tryFire(state, 0, shotgun, 1, createInventory(), lookup)).toEqual({ ok: false, reason: 'incompatibleAmmo' });
  });

  it('melee never needs ammo', () => {
    const bat: WeaponDef = { ...glock, id: 'test_bat', class: '근접무기', rpm: 90 };
    const r = tryFire(initialFireState(), 0, bat, 1, createInventory(), lookup);
    expect(r.ok && r.boxUid).toBeNull();
  });

  it('sub-fire lowers the rpm to 120', () => {
    const inv = addItem(createInventory(), lookup('ammo_9mm_normal'), 10);
    const r = tryFire(toggleSubFire(initialFireState()), 0, glock, 1, inv, lookup);
    expect(r.ok && r.cooldownMs).toBe(500);
  });
});

describe('weaponMath', () => {
  it('scales price and cooldown', () => {
    expect(weaponPrice(glock, 3)).toBe(Math.round(8000 * 1.5625));
    expect(cooldownMs(600, 1)).toBe(100);
    expect(cooldownMs(600, 2)).toBe(50);
  });
});
