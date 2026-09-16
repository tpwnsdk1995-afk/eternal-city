import type { GateDef, MapDef, ObjectiveDef, Rect } from '@data/schema/map';
import { TILE } from '@data/textureKeys';
import { CollisionGrid } from './collisionGrid';

export interface BuiltMap {
  def: MapDef;
  tiles: Uint16Array; // tile id per cell, row-major
  collision: CollisionGrid;
  solidTileIds: number[];
}

function forRect(r: Rect, def: MapDef, fn: (x: number, y: number) => void): void {
  const x0 = Math.max(0, r.x);
  const y0 = Math.max(0, r.y);
  const x1 = Math.min(def.width, r.x + r.w);
  const y1 = Math.min(def.height, r.y + r.h);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) fn(x, y);
}

/** Rasterizes a rule-based MapDef into a tile array plus a collision grid. Pure; no Phaser. */
export function buildMap(def: MapDef): BuiltMap {
  const tiles = new Uint16Array(def.width * def.height).fill(def.groundTile);
  const collision = new CollisionGrid(def.width, def.height, def.tileSize);
  const solid = new Set<number>([def.borderTile]);
  const set = (x: number, y: number, tile: number, blocked: boolean) => {
    tiles[y * def.width + x] = tile;
    collision.setBlocked(x, y, blocked);
  };

  for (const f of def.fills ?? []) {
    forRect(f.rect, def, (x, y) => set(x, y, f.tile, !!f.solid));
    if (f.solid) solid.add(f.tile);
  }
  for (const o of def.obstacles) {
    forRect(o.rect, def, (x, y) => set(x, y, o.tile, true));
    solid.add(o.tile);
  }
  for (const g of def.gates ?? []) {
    forRect(g.rect, def, (x, y) => set(x, y, g.tile, true));
    solid.add(g.tile);
  }
  for (const obj of def.objectives ?? []) {
    forRect({ x: obj.at.x, y: obj.at.y, w: obj.size.w, h: obj.size.h }, def, (x, y) => collision.setBlocked(x, y, true));
  }
  for (const d of def.decor ?? []) if (d.solid) collision.setBlocked(d.at.x, d.at.y, true);
  // border ring
  for (let x = 0; x < def.width; x++) {
    set(x, 0, def.borderTile, true);
    set(x, def.height - 1, def.borderTile, true);
  }
  for (let y = 0; y < def.height; y++) {
    set(0, y, def.borderTile, true);
    set(def.width - 1, y, def.borderTile, true);
  }

  const built: BuiltMap = { def, tiles, collision, solidTileIds: [...solid] };
  decorateTiles(built);
  return built;
}

/** Cheap deterministic hash in [0, 1000) for per-cell variation. */
export function cellHash(x: number, y: number, salt = 0): number {
  let h = (x * 73856093) ^ (y * 19349663) ^ (salt * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) % 1000;
}

const ROAD_TILES = new Set<number>([TILE.asphalt, TILE.roadLine, TILE.crosswalk, TILE.roadDash, TILE.asphaltCrack, TILE.manhole, TILE.asphaltWet, TILE.car, TILE.parkingFloor]);
const CAR_SETS: number[][] = [
  [TILE.car, TILE.carL, TILE.carR, TILE.carT, TILE.carB],
  [TILE.car2, TILE.car2L, TILE.car2R, TILE.car2T, TILE.car2B],
  [TILE.car3, TILE.car3L, TILE.car3R, TILE.car3T, TILE.car3B],
  [TILE.car4, TILE.car4L, TILE.car4R, TILE.car4T, TILE.car4B],
];
const SHOP_TILES = [TILE.wallShop1, TILE.wallShop2, TILE.wallShop3, TILE.wallShop4, TILE.wallShop5, TILE.wallShop6];

/**
 * Visual-only pass: swaps base tiles for variants (cracks, manholes, puddles, oil stains), gives
 * sidewalks a kerb where they meet the road and tactile pavers by crossings, turns the
 * street-facing row of a building into shopfronts with brick corner piers, sprinkles rooftop
 * details, and splits multi-tile cars into coloured halves. Collision is untouched; new solid ids
 * are appended for the tilemap layer.
 */
