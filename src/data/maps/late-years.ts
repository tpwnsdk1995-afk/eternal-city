import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 2006 강남 · 2008 여의도 · 2017 현재의 서울 — the late 패러렐 years. Each year is one hub (a
 * sealed underground shelter) and two fields. Built from small generators so the three years share
 * a footprint while the dressing, monsters and level bands differ.
 */

const ruinBlock = (x: number, y: number, w: number, h: number) => [
  { rect: { x, y, w: Math.ceil(w / 2), h }, tile: TILE.buildingRoof, kind: 'building' as const },
  { rect: { x: x + Math.ceil(w / 2) + 1, y: y + 1, w: Math.max(1, Math.floor(w / 2) - 1), h: Math.max(1, h - 2) }, tile: TILE.concreteWall, kind: 'wall' as const },
];
const towerBlock = (x: number, y: number, w: number, h: number) => [{ rect: { x, y, w, h }, tile: TILE.buildingRoof, kind: 'building' as const }];

interface HubSpec {
  id: string;
  name: string;
  year: MapDef['year'];
  east: { map: string; label: string };
  west: { map: string; label: string };
}

/** Underground shelter hub: two exits (east/west), full service NPC row, vending, 사이버샵. */
function makeHub(s: HubSpec): MapDef {
  return {
    id: s.id,
    name: s.name,
    year: s.year,
    width: 46,
    height: 28,
    tileSize: 32,
    groundTile: TILE.parkingFloor,
    borderTile: TILE.concreteWall,
    fills: [
      { rect: { x: 1, y: 12, w: 44, h: 4 }, tile: TILE.sidewalk },
      { rect: { x: 21, y: 1, w: 4, h: 26 }, tile: TILE.sidewalk },
      { rect: { x: 1, y: 24, w: 44, h: 3 }, tile: TILE.dirt },
    ],
    obstacles: [
      { rect: { x: 4, y: 5, w: 6, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
      { rect: { x: 13, y: 5, w: 5, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
      { rect: { x: 28, y: 5, w: 5, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
      { rect: { x: 36, y: 5, w: 6, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
      { rect: { x: 4, y: 19, w: 6, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
      { rect: { x: 36, y: 19, w: 6, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
      ...[10, 35].flatMap((x) => [9, 18].map((y) => ({ rect: { x, y, w: 1, h: 1 }, tile: TILE.parkingPillar, kind: 'pillar' as const }))),
      { rect: { x: 12, y: 18, w: 4, h: 4 }, tile: TILE.car, kind: 'car' },
      { rect: { x: 30, y: 18, w: 4, h: 4 }, tile: TILE.car, kind: 'car' },
    ],
    decor: [
      ...[10, 35].flatMap((x) => [9, 18].map((y) => ({ at: { x, y }, tex: TEX.deco_pillar }))),
      { at: { x: 19, y: 8 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
      { at: { x: 26, y: 8 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
      { at: { x: 5, y: 10 }, tex: TEX.deco_trash, solid: true },
      { at: { x: 40, y: 10 }, tex: TEX.deco_phone, solid: true },
      { at: { x: 22, y: 18 }, tex: TEX.deco_sign },
      { at: { x: 16, y: 23 }, tex: TEX.deco_bench, solid: true },
      { at: { x: 28, y: 23 }, tex: TEX.deco_bench, solid: true },
      { at: { x: 6, y: 23 }, tex: TEX.deco_lamp, solid: true },
      { at: { x: 40, y: 23 }, tex: TEX.deco_lamp, solid: true },
    ],
    portals: [
      { id: 'toEast', rect: { x: 43, y: 12, w: 2, h: 4 }, toMap: s.east.map, toSpawn: 'fromShelter', label: s.east.label },
      { id: 'toWest', rect: { x: 1, y: 12, w: 2, h: 4 }, toMap: s.west.map, toSpawn: 'fromShelter', label: s.west.label },
    ],
    spawnPoints: {
      default: { x: 23, y: 13 },
      parallel: { x: 23, y: 13 },
      fromEast: { x: 41, y: 13 },
      fromWest: { x: 4, y: 13 },
      taxi: { x: 23, y: 22 },
    },
    npcs: [
      { id: 'npc_parallel', at: { x: 23, y: 9 } },
      { id: 'npc_shop', at: { x: 11, y: 13 } },
      { id: 'npc_tech', at: { x: 15, y: 13 } },
      { id: 'npc_elia', at: { x: 31, y: 13 } },
      { id: 'npc_mainstream', at: { x: 35, y: 13 } },
      { id: 'npc_cybershop', at: { x: 19, y: 22 } },
      { id: 'npc_taxi', at: { x: 27, y: 22 } },
    ],
    safeZone: true,
  };
}

interface FieldSpec {
  id: string;
  name: string;
  year: MapDef['year'];
  hub: string;
  /** which hub spawn we return to */
  hubSpawn: 'fromEast' | 'fromWest';
  levelRange: [number, number];
  /** 'ruins' = collapsed blocks with dirt; 'towers' = intact high-rises (2017) */
  style: 'ruins' | 'towers' | 'park';
  dark?: boolean;
  zones: MapDef['spawnZones'];
  extraDecor?: MapDef['decor'];
  landmark?: MapDef['obstacles'];
}

/** A 120×60 street field: two sidewalks, a central plaza, blocks north and south. */
function makeField(f: FieldSpec): MapDef {
  const blockXs = [4, 24, 44, 64, 84, 104];
  const blocks = f.style === 'towers' ? blockXs.flatMap((x) => [...towerBlock(x, 4, 14, 12), ...towerBlock(x, 44, 14, 12)]) : f.style === 'ruins' ? blockXs.flatMap((x) => [...ruinBlock(x, 4, 14, 12), ...ruinBlock(x, 44, 14, 12)]) : [];
  const parkFills = f.style === 'park' ? [{ rect: { x: 2, y: 2, w: 116, h: 14 }, tile: TILE.dirt }, { rect: { x: 2, y: 44, w: 116, h: 14 }, tile: TILE.dirt }, ...[10, 40, 70, 100].map((x) => ({ rect: { x, y: 6, w: 8, h: 6 }, tile: TILE.water, solid: true }))] : [];
  const parkObstacles = f.style === 'park' ? [20, 55, 90].flatMap((x) => [{ rect: { x, y: 46, w: 6, h: 3 }, tile: TILE.concreteWall, kind: 'wall' as const }]) : [];
  return {
    id: f.id,
    name: f.name,
    year: f.year,
    width: 120,
    height: 60,
    tileSize: 32,
    groundTile: TILE.asphalt,
    borderTile: TILE.concreteWall,
    levelRange: f.levelRange,
    dark: f.dark,
    fills: [
      { rect: { x: 1, y: 18, w: 118, h: 4 }, tile: TILE.sidewalk },
      { rect: { x: 1, y: 38, w: 118, h: 4 }, tile: TILE.sidewalk },
      { rect: { x: 1, y: 29, w: 118, h: 1 }, tile: TILE.roadLine },
      { rect: { x: 54, y: 22, w: 14, h: 16 }, tile: f.style === 'park' ? TILE.dirt : TILE.sidewalk },
      ...[21, 63, 103].map((x) => ({ rect: { x, y: 22, w: 2, h: 16 }, tile: TILE.crosswalk })),
      ...parkFills,
    ],
    obstacles: [
      ...blocks,
      ...parkObstacles,
      ...(f.landmark ?? []),
      { rect: { x: 12, y: 24, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
      { rect: { x: 30, y: 33, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
      { rect: { x: 72, y: 34, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
      { rect: { x: 90, y: 26, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
      { rect: { x: 36, y: 22, w: 1, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
      { rect: { x: 84, y: 35, w: 1, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
    ],
    decor: [
      ...[8, 48, 88].flatMap((x) => [
        { at: { x, y: 21 }, tex: TEX.deco_lamp, solid: true },
        { at: { x: x + 6, y: 38 }, tex: TEX.deco_lamp, solid: true },
      ]),
      { at: { x: 61, y: 25 }, tex: TEX.deco_sign },
      { at: { x: 26, y: 20 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
      { at: { x: 100, y: 20 }, tex: TEX.deco_trash, solid: true },
      { at: { x: 10, y: 20 }, tex: TEX.deco_busstop, solid: true },
      ...(f.extraDecor ?? []),
    ],
    spawnZones: f.zones,
    portals: [{ id: 'toShelter', rect: { x: 1, y: 22, w: 1, h: 6 }, toMap: f.hub, toSpawn: f.hubSpawn, label: '대피소로' }],
    spawnPoints: { default: { x: 4, y: 25 }, fromShelter: { x: 4, y: 25 }, taxi: { x: 8, y: 40 } },
    npcs: [{ id: 'npc_taxi', at: { x: 6, y: 40 } }],
    safeZone: false,
  };
}

// ---------------------------------------------------------------- 2006 · 강남

export const gangnamShelter = makeHub({
  id: 'gangnam-shelter',
  name: '강남역 지하상가 대피소',
  year: 2006,
  east: { map: 'teheran-ro', label: '테헤란로 (동쪽 출구)' },
  west: { map: 'coex-mall', label: '코엑스 지하 (서쪽 연결통로)' },
});

export const teheranRo = makeField({
  id: 'teheran-ro',
  name: '테헤란로',
  year: 2006,
  hub: 'gangnam-shelter',
  hubSpawn: 'fromEast',
  levelRange: [55, 66],
  style: 'towers',
  zones: [
    { id: 'west', rect: { x: 6, y: 22, w: 44, h: 16 }, monsters: [{ id: 'zombie_office', weight: 5 }, { id: 'zombie_soldier', weight: 2 }, { id: 'guest_scout', weight: 2 }], maxAlive: 11, respawnSec: 18 },
    { id: 'east', rect: { x: 70, y: 22, w: 46, h: 16 }, monsters: [{ id: 'wito_heavy_gunner', weight: 4 }, { id: 'zombie_office', weight: 3 }, { id: 'guest_warrior', weight: 2 }], maxAlive: 10, respawnSec: 22 },
    { id: 'alleys', rect: { x: 18, y: 4, w: 86, h: 12 }, monsters: [{ id: 'guest_hunter', weight: 3 }, { id: 'zombie_office', weight: 3 }], maxAlive: 7, respawnSec: 24 },
    { id: 'plaza_boss', rect: { x: 54, y: 22, w: 14, h: 16 }, monsters: [{ id: 'zombie_ceo', weight: 1 }], maxAlive: 1, respawnSec: 300 },
  ],
});

export const coexMall = makeField({
  id: 'coex-mall',
  name: '코엑스 지하몰',
  year: 2006,
  hub: 'gangnam-shelter',
  hubSpawn: 'fromWest',
  levelRange: [60, 70],
  style: 'ruins',
  dark: true,
  zones: [
    { id: 'concourse', rect: { x: 6, y: 22, w: 108, h: 16 }, monsters: [{ id: 'guest_hunter', weight: 5 }, { id: 'zombie_office', weight: 3 }, { id: 'larva', weight: 3 }], maxAlive: 12, respawnSec: 18 },
    { id: 'shops', rect: { x: 18, y: 4, w: 86, h: 12 }, monsters: [{ id: 'wito_heavy_gunner', weight: 3 }, { id: 'guest_warrior', weight: 3 }], maxAlive: 8, respawnSec: 24 },
    { id: 'aquarium', rect: { x: 18, y: 44, w: 86, h: 12 }, monsters: [{ id: 'guest_hunter', weight: 4 }, { id: 'parasite_spawn', weight: 2 }], maxAlive: 8, respawnSec: 22 },
  ],
});

// ---------------------------------------------------------------- 2008 · 여의도

export const yeouidoShelter = makeHub({
  id: 'yeouido-shelter',
  name: '국회 지하 벙커',
  year: 2008,
  east: { map: 'yeouido-park', label: '여의도 공원 (동쪽 출구)' },
  west: { map: 'national-assembly', label: '국회의사당 (서쪽 통로)' },
});

export const yeouidoPark = makeField({
  id: 'yeouido-park',
  name: '여의도 공원',
  year: 2008,
  hub: 'yeouido-shelter',
  hubSpawn: 'fromEast',
  levelRange: [68, 78],
  style: 'park',
  zones: [
    { id: 'lawn_w', rect: { x: 4, y: 20, w: 46, h: 20 }, monsters: [{ id: 'zombie_riot_police', weight: 5 }, { id: 'parasite_spawn', weight: 3 }], maxAlive: 12, respawnSec: 18 },
    { id: 'lawn_e', rect: { x: 70, y: 20, w: 46, h: 20 }, monsters: [{ id: 'wito_drone', weight: 4 }, { id: 'zombie_riot_police', weight: 3 }, { id: 'guest_hunter', weight: 2 }], maxAlive: 11, respawnSec: 20 },
    { id: 'pond', rect: { x: 4, y: 2, w: 112, h: 14 }, monsters: [{ id: 'parasite_spawn', weight: 5 }, { id: 'larva', weight: 3 }], maxAlive: 9, respawnSec: 20 },
  ],
});

export const nationalAssembly = makeField({
  id: 'national-assembly',
  name: '국회의사당 잔해',
  year: 2008,
  hub: 'yeouido-shelter',
  hubSpawn: 'fromWest',
  levelRange: [74, 84],
  style: 'ruins',
  landmark: [{ rect: { x: 56, y: 26, w: 10, h: 8 }, tile: TILE.buildingRoof, kind: 'building' }], // the dome
  zones: [
    { id: 'steps', rect: { x: 6, y: 22, w: 44, h: 16 }, monsters: [{ id: 'wito_drone', weight: 4 }, { id: 'zombie_riot_police', weight: 4 }], maxAlive: 11, respawnSec: 20 },
    { id: 'east_wing', rect: { x: 70, y: 22, w: 46, h: 16 }, monsters: [{ id: 'wito_heavy_gunner', weight: 3 }, { id: 'wito_drone', weight: 3 }, { id: 'guest_warrior', weight: 2 }], maxAlive: 10, respawnSec: 22 },
    { id: 'chambers', rect: { x: 18, y: 44, w: 86, h: 12 }, monsters: [{ id: 'parasite_spawn', weight: 4 }, { id: 'zombie_riot_police', weight: 3 }], maxAlive: 8, respawnSec: 22 },
    { id: 'dome_boss', rect: { x: 50, y: 20, w: 22, h: 4 }, monsters: [{ id: 'wito_commander', weight: 1 }], maxAlive: 1, respawnSec: 360 },
  ],
});

// ---------------------------------------------------------------- 2017 · 현재의 서울

export const seoulStationShelter = makeHub({
  id: 'seoul-station-shelter',
  name: '서울역 지하 대피소',
  year: 2017,
  east: { map: 'gwanghwamun', label: '광화문 광장 (동쪽 출구)' },
  west: { map: 'namsan', label: '남산 (서쪽 등산로)' },
});

export const gwanghwamun = makeField({
  id: 'gwanghwamun',
  name: '광화문 광장',
  year: 2017,
  hub: 'seoul-station-shelter',
  hubSpawn: 'fromEast',
  levelRange: [85, 95],
  style: 'towers',
  landmark: [{ rect: { x: 58, y: 28, w: 6, h: 3 }, tile: TILE.sewerWall, kind: 'wall' }], // 이순신 동상 기단
  zones: [
    { id: 'plaza_w', rect: { x: 6, y: 22, w: 44, h: 16 }, monsters: [{ id: 'guest_elite', weight: 4 }, { id: 'zombie_ancient', weight: 3 }, { id: 'parasite_spawn', weight: 2 }], maxAlive: 12, respawnSec: 18 },
    { id: 'plaza_e', rect: { x: 70, y: 22, w: 46, h: 16 }, monsters: [{ id: 'zombie_ancient', weight: 4 }, { id: 'guest_elite', weight: 3 }, { id: 'wito_drone', weight: 2 }], maxAlive: 12, respawnSec: 20 },
    { id: 'side', rect: { x: 18, y: 44, w: 86, h: 12 }, monsters: [{ id: 'parasite_horror', weight: 3 }, { id: 'guest_hunter', weight: 3 }], maxAlive: 8, respawnSec: 24 },
  ],
});

export const namsan = makeField({
  id: 'namsan',
  name: '남산 — 서울타워 부지',
  year: 2017,
  hub: 'seoul-station-shelter',
  hubSpawn: 'fromWest',
  levelRange: [90, 100],
  style: 'park',
  dark: true,
  landmark: [{ rect: { x: 58, y: 24, w: 6, h: 6 }, tile: TILE.concreteWall, kind: 'wall' }], // tower base
  zones: [
    { id: 'trail_w', rect: { x: 4, y: 20, w: 46, h: 20 }, monsters: [{ id: 'parasite_horror', weight: 4 }, { id: 'zombie_ancient', weight: 3 }], maxAlive: 10, respawnSec: 20 },
    { id: 'trail_e', rect: { x: 70, y: 20, w: 46, h: 20 }, monsters: [{ id: 'guest_elite', weight: 4 }, { id: 'parasite_horror', weight: 3 }], maxAlive: 10, respawnSec: 22 },
    { id: 'summit_raid', rect: { x: 48, y: 44, w: 24, h: 12 }, monsters: [{ id: 'the_wise_one', weight: 1 }], maxAlive: 1, respawnSec: 900 },
    { id: 'summit_guard', rect: { x: 20, y: 44, w: 80, h: 12 }, monsters: [{ id: 'guest_elite', weight: 3 }, { id: 'parasite_spawn', weight: 3 }], maxAlive: 8, respawnSec: 20 },
  ],
});

export const LATE_YEAR_MAPS: MapDef[] = [gangnamShelter, teheranRo, coexMall, yeouidoShelter, yeouidoPark, nationalAssembly, seoulStationShelter, gwanghwamun, namsan];
