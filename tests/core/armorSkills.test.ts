import { describe, expect, it } from 'vitest';
import { createRng, type Rng } from '@core/rng';
import { registry } from '@data/registry';
import { ARMORS } from '@data/armors';
import { SKILLS } from '@data/skills';
import { ARMOR_SLOTS, WEAPON_CLASSES } from '@data/schema/enums';
import { addItem, createInventory } from '@core/inventory/inventory';
import { emptyEquipment, equipStack, totalDefense } from '@core/inventory/equipment';
import { rollLoot, rollPrefix } from '@core/world/loot';
import { aggregateMods } from '@core/skills/modifiers';
import { drainAp } from '@core/skills/skillState';

const always = (v: boolean): Rng => ({ chance: () => v, range: (lo) => lo, int: (lo) => lo, pick: (xs) => xs[0], next: () => (v ? 0 : 0.999) });

describe('방어구 전 부위', () => {
  it('every slot has at least one piece and each equips into its own slot', () => {
    let inv = createInventory();
    let eq = emptyEquipment();
    for (const slot of ARMOR_SLOTS) {
      const def = ARMORS.find((a) => a.slot === slot)!;
      expect(def, slot).toBeTruthy();
      inv = addItem(inv, def);
      const uid = inv.items[inv.items.length - 1].uid;
      const r = equipStack(eq, inv, registry.item, uid, { level: 30, techGrade: 5 });
      expect(r.ok).toBe(true);
      if (r.ok) eq = r.equipment;
    }
    expect(Object.keys(eq.armor).sort()).toEqual([...ARMOR_SLOTS].sort());
    expect(totalDefense(eq, inv, registry.item)).toBeGreaterThan(0);
  });

  it('CL pieces count ×1.5 and 접두 pieces stack on top', () => {
    const cl = ARMORS.find((a) => a.id === 'armor_coat_kevlar_cl')!;
    const plain = ARMORS.find((a) => a.id === 'armor_coat_kevlar')!;
    let inv = addItem(createInventory(), cl);
    let eq = equipStack(emptyEquipment(), inv, registry.item, inv.items[0].uid, { level: 30, techGrade: 5 });
    expect(eq.ok && totalDefense(eq.equipment, inv, registry.item)).toBeCloseTo(plain.defense * 1.5);
    inv = addItem(createInventory(), plain, 1, { prefix: '전설' });
    eq = equipStack(emptyEquipment(), inv, registry.item, inv.items[0].uid, { level: 30, techGrade: 5 });
    expect(eq.ok && totalDefense(eq.equipment, inv, registry.item)).toBeCloseTo(plain.defense * 1.4);
  });

  it('armour drops can roll a 접두; other items never do', () => {
    expect(rollPrefix(always(true))).toBe('전설');
    expect(rollPrefix(always(false))).toBeUndefined();
    const lord = registry.monster('zombie_lord');
    const loot = rollLoot(lord, always(true), registry.item);
    const armour = loot.items.filter((i) => registry.item(i.itemId).kind === 'armor');
    expect(armour.length).toBeGreaterThan(0);
    expect(armour.every((i) => i.prefix === '전설')).toBe(true);
    expect(loot.items.filter((i) => registry.item(i.itemId).kind !== 'armor').every((i) => i.prefix === undefined)).toBe(true);
    // real RNG: prefixes are rare
    const rng = createRng(7);
    let prefixed = 0;
    for (let i = 0; i < 2000; i++) if (rollPrefix(rng)) prefixed++;
    expect(prefixed).toBeGreaterThan(100);
    expect(prefixed).toBeLessThan(500);
  });
});

describe('스킬 확장', () => {
  it('has a mastery for every weapon class except 투척중화기, and four AP-draining actives', () => {
    const masteries = SKILLS.filter((s) => s.category === '웨폰마스터리');
    for (const cls of WEAPON_CLASSES) {
      if (cls === '투척중화기') continue;
      expect(masteries.some((m) => m.weaponClass === cls), cls).toBe(true);
    }
    const actives = SKILLS.filter((s) => s.category === '퍼스널액티브');
    expect(actives.length).toBe(4);
    expect(actives.every((a) => (a.apDrainPerSec ?? 0) > 0)).toBe(true);
  });

  it('an active skill drains AP and switches itself off at zero; its mods stop applying', () => {
    const stim = SKILLS.find((s) => s.id === 'skill_combat_stim')!;
    const state = { learned: [{ id: stim.id, rank: 2 }], active: { 퍼스널액티브: stim.id } };
    expect(aggregateMods(state, registry.skill, null).attackSpeedPct).toBeCloseTo(0.1);
    const tick = drainAp(state, registry.skill, 10, 1000);
    expect(tick.ap).toBeCloseTo(7);
    expect(tick.state.active['퍼스널액티브']).toBe(stim.id);
    const dry = drainAp(state, registry.skill, 2, 1000);
    expect(dry.ap).toBe(0);
    expect(dry.state.active['퍼스널액티브']).toBeUndefined();
    expect(aggregateMods(dry.state, registry.skill, null).attackSpeedPct).toBe(0);
  });
});
