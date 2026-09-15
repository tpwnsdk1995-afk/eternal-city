import type { Vec2 } from '@core/math/vec';
import type { TexKey } from '../textureKeys';

export type MapId = string;
export type TileId = number;

export interface Rect {
  x: number; // tile coords
  y: number;
  w: number;
  h: number;
}

export interface SpawnZoneDef {
  id: string;
  rect: Rect;
  monsters: { id: string; weight: number }[];
  maxAlive: number;
  respawnSec: number;
}

export interface PortalDef {
  id: string;
  rect: Rect;
  toMap: MapId;
  toSpawn: string;
  label: string;
}

/** Destructible mission object (어설트 기물). */
export interface ObjectiveDef {
  id: string;
  at: Vec2; // tile coords
  tex: TexKey;
  hp: number;
  /** Tiles occupied (solid while alive). */
  size: { w: number; h: number };
}

/** A blocking wall segment that opens when the listed objectives are destroyed. */
export interface GateDef {
  id: string;
  rect: Rect;
  tile: TileId;
  opensWhen: string[]; // objective ids
}

export interface MapDef {
  id: MapId;
  name: string;
  year: 2002 | 2003 | 2004 | 2005 | 2006 | 2007 | 2008 | 2017 | 'now';
  width: number; // tiles
  height: number;
  tileSize: 32;
  groundTile: TileId;
  borderTile: TileId;
  fills?: { rect: Rect; tile: TileId; solid?: boolean }[];
  obstacles: { rect: Rect; tile: TileId; kind: 'building' | 'car' | 'wall' | 'pillar' | 'fence' }[];
  /** Street furniture sprites; `at` is the tile the base stands on. `solid` blocks that tile. */
  decor?: { at: Vec2; tex: TexKey; solid?: boolean }[];
  spawnZones?: SpawnZoneDef[];
  portals: PortalDef[];
  spawnPoints: Record<string, Vec2>; // tile coords; must include 'default'
  npcs?: { id: string; at: Vec2 }[];
  objectives?: ObjectiveDef[];
  gates?: GateDef[];
  /** Named zones used by assault phases (e.g. 'stage2', 'bossArena'). */
  zones?: Record<string, Rect>;
  safeZone: boolean;
}
