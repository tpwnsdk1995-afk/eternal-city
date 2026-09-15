import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 어설트 D "의정부 폐허 — 패러사이트 근절" 전용 맵 (2005). 폐허 지하로 파고든 GUEST의 둥지:
 * 뿌리 기물 4개를 부숴 격벽을 열고, 핵실(核室)의 패러사이트 루트를 제거한다.
 */
const W = 100;
const H = 50;

export const parasiteNest: MapDef = {
  id: 'parasite-nest',
  name: '의정부 폐허 — 패러사이트 둥지',
  year: 2005,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.dirt,
  borderTile: TILE.sewerWall,
  dark: true,
  fills: [
    { rect: { x: 1, y: 20, w: 40, h: 10 }, tile: TILE.sewerFloor },
    { rect: { x: 62, y: 8, w: 36, h: 34 }, tile: TILE.sewerFloor },
    { rect: { x: 44, y: 12, w: 14, h: 26 }, tile: TILE.dirt },
  ],
  obstacles: [
    // collapsed ruins framing the approach
    { rect: { x: 1, y: 1, w: 40, h: 17 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 1, y: 32, w: 40, h: 17 }, tile: TILE.buildingRoof, kind: 'building' },
    // nest antechamber walls (root nodes sit here)
    { rect: { x: 41, y: 1, w: 20, h: 9 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 41, y: 40, w: 20, h: 9 }, tile: TILE.sewerWall, kind: 'wall' },
    // membrane wall with the gate gap (GateDef)
    { rect: { x: 60, y: 10, w: 2, h: 10 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 60, y: 30, w: 2, h: 10 }, tile: TILE.sewerWall, kind: 'wall' },
    // core chamber pillars / pools
    { rect: { x: 70, y: 14, w: 2, h: 2 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 88, y: 34, w: 2, h: 2 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 66, y: 34, w: 4, h: 2 }, tile: TILE.sewerWater, kind: 'wall' },
    { rect: { x: 90, y: 12, w: 4, h: 2 }, tile: TILE.sewerWater, kind: 'wall' },
    { rect: { x: 1, y: 8, w: 98, h: 1 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 1, y: 41, w: 98, h: 1 }, tile: TILE.sewerWall, kind: 'wall' },
  ],
  objectives: [
    { id: 'root_1', kind: 'barricade', label: '뿌리 기물', at: { x: 46, y: 13 }, tex: TEX.root_node, hp: 320, size: { w: 2, h: 2 } },
    { id: 'root_2', kind: 'barricade', label: '뿌리 기물', at: { x: 54, y: 17 }, tex: TEX.root_node, hp: 320, size: { w: 2, h: 2 } },
    { id: 'root_3', kind: 'barricade', label: '뿌리 기물', at: { x: 46, y: 33 }, tex: TEX.root_node, hp: 320, size: { w: 2, h: 2 } },
    { id: 'root_4', kind: 'barricade', label: '뿌리 기물', at: { x: 54, y: 29 }, tex: TEX.root_node, hp: 320, size: { w: 2, h: 2 } },
  ],
  gates: [{ id: 'membrane', rect: { x: 60, y: 20, w: 2, h: 10 }, tile: TILE.gateClosed, opensWhen: ['root_1', 'root_2', 'root_3', 'root_4'] }],
  decor: [
    { at: { x: 6, y: 22 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 20, y: 28 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 36, y: 22 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 50, y: 24 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 66, y: 12 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 66, y: 38 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 94, y: 24 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 12, y: 21 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 30, y: 30 }, tex: TEX.deco_sign },
  ],
  zones: {
    approach: { x: 1, y: 18, w: 40, h: 14 },
    antechamber: { x: 42, y: 10, w: 18, h: 30 },
    core: { x: 62, y: 9, w: 36, h: 32 },
  },
  portals: [],
  spawnPoints: {
    default: { x: 4, y: 25 },
    entry: { x: 4, y: 25 },
    approach_n: { x: 30, y: 21 },
    approach_s: { x: 30, y: 29 },
    ante_n: { x: 50, y: 12 },
    ante_s: { x: 50, y: 37 },
    core_n: { x: 80, y: 11 },
    core_s: { x: 80, y: 38 },
    boss: { x: 84, y: 25 },
  },
  safeZone: false,
};
