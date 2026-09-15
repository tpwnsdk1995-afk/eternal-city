import type Phaser from 'phaser';
import { TILE } from '@data/textureKeys';
import type { BuiltMap } from '@core/map/mapBuild';

export interface MinimapInfo {
  tex: string;
  scale: number; // px per tile in the texture
  w: number; // texture size
  h: number;
  tilesW: number;
  tilesH: number;
  tileSize: number;
}

export const MINIMAP_MAX_W = 200;
export const MINIMAP_MAX_H = 150;

const COLORS: Record<number, string> = {
  [TILE.empty]: '#000000',
  [TILE.asphalt]: '#3a3d43',
  [TILE.asphaltCrack]: '#3a3d43',
  [TILE.manhole]: '#3a3d43',
  [TILE.crosswalk]: '#5a5d63',
  [TILE.roadLine]: '#4a4a3a',
  [TILE.sidewalk]: '#8f8c83',
  [TILE.sidewalkCrack]: '#8f8c83',
  [TILE.grass]: '#4d6b3a',
  [TILE.buildingRoof]: '#5a544e',
  [TILE.roofEdge]: '#5a544e',
  [TILE.buildingWall]: '#6b655e',
  [TILE.car]: '#7a2e2e',
  [TILE.carL]: '#7a2e2e',
  [TILE.carR]: '#7a2e2e',
  [TILE.carT]: '#7a2e2e',
  [TILE.carB]: '#7a2e2e',
  [TILE.concreteWall]: '#8a857f',
  [TILE.parkingPillar]: '#a29d96',
  [TILE.parkingStripe]: '#6e6b68',
  [TILE.parkingFloor]: '#5e5b58',
  [TILE.oilStain]: '#5e5b58',
  [TILE.portalGlow]: '#7bd8ff',
  [TILE.fence]: '#9aa0a6',
  [TILE.gateClosed]: '#a3282a',
  [TILE.dirt]: '#6b5a44',
};

/** Rasterises the built map into a small canvas texture for the HUD minimap. Idempotent per map. */
export function buildMinimapTexture(scene: Phaser.Scene, built: BuiltMap): MinimapInfo {
  const { def } = built;
  const scale = Math.max(1, Math.min(4, Math.floor(Math.min(MINIMAP_MAX_W / def.width, MINIMAP_MAX_H / def.height))));
  const w = def.width * scale;
  const h = def.height * scale;
  const key = `minimap:${def.id}`;
  if (scene.textures.exists(key)) scene.textures.remove(key); // tiles can change (gates)
  const tex = scene.textures.createCanvas(key, w, h);
  if (tex) {
    const ctx = tex.getContext();
    for (let y = 0; y < def.height; y++) {
      for (let x = 0; x < def.width; x++) {
        ctx.fillStyle = COLORS[built.tiles[y * def.width + x]] ?? '#444';
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    tex.refresh();
  }
  return { tex: key, scale, w, h, tilesW: def.width, tilesH: def.height, tileSize: def.tileSize };
}

/** Live positions the HUD overlays on the minimap; provided by the active world scene. */
export interface WorldSnapshot {
  player: { x: number; y: number };
  enemies: { x: number; y: number; boss: boolean }[];
  npcs: { x: number; y: number }[];
  pickups: { x: number; y: number }[];
}
