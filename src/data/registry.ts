import type { ItemDef, WeaponDef, AmmoDef, ArmorDef, ConsumableDef } from './schema/item';
import type { MonsterDef } from './schema/monster';
import type { SkillDef } from './schema/skill';
import type { NpcDef } from './schema/npc';
import type { MapDef, Rect } from './schema/map';
import type { AssaultDef } from './schema/assault';
import { WEAPONS } from './weapons';
import { AMMO } from './ammo';
import { ARMORS, CONSUMABLES } from './armors';
import { MONSTERS } from './monsters';
import { SKILLS } from './skills';
import { NPCS } from './npcs';
import { gwangjinParking } from './maps/gwangjin-gucheong-parking';
import { junggokDong } from './maps/junggok-dong';
import { junggokBlockade } from './maps/junggok-blockade';
import { assaultA } from './assaults/assault-a';

const byId = <T extends { id: string }>(list: T[]): Map<string, T> => new Map(list.map((x) => [x.id, x]));

export const ITEMS: ItemDef[] = [...WEAPONS, ...AMMO, ...ARMORS, ...CONSUMABLES];
export const MAPS: MapDef[] = [gwangjinParking, junggokDong, junggokBlockade];
export const ASSAULTS: AssaultDef[] = [assaultA];

const items = byId(ITEMS);
const monsters = byId(MONSTERS);
const skills = byId(SKILLS);
const npcs = byId(NPCS);
const maps = byId(MAPS);
const assaults = byId(ASSAULTS);

function must<T>(map: Map<string, T>, id: string, what: string): T {
  const v = map.get(id);
  if (!v) throw new Error(`Unknown ${what}: ${id}`);
  return v;
}

export const registry = {
  item: (id: string): ItemDef => must(items, id, 'item'),
  weapon: (id: string): WeaponDef => {
    const it = must(items, id, 'item');
    if (it.kind !== 'weapon') throw new Error(`Item is not a weapon: ${id}`);
    return it;
  },
  ammo: (id: string): AmmoDef => {
    const it = must(items, id, 'item');
    if (it.kind !== 'ammo') throw new Error(`Item is not ammo: ${id}`);
    return it;
  },
  armor: (id: string): ArmorDef => {
    const it = must(items, id, 'item');
    if (it.kind !== 'armor') throw new Error(`Item is not armor: ${id}`);
    return it;
  },
  consumable: (id: string): ConsumableDef => {
    const it = must(items, id, 'item');
    if (it.kind !== 'consumable') throw new Error(`Item is not a consumable: ${id}`);
    return it;
  },
  monster: (id: string): MonsterDef => must(monsters, id, 'monster'),
  skill: (id: string): SkillDef => must(skills, id, 'skill'),
  npc: (id: string): NpcDef => must(npcs, id, 'npc'),
  map: (id: string): MapDef => must(maps, id, 'map'),
  assault: (id: string): AssaultDef => must(assaults, id, 'assault'),
  hasItem: (id: string): boolean => items.has(id),
};

function rectInside(r: Rect, m: MapDef): boolean {
  return r.x >= 0 && r.y >= 0 && r.x + r.w <= m.width && r.y + r.h <= m.height;
}

