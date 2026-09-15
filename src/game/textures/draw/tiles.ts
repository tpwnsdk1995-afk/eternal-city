import { TILE } from '@data/textureKeys';

type Ctx = CanvasRenderingContext2D;
const T = 32;

/** Deterministic pseudo-noise for texture grain (no RNG dependency in draw code). */
function grain(ctx: Ctx, x0: number, y0: number, w: number, h: number, color: string, count: number, seed: number, size = 1): void {
  ctx.fillStyle = color;
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = x0 + (s / 233280) * w;
    s = (s * 9301 + 49297) % 233280;
    const y = y0 + (s / 233280) * h;
    ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
  }
}

function fill(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function crack(ctx: Ctx, x: number, pts: [number, number][], color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py)));
  ctx.stroke();
}

const asphalt = (ctx: Ctx, x: number) => {
  fill(ctx, x, 0, T, T, '#34373d');
  grain(ctx, x, 0, T, T, '#3d4046', 70, 11);
  grain(ctx, x, 0, T, T, '#2b2e33', 45, 23);
  grain(ctx, x, 0, T, T, '#46494f', 12, 41);
};

const sidewalk = (ctx: Ctx, x: number) => {
  fill(ctx, x, 0, T, T, '#8f8c83');
  // two slabs per tile with seams
  fill(ctx, x, 15, T, 2, '#6d6a62');
  fill(ctx, x + 15, 0, 2, T, '#6d6a62');
  fill(ctx, x, 0, T, 1, '#a19e94');
  fill(ctx, x, 0, 1, T, '#a19e94');
  grain(ctx, x, 0, T, T, '#9c998f', 40, 5);
  grain(ctx, x, 0, T, T, '#7e7b72', 30, 9);
};

const parkingFloor = (ctx: Ctx, x: number) => {
  fill(ctx, x, 0, T, T, '#5e5b58');
  grain(ctx, x, 0, T, T, '#6a6764', 40, 17);
  grain(ctx, x, 0, T, T, '#504d4a', 30, 29);
  fill(ctx, x, 0, T, 1, '#524f4c');
  fill(ctx, x, 0, 1, T, '#524f4c');
};

const roof = (ctx: Ctx, x: number) => {
  fill(ctx, x, 0, T, T, '#4f4a45');
  grain(ctx, x, 0, T, T, '#5a544e', 60, 3);
  grain(ctx, x, 0, T, T, '#443f3a', 40, 7);
};

function carBody(ctx: Ctx, x: number, part: 'L' | 'R' | 'T' | 'B' | 'single'): void {
  asphalt(ctx, x);
  const body = '#7a2e2e';
  const dark = '#4d1c1c';
  const glass = '#a9c4d8';
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  if (part === 'L' || part === 'R' || part === 'single') {
    ctx.fillRect(x + (part === 'R' ? 0 : 3), 25, T - (part === 'single' ? 6 : 3), 3); // shadow
    fill(ctx, x + (part === 'L' ? 3 : 0), 7, part === 'single' ? 26 : T - (part === 'L' ? 3 : 0) - (part === 'R' ? 3 : 0), 18, body);
    if (part === 'L' || part === 'single') {
      fill(ctx, x + 3, 7, 3, 18, '#f0e9c8'); // headlights strip
      fill(ctx, x + 13, 9, 9, 14, glass); // windshield
      fill(ctx, x + 6, 8, 6, 16, dark); // hood shading
      fill(ctx, x + 2, 5, 6, 3, '#1b1b1f');
      fill(ctx, x + 2, 24, 6, 3, '#1b1b1f'); // wheels
    }
    if (part === 'R' || part === 'single') {
      const ox = part === 'single' ? 0 : 0;
      fill(ctx, x + 26 + ox, 7, 3, 18, '#c8402a'); // tail lights
      fill(ctx, x + 6, 9, 9, 14, glass); // rear window
      fill(ctx, x + 16, 8, 8, 16, dark); // trunk shading
      fill(ctx, x + 22, 5, 6, 3, '#1b1b1f');
      fill(ctx, x + 22, 24, 6, 3, '#1b1b1f');
    }
    fill(ctx, x + (part === 'R' ? 0 : 3), 7, part === 'single' ? 26 : T - 3, 1, '#a34a4a'); // roof highlight
  } else {
    ctx.fillRect(25, x + (part === 'B' ? 0 : 3), 3, T - 3);
    fill(ctx, x + 7, part === 'T' ? 3 : 0, 18, T - (part === 'T' ? 3 : 0) - (part === 'B' ? 3 : 0), body);
    if (part === 'T') {
      fill(ctx, x + 7, 3, 18, 3, '#f0e9c8');
      fill(ctx, x + 9, 13, 14, 9, glass);
      fill(ctx, x + 5, 2, 3, 6, '#1b1b1f');
      fill(ctx, x + 24, 2, 3, 6, '#1b1b1f');
    } else {
      fill(ctx, x + 7, 26, 18, 3, '#c8402a');
      fill(ctx, x + 9, 6, 14, 9, glass);
      fill(ctx, x + 5, 22, 3, 6, '#1b1b1f');
      fill(ctx, x + 24, 22, 3, 6, '#1b1b1f');
    }
  }
}

