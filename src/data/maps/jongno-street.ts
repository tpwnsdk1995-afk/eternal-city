import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 2003년 종로거리 — 보신각에서 종로3가까지 이어지는 대로. 도심 블록 사이의 골목, 광장,
 * 방치된 버스 정류장. 좀비화된 경찰·소방대와 W.I.T.O 워킹 터렛이 대로를 장악했다.
 */
const W = 120;
const H = 60;

/** north and south building rows leave the wide avenue (y 22..37) open */
const northBlocks = [4, 24, 44, 64, 84, 104].map((x) => ({ rect: { x, y: 4, w: 14, h: 12 }, tile: TILE.buildingRoof, kind: 'building' as const }));
const southBlocks = [4, 24, 44, 64, 84, 104].map((x) => ({ rect: { x, y: 44, w: 14, h: 12 }, tile: TILE.buildingRoof, kind: 'building' as const }));

export const jongnoStreet: MapDef = {
  id: 'jongno-street',
  name: '종로거리',
  year: 2003,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  levelRange: [25, 38],
  fills: [
    // sidewalks along the avenue and around the blocks
    { rect: { x: 1, y: 18, w: W - 2, h: 4 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 38, w: W - 2, h: 4 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 2, w: W - 2, h: 2 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 56, w: W - 2, h: 3 }, tile: TILE.sidewalk },
    // 보신각 plaza in the middle
    { rect: { x: 54, y: 22, w: 14, h: 16 }, tile: TILE.sidewalk },
    // lane markings
    { rect: { x: 1, y: 29, w: W - 2, h: 1 }, tile: TILE.roadLine },
    ...[21, 41, 63, 83, 103].map((x) => ({ rect: { x, y: 22, w: 2, h: 16 }, tile: TILE.crosswalk })),
    // alleys between blocks (north/south) are dirt-stained
    ...[18, 38, 58, 78, 98].map((x) => ({ rect: { x, y: 4, w: 6, h: 12 }, tile: TILE.dirt })),
    ...[18, 38, 58, 78, 98].map((x) => ({ rect: { x, y: 44, w: 6, h: 12 }, tile: TILE.dirt })),
  ],
  obstacles: [
    ...northBlocks,
    ...southBlocks,
    // 보신각 pavilion base
    { rect: { x: 59, y: 27, w: 4, h: 4 }, tile: TILE.concreteWall, kind: 'wall' },
    // stalled buses and cars on the avenue
    { rect: { x: 12, y: 24, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 30, y: 33, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 47, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 72, y: 34, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 90, y: 26, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 108, y: 32, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    // sandbag walls where the turrets dug in
    { rect: { x: 84, y: 22, w: 1, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 84, y: 35, w: 1, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 36, y: 22, w: 1, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 36, y: 35, w: 1, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
  ],
  decor: [
    ...[8, 28, 48, 68, 88, 108].flatMap((x) => [
      { at: { x, y: 21 }, tex: TEX.deco_lamp, solid: true },
      { at: { x: x + 6, y: 38 }, tex: TEX.deco_lamp, solid: true },
    ]),
    { at: { x: 10, y: 20 }, tex: TEX.deco_busstop, solid: true },
    { at: { x: 96, y: 39 }, tex: TEX.deco_busstop, solid: true },
    { at: { x: 56, y: 24 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 65, y: 24 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 56, y: 35 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 65, y: 35 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 61, y: 25 }, tex: TEX.deco_sign },
    { at: { x: 26, y: 20 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 76, y: 39 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 40, y: 20 }, tex: TEX.deco_phone, solid: true },
    { at: { x: 100, y: 20 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 14, y: 39 }, tex: TEX.deco_hydrant, solid: true },
    { at: { x: 58, y: 38 }, tex: TEX.deco_bench, solid: true },
  ],
  spawnZones: [
    {
      id: 'west_avenue',
      rect: { x: 6, y: 22, w: 44, h: 16 },
      monsters: [
        { id: 'zombie_police', weight: 4 },
        { id: 'zombie_hardened', weight: 2 },
        { id: 'zombie_firefighter', weight: 2 },
      ],
      maxAlive: 9,
      respawnSec: 20,
    },
    {
      id: 'east_avenue',
      rect: { x: 70, y: 22, w: 46, h: 16 },
      monsters: [
        { id: 'zombie_police', weight: 3 },
        { id: 'wito_engineer', weight: 3 },
        { id: 'zombie_firefighter', weight: 2 },
        { id: 'zombie_banshee', weight: 1 },
      ],
      maxAlive: 9,
      respawnSec: 22,
    },
    {
      id: 'turret_west',
      rect: { x: 34, y: 23, w: 4, h: 14 },
      monsters: [{ id: 'wito_turret', weight: 1 }],
      maxAlive: 1,
      respawnSec: 60,
    },
    {
      id: 'turret_east',
      rect: { x: 82, y: 23, w: 4, h: 14 },
      monsters: [{ id: 'wito_turret', weight: 1 }],
      maxAlive: 1,
      respawnSec: 60,
    },
    {
      id: 'alleys_north',
      rect: { x: 18, y: 4, w: 86, h: 12 },
      monsters: [
        { id: 'zombie_firefighter', weight: 2 },
        { id: 'zombie_police', weight: 2 },
        { id: 'zombie_dog', weight: 2 },
      ],
      maxAlive: 6,
      respawnSec: 26,
    },
    {
      id: 'plaza_boss',
      rect: { x: 54, y: 22, w: 14, h: 16 },
      monsters: [{ id: 'zombie_fire_chief', weight: 1 }],
      maxAlive: 1,
      respawnSec: 180,
    },
  ],
  portals: [{ id: 'toShelter', rect: { x: 1, y: 22, w: 1, h: 6 }, toMap: 'jongno-shelter', toSpawn: 'fromStreet', label: '종로 지하 대피소 (계단)' }],
  spawnPoints: {
    default: { x: 4, y: 25 },
    fromShelter: { x: 4, y: 25 },
    taxi: { x: 8, y: 40 },
  },
  npcs: [{ id: 'npc_taxi', at: { x: 6, y: 40 } }],
  safeZone: false,
};
