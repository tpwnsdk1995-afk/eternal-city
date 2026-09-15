import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 2004년 테크노마트~올림픽대교 — 한강 북단 강변도로. 남쪽은 강, 북쪽은 테크노마트 블록,
 * 동쪽 끝에 올림픽대교 진입로. 좀비 군인·라바 군집·위토 엘리트 병력이 도로를 점거했다.
 */
const W = 110;
const H = 64;

export const technomartBridge: MapDef = {
  id: 'technomart-bridge',
  name: '테크노마트~올림픽대교',
  year: 2004,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  levelRange: [35, 48],
  fills: [
    // riverside: bank, bike lane, water along the south
    { rect: { x: 1, y: 46, w: W - 2, h: 3 }, tile: TILE.riverbank },
    { rect: { x: 1, y: 44, w: W - 2, h: 2 }, tile: TILE.bikeLane },
    { rect: { x: 1, y: 40, w: W - 2, h: 4 }, tile: TILE.grass },
    // sidewalks
    { rect: { x: 1, y: 16, w: W - 2, h: 3 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 37, w: W - 2, h: 3 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 27, w: W - 2, h: 1 }, tile: TILE.roadLine },
    ...[14, 40, 66, 92].map((x) => ({ rect: { x, y: 19, w: 2, h: 18 }, tile: TILE.crosswalk })),
    // bridge approach ramp (east)
    { rect: { x: 96, y: 19, w: 13, h: 18 }, tile: TILE.platform },
  ],
  obstacles: [
    // river (impassable)
    { rect: { x: 1, y: 49, w: W - 2, h: 14 }, tile: TILE.water, kind: 'wall' },
    // Technomart block and shops on the north side
    { rect: { x: 6, y: 3, w: 30, h: 13 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 42, y: 3, w: 22, h: 13 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 70, y: 3, w: 20, h: 13 }, tile: TILE.buildingRoof, kind: 'building' },
    // bridge pylons
    { rect: { x: 100, y: 20, w: 2, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 100, y: 33, w: 2, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
    // wrecked convoy
    { rect: { x: 20, y: 22, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 26, y: 30, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 48, y: 24, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 56, y: 32, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 76, y: 23, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 84, y: 31, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    // sandbags at the bridge checkpoint
    { rect: { x: 94, y: 21, w: 1, h: 4 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 94, y: 31, w: 1, h: 4 }, tile: TILE.concreteWall, kind: 'wall' },
  ],
  decor: [
    ...[10, 30, 50, 70, 90].flatMap((x) => [
      { at: { x, y: 18 }, tex: TEX.deco_lamp, solid: true },
      { at: { x: x + 8, y: 39 }, tex: TEX.deco_lamp, solid: true },
    ]),
    ...[8, 36, 64, 92].map((x) => ({ at: { x, y: 43 }, tex: TEX.deco_tree, solid: true })),
    { at: { x: 38, y: 18 }, tex: TEX.deco_busstop, solid: true },
    { at: { x: 66, y: 18 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 24, y: 39 }, tex: TEX.deco_bench, solid: true },
    { at: { x: 60, y: 39 }, tex: TEX.deco_bench, solid: true },
    { at: { x: 98, y: 18 }, tex: TEX.deco_sign },
    { at: { x: 44, y: 18 }, tex: TEX.deco_trash, solid: true },
  ],
  spawnZones: [
    {
      id: 'road_west',
      rect: { x: 4, y: 19, w: 44, h: 18 },
      monsters: [
        { id: 'zombie_soldier', weight: 4 },
        { id: 'larva', weight: 4 },
        { id: 'zombie_firefighter', weight: 1 },
      ],
      maxAlive: 10,
      respawnSec: 20,
    },
    {
      id: 'road_east',
      rect: { x: 50, y: 19, w: 44, h: 18 },
      monsters: [
        { id: 'zombie_soldier', weight: 3 },
        { id: 'wito_elite_trooper', weight: 3 },
        { id: 'wito_engineer', weight: 2 },
        { id: 'larva', weight: 2 },
      ],
      maxAlive: 10,
      respawnSec: 22,
    },
    {
      id: 'riverside',
      rect: { x: 4, y: 40, w: 100, h: 8 },
      monsters: [
        { id: 'larva', weight: 5 },
        { id: 'zombie_banshee', weight: 2 },
        { id: 'zombie_dog', weight: 1 },
      ],
      maxAlive: 8,
      respawnSec: 18,
    },
    {
      id: 'bridge_checkpoint',
      rect: { x: 96, y: 20, w: 12, h: 16 },
      monsters: [{ id: 'wito_elite_trooper', weight: 2 }, { id: 'wito_turret', weight: 1 }],
      maxAlive: 3,
      respawnSec: 45,
    },
  ],
  portals: [{ id: 'toShelter', rect: { x: 1, y: 24, w: 1, h: 6 }, toMap: 'technomart-shelter', toSpawn: 'fromBridge', label: '테크노마트 지하 쉼터' }],
  spawnPoints: {
    default: { x: 4, y: 27 },
    fromShelter: { x: 4, y: 27 },
    taxi: { x: 8, y: 38 },
  },
  npcs: [{ id: 'npc_taxi', at: { x: 6, y: 38 } }],
  safeZone: false,
};
