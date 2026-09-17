import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/** 2004년 테크노마트 지하 쉼터 — 강변역 지하 상가를 개조한 2004년의 안전지역. */
export const technomartShelter: MapDef = {
  id: 'technomart-shelter',
  name: '테크노마트 지하 쉼터',
  year: 2004,
  width: 46,
  height: 28,
  tileSize: 32,
  groundTile: TILE.schoolFloor,
  borderTile: TILE.concreteWall,
  fills: [
    { rect: { x: 1, y: 12, w: 44, h: 4 }, tile: TILE.sidewalk },
    { rect: { x: 21, y: 1, w: 4, h: 26 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 24, w: 44, h: 3 }, tile: TILE.platform },
  ],
  obstacles: [
    // shuttered shop fronts
    { rect: { x: 3, y: 3, w: 6, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 12, y: 3, w: 6, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 28, y: 3, w: 6, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 37, y: 3, w: 6, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 3, y: 19, w: 6, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 37, y: 19, w: 6, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    // escalator core
    { rect: { x: 12, y: 18, w: 4, h: 4 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 30, y: 18, w: 4, h: 4 }, tile: TILE.concreteWall, kind: 'wall' },
    ...[9, 36].flatMap((x) => [9, 17].map((y) => ({ rect: { x, y, w: 1, h: 1 }, tile: TILE.parkingPillar, kind: 'pillar' as const }))),
  ],
  decor: [
    ...[9, 36].flatMap((x) => [9, 17].map((y) => ({ at: { x, y }, tex: TEX.deco_pillar }))),
    { at: { x: 19, y: 8 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 26, y: 8 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 5, y: 10 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 40, y: 10 }, tex: TEX.deco_phone, solid: true },
    { at: { x: 22, y: 18 }, tex: TEX.deco_sign },
    { at: { x: 16, y: 25 }, tex: TEX.deco_bench, solid: true },
    { at: { x: 28, y: 25 }, tex: TEX.deco_bench, solid: true },
  ],
  portals: [
    { id: 'toBridge', rect: { x: 43, y: 12, w: 2, h: 4 }, toMap: 'technomart-bridge', toSpawn: 'fromShelter', label: '강변 도로로 (동쪽 출구)' },
    { id: 'toUijeongbu', rect: { x: 1, y: 12, w: 2, h: 4 }, toMap: 'uijeongbu', toSpawn: 'fromShelter', label: '의정부행 수송 트럭 (서쪽 출구)' },
  ],
  spawnPoints: {
    default: { x: 23, y: 13 },
    parallel: { x: 23, y: 13 },
    fromBridge: { x: 41, y: 13 },
    fromUijeongbu: { x: 4, y: 13 },
    taxi: { x: 23, y: 23 },
  },
  npcs: [
    { id: 'npc_parallel', at: { x: 23, y: 9 } },
    { id: 'npc_shop', at: { x: 11, y: 13 } },
    { id: 'npc_tech', at: { x: 15, y: 13 } },
    { id: 'npc_elia', at: { x: 31, y: 13 } },
    { id: 'npc_assault', at: { x: 35, y: 13 } },
    { id: 'npc_blackmarket', at: { x: 7, y: 11 } },
    { id: 'npc_taxi', at: { x: 25, y: 23 } },
    { id: 'npc_cybershop', at: { x: 40, y: 13 } },
    { id: 'npc_mainstream', at: { x: 27, y: 13 } },
  ],
  safeZone: true,
};
