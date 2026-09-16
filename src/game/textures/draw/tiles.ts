import { TILE } from '@data/textureKeys';

type Ctx = CanvasRenderingContext2D;
const T = 32;

/** Original-client ground samples (tools/ec-tiles.py → public/art/tiles.png): 32px cells in this order. */
export const TILE_SWATCHES = { url: 'art/tiles.png', names: ['asphalt', 'sidewalk', 'concrete', 'dirt', 'grass'] as const };
type Swatch = (typeof TILE_SWATCHES.names)[number];
let swatchImg: CanvasImageSource | null = null;
/** Set before the atlas is drawn; null keeps every procedural base. */
export function setTileSwatches(img: CanvasImageSource | null): void {
  swatchImg = img;
}
/** Paints the sampled material as the tile base; false → the caller draws its procedural base instead. */
function swatch(ctx: Ctx, x: number, name: Swatch): boolean {
  if (!swatchImg) return false;
  ctx.drawImage(swatchImg, TILE_SWATCHES.names.indexOf(name) * T, 0, T, T, x, 0, T, T);
  return true;
}

// ---------------------------------------------------------------------------------------------
// helpers (deterministic — draw code never touches the game RNG)
// ---------------------------------------------------------------------------------------------

/** LCG in [0,1) seeded per call so every tile is reproducible. */
function rng(seed: number): () => number {
  let s = (seed * 7919 + 13) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function grain(ctx: Ctx, x0: number, y0: number, w: number, h: number, color: string, count: number, seed: number, size = 1): void {
  ctx.fillStyle = color;
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    // clamp so a 2px speck never bleeds into the neighbouring atlas cell
    const x = Math.min(x0 + w - size, Math.floor(x0 + r() * w));
    const y = Math.min(y0 + h - size, Math.floor(y0 + r() * h));
    ctx.fillRect(x, y, size, size);
  }
}

function fill(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function crack(ctx: Ctx, x: number, pts: [number, number][], color: string, width = 1): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py)));
  ctx.stroke();
}

function ellipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, color: string, rot = 0): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** Bricks in staggered courses: `bw×bh` with 1px mortar, shade jitter per brick. */
function bricks(ctx: Ctx, x: number, y0: number, h: number, bw: number, bh: number, base: string, mortar: string, seed: number, shades: string[]): void {
  fill(ctx, x, y0, T, h, mortar);
  const r = rng(seed);
  for (let row = 0, y = y0; y < y0 + h; row++, y += bh) {
    const off = row % 2 ? -Math.floor(bw / 2) : 0;
    for (let bx = off; bx < T; bx += bw) {
      const c = r() < 0.35 ? shades[Math.floor(r() * shades.length)] : base;
      const x0 = Math.max(x, x + bx);
      const x1 = Math.min(x + T, x + bx + bw - 1);
      const y1 = Math.min(y0 + h, y + bh - 1);
      if (x1 > x0) fill(ctx, x0, y, x1 - x0, y1 - y, c);
      // light top edge
      if (x1 > x0) fill(ctx, x0, y, x1 - x0, 1, 'rgba(255,255,255,0.08)');
    }
  }
}

// ---------------------------------------------------------------------------------------------
// ground
// ---------------------------------------------------------------------------------------------

const ASPHALT = '#37383a';

const asphalt = (ctx: Ctx, x: number, seed = 11) => {
  if (swatch(ctx, x, 'asphalt')) return;
  fill(ctx, x, 0, T, T, ASPHALT);
  grain(ctx, x, 0, T, T, '#44474e', 90, seed);
  grain(ctx, x, 0, T, T, '#2c2c2e', 60, seed + 12);
  grain(ctx, x, 0, T, T, '#50545b', 18, seed + 30);
  grain(ctx, x, 0, T, T, '#222224', 10, seed + 41, 2);
};

const asphaltWet = (ctx: Ctx, x: number) => {
  asphalt(ctx, x, 17);
  // puddle with a faint sky reflection
  ellipse(ctx, x + 17, 19, 11, 6, 'rgba(90,110,140,0.22)', 0.3);
  ellipse(ctx, x + 15, 18, 7, 3.5, 'rgba(140,165,200,0.18)', 0.3);
  fill(ctx, x + 10, 15, 8, 1, 'rgba(200,220,240,0.25)');
};

/** 보도블록: interlocking pavers, 16×8 courses. */
const sidewalk = (ctx: Ctx, x: number, seed = 5) => {
  if (swatch(ctx, x, 'sidewalk')) return;
  bricks(ctx, x, 0, T, 16, 8, '#8d897f', '#6a675f', seed, ['#948f85', '#857f75', '#9a958b']);
  grain(ctx, x, 0, T, T, '#7e7a70', 24, seed + 3);
  grain(ctx, x, 0, T, T, '#a09b90', 14, seed + 9);
};