const tileDrawers: Record<number, (ctx: Ctx, x: number) => void> = {
  [TILE.empty]: () => {},
  [TILE.asphalt]: asphalt,
  [TILE.sidewalk]: sidewalk,
  [TILE.roadLine]: (ctx, x) => {
    asphalt(ctx, x);
    fill(ctx, x + 14, 2, 4, 12, '#d9b74a');
    fill(ctx, x + 14, 18, 4, 12, '#d9b74a');
  },
  [TILE.grass]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#4d6b3a');
    grain(ctx, x, 0, T, T, '#5f7f46', 60, 7);
    grain(ctx, x, 0, T, T, '#3d5a2e', 30, 19);
    grain(ctx, x, 0, T, T, '#7a9a4a', 10, 31);
  },
  [TILE.buildingRoof]: roof,
  [TILE.roofEdge]: (ctx, x) => {
    roof(ctx, x);
    fill(ctx, x, 0, T, 4, '#6b655e'); // parapet
    fill(ctx, x, 4, T, 1, '#3a3531');
  },
  [TILE.buildingWall]: (ctx, x) => {
    // facade seen from above-front: ledge, two windows, shadow at the street
    fill(ctx, x, 0, T, T, '#77706a');
    fill(ctx, x, 0, T, 3, '#9a938b'); // ledge
    fill(ctx, x, 3, T, 1, '#4a4440');
    for (const wx of [4, 18]) {
      fill(ctx, x + wx, 8, 10, 14, '#2c3542');
      fill(ctx, x + wx + 1, 9, 3, 12, '#4a5c72'); // reflection
      fill(ctx, x + wx, 14, 10, 1, '#1e252e');
      fill(ctx, x + wx + 4, 8, 1, 14, '#1e252e');
    }
    fill(ctx, x, 26, T, 6, '#5a544e');
    fill(ctx, x, 30, T, 2, 'rgba(0,0,0,0.35)');
    grain(ctx, x, 4, T, 22, '#847d76', 25, 13);
  },
  [TILE.car]: (ctx, x) => carBody(ctx, x, 'single'),
  [TILE.carL]: (ctx, x) => carBody(ctx, x, 'L'),
  [TILE.carR]: (ctx, x) => carBody(ctx, x, 'R'),
  [TILE.carT]: (ctx, x) => carBody(ctx, x, 'T'),
  [TILE.carB]: (ctx, x) => carBody(ctx, x, 'B'),
  [TILE.concreteWall]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#6e6a66');
    fill(ctx, x + 1, 1, 30, 30, '#7d7873');
    fill(ctx, x, 0, T, 2, '#938d86');
    crack(ctx, x, [[6, 4], [12, 14], [10, 26]], '#5a5652');
    grain(ctx, x, 0, T, T, '#8a857f', 20, 13);
    fill(ctx, x, 29, T, 3, 'rgba(0,0,0,0.3)');
  },
  [TILE.parkingPillar]: (ctx, x) => {
    parkingFloor(ctx, x);
    fill(ctx, x + 4, 4, 24, 24, '#9c9791');
    fill(ctx, x + 6, 6, 20, 20, '#b0aba4');
    fill(ctx, x + 6, 6, 20, 4, '#c9b23a'); // hazard stripe
    fill(ctx, x + 6, 10, 20, 2, '#1b1b1f');
    fill(ctx, x + 4, 26, 26, 4, 'rgba(0,0,0,0.35)');
  },
  [TILE.parkingStripe]: (ctx, x) => {
    parkingFloor(ctx, x);
    fill(ctx, x + 14, 0, 4, T, '#d8d4c8');
  },
  [TILE.parkingFloor]: parkingFloor,
  [TILE.oilStain]: (ctx, x) => {
    parkingFloor(ctx, x);
    ctx.fillStyle = 'rgba(20,18,16,0.55)';
    ctx.beginPath();
    ctx.ellipse(x + 15, 17, 9, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 22, 12, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  [TILE.portalGlow]: (ctx, x) => {
    parkingFloor(ctx, x);
    const g = ctx.createRadialGradient(x + 16, 16, 2, x + 16, 16, 16);
    g.addColorStop(0, 'rgba(120,220,255,0.9)');
    g.addColorStop(1, 'rgba(120,220,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, T, T);
  },
  [TILE.fence]: (ctx, x) => {
    tileDrawers[TILE.grass](ctx, x);
    ctx.strokeStyle = '#9aa0a6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= T; i += 8) {
      ctx.beginPath();
      ctx.moveTo(x + i, 0);
      ctx.lineTo(x + i + 8, T);
      ctx.moveTo(x + i + 8, 0);
      ctx.lineTo(x + i, T);
      ctx.stroke();
    }
    fill(ctx, x, 0, T, 2, '#6b7077');
    fill(ctx, x, 30, T, 2, '#6b7077');
  },
  [TILE.gateClosed]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#2f3439');
    for (let i = 3; i < T; i += 7) fill(ctx, x + i, 0, 3, T, '#8b939b');
    fill(ctx, x, 6, T, 3, '#6d757d');
    fill(ctx, x, 23, T, 3, '#6d757d');
    fill(ctx, x, 14, T, 4, '#a3282a');
    fill(ctx, x + 2, 15, T - 4, 1, '#d84a4c');
  },
  [TILE.dirt]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#6b5a44');
    grain(ctx, x, 0, T, T, '#7a6850', 40, 31);
    grain(ctx, x, 0, T, T, '#5a4a37', 30, 37);
    grain(ctx, x, 0, T, T, '#8a7a5a', 8, 43, 2);
  },
  [TILE.asphaltCrack]: (ctx, x) => {
    asphalt(ctx, x);
    crack(ctx, x, [[2, 26], [9, 18], [14, 20], [19, 9], [27, 4]], '#202226');
    crack(ctx, x, [[14, 20], [17, 27]], '#202226');
  },
  [TILE.manhole]: (ctx, x) => {
    asphalt(ctx, x);
    ctx.fillStyle = '#4a4d52';
    ctx.beginPath();
    ctx.arc(x + 16, 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2c30';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 16, 16, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#3a3d42';
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i += 3) {
      ctx.beginPath();
      ctx.moveTo(x + 16 + i, 9);
      ctx.lineTo(x + 16 + i, 23);
      ctx.stroke();
    }
  },
  [TILE.crosswalk]: (ctx, x) => {
    asphalt(ctx, x);
    for (let i = 2; i < T; i += 8) fill(ctx, x + i, 0, 4, T, '#d5d2c8');
    grain(ctx, x, 0, T, T, '#34373d', 30, 47);
  },
  [TILE.sidewalkCrack]: (ctx, x) => {
    sidewalk(ctx, x);
    crack(ctx, x, [[4, 28], [11, 21], [13, 12], [22, 6]], '#5e5b53');
    fill(ctx, x + 10, 20, 2, 2, '#5f7f46');
    fill(ctx, x + 12, 18, 1, 3, '#4d6b3a');
    fill(ctx, x + 8, 22, 1, 2, '#6f8f50');
  },
};

export const TILE_COUNT = Object.keys(TILE).length;

/** Draws every tile id into a horizontal strip; frame index === tile id. */
export function drawTilesAtlas(ctx: Ctx): void {
  for (let id = 0; id < TILE_COUNT; id++) {
    const draw = tileDrawers[id];
    if (draw) draw(ctx, id * T);
  }
}
