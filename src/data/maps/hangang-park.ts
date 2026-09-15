import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/** 2002년 한강공원 — 중곡동 남쪽. 강변 자전거도로와 잔디밭, 밴시가 출몰한다. */
const W = 100;
const H = 50;

export const hangangPark: MapDef = {
  id: 'hangang-park',
  name: '한강공원',
  year: 2002,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.grass,
  borderTile: TILE.concreteWall,
  levelRange: [4, 8],
  fills: [
    // entry road from 중곡동 (north edge)
    { rect: { x: 1, y: 1, w: W - 2, h: 4 }, tile: TILE.asphalt },
    { rect: { x: 1, y: 2, w: W - 2, h: 1 }, tile: TILE.roadLine },
    { rect: { x: 1, y: 5, w: W - 2, h: 2 }, tile: TILE.sidewalk },
    // bike lane along the river
    { rect: { x: 1, y: 36, w: W - 2, h: 2 }, tile: TILE.bikeLane },
    // riverbank + water (south)
    { rect: { x: 1, y: 40, w: W - 2, h: 1 }, tile: TILE.riverbank },
    // paved plaza with 편의점 stand-in
    { rect: { x: 40, y: 12, w: 20, h: 10 }, tile: TILE.sidewalk },
    { rect: { x: 8, y: 26, w: 12, h: 6 }, tile: TILE.dirt },
    { rect: { x: 74, y: 24, w: 14, h: 7 }, tile: TILE.dirt },
  ],
  obstacles: [
    // the Han river
    { rect: { x: 1, y: 41, w: W - 2, h: 8 }, tile: TILE.water, kind: 'wall' },
    // kiosk building on the plaza
    { rect: { x: 46, y: 13, w: 8, h: 4 }, tile: TILE.buildingRoof, kind: 'building' },
    // fences around a closed playground
    { rect: { x: 7, y: 25, w: 14, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 7, y: 32, w: 5, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 16, y: 32, w: 5, h: 1 }, tile: TILE.fence, kind: 'fence' },
    // abandoned cars on the entry road
    { rect: { x: 20, y: 3, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 70, y: 1, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
  ],
  decor: [
    ...[6, 18, 30, 62, 78, 92].map((x) => ({ at: { x, y: 10 }, tex: TEX.deco_tree, solid: true })),
    ...[12, 28, 66, 84].map((x) => ({ at: { x, y: 34 }, tex: TEX.deco_tree, solid: true })),
    ...[10, 34, 58, 82].map((x) => ({ at: { x, y: 38 }, tex: TEX.deco_bench, solid: true })),
    ...[4, 24, 44, 64, 84].map((x) => ({ at: { x, y: 39 }, tex: TEX.deco_lamp, solid: true })),
    { at: { x: 42, y: 20 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 43, y: 20 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 56, y: 20 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 50, y: 6 }, tex: TEX.deco_sign },
    { at: { x: 58, y: 14 }, tex: TEX.deco_phone, solid: true },
  ],
  spawnZones: [
    {
      id: 'lawn_west',
      rect: { x: 2, y: 8, w: 36, h: 26 },
      monsters: [
        { id: 'zombie_dog', weight: 5 },
        { id: 'zombie_stripe', weight: 3 },
        { id: 'zombie_casual_f', weight: 2 },
      ],
      maxAlive: 8,
      respawnSec: 16,
    },
    {
      id: 'lawn_east',
      rect: { x: 62, y: 8, w: 36, h: 26 },
      monsters: [
        { id: 'zombie_stripe', weight: 4 },
        { id: 'zombie_banshee', weight: 3 },
      ],
      maxAlive: 7,
      respawnSec: 22,
    },
    {
      id: 'riverside',
      rect: { x: 2, y: 35, w: 96, h: 5 },
      monsters: [
        { id: 'zombie_banshee', weight: 2 },
        { id: 'zombie_dog', weight: 3 },
      ],
      maxAlive: 5,
      respawnSec: 24,
    },
  ],
  portals: [{ id: 'toJunggok', rect: { x: 58, y: 1, w: 5, h: 1 }, toMap: 'junggok-dong', toSpawn: 'fromHangang', label: '중곡동 거리 (북쪽)' }],
  spawnPoints: {
    default: { x: 60, y: 4 },
    fromJunggok: { x: 60, y: 4 },
    taxi: { x: 54, y: 6 },
  },
  npcs: [{ id: 'npc_taxi', at: { x: 52, y: 6 } }],
  safeZone: false,
};
