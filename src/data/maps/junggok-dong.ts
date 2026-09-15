import type { MapDef } from '../schema/map';
import { TILE } from '../textureKeys';

const BLOCK_W = 14;
const BLOCK_H = 12;
const COLS = [8, 30, 52, 74];
const ROWS = [8, 28, 48];

const buildings = COLS.flatMap((x) => ROWS.map((y) => ({ x, y })));

/** 2002년 중곡동 거리 — 첫 사냥터. 격자형 건물 블록 사이의 도로, 남서쪽에 구청 지하주차장 입구. */
export const junggokDong: MapDef = {
  id: 'junggok-dong',
  name: '중곡동 거리',
  year: 2002,
  width: 100,
  height: 80,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  fills: [
    // sidewalk ring around every block
    ...buildings.map((b) => ({ rect: { x: b.x - 1, y: b.y - 1, w: BLOCK_W + 2, h: BLOCK_H + 2 }, tile: TILE.sidewalk })),
    // road center lines on the vertical streets
    ...[4, 26, 48, 70, 92].map((x) => ({ rect: { x, y: 2, w: 1, h: 76 }, tile: TILE.roadLine })),
    // small park with grass in the south-east
    { rect: { x: 60, y: 64, w: 30, h: 12 }, tile: TILE.grass },
    // parking floor marker in front of the 구청 entrance
    { rect: { x: 2, y: 72, w: 6, h: 6 }, tile: TILE.parkingFloor },
  ],
  obstacles: [
    ...buildings.map((b) => ({ rect: { x: b.x, y: b.y, w: BLOCK_W, h: BLOCK_H }, tile: TILE.buildingRoof, kind: 'building' as const })),
    // abandoned cars on the streets
    { rect: { x: 25, y: 14, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 47, y: 34, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 69, y: 22, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 26, y: 54, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 40, y: 66, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 12, y: 44, w: 1, h: 2 }, tile: TILE.car, kind: 'car' },
    // fence around the park
    { rect: { x: 59, y: 63, w: 32, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 59, y: 76, w: 12, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 79, y: 76, w: 12, h: 1 }, tile: TILE.fence, kind: 'fence' },
  ],
  spawnZones: [
    {
      id: 'north',
      rect: { x: 4, y: 3, w: 92, h: 22 },
      monsters: [
        { id: 'zombie_casual_f', weight: 6 },
        { id: 'zombie_suit_m', weight: 2 },
      ],
      maxAlive: 8,
      respawnSec: 18,
    },
    {
      id: 'middle',
      rect: { x: 4, y: 26, w: 92, h: 22 },
      monsters: [
        { id: 'zombie_suit_m', weight: 4 },
        { id: 'zombie_stripe', weight: 3 },
        { id: 'zombie_casual_f', weight: 2 },
      ],
      maxAlive: 8,
      respawnSec: 20,
    },
    {
      id: 'park',
      rect: { x: 56, y: 50, w: 40, h: 26 },
      monsters: [
        { id: 'zombie_stripe', weight: 4 },
        { id: 'zombie_banshee', weight: 2 },
      ],
      maxAlive: 6,
      respawnSec: 24,
    },
  ],
  portals: [
    { id: 'toParking', rect: { x: 1, y: 74, w: 2, h: 4 }, toMap: 'gwangjin-gucheong-parking', toSpawn: 'fromField', label: '광진구청 지하주차장' },
  ],
  spawnPoints: {
    default: { x: 6, y: 72 },
    fromParking: { x: 6, y: 72 },
  },
  safeZone: false,
};