/** alternate paver: 8×8 squares */
const sidewalkBlock = (ctx: Ctx, x: number) => {
  if (swatch(ctx, x, 'sidewalk')) return;
  fill(ctx, x, 0, T, T, '#6a675f');
  const r = rng(77);
  for (let y = 0; y < T; y += 8)
    for (let bx = 0; bx < T; bx += 8) {
      const c = r() < 0.3 ? '#857f75' : '#8d897f';
      fill(ctx, x + bx, y, 7, 7, c);
      fill(ctx, x + bx, y, 7, 1, 'rgba(255,255,255,0.08)');
    }
  grain(ctx, x, 0, T, T, '#7e7a70', 20, 81);
};

/** 점자블록 — yellow tactile paver next to crossings */
const tactile = (ctx: Ctx, x: number) => {
  fill(ctx, x, 0, T, T, '#b89a2e');
  fill(ctx, x, 0, T, 1, '#6a675f');
  fill(ctx, x, 0, 1, T, '#6a675f');
  for (let y = 4; y < T; y += 7) for (let bx = 4; bx < T; bx += 7) ellipse(ctx, x + bx, y, 2, 2, '#9c8226');
  grain(ctx, x, 0, T, T, '#c9ab3a', 20, 91);
};

/** sidewalk with a kerb on one side dropping to the road */
function curb(ctx: Ctx, x: number, side: 'N' | 'S' | 'E' | 'W'): void {
  sidewalk(ctx, x, 6);
  const light = '#b3afa4';
  const face = '#5b584f';
  const shadow = 'rgba(0,0,0,0.35)';
  switch (side) {
    case 'S':
      fill(ctx, x, 26, T, 3, light);
      fill(ctx, x, 29, T, 3, face);
      break;
    case 'N':
      fill(ctx, x, 0, T, 2, shadow);
      fill(ctx, x, 2, T, 3, light);
      break;
    case 'E':
      fill(ctx, x + 26, 0, 3, T, light);
      fill(ctx, x + 29, 0, 3, T, face);
      break;
    case 'W':
      fill(ctx, x, 0, 2, T, shadow);
      fill(ctx, x + 2, 0, 3, T, light);
      break;
  }
}

const parkingFloor = (ctx: Ctx, x: number, seed = 17) => {
  if (swatch(ctx, x, 'concrete')) {
    fill(ctx, x, 0, T, T, 'rgba(0,0,0,0.3)'); // underground: same concrete, less light
    return;
  }
  fill(ctx, x, 0, T, T, '#5b5855');
  grain(ctx, x, 0, T, T, '#666360', 50, seed);
  grain(ctx, x, 0, T, T, '#4d4a47', 40, seed + 12);
  grain(ctx, x, 0, T, T, '#403d3a', 10, seed + 20, 2);
  fill(ctx, x, 0, T, 1, '#4f4c49');
  fill(ctx, x, 0, 1, T, '#4f4c49');
};

const roof = (ctx: Ctx, x: number, seed = 3) => {
  fill(ctx, x, 0, T, T, '#4a453f');
  grain(ctx, x, 0, T, T, '#56504a', 70, seed, 1);
  grain(ctx, x, 0, T, T, '#3f3a35', 50, seed + 4);
  grain(ctx, x, 0, T, T, '#625b54', 14, seed + 8, 2);
};

const grass = (ctx: Ctx, x: number) => {
  if (swatch(ctx, x, 'grass')) return;
  fill(ctx, x, 0, T, T, '#4a6636');
  grain(ctx, x, 0, T, T, '#5b7a41', 70, 7);
  grain(ctx, x, 0, T, T, '#3b532b', 40, 19);
  // tufts
  const r = rng(31);
  ctx.strokeStyle = '#6f8f4a';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const tx = x + r() * T;
    const ty = r() * T;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 1, ty - 3);
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + 1.5, ty - 2.5);
    ctx.stroke();
  }
  ellipse(ctx, x + 22, 24, 5, 3, '#5a4a37'); // bare patch
  grain(ctx, x + 17, 21, 10, 6, '#6b5a44', 8, 44);
};

// ---------------------------------------------------------------------------------------------
// buildings
// ---------------------------------------------------------------------------------------------

