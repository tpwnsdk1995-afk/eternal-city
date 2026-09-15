import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { WEAPONS } from '@data/weapons';
import { AMMO } from '@data/ammo';
import { addItem, createInventory } from '@core/inventory/inventory';
import { allowedAmmoKinds, isAmmoCompatible } from '@core/weapons/ammoCompat';
import { defaultAmmoKind, initialFireState, tryFire } from '@core/weapons/fireController';
import { fireProfile } from '@core/weapons/weaponMath';
import { targetsInArc } from '@core/combat/meleeArc';

const lookup = registry.item;

describe('ammo compatibility', () => {
  it('follows the caliber table and the shotgun 철갑탄 rule', () => {
    expect(allowedAmmoKinds(registry.weapon('m16a2'))).toEqual(['일반탄', '소이탄', '철갑탄']);
    expect(allowedAmmoKinds(registry.weapon('rem870'))).toEqual(['일반탄', 'Slug']);
    expect(isAmmoCompatible(registry.weapon('rem870'), '철갑탄')).toBe(false);
    expect(allowedAmmoKinds(registry.weapon('rpg7'))).toEqual(['대전차탄']);
    expect(allowedAmmoKinds(registry.weapon('baton'))).toEqual([]);
    expect(isAmmoCompatible(registry.weapon('glock17'), 'Slug')).toBe(false);
  });

  it('every ammo def is compatible with at least one weapon of its caliber', () => {
    for (const def of AMMO) {
      expect(WEAPONS.some((w) => w.caliber === def.caliber && isAmmoCompatible(w, def.ammoKind)), def.id).toBe(true);
    }
  });

  it('defaultAmmoKind prefers a held kind, then the caliber default', () => {
    const rpg = registry.weapon('rpg7');
    expect(defaultAmmoKind(rpg, createInventory(), lookup, '일반탄')).toBe('대전차탄');
    const shotgun = registry.weapon('rem870');
    const inv = addItem(createInventory(), lookup('ammo_12ga_slug'), 10);
    expect(defaultAmmoKind(shotgun, inv, lookup, '일반탄')).toBe('Slug');
    expect(defaultAmmoKind(shotgun, createInventory(), lookup, '철갑탄')).toBe('일반탄');
    // a launcher with the right rounds fires; with the wrong kind selected it is incompatible
    const rinv = addItem(createInventory(), lookup('ammo_rocket'), 3);
    expect(tryFire({ ...initialFireState(), ammoKind: '대전차탄' }, 0, rpg, 1, rinv, lookup).ok).toBe(true);
    expect(tryFire(initialFireState(), 0, rpg, 1, rinv, lookup)).toEqual({ ok: false, reason: 'incompatibleAmmo' });
  });

  it('class fire profiles reward stillness for snipers and punish moving MGs', () => {
    expect(fireProfile('저격소총').crouchDmgMult).toBeGreaterThan(1);
    expect(fireProfile('기관총').moveSpreadMult).toBeGreaterThan(fireProfile('권총').moveSpreadMult);
    expect(fireProfile('권총').moveAccPenalty).toBe(0);
  });
});

describe('melee arc', () => {
  const origin = { x: 0, y: 0 };
  const targets = [
    { id: 'front', x: 30, y: 0, r: 12 },
    { id: 'side', x: 0, y: 30, r: 12 },
    { id: 'behind', x: -30, y: 0, r: 12 },
    { id: 'far', x: 120, y: 0, r: 12 },
    { id: 'diag', x: 25, y: 20, r: 12 },
  ];
  it('hits targets in front within range, nearest first, and ignores behind/far', () => {
    const hits = targetsInArc(origin, 0, 44, targets).map((t) => t.id);
    expect(hits).toEqual(['front', 'diag']);
  });
  it('rotates with the aim angle', () => {
    expect(targetsInArc(origin, Math.PI / 2, 44, targets).map((t) => t.id)).toEqual(['side', 'diag']);
    expect(targetsInArc(origin, Math.PI, 44, targets).map((t) => t.id)).toEqual(['behind']);
  });
});
