import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

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
  ],
  obstacles: [
    // support pillars
    ...[8, 16, 24, 32].flatMap((x) => [8, 15, 22].map((y) => ({ rect: { x, y, w: 1, h: 1 }, tile: TILE.parkingPillar, kind: 'pillar' as const }))),
    // a few parked cars
    { rect: { x: 5, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 13, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 29, y: 25, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
  ],
  decor: [
    { at: { x: 34, y: 4 }, tex: TEX.pickup_item }, // 자판기 자리 (placeholder decor)
  ],
  portals: [
    { id: 'toField', rect: { x: 37, y: 13, w: 2, h: 4 }, toMap: 'junggok-dong', toSpawn: 'fromParking', label: '중곡동 거리로' },
  ],
  spawnPoints: {
    default: { x: 20, y: 12 },
    fromField: { x: 35, y: 15 },
  },
  npcs: [
    { id: 'npc_elia', at: { x: 12, y: 5 } },
    { id: 'npc_shop', at: { x: 20, y: 5 } },
    { id: 'npc_assault', at: { x: 28, y: 5 } },
  ],
  safeZone: true,
};
