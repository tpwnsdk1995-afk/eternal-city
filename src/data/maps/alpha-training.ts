import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 알파 훈련장 — 광진구청 지하주차장 옆 시험 사격장. 새 헌터가 이동·사격·창 열기를 익히는 곳.
 * 울타리 안에 좀비견만 풀려 있고, 교관이 첫 퀘스트를 준다. 출구 램프가 지하주차장으로 이어진다.
 */
export const alphaTraining: MapDef = {
  id: 'alpha-training',
  name: '알파 훈련장',
  year: 2002,
  width: 36,
  height: 24,
  tileSize: 32,
  groundTile: TILE.parkingFloor,
  borderTile: TILE.concreteWall,
  levelRange: [1, 3],
  fills: [
    { rect: { x: 2, y: 2, w: 10, h: 20 }, tile: TILE.sidewalk }, // briefing area
    { rect: { x: 13, y: 3, w: 21, h: 18 }, tile: TILE.dirt }, // the yard
    ...[16, 22, 28].map((x) => ({ rect: { x, y: 6, w: 1, h: 12 }, tile: TILE.parkingStripe })),
  ],
  obstacles: [
    { rect: { x: 12, y: 2, w: 1, h: 8 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 12, y: 14, w: 1, h: 8 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 19, y: 9, w: 2, h: 1 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 26, y: 14, w: 2, h: 1 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 30, y: 8, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
  ],
  decor: [
    { at: { x: 4, y: 5 }, tex: TEX.deco_sign },
    { at: { x: 8, y: 20 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 4, y: 20 }, tex: TEX.deco_bench, solid: true },
    { at: { x: 14, y: 4 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 32, y: 4 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 14, y: 20 }, tex: TEX.deco_lamp, solid: true },
    { at: { x: 32, y: 20 }, tex: TEX.deco_lamp, solid: true },
  ],
  spawnZones: [{ id: 'yard', rect: { x: 15, y: 5, w: 18, h: 14 }, monsters: [{ id: 'zombie_dog', weight: 1 }], maxAlive: 3, respawnSec: 6 }],
  portals: [{ id: 'toParking', rect: { x: 2, y: 22, w: 10, h: 1 }, toMap: 'gwangjin-gucheong-parking', toSpawn: 'default', label: '광진구청 지하주차장 (램프)' }],
  spawnPoints: { default: { x: 6, y: 8 }, fromParking: { x: 6, y: 20 } },
  npcs: [{ id: 'npc_trainer', at: { x: 6, y: 11 } }],
  safeZone: false,
  ambient: 'dusk',
};
