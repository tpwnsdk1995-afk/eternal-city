import type { GateDef, MapDef, ObjectiveDef, Rect } from '@data/schema/map';
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
  // border ring
  for (let x = 0; x < def.width; x++) {
    set(x, 0, def.borderTile, true);
    set(x, def.height - 1, def.borderTile, true);
  }
  for (let y = 0; y < def.height; y++) {
    set(0, y, def.borderTile, true);
    set(def.width - 1, y, def.borderTile, true);
  }

  return { def, tiles, collision, solidTileIds: [...solid] };
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
