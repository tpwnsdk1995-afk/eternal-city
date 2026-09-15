import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { WEAPONS } from '@data/weapons';
import { SKILLS } from '@data/skills';
import { STARTER_KITS } from '@data/starterKit';
import { addItem, createInventory } from '@core/inventory/inventory';
import { emptyEquipment, equipStack, weaponUsableBy } from '@core/inventory/equipment';
import { initialFireState, tryFire } from '@core/weapons/fireController';
import { createCharacter } from '@core/stats/character';
import { rebirth } from '@core/stats/rebirth';

describe('감염체 (infected race)', () => {
  it('변이무기 are infected-only, guns human-only, both at the equip gate', () => {
    for (const w of WEAPONS) expect(weaponUsableBy(w, 'infected'), w.id).toBe(w.class === '변이무기');
    let inv = addItem(createInventory(), registry.weapon('claws'));
    inv = addItem(inv, registry.weapon('glock17'));
    const [claws, glock] = inv.items;
    expect(equipStack(emptyEquipment(), inv, registry.item, claws.uid, { level: 1, techGrade: 1, race: 'infected' }).ok).toBe(true);
    expect(equipStack(emptyEquipment(), inv, registry.item, glock.uid, { level: 1, techGrade: 1, race: 'infected' })).toEqual({ ok: false, reason: 'race' });
    expect(equipStack(emptyEquipment(), inv, registry.item, claws.uid, { level: 1, techGrade: 1, race: 'human' })).toEqual({ ok: false, reason: 'race' });
    expect(equipStack(emptyEquipment(), inv, registry.item, glock.uid, { level: 1, techGrade: 1 }).ok).toBe(true); // race defaults to human
  });

  it('변이무기 never need ammo, and 산성 토사 lobs a projectile without hurting its owner', () => {
    const inv = createInventory();
    for (const id of ['claws', 'tentacle', 'acid_spit', 'bone_blade']) {
      const r = tryFire(initialFireState(), 10_000, registry.weapon(id), 1, inv, registry.item);
      expect(r.ok, id).toBe(true);
      if (r.ok) expect(r.boxUid).toBeNull();
    }
    const acid = registry.weapon('acid_spit');
    expect(acid.projectile?.selfDamage).toBe(false);
    expect(acid.caliber).toBe('none');
  });

  it('starter kits and race carry through creation and rebirth; race-locked skills exist for both', () => {
    expect(STARTER_KITS.infected.equipWeaponItemId).toBe('claws');
    expect(STARTER_KITS.human.equipWeaponItemId).toBe('glock17');
    const c = createCharacter('감염', 5, 'infected');
    expect(c.race).toBe('infected');
    expect(rebirth({ ...c, level: 50 }).race).toBe('infected');
    expect(createCharacter('x', 5).race).toBe('human');
    expect(SKILLS.some((s) => s.race === 'infected' && s.weaponClass === '변이무기')).toBe(true);
    expect(SKILLS.filter((s) => s.category === '웨폰마스터리' && s.weaponClass !== '변이무기').every((s) => s.race === 'human')).toBe(true);
  });
});
