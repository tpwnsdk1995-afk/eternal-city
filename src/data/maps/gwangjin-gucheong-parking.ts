import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

const PILLAR_X = [8, 16, 24, 32];
const PILLAR_Y = [8, 15, 22];

/** 2002년 광진구청 지하주차장 — 시작 안전지역 / 부활 지점. */
export const gwangjinParking: MapDef = {
  id: 'gwangjin-gucheong-parking',
  name: '광진구청 지하주차장',
  year: 2002,
  width: 40,
  height: 30,
  tileSize: 32,
  groundTile: TILE.parkingFloor,
  borderTile: TILE.concreteWall,
  fills: [
    // parking stripes along two aisles (visual only)
    ...Array.from({ length: 8 }, (_, i) => ({ rect: { x: 4 + i * 4, y: 24, w: 1, h: 4 }, tile: TILE.parkingStripe })),
    ...Array.from({ length: 8 }, (_, i) => ({ rect: { x: 4 + i * 4, y: 12, w: 1, h: 3 }, tile: TILE.parkingStripe })),
    // painted lane toward the exit ramp
    { rect: { x: 34, y: 18, w: 4, h: 1 }, tile: TILE.parkingStripe },
  ],
  obstacles: [
    // support pillars
    ...PILLAR_X.flatMap((x) => PILLAR_Y.map((y) => ({ rect: { x, y, w: 1, h: 1 }, tile: TILE.parkingPillar, kind: 'pillar' as const }))),
    // parked cars between the stripes
    { rect: { x: 5, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 9, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 13, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 25, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 29, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 5, y: 13, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 13, y: 13, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 29, y: 13, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    // ticket booth wall near the ramp
    { rect: { x: 34, y: 8, w: 3, h: 1 }, tile: TILE.concreteWall, kind: 'wall' },
  ],
  decor: [
    // tall pillar sprites standing on the pillar tiles (tile is already solid)
    ...PILLAR_X.flatMap((x) => PILLAR_Y.map((y) => ({ at: { x, y }, tex: TEX.deco_pillar }))),
    { at: { x: 34, y: 4 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 35, y: 4 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 5, y: 4 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 36, y: 12 }, tex: TEX.deco_sign },
    { at: { x: 2, y: 20 }, tex: TEX.deco_phone, solid: true },
    // ceiling fluorescents (drawn flat on the floor plane; the scene adds a cold glow pool under each)
    ...[6, 12, 18, 24, 30].flatMap((x) => [6, 11, 18].map((y) => ({ at: { x, y }, tex: TEX.deco_fluorescent }))),
    { at: { x: 30, y: 21 }, tex: TEX.deco_barrier, solid: true },
    { at: { x: 6, y: 23 }, tex: TEX.deco_trashbags },
  ],
  portals: [
    { id: 'toField', rect: { x: 37, y: 13, w: 2, h: 4 }, toMap: 'junggok-dong', toSpawn: 'fromParking', label: '중곡동 거리로' },
  ],
  spawnPoints: {
    default: { x: 20, y: 12 },
    fromField: { x: 35, y: 15 },
    taxi: { x: 33, y: 21 },
  },
  npcs: [
    { id: 'npc_elia', at: { x: 12, y: 5 } },
    { id: 'npc_shop', at: { x: 20, y: 5 } },
    { id: 'npc_tech', at: { x: 24, y: 5 } },
    { id: 'npc_mainstream', at: { x: 18, y: 12 } },
    { id: 'npc_storage', at: { x: 14, y: 12 } },
    { id: 'npc_parallel', at: { x: 30, y: 12 } },
    { id: 'npc_cybershop', at: { x: 8, y: 19 } },
    { id: 'npc_blackmarket', at: { x: 4, y: 19 } },
    { id: 'npc_assault', at: { x: 28, y: 5 } },
    { id: 'npc_taxi', at: { x: 35, y: 21 } },
  ],
  safeZone: true,
  ambient: 'indoor',
};
