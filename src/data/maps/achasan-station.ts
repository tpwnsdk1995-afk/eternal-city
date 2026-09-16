import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/** 2002년 아차산역 — 중곡역 동쪽. 역 광장 아래로 하수도 입구가 열려 있다. */
const W = 70;
const H = 50;

export const achasanStation: MapDef = {
  id: 'achasan-station',
  name: '아차산역',
  year: 2002,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  levelRange: [7, 12],
  fills: [
    { rect: { x: 1, y: 1, w: W - 2, h: 4 }, tile: TILE.rail },
    { rect: { x: 1, y: 5, w: W - 2, h: 3 }, tile: TILE.platform },
    { rect: { x: 8, y: 14, w: 54, h: 9 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 23, w: W - 2, h: 2 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 44, w: W - 2, h: 5 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 34, w: W - 2, h: 1 }, tile: TILE.roadLine },
    // sewer entrance pit (visual) — the actual portal sits on the grate
    { rect: { x: 50, y: 40, w: 6, h: 4 }, tile: TILE.sewerFloor },
    ...[8, 34, 58].map((x) => ({ rect: { x, y: 25, w: 4, h: 1 }, tile: TILE.crosswalk })),
  ],
  obstacles: [
    { rect: { x: 1, y: 8, w: 26, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 32, y: 8, w: 37, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 12, y: 9, w: 46, h: 5 }, tile: TILE.buildingRoof, kind: 'building' },
    // south blocks
    { rect: { x: 4, y: 36, w: 16, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 24, y: 36, w: 20, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 58, y: 36, w: 9, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
    // sewer pit walls (open on the north side)
    { rect: { x: 49, y: 40, w: 1, h: 5 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 56, y: 40, w: 1, h: 5 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 49, y: 44, w: 8, h: 1 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 20, y: 29, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 44, y: 31, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 62, y: 27, w: 1, h: 2 }, tile: TILE.car, kind: 'car' },
  ],
  decor: [
    { at: { x: 35, y: 16 }, tex: TEX.deco_sign },
    { at: { x: 16, y: 22 }, tex: TEX.deco_busstop, solid: true },
    ...[10, 30, 50].map((x) => ({ at: { x, y: 22 }, tex: TEX.deco_lamp, solid: true })),
    ...[6, 26, 46, 64].map((x) => ({ at: { x, y: 45 }, tex: TEX.deco_lamp, solid: true })),
    { at: { x: 40, y: 15 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 54, y: 15 }, tex: TEX.deco_phone, solid: true },
    { at: { x: 52, y: 39 }, tex: TEX.deco_sign },
    { at: { x: 8, y: 16 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 60, y: 16 }, tex: TEX.deco_tree, solid: true },
  ],
  spawnZones: [
    {
      id: 'plaza',
      rect: { x: 8, y: 14, w: 54, h: 11 },
      monsters: [
        { id: 'zombie_worker', weight: 4 },
        { id: 'zombie_stripe', weight: 3 },
        { id: 'zombie_suit_m', weight: 2 },
      ],
      maxAlive: 8,
      respawnSec: 18,
    },
    {
      id: 'avenue',
      rect: { x: 2, y: 26, w: 66, h: 9 },
      monsters: [
        { id: 'zombie_hardened', weight: 2 },
        { id: 'zombie_worker', weight: 3 },
        { id: 'zombie_banshee', weight: 1 },
        { id: 'zombie_dog', weight: 2 },
      ],
      maxAlive: 8,
      respawnSec: 22,
    },
  ],
  portals: [
    { id: 'toJunggokStation', rect: { x: 1, y: 26, w: 1, h: 8 }, toMap: 'junggok-station', toSpawn: 'fromAchasan', label: '중곡역 (서쪽)' },
    { id: 'toSewer', rect: { x: 52, y: 42, w: 2, h: 2 }, toMap: 'sewer', toSpawn: 'entrance', label: '하수도 입구' },
  ],
  spawnPoints: {
    default: { x: 4, y: 30 },
    fromJunggokStation: { x: 4, y: 30 },
    fromSewer: { x: 52, y: 39 },
    taxi: { x: 8, y: 24 },
  },
  npcs: [
    { id: 'npc_taxi', at: { x: 6, y: 24 } },
    // 하수도 입구 옆 그늘 — 불법무기·철갑탄·Slug
    { id: 'npc_blackmarket', at: { x: 47, y: 42 } },
  ],
  safeZone: false,
  ambient: 'dusk',
};