/** generic facade: concrete, two framed windows, base band */
const wallPlain = (ctx: Ctx, x: number) => {
  fill(ctx, x, 0, T, T, '#746d66');
  fill(ctx, x, 0, T, 3, '#978f86'); // ledge
  fill(ctx, x, 3, T, 1, '#463f3a');
  for (const wx of [4, 18]) {
    fill(ctx, x + wx - 1, 7, 12, 15, '#3a3530'); // frame
    fill(ctx, x + wx, 8, 10, 13, '#243040');
    fill(ctx, x + wx + 1, 9, 3, 11, 'rgba(120,150,190,0.35)'); // reflection
    fill(ctx, x + wx, 14, 10, 1, '#1a2028');
    fill(ctx, x + wx + 5, 8, 1, 13, '#1a2028');
  }
  fill(ctx, x, 25, T, 7, '#5a534d'); // base
  fill(ctx, x, 25, T, 1, '#847c74');
  fill(ctx, x, 30, T, 2, 'rgba(0,0,0,0.4)');
  grain(ctx, x, 4, T, 20, '#807870', 24, 13);
};

const SHOPS: { text: string; bg: string; fg: string; door: string }[] = [
  { text: '약국', bg: '#2f7d4f', fg: '#ffffff', door: '#c9dfe8' },
  { text: '치킨', bg: '#c8402a', fg: '#ffe28a', door: '#5a3a1f' },
  { text: 'PC방', bg: '#2a4a9a', fg: '#dfe8ff', door: '#23303f' },
  { text: '슈퍼', bg: '#e0a020', fg: '#1a1a1a', door: '#c9dfe8' },
  { text: '노래방', bg: '#7a2a8a', fg: '#ffd6ff', door: '#2a1f30' },
  { text: '분식', bg: '#b5442a', fg: '#ffffff', door: '#c9dfe8' },
];

