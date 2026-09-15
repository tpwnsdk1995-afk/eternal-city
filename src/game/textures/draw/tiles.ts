import { TILE } from '@data/textureKeys';

type Ctx = CanvasRenderingContext2D;

/** Deterministic pseudo-noise for texture grain (no RNG dependency in draw code). */
function grain(ctx: Ctx, x0: number, y0: number, w: number, h: number, color: string, count: number, seed: number): void {
  ctx.fillStyle = color;
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = x0 + (s / 233280) * w;
    s = (s * 9301 + 49297) % 233280;
    const y = y0 + (s / 233280) * h;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }
}

function fill(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const tileDrawers: Record<number, (ctx: Ctx, x: number) => void> = {
  [TILE.empty]: () => {},
  [TILE.asphalt]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#3a3d43');
    grain(ctx, x, 0, 32, 32, '#454850', 40, 11);
    grain(ctx, x, 0, 32, 32, '#2f3237', 30, 23);
  },
  [TILE.sidewalk]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#8d8a80');
    ctx.strokeStyle = '#6f6c63';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, 0.5, 15, 15);
    ctx.strokeRect(x + 16.5, 0.5, 15, 15);
    ctx.strokeRect(x + 0.5, 16.5, 15, 15);
    ctx.strokeRect(x + 16.5, 16.5, 15, 15);
    grain(ctx, x, 0, 32, 32, '#9a978c', 25, 5);
  },
  [TILE.roadLine]: (ctx, x) => {
    tileDrawers[TILE.asphalt](ctx, x);
    fill(ctx, x + 14, 2, 4, 12, '#d9b74a');
    fill(ctx, x + 14, 18, 4, 12, '#d9b74a');
  },
  [TILE.grass]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#4d6b3a');
    grain(ctx, x, 0, 32, 32, '#5f7f46', 60, 7);
    grain(ctx, x, 0, 32, 32, '#3d5a2e', 30, 19);
  },
  [TILE.buildingRoof]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#5b5550');
    fill(ctx, x + 2, 2, 28, 28, '#66605a');
    grain(ctx, x, 0, 32, 32, '#726b64', 20, 3);
    fill(ctx, x + 12, 12, 8, 8, '#4a4541'); // vent
  },
  [TILE.car]: (ctx, x) => {
    tileDrawers[TILE.asphalt](ctx, x);
    fill(ctx, x + 2, 8, 28, 16, '#7a2e2e');
    fill(ctx, x + 8, 10, 10, 12, '#b9d3e6');
    fill(ctx, x + 3, 6, 6, 3, '#222');
    fill(ctx, x + 23, 6, 6, 3, '#222');
    fill(ctx, x + 3, 23, 6, 3, '#222');
    fill(ctx, x + 23, 23, 6, 3, '#222');
  },
  [TILE.concreteWall]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#6e6a66');
    fill(ctx, x + 1, 1, 30, 30, '#7d7873');
    ctx.strokeStyle = '#5a5652';
    ctx.beginPath();
    ctx.moveTo(x + 6, 4);
    ctx.lineTo(x + 12, 14);
    ctx.lineTo(x + 10, 26);
    ctx.stroke();
    grain(ctx, x, 0, 32, 32, '#8a857f', 20, 13);
  },
  [TILE.parkingPillar]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#55514d');
    fill(ctx, x + 4, 4, 24, 24, '#9c9791');
    fill(ctx, x + 6, 6, 20, 20, '#b0aba4');
    fill(ctx, x + 6, 6, 20, 4, '#c9b23a'); // hazard stripe
  },
  [TILE.parkingStripe]: (ctx, x) => {
    tileDrawers[TILE.parkingFloor](ctx, x);
    fill(ctx, x + 14, 0, 4, 32, '#d8d4c8');
  },
  [TILE.parkingFloor]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#5e5b58');
    grain(ctx, x, 0, 32, 32, '#6a6764', 40, 17);
    grain(ctx, x, 0, 32, 32, '#504d4a', 30, 29);
    // faint expansion-joint lines so the floor reads as concrete slabs
    fill(ctx, x, 0, 32, 1, '#524f4c');
    fill(ctx, x, 0, 1, 32, '#524f4c');
  },
  [TILE.portalGlow]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#5e5b58');
    const g = ctx.createRadialGradient(x + 16, 16, 2, x + 16, 16, 16);
    g.addColorStop(0, 'rgba(120,220,255,0.9)');
    g.addColorStop(1, 'rgba(120,220,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 32, 32);
  },
  [TILE.fence]: (ctx, x) => {
    tileDrawers[TILE.grass](ctx, x);
    ctx.strokeStyle = '#9aa0a6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 32; i += 8) {
      ctx.beginPath();
      ctx.moveTo(x + i, 0);
      ctx.lineTo(x + i + 8, 32);
      ctx.moveTo(x + i + 8, 0);
      ctx.lineTo(x + i, 32);
      ctx.stroke();
    }
    fill(ctx, x, 0, 32, 2, '#6b7077');
  },
  [TILE.gateClosed]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#2f3439');
    for (let i = 4; i < 32; i += 8) fill(ctx, x + i, 0, 3, 32, '#8b939b');
    fill(ctx, x, 14, 32, 4, '#a3282a');
  },
  [TILE.dirt]: (ctx, x) => {
    fill(ctx, x, 0, 32, 32, '#6b5a44');
    grain(ctx, x, 0, 32, 32, '#7a6850', 40, 31);
    grain(ctx, x, 0, 32, 32, '#5a4a37', 30, 37);
  },
};

export const TILE_COUNT = Object.keys(TILE).length;

/** Draws every tile id into a horizontal strip; frame index === tile id. */
export function drawTilesAtlas(ctx: Ctx): void {
  for (let id = 0; id < TILE_COUNT; id++) {
    const draw = tileDrawers[id];
    if (draw) draw(ctx, id * 32);
  }
}