/** Cross-checks every id reference in the content tables. Throws with all problems listed. */
export function validateAll(): void {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const it of ITEMS) {
    if (seen.has(it.id)) errors.push(`duplicate item id ${it.id}`);
    seen.add(it.id);
  }

  for (const m of MONSTERS) {
    for (const d of m.drops) if (!items.has(d.itemId)) errors.push(`monster ${m.id} drops unknown item ${d.itemId}`);
    if ((m.ai === 'rangedKite' || m.ai === 'assaulter') && !m.ranged) errors.push(`monster ${m.id} ai ${m.ai} needs ranged`);
    if (m.ai === 'banshee' && !m.jump) errors.push(`monster ${m.id} ai banshee needs jump`);
  }

  for (const n of NPCS) {
    for (const id of n.stock ?? []) if (!items.has(id)) errors.push(`npc ${n.id} stocks unknown item ${id}`);
    for (const id of n.assaults ?? []) if (!assaults.has(id)) errors.push(`npc ${n.id} offers unknown assault ${id}`);
    if (n.role === 'shop' && !n.stock?.length) errors.push(`shop npc ${n.id} has empty stock`);
  }

  for (const w of WEAPONS) {
    if (w.class === '산탄총') {
      // shotguns cannot use 철갑탄 — stock must not pair them (checked at fire time too)
    }
    if (w.gradeMin < 1 || w.gradeMax < w.gradeMin) errors.push(`weapon ${w.id} bad grade range`);
  }

  for (const m of MAPS) {
    if (!m.spawnPoints.default) errors.push(`map ${m.id} lacks 'default' spawn point`);
    for (const p of m.portals) {
      const target = maps.get(p.toMap);
      if (!target) errors.push(`map ${m.id} portal ${p.id} → unknown map ${p.toMap}`);
      else if (!target.spawnPoints[p.toSpawn]) errors.push(`map ${m.id} portal ${p.id} → unknown spawn ${p.toSpawn} in ${p.toMap}`);
      if (!rectInside(p.rect, m)) errors.push(`map ${m.id} portal ${p.id} out of bounds`);
    }
    for (const z of m.spawnZones ?? []) {
      for (const mm of z.monsters) if (!monsters.has(mm.id)) errors.push(`map ${m.id} zone ${z.id} unknown monster ${mm.id}`);
      if (!rectInside(z.rect, m)) errors.push(`map ${m.id} zone ${z.id} out of bounds`);
    }
    for (const n of m.npcs ?? []) if (!npcs.has(n.id)) errors.push(`map ${m.id} places unknown npc ${n.id}`);
    for (const o of m.obstacles) if (!rectInside(o.rect, m)) errors.push(`map ${m.id} obstacle out of bounds at ${o.rect.x},${o.rect.y}`);
    const objectiveIds = new Set((m.objectives ?? []).map((o) => o.id));
    for (const g of m.gates ?? []) for (const id of g.opensWhen) if (!objectiveIds.has(id)) errors.push(`map ${m.id} gate ${g.id} references unknown objective ${id}`);
  }

  for (const a of ASSAULTS) {
    const m = maps.get(a.mapId);
    if (!m) {
      errors.push(`assault ${a.id} → unknown map ${a.mapId}`);
      continue;
    }
    if (!m.spawnPoints[a.entrySpawn]) errors.push(`assault ${a.id} entry spawn ${a.entrySpawn} missing`);
    const objectiveIds = new Set((m.objectives ?? []).map((o) => o.id));
    const checkWaves = (waves: { spawns: { monsterId: string; spawnPoint: string }[] }[] | undefined, where: string) => {
      for (const w of waves ?? [])
        for (const s of w.spawns) {
          if (!monsters.has(s.monsterId)) errors.push(`assault ${a.id} ${where} unknown monster ${s.monsterId}`);
          if (!m.spawnPoints[s.spawnPoint]) errors.push(`assault ${a.id} ${where} unknown spawn ${s.spawnPoint}`);
        }
    };
    a.phases.forEach((p, i) => {
      const where = `phase[${i}] ${p.kind}`;
      switch (p.kind) {
        case 'clear':
          checkWaves(p.waves, where);
          break;
        case 'destroy':
          for (const id of p.objectiveIds) if (!objectiveIds.has(id)) errors.push(`assault ${a.id} ${where} unknown objective ${id}`);
          checkWaves(p.waves, where);
          break;
        case 'advance':
        case 'moveTo':
          if (!m.zones?.[p.toZone]) errors.push(`assault ${a.id} ${where} unknown zone ${p.toZone}`);
          break;
        case 'boss':
          if (!monsters.has(p.monsterId)) errors.push(`assault ${a.id} ${where} unknown boss ${p.monsterId}`);
          if (!m.spawnPoints[p.spawnPoint]) errors.push(`assault ${a.id} ${where} unknown spawn ${p.spawnPoint}`);
          checkWaves(p.adds, where);
          break;
        case 'defend':
          checkWaves(p.waves, where);
          break;
      }
    });
    for (const r of a.rewards.items) if (!items.has(r.itemId)) errors.push(`assault ${a.id} rewards unknown item ${r.itemId}`);
  }

  if (errors.length) throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`);
}
