import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { addItem, consumeRound, createInventory, findAmmoBoxes, removeQty, removeStack, totalRounds } from '@core/inventory/inventory';
import { totalWeightKg } from '@core/inventory/weight';
import { emptyEquipment, equipStack, equippedWeapon, pruneEquipment, totalDefense } from '@core/inventory/equipment';

const lookup = registry.item;

describe('inventory', () => {
  it('keeps ammo boxes as separate stacks and removes an empty box', () => {
    let inv = addItem(createInventory(), lookup('ammo_9mm_normal'), 2);
    expect(inv.items).toHaveLength(1);
    inv = consumeRound(inv, inv.items[0].uid);
    expect(inv.items[0].qty).toBe(1);
    inv = consumeRound(inv, inv.items[0].uid);
    expect(inv.items).toHaveLength(0);
  });

  it('merges consumables into one stack', () => {
    let inv = addItem(createInventory(), lookup('bandage'), 1);
    inv = addItem(inv, lookup('bandage'), 2);
    expect(inv.items).toHaveLength(1);
    expect(inv.items[0].qty).toBe(3);
  });


  it('finds ammo boxes by caliber and kind, smallest first', () => {
    let inv = addItem(createInventory(), lookup('ammo_9mm_normal'), 100);
    inv = addItem(inv, lookup('ammo_9mm_normal'), 30);
    inv = addItem(inv, lookup('ammo_45_normal'), 80);
    inv = addItem(inv, lookup('ammo_9mm_incendiary'), 60);
    const boxes = findAmmoBoxes(inv, lookup, '9mm', '일반탄');
    expect(boxes.map((b) => b.qty)).toEqual([30, 100]);
    expect(totalRounds(inv, lookup, '9mm', '일반탄')).toBe(130);
  });

  it('sums weight across stacks', () => {
    let inv = addItem(createInventory(), lookup('glock17'), 1);
    inv = addItem(inv, lookup('ammo_9mm_normal'), 100);
    expect(totalWeightKg(inv, lookup)).toBeCloseTo(0.9 + 0.8);
  });

  it('removeQty removes the stack when it hits zero', () => {
    let inv = addItem(createInventory(), lookup('bandage'), 2);
    inv = removeQty(inv, inv.items[0].uid, 2);
    expect(inv.items).toHaveLength(0);
  });
});

describe('equipment', () => {
  const char = { level: 1, techGrade: 1 };

  it('equips a weapon the character qualifies for', () => {
    const inv = addItem(createInventory(), lookup('glock17'), 1);
    const r = equipStack(emptyEquipment(), inv, lookup, inv.items[0].uid, char);
    expect(r.ok).toBe(true);
    if (r.ok) expect(equippedWeapon(r.equipment, inv, lookup)?.def.id).toBe('glock17');
  });

  it('refuses under-level weapons and non-equippables', () => {
    let inv = addItem(createInventory(), lookup('mp5'), 1);
    inv = addItem(inv, lookup('ammo_9mm_normal'), 10);
    expect(equipStack(emptyEquipment(), inv, lookup, inv.items[0].uid, char)).toEqual({ ok: false, reason: 'levelTooLow' });
    expect(equipStack(emptyEquipment(), inv, lookup, inv.items[1].uid, char)).toEqual({ ok: false, reason: 'notEquippable' });
    expect(equipStack(emptyEquipment(), inv, lookup, 'nope', char)).toEqual({ ok: false, reason: 'notFound' });
  });

  it('sums armor defense and prunes dangling references', () => {
    let inv = addItem(createInventory(), lookup('armor_top_basic'), 1);
    inv = addItem(inv, lookup('armor_bottom_basic'), 1);
    let eq = emptyEquipment();
    for (const s of inv.items) {
      const r = equipStack(eq, inv, lookup, s.uid, char);
      if (r.ok) eq = r.equipment;
    }
    expect(totalDefense(eq, inv, lookup)).toBe(10);
    inv = removeStack(inv, inv.items[0].uid);
    expect(totalDefense(pruneEquipment(eq, inv), inv, lookup)).toBe(4);
  });
});
