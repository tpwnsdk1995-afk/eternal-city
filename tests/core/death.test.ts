import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { WEAPONS } from '@data/weapons';
import { ARMORS } from '@data/armors';
import type { ArmorDef, ItemStack } from '@data/schema/item';
import type { Rng } from '@core/rng';
import { addItem, createInventory } from '@core/inventory/inventory';
import { emptyEquipment, equipStack } from '@core/inventory/equipment';
import { rollBreak } from '@core/inventory/death';
import { armorDefense, armorLabel, effectiveWeapon, repair, repairCost, weaponLabel } from '@core/tuning/tuning';
import { balance } from '@data/balance';

const glock = WEAPONS.find((w) => w.id === 'glock17')!;
const top = ARMORS.find((a) => a.kind === 'armor' && a.slot === '상의') as ArmorDef;
const rng = (roll: number, pick = 0): Rng => ({ chance: (p: number) => roll < p, range: (lo: number, hi: number) => lo + pick * (hi - lo), int: (lo: number) => lo, pick: <T>(xs: readonly T[]) => xs[0], next: () => roll });

function loadout() {
  let inv = addItem(createInventory(), glock);
  inv = addItem(inv, top);
  const [g, t] = inv.items;
  let eq = emptyEquipment();
  let r = equipStack(eq, inv, registry.item, g.uid, { level: 30, techGrade: 3 });
  if (r.ok) eq = r.equipment;
  r = equipStack(eq, inv, registry.item, t.uid, { level: 30, techGrade: 3 });
  if (r.ok) eq = r.equipment;
  return { inv, eq, g, t };
}

describe('사망 파손 · 파방클 · 수리', () => {
  it('breaks one equipped item on a failed roll, never when protected or when the roll passes', () => {
    const { inv, eq } = loadout();
    expect(rollBreak(eq, inv, registry.item, rng(0.01), true)).toMatchObject({ broken: null, spared: 'protected' });
    expect(rollBreak(eq, inv, registry.item, rng(0.99), false)).toMatchObject({ broken: null, spared: 'roll' });
    const hit = rollBreak(eq, inv, registry.item, rng(0.01, 0), false);
    expect(hit.broken).not.toBeNull();
    const damaged = hit.inventory.items.filter((s) => s.damaged);
    expect(damaged).toHaveLength(1);
    expect(damaged[0].uid).toBe(hit.broken!.uid);
    // second death with the same roll picks the other (undamaged) piece; third finds nothing left
    const hit2 = rollBreak(eq, hit.inventory, registry.item, rng(0.01, 0), false);
    expect(hit2.broken!.uid).not.toBe(hit.broken!.uid);
    expect(rollBreak(eq, hit2.inventory, registry.item, rng(0.01), false)).toMatchObject({ broken: null, spared: 'allDamaged' });
    expect(rollBreak(emptyEquipment(), inv, registry.item, rng(0.01), false)).toMatchObject({ broken: null, spared: 'nothingEquipped' });
  });

  it('damaged gear loses damage/defense and shows [파손]; repair restores it for a price', () => {
    const g: ItemStack = { uid: 'g', itemId: glock.id, qty: 1, damaged: true };
    const ok: ItemStack = { uid: 'g2', itemId: glock.id, qty: 1 };
    expect(effectiveWeapon(glock, g).def.baseDamage).toBeCloseTo(effectiveWeapon(glock, ok).def.baseDamage * (1 - balance.death.brokenWeaponPenalty), 6);
    expect(weaponLabel(glock, g)).toContain('[파손]');
    const a: ItemStack = { uid: 'a', itemId: top.id, qty: 1, damaged: true };
    expect(armorDefense(top, a)).toBeCloseTo(top.defense * (1 - balance.death.brokenArmorPenalty), 6);
    expect(armorLabel(top, a)).toContain('[파손]');
    const r = repair(glock, g);
    expect(r.ok && r.success).toBe(true);
    if (r.ok) {
      expect(r.stack.damaged).toBeUndefined();
      expect(r.cost).toBe(repairCost(glock, g));
      expect(r.cost).toBeGreaterThan(0);
    }
    expect(repair(glock, ok)).toEqual({ ok: false, reason: 'maxed' });
    expect(registry.buff('buff_pabang_clip').durationMs).toBe(7 * 86_400_000);
    expect(registry.item('pabang_clip').kind).toBe('consumable');
  });
});
