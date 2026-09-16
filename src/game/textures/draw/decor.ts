type Ctx = CanvasRenderingContext2D;

/**
 * Street furniture drawn in the oblique view with the base at the bottom of the frame.
 * v2 (D2-3): every part is boxed with a 1px dark contour and a left-lit two-tone face so the props
 * sit in the same visual language as the figure renderer, plus 2000년대 서울 clutter (전신주, 현수막,
 * 쓰레기봉투, 노점, 전복 버스, 불탄 차, 바리케이드, 에어컨 외기, 오토바이, 형광등).
 */

const OUTLINE = 'rgba(0,0,0,0.55)';

function fill(ctx: Ctx, x: number, y: number, w: number, h: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

/** Lighten/darken a hex colour by a factor. */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
  const b = Math.min(255, Math.round((n & 255) * k));
  return `rgb(${r},${g},${b})`;
}

/** Filled box with contour and a lit left/top edge + shaded right/bottom edge. */
function box(ctx: Ctx, x: number, y: number, w: number, h: number, c: string, lit = true): void {
  fill(ctx, x, y, w, h, c);
  if (lit && w >= 3 && h >= 3) {
    fill(ctx, x, y, w, 1, shade(c, 1.25));
    fill(ctx, x, y, 1, h, shade(c, 1.18));
    fill(ctx, x + w - 1, y + 1, 1, h - 1, shade(c, 0.7));
    fill(ctx, x + 1, y + h - 1, w - 1, 1, shade(c, 0.65));
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
}

function shadow(ctx: Ctx, cx: number, baseY: number, rx: number, ry = rx * 0.35): void {
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function disc(ctx: Ctx, x: number, y: number, r: number, c: string, outline = true): void {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** Soot / grime blotches. */
function grime(ctx: Ctx, x: number, y: number, w: number, h: number, n: number, seed: number, c = 'rgba(0,0,0,0.35)'): void {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  ctx.fillStyle = c;
  for (let i = 0; i < n; i++) {
    const bx = x + rnd() * w;
    const by = y + rnd() * h;
    const r = 1.5 + rnd() * 3;
    ctx.beginPath();
    ctx.ellipse(bx, by, r * 1.4, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function text(ctx: Ctx, s: string, x: number, y: number, size: number, c: string, bold = true): void {
  ctx.font = `${bold ? 'bold ' : ''}${size}px 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = c;
  ctx.fillText(s, x, y);
}

/** 32×80 street lamp */
export function drawLamp(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 3;
  shadow(ctx, cx, base, 8);
  box(ctx, cx - 5, base - 6, 10, 6, '#3a3d42');
  box(ctx, cx - 2, 10, 4, base - 16, '#5b6069');
  box(ctx, cx - 2, 7, 13, 3, '#5b6069'); // arm
  box(ctx, cx + 6, 9, 9, 5, '#33363b'); // head
  fill(ctx, cx + 7, 14, 7, 2, '#fff2b0'); // lamp
  const g = ctx.createRadialGradient(cx + 10, 16, 1, cx + 10, 16, 11);
  g.addColorStop(0, 'rgba(255,240,180,0.5)');
  g.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 2, 5, 26, 24);
}

/** 32×56 vending machine (2000년대 자판기) */
export function drawVending(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 14, 4);
  box(ctx, 4, 4, 24, base - 4, '#b8342c');
  box(ctx, 6, 9, 14, 20, '#1e2a38', false); // window
  const cans = ['#f2c94c', '#3b7bc2', '#7bd88f', '#ffffff', '#c23b3b', '#f2c94c', '#3b7bc2', '#ffffff', '#7bd88f'];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) fill(ctx, 8 + c * 4, 12 + r * 6, 3, 4, cans[r * 3 + c]);
  fill(ctx, 6, 9, 14, 20, 'rgba(160,200,255,0.12)'); // glass sheen
  box(ctx, 22, 10, 4, 12, '#e8e8e8'); // buttons column
  for (let i = 0; i < 4; i++) fill(ctx, 23, 11 + i * 3, 2, 1.5, '#333');
  fill(ctx, 22, 24, 4, 3, '#222'); // coin slot
  box(ctx, 6, 32, 20, 8, '#2a1a1a', false); // pickup flap
  fill(ctx, 7, 33, 18, 2, '#5a3a3a');
  fill(ctx, 4, base - 6, 24, 6, '#5c1a16');
  text(ctx, '음료', 16, 45, 6, '#f7e6c3');
}

/** 24×32 trash can */
export function drawTrash(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 9, 3);
  box(ctx, 5, 8, 14, base - 8, '#4b6b3a');
  box(ctx, 4, 6, 16, 3, '#3a5a2c');
  box(ctx, 9, 3, 6, 4, '#2a3a20');
  fill(ctx, 7, 14, 10, 4, '#d8d4c8'); // label
  fill(ctx, 8, 15, 8, 1, '#4b6b3a');
  grime(ctx, 5, 18, 14, 10, 3, 7, 'rgba(0,0,0,0.25)');
}

/** 32×64 public phone booth */
export function drawPhone(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 13, 4);
  box(ctx, 4, 6, 24, base - 6, '#2f5f9a');
  box(ctx, 4, 6, 24, 4, '#1e3f6a');
  fill(ctx, 7, 12, 18, 30, 'rgba(180,210,240,0.5)'); // glass
  fill(ctx, 8, 13, 4, 28, 'rgba(255,255,255,0.18)');
  fill(ctx, 15, 12, 2, 30, '#1e3f6a');
  box(ctx, 9, 20, 5, 9, '#333', false); // phone
  fill(ctx, 6, 44, 20, 3, '#1e3f6a');
  fill(ctx, 5, 8, 22, 2, '#f2c94c'); // sign strip
}

/** 24×56 street sign */
export function drawSign(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 5, 2);
  box(ctx, w / 2 - 1, 14, 3, base - 14, '#8a9099');
  box(ctx, 3, 4, 18, 12, '#2c6e49');
  fill(ctx, 5, 8, 12, 1.5, '#ffffff');
  fill(ctx, 5, 11, 8, 1.5, '#ffffff');
  fill(ctx, 18, 7, 2, 6, '#ffffff');
}

/** 64×80 street tree (canopy over trunk) */
export function drawTree(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 4;
  shadow(ctx, cx, base, 20, 7);
  box(ctx, cx - 3, base - 26, 7, 26, '#4a3524');
  const blobs: [number, number, number, string][] = [
    [cx, 30, 22, '#3f6b33'],
    [cx - 14, 36, 14, '#35592b'],
    [cx + 14, 38, 14, '#35592b'],
    [cx - 4, 22, 12, '#4d7d3c'],
    [cx + 8, 26, 10, '#4d7d3c'],
  ];
  for (const [x, y, r, c] of blobs) disc(ctx, x, y, r, c);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(cx - 6, 20, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.arc(cx + 8, 40, 12, 0, Math.PI * 2);
  ctx.fill();
}

/** 16×28 fire hydrant */
export function drawHydrant(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, w / 2, base, 6, 2);
  box(ctx, 5, 8, 6, base - 8, '#c8402a');
  box(ctx, 3, 12, 10, 3, '#c8402a');
  box(ctx, 6, 4, 4, 4, '#a33222');
}

/** 48×24 bench */
export function drawBench(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, w / 2, base, 20, 3);
  box(ctx, 4, 6, 40, 4, '#6b4a2e');
  box(ctx, 4, 12, 40, 4, '#6b4a2e');
  box(ctx, 6, 16, 3, base - 16, '#2f3439');
  box(ctx, 39, 16, 3, base - 16, '#2f3439');
}

/** 64×72 bus stop shelter */
export function drawBusStop(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 28, 5);
  box(ctx, 2, 6, 60, 5, '#3a3d42'); // roof
  box(ctx, 4, 11, 3, base - 11, '#5b6069');
  box(ctx, 57, 11, 3, base - 11, '#5b6069');
  fill(ctx, 7, 12, 50, 30, 'rgba(170,200,230,0.32)'); // back glass
  box(ctx, 10, 16, 20, 22, '#e8e2d0', false); // ad poster
  fill(ctx, 12, 20, 16, 2, '#c23b3b');
  fill(ctx, 12, 26, 10, 2, '#3b7bc2');
  text(ctx, '광진', 20, 33, 6, '#333');
  box(ctx, 34, 20, 18, 10, '#2c6e49', false); // route sign
  text(ctx, '2222', 43, 25, 6, '#fff');
  box(ctx, 8, 44, 48, 3, '#6b4a2e'); // bench
}

/** 64×40 football goal (posts, crossbar, net) */
export function drawGoal(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 28, 4);
  ctx.strokeStyle = 'rgba(230,230,230,0.5)';
  ctx.lineWidth = 1;
  for (let x = 6; x <= w - 6; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x, base);
    ctx.stroke();
  }
  for (let y = 8; y <= base; y += 6) {
    ctx.beginPath();
    ctx.moveTo(4, y);
    ctx.lineTo(w - 4, y);
    ctx.stroke();
  }
  box(ctx, 3, 6, 3, base - 6, '#f0f0f0');
  box(ctx, w - 6, 6, 3, base - 6, '#f0f0f0');
  box(ctx, 3, 5, w - 6, 3, '#f0f0f0');
}

/** 24×96 flag pole with a Korean flag */
export function drawFlagpole(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 6, 2);
  box(ctx, w / 2 - 1, 6, 3, base - 6, '#9aa0a6');
  box(ctx, w / 2 - 4, base - 5, 8, 5, '#5b6069');
  box(ctx, w / 2 + 2, 8, 16, 11, '#f4f4f4');
  ctx.fillStyle = '#c23b3b';
  ctx.beginPath();
  ctx.arc(w / 2 + 10, 13.5, 3, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#2f5fa8';
  ctx.beginPath();
  ctx.arc(w / 2 + 10, 13.5, 3, 0, Math.PI);
  ctx.fill();
}

/** 32×72 parking-garage pillar (drawn tall so it occludes) */
export function drawPillar(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, w / 2, base, 14, 4);
  box(ctx, 6, 4, 20, base - 4, '#a29d96');
  fill(ctx, 6, base - 22, 20, 6, '#c9b23a');
  fill(ctx, 6, base - 16, 20, 3, '#1b1b1f');
  fill(ctx, 6, base - 13, 20, 6, '#c9b23a');
  fill(ctx, 6, base - 7, 20, 3, '#1b1b1f');
  grime(ctx, 6, base - 30, 20, 26, 4, 3, 'rgba(0,0,0,0.2)');
  text(ctx, 'B1', 16, 14, 8, '#2b4a7a');
}

// ---- D2-3 additions -------------------------------------------------------------------------

/** 24×112 concrete utility pole with a transformer box, insulators and a warning band. */
export function drawPole(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 3;
  shadow(ctx, cx, base, 7);
  box(ctx, cx - 3, 6, 6, base - 6, '#8e8a84');
  fill(ctx, cx - 3, base - 30, 6, 6, '#c9b23a'); // yellow/black band
  fill(ctx, cx - 3, base - 27, 6, 2, '#1b1b1f');
  fill(ctx, cx - 3, base - 24, 6, 2, '#1b1b1f');
  box(ctx, cx - 10, 8, 20, 3, '#5b5e63'); // cross-arm
  for (const dx of [-8, -3, 3, 8]) box(ctx, cx + dx - 1, 4, 2, 4, '#dcd8d0'); // insulators
  box(ctx, cx + 3, 22, 7, 12, '#4a4d52'); // transformer
  fill(ctx, cx + 4, 24, 5, 1, '#6a6d72');
  fill(ctx, cx + 4, 27, 5, 1, '#6a6d72');
  box(ctx, cx - 9, 40, 5, 8, '#c9c4bb'); // notice sheet
  fill(ctx, cx - 8, 42, 3, 1, '#c23b3b');
  fill(ctx, cx - 8, 44, 3, 1, '#333');
}

/** 96×40 street banner (현수막) strung between two posts. */
export function drawBanner(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, 6, base, 4, 2);
  shadow(ctx, w - 6, base, 4, 2);
  box(ctx, 4, 4, 3, base - 4, '#5b6069');
  box(ctx, w - 7, 4, 3, base - 4, '#5b6069');
  // cloth with a slight sag
  ctx.fillStyle = '#b8342c';
  ctx.beginPath();
  ctx.moveTo(7, 8);
  ctx.lineTo(w - 7, 8);
  ctx.lineTo(w - 7, 26);
  ctx.quadraticCurveTo(w / 2, 30, 7, 26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  fill(ctx, 8, 9, w - 16, 1, 'rgba(255,255,255,0.25)');
  text(ctx, '상가 임대 02-456-7890', w / 2, 17, 8, '#fff8e0');
  // torn corner
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(w - 14, 22, 6, 6);
}

/** 40×28 pile of garbage bags at the kerb. */
export function drawTrashbags(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, w / 2, base, 17, 4);
  const bags: [number, number, number, number, string][] = [
    [6, base - 12, 14, 12, '#1d1f24'],
    [17, base - 15, 15, 15, '#2a2d34'],
    [28, base - 10, 10, 10, '#e9e6de'],
    [11, base - 20, 12, 10, '#1d1f24'],
  ];
  for (const [x, y, bw, bh, c] of bags) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x + bw / 2, y + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
    fill(ctx, x + 3, y + 2, 3, 2, 'rgba(255,255,255,0.22)'); // sheen
    fill(ctx, x + bw / 2 - 1, y - 1, 2, 3, shade(c === '#e9e6de' ? '#c9c6be' : '#3a3d44', 1)); // knot
  }
  fill(ctx, 30, base - 4, 6, 3, '#c23b3b'); // stray red lid
}

/** 64×64 street vendor stall with a striped parasol. */
export function drawStall(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 3;
  shadow(ctx, cx, base, 26, 6);
  // cart
  box(ctx, 10, base - 22, 44, 18, '#8a6a48');
  box(ctx, 12, base - 20, 40, 6, '#c9c4bb'); // counter top
  for (let i = 0; i < 5; i++) box(ctx, 14 + i * 8, base - 19, 6, 4, ['#e0a030', '#c23b3b', '#f2e0a0', '#7bd88f', '#e0a030'][i], false); // goods
  disc(ctx, 16, base - 2, 4, '#2a2d34');
  disc(ctx, 48, base - 2, 4, '#2a2d34');
  box(ctx, cx - 1, 8, 3, base - 30, '#5b6069'); // pole
  // parasol (striped canopy)
  ctx.beginPath();
  ctx.moveTo(2, 22);
  ctx.quadraticCurveTo(cx, -4, w - 2, 22);
  ctx.closePath();
  ctx.fillStyle = '#e8e2d0';
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let x = 2; x < w; x += 12) fill(ctx, x, 0, 6, 24, '#c23b3b');
  ctx.restore();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let x = 4; x < w - 2; x += 6) fill(ctx, x, 21, 3, 3, x % 12 === 4 ? '#c23b3b' : '#e8e2d0'); // scalloped edge
  text(ctx, '떡볶이', cx, base - 8, 7, '#fff3d0');
}

/** 128×64 overturned city bus lying on its side. */
export function drawWreckBus(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 4;
  shadow(ctx, w / 2, base, 60, 7);
  // body on its side: roof toward the viewer bottom, underside up
  box(ctx, 6, 14, w - 12, base - 16, '#2f7a4f');
  fill(ctx, 6, 14, w - 12, 12, '#e8e6dd'); // white upper band (now sideways)
  fill(ctx, 6, 26, w - 12, 2, '#1f5a38');
  // windows row (cracked)
  for (let i = 0; i < 7; i++) {
    const x = 12 + i * 16;
    box(ctx, x, 30, 12, 12, '#1e2a38', false);
    fill(ctx, x + 1, 31, 4, 10, 'rgba(180,210,240,0.25)');
    if (i % 2 === 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.moveTo(x + 2, 32);
      ctx.lineTo(x + 8, 40);
      ctx.moveTo(x + 6, 31);
      ctx.lineTo(x + 4, 38);
      ctx.stroke();
    }
  }
  // wheels pointing up-ish along the top edge
  for (const x of [26, 38, 92, 104]) {
    disc(ctx, x, 12, 6, '#1b1b1f');
    disc(ctx, x, 12, 2.5, '#6a6d72');
  }
  fill(ctx, 6, 8, w - 12, 5, '#3a3d42'); // undercarriage
  // headlight / rear
  fill(ctx, 8, 44, 6, 4, '#f2e0a0');
  fill(ctx, w - 14, 44, 6, 4, '#c23b3b');
  text(ctx, '2222', 60, 20, 8, '#1f5a38');
  grime(ctx, 60, 14, 60, 40, 14, 11, 'rgba(0,0,0,0.45)');
  grime(ctx, 6, 40, 40, 14, 6, 5, 'rgba(120,70,30,0.4)'); // rust
  fill(ctx, 20, base - 2, 90, 2, 'rgba(0,0,0,0.5)'); // ground contact
}

/** 64×40 burnt-out sedan. */
export function drawWreckCar(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 29, 5);
  box(ctx, 4, base - 16, 56, 12, '#3a3230'); // body
  box(ctx, 16, base - 24, 30, 9, '#2a2422'); // cabin
  for (const x of [18, 32]) box(ctx, x, base - 22, 11, 6, '#141a22', false); // dark windows
  fill(ctx, 19, base - 21, 4, 4, 'rgba(180,210,240,0.15)');
  box(ctx, 8, base - 18, 6, 3, '#4a3a2a'); // hood buckled
  disc(ctx, 14, base - 3, 5, '#1b1b1f');
  disc(ctx, 50, base - 3, 5, '#1b1b1f');
  disc(ctx, 14, base - 3, 2, '#3a3d42');
  fill(ctx, 4, base - 11, 6, 3, '#6a5a40'); // dead headlight
  fill(ctx, 54, base - 11, 6, 3, '#5a2a2a');
  grime(ctx, 4, base - 26, 56, 22, 12, 21, 'rgba(0,0,0,0.5)');
  grime(ctx, 4, base - 16, 56, 12, 8, 9, 'rgba(150,80,30,0.45)'); // rust
  // door hanging open
  box(ctx, 44, base - 14, 4, 12, '#2f2826');
}

/** 48×28 police barrier (yellow/black stripes on steel legs). */
export function drawBarrier(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, w / 2, base, 22, 3);
  box(ctx, 6, 10, w - 12, 8, '#c9b23a');
  ctx.save();
  ctx.beginPath();
  ctx.rect(6, 10, w - 12, 8);
  ctx.clip();
  ctx.fillStyle = '#1b1b1f';
  for (let x = -4; x < w; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x + 6, 18);
    ctx.lineTo(x + 12, 10);
    ctx.lineTo(x + 6, 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  box(ctx, 8, 18, 3, base - 18, '#5b6069');
  box(ctx, w - 11, 18, 3, base - 18, '#5b6069');
  box(ctx, 4, base - 2, 10, 2, '#5b6069');
  box(ctx, w - 14, base - 2, 10, 2, '#5b6069');
  text(ctx, 'POLICE', w / 2, 6, 6, '#e8e6dd');
}

/** 28×22 wall-mounted air-conditioner outdoor unit. */
export function drawAc(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  box(ctx, 2, 2, w - 4, base - 4, '#c9c4bb');
  disc(ctx, 11, 11, 6, '#9a958c');
  disc(ctx, 11, 11, 4.5, '#5b6069', false);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  for (let a = 0; a < 6; a++) {
    ctx.beginPath();
    ctx.moveTo(11, 11);
    ctx.lineTo(11 + Math.cos((a / 6) * Math.PI * 2) * 4, 11 + Math.sin((a / 6) * Math.PI * 2) * 4);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) fill(ctx, 20, 5 + i * 3, 5, 1, '#8e8a84'); // grille
  fill(ctx, 3, base - 5, w - 6, 1, 'rgba(120,70,30,0.5)'); // rust drip line
  grime(ctx, 2, 2, w - 4, base - 4, 3, 17, 'rgba(0,0,0,0.2)');
}

/** 40×32 delivery scooter tipped over on its side. */
export function drawScooter(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 18, 4);
  box(ctx, 8, base - 10, 22, 6, '#c23b3b'); // body / fairing
  box(ctx, 26, base - 16, 8, 8, '#2a2d34'); // seat
  box(ctx, 30, base - 20, 9, 7, '#e8e6dd'); // delivery box
  text(ctx, '배달', 34, base - 16, 5, '#c23b3b');
  disc(ctx, 8, base - 4, 6, '#1b1b1f');
  disc(ctx, 8, base - 4, 2, '#6a6d72');
  disc(ctx, 30, base - 3, 5, '#1b1b1f');
  fill(ctx, 4, base - 14, 2, 8, '#5b6069'); // handlebar
  fill(ctx, 2, base - 15, 6, 2, '#5b6069');
  fill(ctx, 4, base - 12, 3, 2, '#f2e0a0'); // headlight
  grime(ctx, 8, base - 12, 24, 8, 4, 13, 'rgba(0,0,0,0.3)');
}

/** 64×24 reflection of a ceiling fluorescent tube on the wet garage floor (the tube itself is overhead). */
export function drawFluorescent(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(225,240,255,0.55)');
  g.addColorStop(0.5, 'rgba(200,225,255,0.22)');
  g.addColorStop(1, 'rgba(200,225,255,0)');
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
  ctx.restore();
  fill(ctx, w / 2 - 14, h / 2 - 1, 28, 2, 'rgba(240,248,255,0.5)'); // hot core of the tube's mirror image
}