/** 2000s Korean shopfront: upper-floor windows, sign board with Hangul, glass door / shutter. */
function wallShop(ctx: Ctx, x: number, i: number): void {
  const s = SHOPS[i % SHOPS.length];
  fill(ctx, x, 0, T, T, '#6f6861');
  fill(ctx, x, 0, T, 2, '#938b82');
  fill(ctx, x, 2, T, 1, '#463f3a');
  // upper windows
  for (const wx of [4, 19]) {
    fill(ctx, x + wx - 1, 4, 10, 7, '#3a3530');
    fill(ctx, x + wx, 5, 8, 5, '#243040');
    fill(ctx, x + wx + 1, 5, 2, 5, 'rgba(120,150,190,0.35)');
  }
  // sign board
  fill(ctx, x, 12, T, 10, s.bg);
  fill(ctx, x, 12, T, 1, 'rgba(255,255,255,0.35)');
  fill(ctx, x, 21, T, 1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = s.fg;
  ctx.font = `bold ${s.text.length > 2 ? 9 : 11}px 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s.text, x + 16, 17.5);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  // shopfront: glass door with dark interior, or a pulled-down shutter
  if (i % 3 === 2) {
    fill(ctx, x + 2, 22, T - 4, 8, '#7a7570');
    for (let y = 23; y < 30; y += 2) fill(ctx, x + 2, y, T - 4, 1, '#5c5751');
  } else {
    fill(ctx, x + 2, 22, T - 4, 8, s.door);
    fill(ctx, x + 3, 23, 12, 6, 'rgba(20,25,35,0.55)');
    fill(ctx, x + 17, 23, 12, 6, 'rgba(20,25,35,0.55)');
    fill(ctx, x + 15, 22, 2, 8, '#3a3530');
    fill(ctx, x + 4, 24, 2, 4, 'rgba(180,200,220,0.35)');
  }
  fill(ctx, x, 30, T, 2, 'rgba(0,0,0,0.45)'); // street shadow
  fill(ctx, x, 29, T, 1, '#4a4440');
}

/** block corner: brick pier */
const wallCorner = (ctx: Ctx, x: number) => {
  bricks(ctx, x, 0, T, 10, 5, '#6b4a3a', '#3e2a20', 21, ['#755040', '#5f4032', '#7a5a48']);
  fill(ctx, x, 0, T, 2, '#8a7a6a');
  fill(ctx, x, 30, T, 2, 'rgba(0,0,0,0.45)');
};

const roofEdge = (ctx: Ctx, x: number) => {
  roof(ctx, x, 5);
  fill(ctx, x, 0, T, 5, '#6d665e'); // parapet cap
  fill(ctx, x, 0, T, 1, '#8a827a');
  fill(ctx, x, 5, T, 2, 'rgba(0,0,0,0.4)');
};

const roofTank = (ctx: Ctx, x: number) => {
  roof(ctx, x, 9);
  ellipse(ctx, x + 17, 19, 10, 5, 'rgba(0,0,0,0.35)');
  ellipse(ctx, x + 16, 15, 9, 9, '#5d636a');
  ellipse(ctx, x + 14, 13, 5, 5, '#737a81');
  ellipse(ctx, x + 16, 15, 2, 2, '#33383d');
  ctx.strokeStyle = '#5a5f65';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x + 16, 15, 9, 0, Math.PI * 2);
  ctx.stroke();
};

const roofAc = (ctx: Ctx, x: number) => {
  roof(ctx, x, 13);
  for (const [bx, by] of [
    [4, 6],
    [17, 15],
  ]) {
    fill(ctx, x + bx + 1, by + 9, 11, 3, 'rgba(0,0,0,0.35)');
    fill(ctx, x + bx, by, 11, 10, '#8f9498');
    fill(ctx, x + bx, by, 11, 1, '#b3b7bb');
    ellipse(ctx, x + bx + 5.5, by + 5, 3.5, 3.5, '#4f545a');
    ellipse(ctx, x + bx + 5.5, by + 5, 1.2, 1.2, '#2a2d31');
  }
};

const roofHatch = (ctx: Ctx, x: number) => {
  roof(ctx, x, 15);
  fill(ctx, x + 7, 8, 18, 16, '#5a4a3a');
  fill(ctx, x + 7, 8, 18, 3, '#7a6a5a');
  fill(ctx, x + 10, 13, 5, 6, '#243040');
  fill(ctx, x + 18, 13, 5, 6, '#243040');
  fill(ctx, x + 6, 24, 20, 3, 'rgba(0,0,0,0.35)');
};

// ---------------------------------------------------------------------------------------------
// vehicles — 2000s sedans in four colours, drawn as L/R/T/B halves or a single tile
// ---------------------------------------------------------------------------------------------

interface CarPalette {
  body: string;
  dark: string;
  light: string;
}
const CAR_PALETTES: CarPalette[] = [
  { body: '#7a2e2e', dark: '#4d1c1c', light: '#a34a4a' }, // red
  { body: '#d6d6d1', dark: '#9a9a95', light: '#f4f4f0' }, // white
  { body: '#8f959c', dark: '#5c6168', light: '#b8bec5' }, // silver
  { body: '#23262b', dark: '#101215', light: '#4a4f57' }, // black
];
const GLASS = '#8fa8bd';
const GLASS_DARK = '#4c6074';

function carBody(ctx: Ctx, x: number, part: 'L' | 'R' | 'T' | 'B' | 'single', p: CarPalette): void {
  asphalt(ctx, x, 51);
  const horizontal = part === 'L' || part === 'R' || part === 'single';
  if (horizontal) {
    const x0 = part === 'R' ? -4 : 3; // body continues past the tile edge on the joined side
    const w = part === 'single' ? 26 : T + 4 - (part === 'L' ? 3 : 0) - (part === 'R' ? 3 : 0);
    fill(ctx, x + x0 + 1, 25, w - 1, 3, 'rgba(0,0,0,0.4)'); // shadow
    // wheels
    for (const wx of part === 'L' ? [5] : part === 'R' ? [21] : [4, 20]) {
      fill(ctx, x + wx, 4, 7, 3, '#141417');
      fill(ctx, x + wx, 25, 7, 3, '#141417');
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, T, T);
    ctx.clip();
    // body
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.roundRect(x + x0, 7, w, 18, 4);
    ctx.fill();
    fill(ctx, x + x0 + 2, 8, w - 4, 2, p.light); // roof highlight
    fill(ctx, x + x0 + 2, 22, w - 4, 2, p.dark); // lower shade
    if (part === 'L' || part === 'single') {
      fill(ctx, x + 3, 9, 2, 14, '#f0e9c8'); // headlights
      fill(ctx, x + 5, 8, 7, 16, p.dark); // hood
      fill(ctx, x + 12, 9, 7, 14, GLASS); // windshield
      fill(ctx, x + 13, 9, 2, 14, GLASS_DARK);
      fill(ctx, x + 12, 6, 2, 2, p.dark); // mirrors
      fill(ctx, x + 12, 24, 2, 2, p.dark);
    }
    if (part === 'R' || part === 'single') {
      const rx = part === 'single' ? x + 26 : x + 27;
      fill(ctx, rx, 9, 2, 14, '#d63a2a'); // tail lights
      fill(ctx, rx - 8, 8, 8, 16, p.dark); // trunk
      fill(ctx, rx - 15, 9, 7, 14, GLASS); // rear glass
      fill(ctx, rx - 14, 9, 2, 14, GLASS_DARK);
    }
    if (part !== 'single') fill(ctx, x + 8, 11, 16, 10, p.body); // roof between the glasses
    fill(ctx, x + (part === 'R' ? 0 : 10), 12, part === 'single' ? 6 : 12, 8, p.body);
    ctx.restore();
  } else {
    const y0 = part === 'B' ? -4 : 3;
    const h = T + 4 - (part === 'T' ? 3 : 0) - (part === 'B' ? 3 : 0);
    fill(ctx, x + 25, y0 + 1, 3, h - 1, 'rgba(0,0,0,0.4)');
    for (const wy of part === 'T' ? [5] : [21]) {
      fill(ctx, x + 4, wy, 3, 7, '#141417');
      fill(ctx, x + 25, wy, 3, 7, '#141417');
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, T, T);
    ctx.clip();
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.roundRect(x + 7, y0, 18, h, 4);
    ctx.fill();
    fill(ctx, x + 8, y0 + 2, 2, h - 4, p.light);
    fill(ctx, x + 22, y0 + 2, 2, h - 4, p.dark);
    if (part === 'T') {
      fill(ctx, x + 9, 3, 14, 2, '#f0e9c8');
      fill(ctx, x + 8, 5, 16, 7, p.dark);
      fill(ctx, x + 9, 12, 14, 7, GLASS);
      fill(ctx, x + 9, 13, 14, 2, GLASS_DARK);
      fill(ctx, x + 6, 12, 2, 2, p.dark);
      fill(ctx, x + 24, 12, 2, 2, p.dark);
    } else {
      fill(ctx, x + 9, 27, 14, 2, '#d63a2a');
      fill(ctx, x + 8, 19, 16, 8, p.dark);
      fill(ctx, x + 9, 12, 14, 7, GLASS);
      fill(ctx, x + 9, 17, 14, 2, GLASS_DARK);
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------------------------
// atlas
// ---------------------------------------------------------------------------------------------

const tileDrawers: Record<number, (ctx: Ctx, x: number) => void> = {
  [TILE.empty]: () => {},
  [TILE.asphalt]: (ctx, x) => asphalt(ctx, x),
  [TILE.asphaltWet]: asphaltWet,
  [TILE.sidewalk]: (ctx, x) => sidewalk(ctx, x),
  [TILE.sidewalkBlock]: sidewalkBlock,
  [TILE.tactile]: tactile,
  [TILE.curbN]: (ctx, x) => curb(ctx, x, 'N'),
  [TILE.curbS]: (ctx, x) => curb(ctx, x, 'S'),
  [TILE.curbE]: (ctx, x) => curb(ctx, x, 'E'),
  [TILE.curbW]: (ctx, x) => curb(ctx, x, 'W'),
  [TILE.roadLine]: (ctx, x) => {
    // 황색 중앙 복선
    asphalt(ctx, x, 21);
    fill(ctx, x + 12, 0, 3, T, '#c9a53a');
    fill(ctx, x + 17, 0, 3, T, '#c9a53a');
    grain(ctx, x + 12, 0, 8, T, ASPHALT, 10, 61); // wear
  },
  [TILE.roadDash]: (ctx, x) => {
    asphalt(ctx, x, 23);
    fill(ctx, x + 14, 4, 4, 18, '#cfccc2');
    grain(ctx, x + 14, 4, 4, 18, ASPHALT, 6, 63);
  },
  [TILE.grass]: grass,
  [TILE.buildingRoof]: (ctx, x) => roof(ctx, x),
  [TILE.roofEdge]: roofEdge,
  [TILE.roofTank]: roofTank,
  [TILE.roofAc]: roofAc,
  [TILE.roofHatch]: roofHatch,
  [TILE.buildingWall]: wallPlain,
  [TILE.wallShop1]: (ctx, x) => wallShop(ctx, x, 0),
  [TILE.wallShop2]: (ctx, x) => wallShop(ctx, x, 1),
  [TILE.wallShop3]: (ctx, x) => wallShop(ctx, x, 2),
  [TILE.wallShop4]: (ctx, x) => wallShop(ctx, x, 3),
  [TILE.wallShop5]: (ctx, x) => wallShop(ctx, x, 4),
  [TILE.wallShop6]: (ctx, x) => wallShop(ctx, x, 5),
  [TILE.wallCorner]: wallCorner,
  [TILE.car]: (ctx, x) => carBody(ctx, x, 'single', CAR_PALETTES[0]),
  [TILE.carL]: (ctx, x) => carBody(ctx, x, 'L', CAR_PALETTES[0]),
  [TILE.carR]: (ctx, x) => carBody(ctx, x, 'R', CAR_PALETTES[0]),
  [TILE.carT]: (ctx, x) => carBody(ctx, x, 'T', CAR_PALETTES[0]),
  [TILE.carB]: (ctx, x) => carBody(ctx, x, 'B', CAR_PALETTES[0]),
  [TILE.car2]: (ctx, x) => carBody(ctx, x, 'single', CAR_PALETTES[1]),
  [TILE.car2L]: (ctx, x) => carBody(ctx, x, 'L', CAR_PALETTES[1]),
  [TILE.car2R]: (ctx, x) => carBody(ctx, x, 'R', CAR_PALETTES[1]),
  [TILE.car2T]: (ctx, x) => carBody(ctx, x, 'T', CAR_PALETTES[1]),
  [TILE.car2B]: (ctx, x) => carBody(ctx, x, 'B', CAR_PALETTES[1]),
  [TILE.car3]: (ctx, x) => carBody(ctx, x, 'single', CAR_PALETTES[2]),
  [TILE.car3L]: (ctx, x) => carBody(ctx, x, 'L', CAR_PALETTES[2]),
  [TILE.car3R]: (ctx, x) => carBody(ctx, x, 'R', CAR_PALETTES[2]),
  [TILE.car3T]: (ctx, x) => carBody(ctx, x, 'T', CAR_PALETTES[2]),
  [TILE.car3B]: (ctx, x) => carBody(ctx, x, 'B', CAR_PALETTES[2]),
  [TILE.car4]: (ctx, x) => carBody(ctx, x, 'single', CAR_PALETTES[3]),
  [TILE.car4L]: (ctx, x) => carBody(ctx, x, 'L', CAR_PALETTES[3]),
  [TILE.car4R]: (ctx, x) => carBody(ctx, x, 'R', CAR_PALETTES[3]),
  [TILE.car4T]: (ctx, x) => carBody(ctx, x, 'T', CAR_PALETTES[3]),
  [TILE.car4B]: (ctx, x) => carBody(ctx, x, 'B', CAR_PALETTES[3]),
  [TILE.concreteWall]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#6b6763');
    fill(ctx, x + 1, 1, 30, 27, '#7b7671');
    fill(ctx, x, 0, T, 2, '#928c85');
    fill(ctx, x + 1, 2, 30, 1, 'rgba(255,255,255,0.12)');
    crack(ctx, x, [[6, 4], [12, 14], [10, 26]], '#585450');
    grain(ctx, x, 0, T, 28, '#8a857f', 24, 13);
    grain(ctx, x, 0, T, 28, '#605c58', 16, 15);
    fill(ctx, x, 28, T, 4, 'rgba(0,0,0,0.4)');
  },
  [TILE.parkingPillar]: (ctx, x) => {
    parkingFloor(ctx, x);
    fill(ctx, x + 4, 4, 26, 26, 'rgba(0,0,0,0.35)');
    fill(ctx, x + 4, 4, 24, 24, '#9c9791');
    fill(ctx, x + 6, 6, 20, 20, '#b0aba4');
    fill(ctx, x + 6, 6, 20, 4, '#c9b23a'); // hazard stripe
    fill(ctx, x + 6, 10, 20, 2, '#1b1b1f');
    fill(ctx, x + 6, 6, 2, 20, 'rgba(255,255,255,0.15)');
  },
  [TILE.parkingStripe]: (ctx, x) => {
    parkingFloor(ctx, x, 19);
    fill(ctx, x + 14, 0, 4, T, '#d8d4c8');
    grain(ctx, x + 14, 0, 4, T, '#5b5855', 8, 67);
  },
  [TILE.parkingFloor]: (ctx, x) => parkingFloor(ctx, x),
  [TILE.oilStain]: (ctx, x) => {
    parkingFloor(ctx, x, 27);
    ellipse(ctx, x + 15, 17, 9, 6, 'rgba(20,18,16,0.6)', 0.4);
    ellipse(ctx, x + 22, 12, 4, 3, 'rgba(20,18,16,0.5)');
    ellipse(ctx, x + 13, 15, 4, 2, 'rgba(90,60,120,0.25)', 0.4); // oily sheen
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
    grass(ctx, x);
    ctx.strokeStyle = '#8a9096';
    ctx.lineWidth = 1;
    for (let i = 0; i <= T; i += 8) {
      ctx.beginPath();
      ctx.moveTo(x + i, 2);
      ctx.lineTo(x + i + 8, 30);
      ctx.moveTo(x + i + 8, 2);
      ctx.lineTo(x + i, 30);
      ctx.stroke();
    }
    fill(ctx, x, 0, T, 2, '#6b7077');
    fill(ctx, x, 30, T, 2, '#6b7077');
    fill(ctx, x, 0, 2, T, '#5a5f66');
  },
  [TILE.gateClosed]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#2f3439');
    for (let i = 3; i < T; i += 7) {
      fill(ctx, x + i, 0, 3, T, '#8b939b');
      fill(ctx, x + i, 0, 1, T, '#b5bcc3');
    }
    fill(ctx, x, 6, T, 3, '#6d757d');
    fill(ctx, x, 23, T, 3, '#6d757d');
    fill(ctx, x, 14, T, 4, '#a3282a');
    fill(ctx, x + 2, 15, T - 4, 1, '#d84a4c');
  },
  [TILE.dirt]: (ctx, x) => {
    if (swatch(ctx, x, 'dirt')) return;
    fill(ctx, x, 0, T, T, '#6b5a44');
    grain(ctx, x, 0, T, T, '#7a6850', 50, 31);
    grain(ctx, x, 0, T, T, '#5a4a37', 40, 37);
    grain(ctx, x, 0, T, T, '#8a7a5a', 10, 43, 2);
    grain(ctx, x, 0, T, T, '#4a3a2a', 6, 45, 2);
  },
  [TILE.asphaltCrack]: (ctx, x) => {
    asphalt(ctx, x, 13);
    crack(ctx, x, [[2, 26], [9, 18], [14, 20], [19, 9], [27, 4]], '#1e2024', 1.2);
    crack(ctx, x, [[14, 20], [17, 27]], '#1e2024');
    crack(ctx, x, [[3, 27], [10, 19]], 'rgba(255,255,255,0.06)');
  },
  [TILE.manhole]: (ctx, x) => {
    asphalt(ctx, x, 15);
    ellipse(ctx, x + 16.5, 16.5, 10.5, 10.5, 'rgba(0,0,0,0.35)');
    ellipse(ctx, x + 16, 16, 10, 10, '#4a4d52');
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
    ellipse(ctx, x + 13, 12, 2, 1.2, 'rgba(255,255,255,0.12)');
  },
  [TILE.crosswalk]: (ctx, x) => {
    asphalt(ctx, x, 47);
    for (let i = 2; i < T; i += 8) fill(ctx, x + i, 0, 4, T, '#d5d2c8');
    grain(ctx, x, 0, T, T, ASPHALT, 40, 47);
  },
  [TILE.track]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#9a4b3c');
    grain(ctx, x, 0, T, T, '#a8564a', 50, 53);
    grain(ctx, x, 0, T, T, '#86402f', 40, 59);
  },
  [TILE.trackLine]: (ctx, x) => {
    tileDrawers[TILE.track](ctx, x);
    fill(ctx, x, 14, T, 3, '#e8e2d2');
  },
  [TILE.schoolFloor]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#bfb39a');
    fill(ctx, x, 0, T, 1, '#8f8570');
    fill(ctx, x, 0, 1, T, '#8f8570');
    fill(ctx, x + 16, 0, 1, T, '#a99d86');
    fill(ctx, x, 16, T, 1, '#a99d86');
    grain(ctx, x, 0, T, T, '#cfc3aa', 30, 61);
  },
  [TILE.platform]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#a8a49a');
    fill(ctx, x, 0, T, 1, '#8a867c');
    fill(ctx, x, 0, 1, T, '#8a867c');
    fill(ctx, x, 27, T, 5, '#d8c45a'); // yellow safety line
    grain(ctx, x, 0, T, 26, '#b5b1a6', 30, 71);
  },
  [TILE.rail]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#4a4640');
    grain(ctx, x, 0, T, T, '#5a554d', 60, 73, 2); // ballast
    for (let i = 2; i < T; i += 8) fill(ctx, x + i, 0, 5, T, '#6b5a44'); // sleepers
    fill(ctx, x, 9, T, 3, '#9aa0a6');
    fill(ctx, x, 21, T, 3, '#9aa0a6');
    fill(ctx, x, 9, T, 1, '#c8ccd2');
    fill(ctx, x, 21, T, 1, '#c8ccd2');
  },
  [TILE.water]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#2a4767');
    grain(ctx, x, 0, T, T, '#33557a', 40, 77, 2);
    grain(ctx, x, 0, T, T, '#233d5a', 20, 78, 2);
    ctx.strokeStyle = 'rgba(180,210,240,0.35)';
    ctx.lineWidth = 1;
    for (const [wx, wy, w] of [
      [3, 8, 10],
      [17, 20, 9],
      [8, 27, 7],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x + wx, wy);
      ctx.quadraticCurveTo(x + wx + w / 2, wy - 2, x + wx + w, wy);
      ctx.stroke();
    }
  },
  [TILE.riverbank]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#7f7a6a');
    grain(ctx, x, 0, T, T, '#8f8a78', 40, 79, 2);
    fill(ctx, x, 0, T, 6, '#2a4767');
    fill(ctx, x, 6, T, 2, 'rgba(200,220,240,0.35)');
  },
  [TILE.sewerFloor]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#383d3a');
    grain(ctx, x, 0, T, T, '#434945', 50, 83);
    grain(ctx, x, 0, T, T, '#2a2e2c', 40, 89);
    fill(ctx, x, 0, T, 1, '#2a2e2c');
    fill(ctx, x, 0, 1, T, '#2a2e2c');
    ellipse(ctx, x + 20, 22, 6, 3, 'rgba(120,160,150,0.12)'); // damp sheen
  },
  [TILE.sewerWall]: (ctx, x) => {
    bricks(ctx, x, 0, 26, 16, 8, '#565b57', '#3a3e3b', 33, ['#5e635f', '#4e5350', '#616660']);
    fill(ctx, x, 26, T, 6, '#2f5a48'); // moss line
    grain(ctx, x, 20, T, 8, '#3f6a55', 12, 35);
    fill(ctx, x, 30, T, 2, 'rgba(0,0,0,0.4)');
    fill(ctx, x + 6, 3, 1, 20, 'rgba(160,200,190,0.12)'); // wet streak
  },
  [TILE.sewerWater]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#233a2f');
    grain(ctx, x, 0, T, T, '#2c4a3a', 50, 97, 2);
    fill(ctx, x + 6, 12, 12, 1, 'rgba(160,200,170,0.25)');
    fill(ctx, x + 18, 24, 8, 1, 'rgba(160,200,170,0.18)');
  },
  [TILE.bikeLane]: (ctx, x) => {
    fill(ctx, x, 0, T, T, '#6b4a3a');
    grain(ctx, x, 0, T, T, '#7a5645', 40, 101);
    fill(ctx, x, 15, T, 2, '#e8e2d2');
  },
  [TILE.sidewalkCrack]: (ctx, x) => {
    sidewalk(ctx, x, 8);
    crack(ctx, x, [[4, 28], [11, 21], [13, 12], [22, 6]], '#4f4c45');
    fill(ctx, x + 10, 20, 2, 2, '#5f7f46'); // weeds
    fill(ctx, x + 12, 18, 1, 3, '#4d6b3a');
    fill(ctx, x + 8, 22, 1, 2, '#6f8f50');
  },
};

export const TILE_COUNT = Object.keys(TILE).length;
/** 1px extruded border around every cell so zoomed sampling never bleeds into the neighbour */
export const TILE_PAD = 1;
export const TILE_CELL = T + TILE_PAD * 2;
export const TILE_ATLAS_W = TILE_CELL * TILE_COUNT;
export const TILE_ATLAS_H = TILE_CELL;

/**
 * Draws every tile id into a horizontal strip of padded cells (`TILE_CELL` apart, `TILE_PAD`
 * margin); frame index === tile id. Each tile is painted into a scratch canvas and blitted with
 * its edge pixels repeated into the padding, which is what the tileset's margin/spacing expects.
 */
export function drawTilesAtlas(ctx: Ctx): void {
  const scratch = document.createElement('canvas');
  scratch.width = T;
  scratch.height = T;
  const sctx = scratch.getContext('2d');
  if (!sctx) return;
  for (let id = 0; id < TILE_COUNT; id++) {
    const draw = tileDrawers[id];
    sctx.clearRect(0, 0, T, T);
    if (draw) draw(sctx, 0);
    const x = id * TILE_CELL + TILE_PAD;
    const y = TILE_PAD;
    ctx.drawImage(scratch, x, y);
    // extrude edges
    ctx.drawImage(scratch, 0, 0, T, 1, x, y - TILE_PAD, T, TILE_PAD);
    ctx.drawImage(scratch, 0, T - 1, T, 1, x, y + T, T, TILE_PAD);
    ctx.drawImage(scratch, 0, 0, 1, T, x - TILE_PAD, y, TILE_PAD, T);
    ctx.drawImage(scratch, T - 1, 0, 1, T, x + T, y, TILE_PAD, T);
    ctx.drawImage(scratch, 0, 0, 1, 1, x - TILE_PAD, y - TILE_PAD, TILE_PAD, TILE_PAD);
    ctx.drawImage(scratch, T - 1, 0, 1, 1, x + T, y - TILE_PAD, TILE_PAD, TILE_PAD);
    ctx.drawImage(scratch, 0, T - 1, 1, 1, x - TILE_PAD, y + T, TILE_PAD, TILE_PAD);
    ctx.drawImage(scratch, T - 1, T - 1, 1, 1, x + T, y + T, TILE_PAD, TILE_PAD);
  }
}
