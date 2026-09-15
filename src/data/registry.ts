import type { ItemDef, WeaponDef, AmmoDef, ArmorDef, ConsumableDef } from './schema/item';
import type { MonsterDef } from './schema/monster';
import type { SkillDef } from './schema/skill';
import type { NpcDef } from './schema/npc';
import type { MapDef, Rect } from './schema/map';
import type { AssaultDef } from './schema/assault';
import type { QuestDef } from './schema/quest';
import { WEAPONS } from './weapons';
import { AMMO } from './ammo';
import { ARMORS, CONSUMABLES } from './armors';
import { MISC } from './misc';
import { QUESTS } from './quests';
import { MONSTERS } from './monsters';
import { SKILLS } from './skills';
import { NPCS } from './npcs';
import { gwangjinParking } from './maps/gwangjin-gucheong-parking';
import { junggokDong } from './maps/junggok-dong';
import { junggokBlockade } from './maps/junggok-blockade';
import { yonggokMiddleSchool } from './maps/yonggok-middle-school';
import { junggokStation } from './maps/junggok-station';
import { achasanStation } from './maps/achasan-station';
import { sewer } from './maps/sewer';
import { hangangPark } from './maps/hangang-park';
import { pyeongchangDong } from './maps/pyeongchang-dong';
import { junggokStationDefense } from './maps/junggok-station-defense';
import { sewerDepths } from './maps/sewer-depths';
import { jongnoShelter } from './maps/jongno-shelter';
import { jongnoStreet } from './maps/jongno-street';
import { technomartShelter } from './maps/technomart-shelter';
import { technomartBridge } from './maps/technomart-bridge';
import { uijeongbu } from './maps/uijeongbu';
import { parasiteNest } from './maps/parasite-nest';
import { uijeongbuRuinsShelter } from './maps/uijeongbu-ruins-shelter';
import { ilsanWaterway, jongnoRuins, uijeongbuRuins } from './maps/ruins-2005';
import { LATE_YEAR_MAPS } from './maps/late-years';
import { YEARS } from './years';
import { assaultA } from './assaults/assault-a';
import { assaultB } from './assaults/assault-b';
import { assaultC } from './assaults/assault-c';
import { assaultD } from './assaults/assault-d';
import { assaultE } from './assaults/assault-e';
import { assaultF } from './assaults/assault-f';
import { coexUnderground, gwanghwamunDefense } from './maps/late-assaults';
import { alphaTraining } from './maps/alpha-training';
import { advancedOf } from '@core/assault/advanced';
import { CAMPAIGNS } from './campaigns';
import { ACHIEVEMENTS } from './achievements';
import { BUFFS } from './buffs';
import type { BuffDef } from '@core/combat/buffs';
import type { AchievementDef, CampaignDef } from './schema/progress';
import { isMeleeClass } from './schema/enums';

const byId = <T extends { id: string }>(list: T[]): Map<string, T> => new Map(list.map((x) => [x.id, x]));

export const ITEMS: ItemDef[] = [...WEAPONS, ...AMMO, ...ARMORS, ...CONSUMABLES, ...MISC];
export const MAPS: MapDef[] = [gwangjinParking, junggokDong, junggokBlockade, yonggokMiddleSchool, junggokStation, achasanStation, sewer, hangangPark, pyeongchangDong, junggokStationDefense, sewerDepths, jongnoShelter, jongnoStreet, technomartShelter, technomartBridge, uijeongbu, parasiteNest, uijeongbuRuinsShelter, uijeongbuRuins, jongnoRuins, ilsanWaterway, ...LATE_YEAR_MAPS, coexUnderground, gwanghwamunDefense, alphaTraining];
const BASE_ASSAULTS: AssaultDef[] = [assaultA, assaultB, assaultC, assaultD, assaultE, assaultF];
/** every mission plus its 고급 variant */
export const ASSAULTS: AssaultDef[] = [...BASE_ASSAULTS, ...BASE_ASSAULTS.map(advancedOf)];

