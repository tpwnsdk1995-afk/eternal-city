import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 2005년 필드 3곳. 서울과 외곽이 함락된 뒤의 풍경 — 무너진 블록, 잿빛 흙, GUEST가 순찰하는 거리.
 */

/** 무너진 건물 블록: 지붕 일부만 남고 나머지는 잔해(dirt)로 표현 */
const ruinBlock = (x: number, y: number, w: number, h: number) => [
  { rect: { x, y, w: Math.ceil(w / 2), h }, tile: TILE.buildingRoof, kind: 'building' as const },
  { rect: { x: x + Math.ceil(w / 2) + 1, y: y + 1, w: Math.max(1, Math.floor(w / 2) - 1), h: Math.max(1, h - 2) }, tile: TILE.concreteWall, kind: 'wall' as const },
];

export const uijeongbuRuins: MapDef = {
  id: 'uijeongbu-ruins',
  name: '의정부 폐허',
  year: 2005,
  width: 110,
  height: 70,
  tileSize: 32,
  groundTile: TILE.dirt,
  borderTile: TILE.concreteWall,
  levelRange: [45, 58],
  fills: [
    { rect: { x: 1, y: 30, w: 108, h: 10 }, tile: TILE.asphalt },
    { rect: { x: 1, y: 35, w: 108, h: 1 }, tile: TILE.roadLine },
    { rect: { x: 50, y: 1, w: 8, h: 68 }, tile: TILE.asphalt },
    { rect: { x: 30, y: 44, w: 50, h: 20 }, tile: TILE.sidewalk },
    ...[16, 40, 66, 90].map((x) => ({ rect: { x, y: 30, w: 2, h: 10 }, tile: TILE.crosswalk })),
  ],
  obstacles: [
    ...ruinBlock(4, 6, 18, 12),
    ...ruinBlock(28, 8, 16, 12),
    ...ruinBlock(62, 6, 18, 12),
    ...ruinBlock(86, 8, 18, 12),
    ...ruinBlock(4, 46, 16, 14),
    ...ruinBlock(86, 46, 18, 14),
    // town square remains
    { rect: { x: 40, y: 50, w: 6, h: 6 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 64, y: 50, w: 6, h: 6 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 22, y: 33, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 74, y: 37, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 100, y: 32, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 10, y: 24, w: 30, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 70, y: 24, w: 30, h: 1 }, tile: TILE.fence, kind: 'fence' },
  ],
  decor: [
    ...[8, 30, 60, 84, 104].map((x) => ({ at: { x, y: 29 }, tex: TEX.deco_lamp, solid: true })),
    ...[12, 36, 72, 96].map((x) => ({ at: { x, y: 40 }, tex: TEX.deco_lamp, solid: true })),
    ...[26, 48, 82].map((x) => ({ at: { x, y: 3 }, tex: TEX.deco_tree, solid: true })),
    { at: { x: 54, y: 46 }, tex: TEX.deco_sign },
    { at: { x: 34, y: 45 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 76, y: 45 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 6, y: 41 }, tex: TEX.deco_busstop, solid: true },
  ],
  spawnZones: [
    { id: 'road', rect: { x: 4, y: 30, w: 102, h: 10 }, monsters: [{ id: 'guest_scout', weight: 4 }, { id: 'zombie_soldier', weight: 3 }, { id: 'guest_warrior', weight: 2 }], maxAlive: 10, respawnSec: 22 },
    { id: 'north_ruins', rect: { x: 4, y: 2, w: 100, h: 22 }, monsters: [{ id: 'larva', weight: 4 }, { id: 'zombie_soldier', weight: 3 }, { id: 'guest_scout', weight: 2 }], maxAlive: 10, respawnSec: 20 },
    { id: 'square', rect: { x: 30, y: 44, w: 50, h: 20 }, monsters: [{ id: 'guest_warrior', weight: 3 }, { id: 'guest_scout', weight: 3 }, { id: 'wito_elite_trooper', weight: 1 }], maxAlive: 8, respawnSec: 26 },
  ],
  portals: [{ id: 'toShelter', rect: { x: 1, y: 32, w: 1, h: 6 }, toMap: 'uijeongbu-ruins-shelter', toSpawn: 'fromRuins', label: '의정부 폐허 대피소' }],
  spawnPoints: { default: { x: 4, y: 35 }, fromShelter: { x: 4, y: 35 }, taxi: { x: 8, y: 41 } },
  npcs: [{ id: 'npc_taxi', at: { x: 10, y: 41 } }],
  safeZone: false,
};

