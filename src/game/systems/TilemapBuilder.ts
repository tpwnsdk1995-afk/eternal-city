import Phaser from 'phaser';
import { TEX } from '@data/textureKeys';
import type { BuiltMap } from '@core/map/mapBuild';
import { TILE_PAD } from '../textures/draw/tiles';

export interface BuiltTilemap {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
}

/** Turns a pure BuiltMap into a Phaser tilemap layer with collision on the solid tile ids. */
export function buildTilemap(scene: Phaser.Scene, built: BuiltMap): BuiltTilemap {
  const { def } = built;
  const map = scene.make.tilemap({ tileWidth: def.tileSize, tileHeight: def.tileSize, width: def.width, height: def.height });
  // the atlas is extruded: 1px margin, 2px between cells (see drawTilesAtlas)
  const tileset = map.addTilesetImage(TEX.tiles, TEX.tiles, def.tileSize, def.tileSize, TILE_PAD, TILE_PAD * 2, 0);
  if (!tileset) throw new Error('tiles texture missing — run generateAllTextures first');
  const layer = map.createBlankLayer('ground', tileset, 0, 0);
  if (!layer) throw new Error('failed to create tilemap layer');

  for (let y = 0; y < def.height; y++) {
    for (let x = 0; x < def.width; x++) {
      layer.putTileAt(built.tiles[y * def.width + x], x, y);
    }
  }
  layer.setCollision(built.solidTileIds);
  return { map, layer };
}

/** Re-syncs a set of cells from the BuiltMap after a runtime change (gate opened, etc.). */
export function refreshTiles(tilemap: BuiltTilemap, built: BuiltMap, cells: { x: number; y: number }[]): void {
  for (const c of cells) tilemap.layer.putTileAt(built.tiles[c.y * built.def.width + c.x], c.x, c.y);
}