export function decorateTiles(built: BuiltMap): void {
  const { def, tiles } = built;
  const W = def.width;
  const H = def.height;
  const at = (x: number, y: number): number => (x < 0 || y < 0 || x >= W || y >= H ? -1 : tiles[y * W + x]);
  const road = (x: number, y: number): boolean => ROAD_TILES.has(at(x, y));
  const out = new Uint16Array(tiles);
  const solid = new Set(built.solidTileIds);
  const setSolid = (i: number, v: number) => {
    out[i] = v;
    solid.add(v);
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const t = tiles[i];
      const h = cellHash(x, y);
      switch (t) {
        case TILE.asphalt:
          if (h < 60) out[i] = TILE.asphaltCrack;
          else if (h < 66) out[i] = TILE.manhole;
          else if (h < 105) out[i] = TILE.asphaltWet;
          break;
        case TILE.sidewalk: {
          // kerb toward the road (south first: the visible drop), tactile pavers beside crossings
          if (road(x, y + 1)) out[i] = TILE.curbS;
          else if (road(x, y - 1)) out[i] = TILE.curbN;
          else if (road(x + 1, y)) out[i] = TILE.curbE;
          else if (road(x - 1, y)) out[i] = TILE.curbW;
          else if ([at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)].includes(TILE.crosswalk)) out[i] = TILE.tactile;
          else if (h < 80) out[i] = TILE.sidewalkCrack;
          else if (h < 260) out[i] = TILE.sidewalkBlock;
          break;
        }
        case TILE.parkingFloor:
          if (h < 18) out[i] = TILE.oilStain;
          break;
        case TILE.buildingRoof: {
          const below = at(x, y + 1);
          const above = at(x, y - 1);
          if (below !== TILE.buildingRoof && below !== -1) {
            const endL = at(x - 1, y) !== TILE.buildingRoof;
            const endR = at(x + 1, y) !== TILE.buildingRoof;
            if (endL || endR) setSolid(i, TILE.wallCorner);
            else if (cellHash(x, y, 3) < 700) setSolid(i, SHOP_TILES[cellHash(x, y, 5) % SHOP_TILES.length]);
            else setSolid(i, TILE.buildingWall);
          } else if (above !== TILE.buildingRoof && above !== -1) {
            setSolid(i, TILE.roofEdge);
          } else if (at(x, y + 2) === TILE.buildingRoof) {
            const r = cellHash(x, y, 9);
            if (r < 10) setSolid(i, TILE.roofTank);
            else if (r < 28) setSolid(i, TILE.roofAc);
            else if (r < 34) setSolid(i, TILE.roofHatch);
          }
          break;
        }
        case TILE.car: {
          const l = at(x - 1, y) === TILE.car;
          const r = at(x + 1, y) === TILE.car;
          const u = at(x, y - 1) === TILE.car;
          const d = at(x, y + 1) === TILE.car;
          // colour from the car's top-left cell so both halves match
          let ox = x;
          let oy = y;
          while (at(ox - 1, oy) === TILE.car) ox--;
          while (at(ox, oy - 1) === TILE.car) oy--;
          const set = CAR_SETS[cellHash(ox, oy, 11) % CAR_SETS.length];
          let v = set[0];
          if (r && !l) v = set[1];
          else if (l && !r) v = set[2];
          else if (d && !u) v = set[3];
          else if (u && !d) v = set[4];
          setSolid(i, v);
          break;
        }
      }
    }
  }
  tiles.set(out);
  built.solidTileIds = [...solid];
}

export function tileAt(built: BuiltMap, x: number, y: number): number {
  return built.tiles[y * built.def.width + x];
}

/** Opens a gate: its tiles become ground and stop blocking. Returns the cells that changed. */
export function openGate(built: BuiltMap, gate: GateDef): { x: number; y: number }[] {
  const changed: { x: number; y: number }[] = [];
  forRect(gate.rect, built.def, (x, y) => {
    built.tiles[y * built.def.width + x] = built.def.groundTile;
    built.collision.setBlocked(x, y, false);
    changed.push({ x, y });
  });
  // tyre marks where the gate stood
  for (const c of changed) if (cellHash(c.x, c.y, 7) < 250 && built.def.groundTile === TILE.asphalt) built.tiles[c.y * built.def.width + c.x] = TILE.asphaltCrack;
  return changed;
}

/** Objectives block movement while alive; call with `false` once destroyed. */
export function setObjectiveBlocked(built: BuiltMap, obj: ObjectiveDef, blocked: boolean): void {
  forRect({ x: obj.at.x, y: obj.at.y, w: obj.size.w, h: obj.size.h }, built.def, (x, y) => built.collision.setBlocked(x, y, blocked));
}

/** World-pixel centre of a tile coordinate. */
export function tileCenter(def: MapDef, tx: number, ty: number): { x: number; y: number } {
  return { x: tx * def.tileSize + def.tileSize / 2, y: ty * def.tileSize + def.tileSize / 2 };
}

export function rectCenter(def: MapDef, r: Rect): { x: number; y: number } {
  return { x: (r.x + r.w / 2) * def.tileSize, y: (r.y + r.h / 2) * def.tileSize };
}

export function pointInRect(def: MapDef, px: number, py: number, r: Rect): boolean {
  const ts = def.tileSize;
  return px >= r.x * ts && px < (r.x + r.w) * ts && py >= r.y * ts && py < (r.y + r.h) * ts;
}