const items = byId(ITEMS);
const monsters = byId(MONSTERS);
const skills = byId(SKILLS);
const npcs = byId(NPCS);
const maps = byId(MAPS);
const assaults = byId(ASSAULTS);
const campaigns = byId(CAMPAIGNS);
const achievements = byId(ACHIEVEMENTS);
const buffs = byId(BUFFS);
export { CAMPAIGNS, ACHIEVEMENTS, BUFFS };
const quests = byId(QUESTS);

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
  quest: (id: string): QuestDef => must(quests, id, 'quest'),
  campaign: (id: string): CampaignDef => must(campaigns, id, 'campaign'),
  achievement: (id: string): AchievementDef => must(achievements, id, 'achievement'),
  buff: (id: string): BuffDef => must(buffs, id, 'buff'),
  hasItem: (id: string): boolean => items.has(id),
  hasMap: (id: string): boolean => maps.has(id),
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

  for (const it of ITEMS) if (it.kind === 'consumable' && it.effect.buff && !buffs.has(it.effect.buff)) errors.push(`consumable ${it.id} applies unknown buff ${it.effect.buff}`);

  for (const m of MONSTERS) {
    for (const d of m.drops) if (!items.has(d.itemId)) errors.push(`monster ${m.id} drops unknown item ${d.itemId}`);
    if ((m.ai === 'rangedKite' || m.ai === 'assaulter') && !m.ranged) errors.push(`monster ${m.id} ai ${m.ai} needs ranged`);
    if (m.ai === 'banshee' && !m.jump) errors.push(`monster ${m.id} ai banshee needs jump`);
    if (m.ai === 'burrower' && !m.burrow) errors.push(`monster ${m.id} ai burrower needs burrow`);
    if (m.burrow?.summon && !MONSTERS.some((x) => x.id === m.burrow!.summon!.monsterId)) errors.push(`monster ${m.id} summons unknown monster ${m.burrow.summon.monsterId}`);
  }

  for (const n of NPCS) {
    for (const id of n.stock ?? []) if (!items.has(id)) errors.push(`npc ${n.id} stocks unknown item ${id}`);
    for (const id of n.assaults ?? []) if (!assaults.has(id)) errors.push(`npc ${n.id} offers unknown assault ${id}`);
    for (const id of n.quests ?? []) if (!quests.has(id)) errors.push(`npc ${n.id} gives unknown quest ${id}`);
    if (n.role === 'shop' && !n.stock?.length) errors.push(`shop npc ${n.id} has empty stock`);
    if (n.role === 'quest' && !n.quests?.length) errors.push(`quest npc ${n.id} has no quests`);
  }

  for (const q of QUESTS) {
    const giver = npcs.get(q.giver);
    if (!giver) errors.push(`quest ${q.id} giver ${q.giver} unknown`);
    else if (!giver.quests?.includes(q.id)) errors.push(`quest ${q.id} not listed on giver ${q.giver}`);
    for (const id of q.prereq?.quests ?? []) if (!quests.has(id)) errors.push(`quest ${q.id} prereq unknown quest ${id}`);
    for (const st of q.steps) {
      if (st.kind === 'kill' && st.monsterId && !monsters.has(st.monsterId)) errors.push(`quest ${q.id} kill step unknown monster ${st.monsterId}`);
      if (st.kind === 'collect' && !items.has(st.itemId)) errors.push(`quest ${q.id} collect step unknown item ${st.itemId}`);
      if (st.kind === 'talk' && !npcs.has(st.npcId)) errors.push(`quest ${q.id} talk step unknown npc ${st.npcId}`);
      if (st.kind === 'reach' && !maps.has(st.mapId)) errors.push(`quest ${q.id} reach step unknown map ${st.mapId}`);
    }
    for (const it of [...(q.rewards.items ?? []), ...(q.rewards.itemChances ?? []), ...(q.consumes ?? [])]) if (!items.has(it.itemId)) errors.push(`quest ${q.id} references unknown item ${it.itemId}`);
  }

  for (const c of CAMPAIGNS) {
    c.chapters.forEach((ch, i) => {
      const where = `campaign ${c.id} chapter[${i}]`;
      for (const q of ch.requires.quests ?? []) if (!quests.has(q)) errors.push(`${where} requires unknown quest ${q}`);
      for (const a of ch.requires.assaultClears ?? []) if (!assaults.has(a.assaultId)) errors.push(`${where} requires unknown assault ${a.assaultId}`);
      for (const k of ch.requires.kills ?? []) if (!monsters.has(k.monsterId)) errors.push(`${where} requires unknown monster ${k.monsterId}`);
      for (const a of ch.requires.achievements ?? []) if (!achievements.has(a)) errors.push(`${where} requires unknown achievement ${a}`);
      for (const it of ch.rewards.items ?? []) if (!items.has(it.itemId)) errors.push(`${where} rewards unknown item ${it.itemId}`);
    });
  }
  for (const y of YEARS) {
    const hub = maps.get(y.hubMapId);
    if (!hub) errors.push(`year ${y.year} hub map ${y.hubMapId} unknown`);
    else {
      if (!hub.safeZone) errors.push(`year ${y.year} hub ${y.hubMapId} must be a safe zone`);
      if (hub.year !== y.year) errors.push(`year ${y.year} hub ${y.hubMapId} is a ${hub.year} map`);
      if (!hub.spawnPoints.parallel && !hub.spawnPoints.default) errors.push(`year ${y.year} hub lacks a parallel/default spawn`);
    }
  }
  for (const a of ACHIEVEMENTS) {
    const c = a.cond;
    if (c.kind === 'killMonster' && !monsters.has(c.monsterId)) errors.push(`achievement ${a.id} unknown monster ${c.monsterId}`);
    if (c.kind === 'assaultClears' && c.assaultId && !assaults.has(c.assaultId)) errors.push(`achievement ${a.id} unknown assault ${c.assaultId}`);
  }

  for (const w of WEAPONS) {
    if (w.gradeMin < 1 || w.gradeMax < w.gradeMin) errors.push(`weapon ${w.id} bad grade range`);
    const melee = isMeleeClass(w.class);
    if (melee !== (w.caliber === 'none')) errors.push(`weapon ${w.id}: melee weapons and only melee weapons use caliber 'none'`);
    if ((w.class === '변이무기') !== (w.race === 'infected')) errors.push(`weapon ${w.id}: 변이무기 and only 변이무기 are infected-only`);
    if (!melee && !AMMO.some((a) => a.caliber === w.caliber)) errors.push(`weapon ${w.id} has no ammo for caliber ${w.caliber}`);
    if (w.class === '산탄총' && !w.pellets) errors.push(`shotgun ${w.id} needs pellets`);
    if (w.class === '투척중화기' && !w.projectile) errors.push(`weapon ${w.id}: launchers define projectile`);
    if (w.projectile && w.class !== '투척중화기' && w.class !== '변이무기') errors.push(`weapon ${w.id}: only launchers and 변이무기 define projectile`);
  }

  for (const m of MAPS) {
    if (!m.spawnPoints.default) errors.push(`map ${m.id} lacks 'default' spawn point`);
    for (const p of m.portals) {
      const target = maps.get(p.toMap);
      if (!target) errors.push(`map ${m.id} portal ${p.id} → unknown map ${p.toMap}`);
      else {
        if (!target.spawnPoints[p.toSpawn]) errors.push(`map ${m.id} portal ${p.id} → unknown spawn ${p.toSpawn} in ${p.toMap}`);
        // field ↔ field links must be walkable both ways (safe zone / assault maps are exempt)
        if (!target.safeZone && !m.safeZone && target.portals.length && !target.portals.some((tp) => tp.toMap === m.id)) errors.push(`map ${m.id} portal ${p.id} → ${p.toMap} has no way back`);
      }
      if (!rectInside(p.rect, m)) errors.push(`map ${m.id} portal ${p.id} out of bounds`);
    }
    for (const d of m.decor ?? []) if (d.at.x < 0 || d.at.y < 0 || d.at.x >= m.width || d.at.y >= m.height) errors.push(`map ${m.id} decor out of bounds at ${d.at.x},${d.at.y}`);
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
        case 'defend': {
          const booth = (m.objectives ?? []).find((o) => o.id === p.boothId);
          if (!booth) errors.push(`assault ${a.id} ${where} unknown booth ${p.boothId}`);
          else if (booth.kind !== 'booth') errors.push(`assault ${a.id} ${where} objective ${p.boothId} is not a booth`);
          checkWaves(p.waves, where);
          break;
        }
      }
    });
    for (const r of a.rewards.items) if (!items.has(r.itemId)) errors.push(`assault ${a.id} rewards unknown item ${r.itemId}`);
  }

  if (errors.length) throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`);
}
