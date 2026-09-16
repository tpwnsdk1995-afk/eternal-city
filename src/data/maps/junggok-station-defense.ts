import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 어설트 B "중곡역 부스 방어" 전용 맵. 역 앞 광장 한가운데 조합 부스(3시 부스)가 서 있고,
 * 서쪽 진입로에서 정찰대를 걷어낸 뒤 부스로 달려가 공수부대의 파상 공세를 막아 낸다.
 * 진입(서) → 광장(부스) ; 적 스폰: 남/북 골목, 동쪽 역사 계단.
 */
const W = 70;
const H = 44;

export const junggokStationDefense: MapDef = {
  id: 'junggok-station-defense',
  name: '중곡역 앞 광장 (봉쇄)',
  year: 2002,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.asphalt,
  borderTile: TILE.concreteWall,
  fills: [
    // rails + platform along the north edge
    { rect: { x: 1, y: 1, w: W - 2, h: 4 }, tile: TILE.rail },
    { rect: { x: 1, y: 5, w: W - 2, h: 3 }, tile: TILE.platform },
    // the plaza
    { rect: { x: 22, y: 14, w: 36, h: 18 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 40, w: W - 2, h: 3 }, tile: TILE.sidewalk },
    { rect: { x: 1, y: 36, w: W - 2, h: 1 }, tile: TILE.roadLine },
    ...[10, 62].map((x) => ({ rect: { x, y: 33, w: 4, h: 1 }, tile: TILE.crosswalk })),
    // approach road from the west entry
    { rect: { x: 1, y: 20, w: 21, h: 6 }, tile: TILE.asphalt },
  ],
  obstacles: [
    // station building with the stair gap in the middle (east spawn comes down here)
    { rect: { x: 1, y: 8, w: 30, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 36, y: 8, w: 33, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 12, y: 9, w: 20, h: 5 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 38, y: 9, w: 24, h: 5 }, tile: TILE.buildingRoof, kind: 'building' },
    // west approach walls (funnel)
    { rect: { x: 1, y: 14, w: 20, h: 5 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 1, y: 27, w: 20, h: 6 }, tile: TILE.buildingRoof, kind: 'building' },
    // south shops with two alleys (spawn lanes) at x 30 and x 50
    { rect: { x: 4, y: 37, w: 24, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 32, y: 37, w: 16, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 52, y: 37, w: 14, h: 3 }, tile: TILE.buildingRoof, kind: 'building' },
    // cover on the plaza
    { rect: { x: 28, y: 18, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 50, y: 27, w: 2, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 26, y: 28, w: 3, h: 1 }, tile: TILE.concreteWall, kind: 'wall' },
    { rect: { x: 52, y: 17, w: 3, h: 1 }, tile: TILE.concreteWall, kind: 'wall' },
    // east side: closed shutter wall, one gap for the east lane
    { rect: { x: 62, y: 14, w: 7, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 62, y: 26, w: 7, h: 8 }, tile: TILE.buildingRoof, kind: 'building' },
  ],
  objectives: [
    // 3시 부스 — the thing to keep standing
    { id: 'booth_3', kind: 'booth', label: '3시 부스', at: { x: 39, y: 21 }, tex: TEX.booth, hp: 900, size: { w: 2, h: 2 } },
  ],
  decor: [
    { at: { x: 40, y: 15 }, tex: TEX.deco_sign },
    ...[24, 34, 46, 56].map((x) => ({ at: { x, y: 31 }, tex: TEX.deco_lamp, solid: true })),
    ...[6, 26, 44, 60].map((x) => ({ at: { x, y: 41 }, tex: TEX.deco_lamp, solid: true })),
    { at: { x: 30, y: 15 }, tex: TEX.deco_vending, solid: true },
    { at: { x: 48, y: 15 }, tex: TEX.deco_phone, solid: true },
    { at: { x: 36, y: 30 }, tex: TEX.deco_bench, solid: true },
    { at: { x: 44, y: 30 }, tex: TEX.deco_bench, solid: true },
    { at: { x: 24, y: 15 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 56, y: 15 }, tex: TEX.deco_tree, solid: true },
    { at: { x: 8, y: 41 }, tex: TEX.deco_trash, solid: true },
  ],
  zones: {
    approach: { x: 1, y: 19, w: 21, h: 8 },
    plaza: { x: 22, y: 14, w: 40, h: 18 },
    /** within ~6 tiles of the booth */
    booth: { x: 33, y: 15, w: 14, h: 14 },
  },
  portals: [],
  spawnPoints: {
    default: { x: 3, y: 23 },
    entry: { x: 3, y: 23 },
    recon_w: { x: 10, y: 22 },
    recon_alley_s: { x: 30, y: 38 },
    alley_s1: { x: 30, y: 38 },
    alley_s2: { x: 49, y: 38 },
    stairs_e: { x: 33, y: 9 },
    lane_e: { x: 66, y: 23 },
    boss: { x: 66, y: 23 },
  },
  safeZone: false,
  ambient: 'dusk',
};
