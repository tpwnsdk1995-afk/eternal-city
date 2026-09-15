import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/** 2003년 종로 지하 대피소 — 종각역 지하 통로를 막아 만든 2003년의 안전지역. */
export const jongnoShelter: MapDef = {
  id: 'jongno-shelter',
  name: '종로 지하 대피소',
  year: 2003,
  width: 44,
  height: 26,
  tileSize: 32,
  groundTile: TILE.platform,
  borderTile: TILE.concreteWall,
  fills: [
    { rect: { x: 1, y: 1, w: 42, h: 3 }, tile: TILE.rail },
    { rect: { x: 1, y: 4, w: 42, h: 2 }, tile: TILE.sidewalk },
    { rect: { x: 20, y: 6, w: 4, h: 19 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 14, w: 42, h: 3 }, tile: TILE.sidewalk },
  ],
  obstacles: [
    // ticket gates and kiosks
    { rect: { x: 6, y: 8, w: 4, h: 2 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 34, y: 8, w: 4, h: 2 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 6, y: 20, w: 4, h: 2 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 34, y: 20, w: 4, h: 2 }, tile: TILE.concreteWall, kind: 'wall' },
    // support pillars
    ...[12, 30].flatMap((x) => [7, 12, 19].map((y) => ({ rect: { x, y, w: 1, h: 1 }, tile: TILE.parkingPillar, kind: 'pillar' as const }))),
    // barricaded platform edge (stairs to the street at the east end)
    { rect: { x: 1, y: 6, w: 38, h: 1 }, tile: TILE.fence, kind: 'fence' },
  ],
  decor: [
    ...[12, 30].flatMap((x) => [7, 12, 19].map((y) => ({ at: { x, y }, tex: TEX.deco_pillar }))),
    { at: { x: 16, y: 9 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 17, y: 9 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 26, y: 9 }, tex: TEX.deco_phone, solid: true },
    { at: { x: 3, y: 12 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 40, y: 12 }, tex: TEX.deco_sign },
    { at: { x: 14, y: 22 }, tex: TEX.deco_bench, solid: true },
    { at: { x: 26, y: 22 }, tex: TEX.deco_bench, solid: true },
  ],
  portals: [{ id: 'toStreet', rect: { x: 39, y: 4, w: 4, h: 2 }, toMap: 'jongno-street', toSpawn: 'fromShelter', label: '종로거리로 (계단)' }],
  spawnPoints: {
    default: { x: 22, y: 12 },
    parallel: { x: 22, y: 12 },
    fromStreet: { x: 38, y: 7 },
    taxi: { x: 22, y: 21 },
  },
  npcs: [
    { id: 'npc_parallel', at: { x: 22, y: 8 } },
    { id: 'npc_shop', at: { x: 10, y: 12 } },
    { id: 'npc_tech', at: { x: 14, y: 12 } },
    { id: 'npc_elia', at: { x: 28, y: 12 } },
    { id: 'npc_assault', at: { x: 34, y: 12 } },
    { id: 'npc_taxi', at: { x: 24, y: 21 } },
    { id: 'npc_cybershop', at: { x: 38, y: 12 } },
    { id: 'npc_mainstream', at: { x: 18, y: 12 } },
  ],
  safeZone: true,
};
