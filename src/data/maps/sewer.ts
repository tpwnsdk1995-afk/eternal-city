import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 2002년 하수도 — 아차산역 아래. 어둡고 좁은 통로, 강화 좀비, 그리고 깊숙한 방에 네임드 **오구린**.
 * Walkways run along two channels; the water itself is impassable.
 */
const W = 90;
const H = 40;

export const sewer: MapDef = {
  id: 'sewer',
  name: '하수도',
  year: 2002,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.sewerFloor,
  borderTile: TILE.sewerWall,
  dark: true,
  levelRange: [9, 14],
  fills: [],
  obstacles: [
    // thick wall masses to carve corridors
    { rect: { x: 1, y: 1, w: 88, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 1, y: 33, w: 88, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 12, y: 7, w: 10, h: 10 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 12, y: 23, w: 10, h: 10 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 30, y: 7, w: 26, h: 8 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 30, y: 25, w: 26, h: 8 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 62, y: 7, w: 6, h: 26 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 68, y: 7, w: 20, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 68, y: 27, w: 20, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    // water channels (impassable) with walkways either side
    { rect: { x: 24, y: 17, w: 36, h: 4 }, tile: TILE.sewerWater, kind: 'wall' },
    { rect: { x: 4, y: 18, w: 6, h: 2 }, tile: TILE.sewerWater, kind: 'wall' },
    // boss chamber inner pillars
    { rect: { x: 74, y: 17, w: 2, h: 2 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 82, y: 21, w: 2, h: 2 }, tile: TILE.sewerWall, kind: 'wall' },
  ],
  decor: [
    { at: { x: 6, y: 9 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 27, y: 22 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 58, y: 15 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 70, y: 15 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 8, y: 30 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 40, y: 23 }, tex: TEX.deco_trash, solid: true },
  ],
  spawnZones: [
    {
      id: 'west',
      rect: { x: 2, y: 7, w: 26, h: 26 },
      monsters: [
        { id: 'zombie_hardened', weight: 3 },
        { id: 'zombie_stripe', weight: 2 },
        { id: 'zombie_dog', weight: 2 },
      ],
      maxAlive: 6,
      respawnSec: 24,
    },
    {
      id: 'channels',
      rect: { x: 24, y: 15, w: 38, h: 10 },
      monsters: [
        { id: 'zombie_hardened', weight: 4 },
        { id: 'zombie_banshee', weight: 1 },
      ],
      maxAlive: 6,
      respawnSec: 26,
    },
    {
      id: 'lair',
      rect: { x: 70, y: 13, w: 18, h: 14 },
      monsters: [{ id: 'ogurin', weight: 1 }],
      maxAlive: 1,
      respawnSec: 150,
    },
    {
      id: 'lair_guards',
      rect: { x: 70, y: 13, w: 18, h: 14 },
      monsters: [{ id: 'zombie_hardened', weight: 1 }],
      maxAlive: 3,
      respawnSec: 40,
    },
  ],
  portals: [{ id: 'toAchasan', rect: { x: 2, y: 12, w: 2, h: 2 }, toMap: 'achasan-station', toSpawn: 'fromSewer', label: '아차산역으로 (계단)' }],
  spawnPoints: {
    default: { x: 5, y: 13 },
    entrance: { x: 5, y: 13 },
  },
  safeZone: false,
};
