import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 2002년 평창동 — 부촌 주택가, 택시로만 갈 수 있다. 담장으로 나뉜 골목, 강화 좀비·밴시·위토 정찰대.
 * 권장 레벨 15+.
 */
const W = 80;
const H = 60;

const houses: { x: number; y: number; w: number; h: number }[] = [
  { x: 6, y: 6, w: 12, h: 8 },
  { x: 24, y: 6, w: 14, h: 8 },
  { x: 46, y: 5, w: 12, h: 9 },
  { x: 62, y: 7, w: 12, h: 7 },
  { x: 5, y: 24, w: 14, h: 9 },
  { x: 28, y: 26, w: 10, h: 7 },
  { x: 44, y: 24, w: 14, h: 9 },
  { x: 62, y: 26, w: 12, h: 8 },
  { x: 8, y: 44, w: 12, h: 8 },
  { x: 26, y: 44, w: 14, h: 8 },
  { x: 46, y: 45, w: 12, h: 7 },
  { x: 62, y: 44, w: 12, h: 8 },
];

export const pyeongchangDong: MapDef = {
  id: 'pyeongchang-dong',
  name: '평창동',
  year: 2002,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  levelRange: [15, 22],
  fills: [
    // sidewalks around each house lot
    ...houses.map((b) => ({ rect: { x: b.x - 1, y: b.y - 1, w: b.w + 2, h: b.h + 2 }, tile: TILE.sidewalk })),
    // garden strips
    ...houses.map((b) => ({ rect: { x: b.x - 1, y: b.y + b.h, w: b.w + 2, h: 2 }, tile: TILE.grass })),
    { rect: { x: 40, y: 2, w: 1, h: 56 }, tile: TILE.roadLine },
    { rect: { x: 2, y: 20, w: 76, h: 1 }, tile: TILE.roadLine },
    { rect: { x: 2, y: 40, w: 76, h: 1 }, tile: TILE.roadLine },
    // taxi stand paving at the south gate
    { rect: { x: 36, y: 54, w: 9, h: 5 }, tile: TILE.sidewalk },
  ],
  obstacles: [
    ...houses.map((b) => ({ rect: b, tile: TILE.buildingRoof, kind: 'building' as const })),
    // garden walls (with gaps at the gates)
    ...houses.flatMap((b) => [
      { rect: { x: b.x - 1, y: b.y + b.h + 2, w: Math.floor(b.w / 2), h: 1 }, tile: TILE.concreteWall, kind: 'wall' as const },
      { rect: { x: b.x + Math.floor(b.w / 2) + 2, y: b.y + b.h + 2, w: b.w - Math.floor(b.w / 2), h: 1 }, tile: TILE.concreteWall, kind: 'wall' as const },
    ]),
    { rect: { x: 20, y: 18, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 58, y: 38, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 41, y: 30, w: 1, h: 2 }, tile: TILE.car, kind: 'car' },
  ],
  decor: [
    ...houses.map((b) => ({ at: { x: b.x + b.w + 1, y: b.y + b.h + 1 }, tex: TEX.deco_tree, solid: true })),
    ...[10, 30, 50, 70].flatMap((x) => [19, 39].map((y) => ({ at: { x, y }, tex: TEX.deco_lamp, solid: true }))),
    { at: { x: 44, y: 56 }, tex: TEX.deco_sign },
    { at: { x: 37, y: 55 }, tex: TEX.deco_bench, solid: true },
  ],
  spawnZones: [
    {
      id: 'north',
      rect: { x: 2, y: 15, w: 76, h: 8 },
      monsters: [
        { id: 'zombie_hardened', weight: 4 },
        { id: 'zombie_banshee', weight: 2 },
        { id: 'zombie_worker', weight: 2 },
      ],
      maxAlive: 8,
      respawnSec: 20,
    },
    {
      id: 'middle',
      rect: { x: 2, y: 35, w: 76, h: 8 },
      monsters: [
        { id: 'zombie_hardened', weight: 4 },
        { id: 'wito_recon', weight: 2 },
        { id: 'zombie_banshee', weight: 2 },
      ],
      maxAlive: 8,
      respawnSec: 22,
    },
    {
      id: 'alleys',
      rect: { x: 2, y: 2, w: 76, h: 12 },
      monsters: [
        { id: 'zombie_hardened', weight: 3 },
        { id: 'wito_airborne', weight: 1 },
      ],
      maxAlive: 5,
      respawnSec: 26,
    },
  ],
  portals: [],
  spawnPoints: {
    default: { x: 40, y: 56 },
    taxi: { x: 40, y: 56 },
  },
  npcs: [{ id: 'npc_taxi', at: { x: 42, y: 55 } }],
  safeZone: false,
};
