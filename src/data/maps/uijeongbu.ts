import type { MapDef } from '../schema/map';
import { TEX, TILE } from '../textureKeys';

/**
 * 2004년 의정부 — 서울 북쪽 외곽. 논밭과 비포장 도로, 폐허가 된 읍내. 땅속에는 **몽골리안
 * 데스웜**이 도사려 라바 군집을 토해 낸다. 2004년의 레이드 필드.
 */
const W = 120;
const H = 80;

export const uijeongbu: MapDef = {
  id: 'uijeongbu',
  name: '의정부 외곽',
  year: 2004,
  width: W,
  height: H,
  tileSize: 32,
  groundTile: TILE.dirt,
  borderTile: TILE.concreteWall,
  levelRange: [40, 55],
  fills: [
    // paddies and grass
    { rect: { x: 4, y: 4, w: 40, h: 26 }, tile: TILE.grass },
    { rect: { x: 76, y: 6, w: 40, h: 22 }, tile: TILE.grass },
    { rect: { x: 4, y: 50, w: 36, h: 26 }, tile: TILE.grass },
    { rect: { x: 80, y: 52, w: 36, h: 24 }, tile: TILE.grass },
    // the county road (asphalt) crossing the map
    { rect: { x: 1, y: 36, w: W - 2, h: 8 }, tile: TILE.asphalt },
    { rect: { x: 1, y: 40, w: W - 2, h: 1 }, tile: TILE.roadLine },
    { rect: { x: 58, y: 1, w: 6, h: W }, tile: TILE.asphalt },
    // town square
    { rect: { x: 46, y: 46, w: 30, h: 20 }, tile: TILE.sidewalk },
    // irrigation ditches
    { rect: { x: 10, y: 30, w: 100, h: 1 }, tile: TILE.riverbank },
  ],
  obstacles: [
    // ruined town blocks
    { rect: { x: 48, y: 48, w: 8, h: 6 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 66, y: 48, w: 8, h: 6 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 48, y: 58, w: 8, h: 6 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 66, y: 58, w: 8, h: 6 }, tile: TILE.buildingRoof, kind: 'building' },
    // farmhouses
    { rect: { x: 10, y: 10, w: 6, h: 4 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 30, y: 18, w: 6, h: 4 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 90, y: 10, w: 8, h: 5 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 12, y: 60, w: 6, h: 4 }, tile: TILE.buildingRoof, kind: 'building' },
    { rect: { x: 96, y: 62, w: 8, h: 5 }, tile: TILE.buildingRoof, kind: 'building' },
    // ponds
    { rect: { x: 22, y: 26, w: 8, h: 3 }, tile: TILE.water, kind: 'wall' },
    { rect: { x: 100, y: 30, w: 10, h: 3 }, tile: TILE.water, kind: 'wall' },
    // fences along the paddies
    { rect: { x: 4, y: 33, w: 50, h: 1 }, tile: TILE.fence, kind: 'fence' },
    { rect: { x: 68, y: 33, w: 48, h: 1 }, tile: TILE.fence, kind: 'fence' },
    // wrecked trucks on the road
    { rect: { x: 20, y: 38, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
    { rect: { x: 86, y: 41, w: 4, h: 1 }, tile: TILE.car, kind: 'car' },
  ],
  decor: [
    ...[8, 28, 48, 72, 92, 110].map((x) => ({ at: { x, y: 35 }, tex: TEX.deco_lamp, solid: true })),
    ...[6, 18, 40, 84, 104].map((x) => ({ at: { x, y: 8 }, tex: TEX.deco_tree, solid: true })),
    ...[8, 26, 44, 82, 100, 112].map((x) => ({ at: { x, y: 70 }, tex: TEX.deco_tree, solid: true })),
    { at: { x: 60, y: 46 }, tex: TEX.deco_sign },
    { at: { x: 58, y: 56 }, tex: TEX.deco_vending, solid: true, interact: 'vending' },
    { at: { x: 62, y: 56 }, tex: TEX.deco_phone, solid: true },
    { at: { x: 52, y: 66 }, tex: TEX.deco_bench, solid: true },
    { at: { x: 70, y: 66 }, tex: TEX.deco_trash, solid: true },
    { at: { x: 4, y: 42 }, tex: TEX.deco_busstop, solid: true },
  ],
  spawnZones: [
    {
      id: 'road',
      rect: { x: 4, y: 36, w: 112, h: 8 },
      monsters: [
        { id: 'zombie_soldier', weight: 4 },
        { id: 'wito_elite_trooper', weight: 2 },
        { id: 'wito_engineer', weight: 2 },
      ],
      maxAlive: 10,
      respawnSec: 22,
    },
    {
      id: 'paddies_nw',
      rect: { x: 4, y: 4, w: 40, h: 26 },
      monsters: [
        { id: 'larva', weight: 6 },
        { id: 'zombie_soldier', weight: 2 },
      ],
      maxAlive: 10,
      respawnSec: 16,
    },
    {
      id: 'paddies_ne',
      rect: { x: 76, y: 6, w: 40, h: 22 },
      monsters: [
        { id: 'larva', weight: 5 },
        { id: 'zombie_banshee', weight: 2 },
        { id: 'zombie_firefighter', weight: 1 },
      ],
      maxAlive: 9,
      respawnSec: 18,
    },
    {
      id: 'town',
      rect: { x: 46, y: 46, w: 30, h: 20 },
      monsters: [
        { id: 'zombie_soldier', weight: 3 },
        { id: 'wito_elite_trooper', weight: 3 },
      ],
      maxAlive: 7,
      respawnSec: 24,
    },
    {
      id: 'deathworm_field',
      rect: { x: 4, y: 50, w: 36, h: 26 },
      monsters: [{ id: 'mongolian_deathworm', weight: 1 }],
      maxAlive: 1,
      respawnSec: 600,
    },
    {
      id: 'deathworm_larvae',
      rect: { x: 4, y: 50, w: 36, h: 26 },
      monsters: [{ id: 'larva', weight: 1 }],
      maxAlive: 5,
      respawnSec: 20,
    },
  ],
  portals: [{ id: 'toShelter', rect: { x: 1, y: 37, w: 1, h: 6 }, toMap: 'technomart-shelter', toSpawn: 'fromUijeongbu', label: '수송 트럭 — 테크노마트 쉼터로' }],
  spawnPoints: {
    default: { x: 4, y: 39 },
    fromShelter: { x: 4, y: 39 },
    taxi: { x: 8, y: 45 },
  },
  npcs: [{ id: 'npc_taxi', at: { x: 6, y: 45 } }],
  safeZone: false,
};
