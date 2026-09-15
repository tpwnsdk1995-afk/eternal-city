import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 어설트 A "중곡동 봉쇄선 돌파" 전용 맵. 서→동으로 진행하는 선형 구조:
 * 1구역(정찰대) → 바리케이드 3개 파괴 시 게이트 개방 → 2구역(공수부대) → 보스 아레나(좀비두목).
 */
export const junggokBlockade: MapDef = {
  id: 'junggok-blockade',
  name: '중곡동 봉쇄선',
  year: 2002,
  width: 100,
  height: 40,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  fills: [
    { rect: { x: 1, y: 1, w: 98, h: 3 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 36, w: 98, h: 3 }, tile: TILE.sidewalk },
    { rect: { x: 50, y: 4, w: 1, h: 32 }, tile: TILE.roadLine },
    { rect: { x: 72, y: 4, w: 27, h: 32 }, tile: TILE.dirt },
  ],
  obstacles: [
    // cover in stage 1
    { rect: { x: 10, y: 10, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 12, y: 28, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 22, y: 6, w: 3, h: 1 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 22, y: 33, w: 3, h: 1 }, tile: TILE.concreteWall, kind: 'wall' },
    // blockade wall with the gate gap (the gate itself is a GateDef)
    { rect: { x: 31, y: 1, w: 2, h: 13 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 31, y: 26, w: 2, h: 13 }, tile: TILE.concreteWall, kind: 'wall' },
    // cover in stage 2
    { rect: { x: 40, y: 12, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 44, y: 26, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 58, y: 8, w: 1, h: 4 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 58, y: 28, w: 1, h: 4 }, tile: TILE.concreteWall, kind: 'wall' },
    // boss arena entrance pillars
    { rect: { x: 71, y: 1, w: 1, h: 10 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 71, y: 29, w: 1, h: 10 }, tile: TILE.concreteWall, kind: 'wall' },
  ],
  objectives: [
    { id: 'barricade_1', at: { x: 27, y: 12 }, tex: TEX.barricade, hp: 150, size: { w: 2, h: 2 } },
    { id: 'barricade_2', at: { x: 27, y: 19 }, tex: TEX.barricade, hp: 150, size: { w: 2, h: 2 } },
    { id: 'barricade_3', at: { x: 27, y: 26 }, tex: TEX.barricade, hp: 150, size: { w: 2, h: 2 } },
  ],
  gates: [
    { id: 'gate_1', rect: { x: 31, y: 14, w: 2, h: 12 }, tile: TILE.gateClosed, opensWhen: ['barricade_1', 'barricade_2', 'barricade_3'] },
  ],
  zones: {
    stage1: { x: 1, y: 1, w: 30, h: 38 },
    stage2: { x: 33, y: 1, w: 38, h: 38 },
    bossArena: { x: 72, y: 1, w: 27, h: 38 },
  },
  portals: [],
  spawnPoints: {
    default: { x: 4, y: 20 },
    entry: { x: 4, y: 20 },
    recon_n: { x: 26, y: 6 },
    recon_s: { x: 26, y: 33 },
    airborne_1: { x: 48, y: 6 },
    airborne_2: { x: 48, y: 33 },
    airborne_3: { x: 66, y: 20 },
    bossSpawn: { x: 90, y: 20 },
    boss_adds: { x: 80, y: 6 },
  },
  safeZone: false,
};