export const jongnoRuins: MapDef = {
  id: 'jongno-ruins',
  name: '종로 폐허',
  year: 2005,
  width: 120,
  height: 60,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  levelRange: [48, 60],
  fills: [
    { rect: { x: 1, y: 18, w: 118, h: 4 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 38, w: 118, h: 4 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 29, w: 118, h: 1 }, tile: TILE.roadLine },
    { rect: { x: 54, y: 22, w: 14, h: 16 }, tile: TILE.dirt },
    ...[18, 38, 58, 78, 98].map((x) => ({ rect: { x, y: 4, w: 6, h: 12 }, tile: TILE.dirt })),
    ...[18, 38, 58, 78, 98].map((x) => ({ rect: { x, y: 44, w: 6, h: 12 }, tile: TILE.dirt })),
    ...[21, 63, 103].map((x) => ({ rect: { x, y: 22, w: 2, h: 16 }, tile: TILE.crosswalk })),
  ],
  obstacles: [
    ...[4, 24, 44, 64, 84, 104].flatMap((x) => ruinBlock(x, 4, 14, 12)),
    ...[4, 24, 44, 64, 84, 104].flatMap((x) => ruinBlock(x, 44, 14, 12)),
    { rect: { x: 59, y: 27, w: 4, h: 4 }, tile: TILE.sewerWall, kind: 'wall' }, // collapsed 보신각
    { rect: { x: 12, y: 24, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 30, y: 33, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 72, y: 34, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 90, y: 26, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 36, y: 22, w: 1, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 84, y: 35, w: 1, h: 3 }, tile: TILE.concreteWall, kind: 'wall' },
  ],
  decor: [
    ...[8, 48, 88].flatMap((x) => [
      { at: { x, y: 21 }, tex: TEX.deco_lamp, solid: true },
      { at: { x: x + 6, y: 38 }, tex: TEX.deco_lamp, solid: true },
    ]),
    { at: { x: 61, y: 25 }, tex: TEX.deco_sign },
    { at: { x: 26, y: 20 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 100, y: 20 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 10, y: 20 }, tex: TEX.deco_busstop, solid: true },
  ],
  spawnZones: [
    { id: 'west', rect: { x: 6, y: 22, w: 44, h: 16 }, monsters: [{ id: 'guest_scout', weight: 4 }, { id: 'zombie_police', weight: 2 }, { id: 'zombie_firefighter', weight: 2 }, { id: 'zombie_soldier', weight: 2 }], maxAlive: 10, respawnSec: 20 },
    { id: 'east', rect: { x: 70, y: 22, w: 46, h: 16 }, monsters: [{ id: 'guest_warrior', weight: 4 }, { id: 'guest_scout', weight: 3 }, { id: 'wito_turret', weight: 1 }], maxAlive: 9, respawnSec: 24 },
    { id: 'alleys', rect: { x: 18, y: 4, w: 86, h: 12 }, monsters: [{ id: 'larva', weight: 4 }, { id: 'zombie_soldier', weight: 3 }], maxAlive: 7, respawnSec: 22 },
    { id: 'plaza_boss', rect: { x: 54, y: 22, w: 14, h: 16 }, monsters: [{ id: 'zombie_fire_chief', weight: 1 }], maxAlive: 1, respawnSec: 240 },
  ],
  portals: [{ id: 'toShelter', rect: { x: 1, y: 22, w: 1, h: 6 }, toMap: 'uijeongbu-ruins-shelter', toSpawn: 'fromJongnoRuins', label: '수송차 — 의정부 폐허 대피소' }],
  spawnPoints: { default: { x: 4, y: 25 }, fromShelter: { x: 4, y: 25 }, taxi: { x: 8, y: 40 } },
  npcs: [{ id: 'npc_taxi', at: { x: 6, y: 40 } }],
  safeZone: false,
};

export const ilsanWaterway: MapDef = {
  id: 'ilsan-waterway',
  name: '일산 지하수로',
  year: 2005,
  width: 100,
  height: 44,
  tileSize: 32,
  groundTile: TILE.sewerFloor,
  borderTile: TILE.sewerWall,
  dark: true,
  levelRange: [50, 62],
  fills: [],
  obstacles: [
    { rect: { x: 1, y: 1, w: 98, h: 7 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 1, y: 36, w: 98, h: 7 }, tile: TILE.sewerWall, kind: 'wall' },
    // central channel with two crossings
    { rect: { x: 12, y: 19, w: 28, h: 5 }, tile: TILE.sewerWater, kind: 'wall' },
    { rect: { x: 46, y: 19, w: 42, h: 5 }, tile: TILE.sewerWater, kind: 'wall' },
    // pump rooms
    { rect: { x: 20, y: 8, w: 12, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 56, y: 8, w: 12, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 20, y: 30, w: 12, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    { rect: { x: 70, y: 30, w: 12, h: 6 }, tile: TILE.sewerWall, kind: 'wall' },
    // train depot at the far end (차량기지)
    { rect: { x: 90, y: 9, w: 3, h: 10 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 90, y: 25, w: 3, h: 10 }, tile: TILE.car, kind: 'car' },
  ],
  decor: [
    ...[6, 40, 76].flatMap((x) => [
      { at: { x, y: 10 }, tex: TEX.deco_lamp, solid: true },
      { at: { x: x + 4, y: 33 }, tex: TEX.deco_lamp, solid: true },
    ]),
    { at: { x: 50, y: 17 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 86, y: 22 }, tex: TEX.deco_sign },
  ],
  spawnZones: [
    { id: 'north_walk', rect: { x: 4, y: 8, w: 84, h: 10 }, monsters: [{ id: 'larva', weight: 6 }, { id: 'guest_scout', weight: 3 }, { id: 'zombie_hardened', weight: 2 }], maxAlive: 10, respawnSec: 16 },
    { id: 'south_walk', rect: { x: 4, y: 25, w: 84, h: 10 }, monsters: [{ id: 'larva', weight: 5 }, { id: 'guest_warrior', weight: 3 }, { id: 'zombie_soldier', weight: 2 }], maxAlive: 10, respawnSec: 18 },
    { id: 'depot', rect: { x: 84, y: 9, w: 14, h: 26 }, monsters: [{ id: 'guest_warrior', weight: 3 }, { id: 'ogurin_mutant', weight: 1 }], maxAlive: 4, respawnSec: 120 },
  ],
  portals: [{ id: 'toShelter', rect: { x: 2, y: 20, w: 2, h: 3 }, toMap: 'uijeongbu-ruins-shelter', toSpawn: 'fromIlsan', label: '갱도 — 의정부 폐허 대피소' }],
  spawnPoints: { default: { x: 6, y: 21 }, fromShelter: { x: 6, y: 21 } },
  safeZone: false,
};
