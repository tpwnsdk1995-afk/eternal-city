import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 어설트 C "하수도 심층 — 변종 오구린" 전용 맵. 아차산 하수도의 더 깊은 층: 제한 시간 안에 서쪽
 * 사다리에서 중앙 처리실까지 뚫고 들어가, 변종 오구린을 잡고, 동쪽 비상 사다리로 탈출한다.
 */
const W = 90;
const H = 40;

export const sewerDepths: MapDef = {
  id: 'sewer-depths',
  name: '하수도 심층',
  year: 2002,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.sewerFloor,
  borderTile: TILE.sewerWall,
  dark: true,
  fills: [],
  obstacles: [
    // outer wall masses
    { rect: { x: 1, y: 1, w: 88, h: 7 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 1, y: 32, w: 88, h: 7 }, tile: TILE.sewerWall, kind: 'wall' },
    // west approach: two corridors split by a water channel
    { rect: { x: 10, y: 8, w: 14, h: 8 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 10, y: 24, w: 14, h: 8 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 10, y: 18, w: 16, h: 4 }, tile: TILE.sewerWater, kind: 'wall' },
    // mid section: pump blocks
    { rect: { x: 30, y: 8, w: 10, h: 9 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 30, y: 23, w: 10, h: 9 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 44, y: 12, w: 4, h: 16 }, tile: TILE.sewerWall, kind: 'wall' },
    // central chamber ring (openings west at y 18..21 and east at y 18..21)
    { rect: { x: 52, y: 8, w: 22, h: 4 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 52, y: 28, w: 22, h: 4 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 52, y: 12, w: 2, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 52, y: 22, w: 2, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 72, y: 12, w: 2, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 72, y: 22, w: 2, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    // chamber pools
    { rect: { x: 58, y: 14, w: 3, h: 2 }, tile: TILE.sewerWater, kind: 'wall' },
    { rect: { x: 65, y: 24, w: 3, h: 2 }, tile: TILE.sewerWater, kind: 'wall' },
    // east extraction corridor walls
    { rect: { x: 76, y: 8, w: 12, h: 8 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 76, y: 24, w: 12, h: 8 }, tile: TILE.sewerWall, kind: 'wall' },
  ],
  decor: [
    { at: { x: 5, y: 12 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 27, y: 10 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 27, y: 30 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 50, y: 17 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 56, y: 13 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 70, y: 26 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 84, y: 17 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 6, y: 28 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 42, y: 30 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 86, y: 22 }, tex: TEX.deco_sign },
  ],
  zones: {
    entry: { x: 1, y: 8, w: 8, h: 24 },
    chamber: { x: 54, y: 12, w: 18, h: 16 },
    exit: { x: 82, y: 16, w: 7, h: 8 },
  },
  portals: [],
  spawnPoints: {
    default: { x: 4, y: 20 },
    entry: { x: 4, y: 20 },
    corridor_n: { x: 27, y: 11 },
    corridor_s: { x: 27, y: 29 },
    chamber_w: { x: 56, y: 20 },
    chamber_n: { x: 63, y: 13 },
    chamber_s: { x: 63, y: 26 },
    boss: { x: 67, y: 20 },
    exit_lane: { x: 78, y: 20 },
  },
  safeZone: false,
};
