import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/** 2002년 중곡역 — 중곡동 동쪽. 역사(驛舍)와 플랫폼, 앞 광장. 동쪽으로 아차산역. */
const W = 80;
const H = 50;

export const junggokStation: MapDef = {
  id: 'junggok-station',
  name: '중곡역',
  year: 2002,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  levelRange: [4, 9],
  fills: [
    // rails + platform along the north
    { rect: { x: 1, y: 1, w: W - 2, h: 5 }, tile: TILE.rail },
    { rect: { x: 1, y: 6, w: W - 2, h: 3 }, tile: TILE.platform },
    // station plaza (paving) south of the building
    { rect: { x: 12, y: 16, w: 56, h: 8 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 24, w: W - 2, h: 3 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 46, w: W - 2, h: 3 }, tile: TILE.sidewalk },
    // avenue centre line
    { rect: { x: 1, y: 36, w: W - 2, h: 1 }, tile: TILE.roadLine },
    ...[10, 40, 70].map((x) => ({ rect: { x, y: 27, w: 4, h: 1 }, tile: TILE.crosswalk })),
    ...[10, 40, 70].map((x) => ({ rect: { x, y: 45, w: 4, h: 1 }, tile: TILE.crosswalk })),
  ],
  obstacles: [
    // platform fence (gaps where the stairs come down)
    { rect: { x: 1, y: 9, w: 30, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 36, y: 9, w: 43, h: 1 }, tile: TILE.fence, kind: 'fence' },
    // station building
    { rect: { x: 16, y: 10, w: 48, h: 6 }, tile: TILE.buildingRoof, kind: 'building' },
    // shops along the south side of the avenue
    { rect: { x: 4, y: 38, w: 14, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 22, y: 38, w: 18, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 46, y: 38, w: 12, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 62, y: 38, w: 14, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
    // stalled bus and cars
    { rect: { x: 30, y: 30, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 52, y: 33, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 8, y: 31, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 70, y: 29, w: 1, h: 2 }, tile: TILE.car, kind: 'car' },
  ],
  decor: [
    { at: { x: 40, y: 18 }, tex: TEX.deco_sign },
    { at: { x: 20, y: 22 }, tex: TEX.deco_busstop, solid: true },
    { at: { x: 58, y: 22 }, tex: TEX.deco_busstop, solid: true },
    ...[14, 30, 48, 66].map((x) => ({ at: { x, y: 23 }, tex: TEX.deco_lamp, solid: true })),
    ...[6, 26, 44, 60, 76].map((x) => ({ at: { x, y: 46 }, tex: TEX.deco_lamp, solid: true })),
    { at: { x: 24, y: 17 }, tex: TEX.deco_vending, solid: true },
    { at: { x: 25, y: 17 }, tex: TEX.deco_vending, solid: true },
    { at: { x: 56, y: 17 }, tex: TEX.deco_phone, solid: true },
    { at: { x: 36, y: 17 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 12, y: 18 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 68, y: 18 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 46, y: 24 }, tex: TEX.deco_bench, solid: true },
  ],
  spawnZones: [
    {
      id: 'plaza',
      rect: { x: 12, y: 16, w: 56, h: 11 },
      monsters: [
        { id: 'zombie_suit_m', weight: 5 },
        { id: 'zombie_worker', weight: 3 },
        { id: 'zombie_casual_f', weight: 2 },
      ],
      maxAlive: 8,
      respawnSec: 18,
    },
    {
      id: 'avenue',
      rect: { x: 2, y: 28, w: 76, h: 9 },
      monsters: [
        { id: 'zombie_worker', weight: 4 },
        { id: 'zombie_stripe', weight: 3 },
        { id: 'zombie_dog', weight: 3 },
      ],
      maxAlive: 8,
      respawnSec: 20,
    },
    {
      id: 'platform',
      rect: { x: 2, y: 6, w: 76, h: 3 },
      monsters: [{ id: 'zombie_worker', weight: 1 }],
      maxAlive: 3,
      respawnSec: 30,
    },
  ],
  portals: [
    { id: 'toJunggok', rect: { x: 1, y: 28, w: 1, h: 8 }, toMap: 'junggok-dong', toSpawn: 'fromStation', label: '중곡동 거리 (서쪽)' },
    { id: 'toAchasan', rect: { x: 78, y: 28, w: 1, h: 8 }, toMap: 'achasan-station', toSpawn: 'fromJunggokStation', label: '아차산역 (동쌍)' },
  ],
  spawnPoints: {
    default: { x: 4, y: 32 },
    fromJunggok: { x: 4, y: 32 },
    fromAchasan: { x: 75, y: 32 },
  },
  safeZone: false,
};
