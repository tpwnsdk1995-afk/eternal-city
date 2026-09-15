type Ctx = CanvasRenderingContext2D;

/** Street furniture drawn in the oblique view with the base at the bottom of the frame. */

function fill(ctx: Ctx, x: number, y: number, w: number, h: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function shadow(ctx: Ctx, cx: number, baseY: number, rx: number, ry = rx * 0.35): void {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 32×80 street lamp */
export function drawLamp(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 3;
  shadow(ctx, cx, base, 7);
  fill(ctx, cx - 4, base - 5, 8, 5, '#3a3d42');
  fill(ctx, cx - 1.5, 10, 3, base - 14, '#5b6069');
  fill(ctx, cx - 0.5, 10, 1, base - 14, '#8a9099');
  fill(ctx, cx - 1.5, 8, 12, 3, '#5b6069'); // arm
  fill(ctx, cx + 6, 10, 8, 4, '#3a3d42'); // head
  fill(ctx, cx + 7, 14, 6, 2, '#fff2b0'); // lamp
  const g = ctx.createRadialGradient(cx + 10, 16, 1, cx + 10, 16, 10);
  g.addColorStop(0, 'rgba(255,240,180,0.45)');
  g.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx, 6, 22, 22);
}

/** 32×56 vending machine (2000년대 자판기) */
export function drawVending(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 14, 4);
  fill(ctx, 4, 4, 24, base - 4, '#b8342c');
  fill(ctx, 4, 4, 24, 3, '#d9524a');
  fill(ctx, 6, 9, 14, 20, '#1e2a38'); // window
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) fill(ctx, 8 + c * 4, 12 + r * 6, 3, 4, ['#f2c94c', '#3b7bc2', '#7bd88f', '#ffffff', '#c23b3b', '#f2c94c', '#3b7bc2', '#ffffff', '#7bd88f'][r * 3 + c]);
  fill(ctx, 22, 10, 4, 12, '#e8e8e8'); // buttons column
  for (let i = 0; i < 4; i++) fill(ctx, 23, 11 + i * 3, 2, 1.5, '#333');
  fill(ctx, 22, 24, 4, 3, '#222'); // coin slot
  fill(ctx, 6, 32, 20, 8, '#2a1a1a'); // pickup flap
  fill(ctx, 7, 33, 18, 2, '#5a3a3a');
  fill(ctx, 4, base - 6, 24, 6, '#5c1a16');
  fill(ctx, 4, 4, 1, base - 4, 'rgba(255,255,255,0.25)');
}

/** 24×32 trash can */
export function drawTrash(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 9, 3);
  fill(ctx, 5, 8, 14, base - 8, '#4b6b3a');
  fill(ctx, 4, 6, 16, 3, '#3a5a2c');
  fill(ctx, 9, 4, 6, 3, '#2a3a20');
  fill(ctx, 6, 12, 1, base - 14, 'rgba(255,255,255,0.2)');
  fill(ctx, 7, 14, 10, 4, '#d8d4c8'); // label
}

/** 32×64 public phone booth */
export function drawPhone(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 13, 4);
  fill(ctx, 4, 6, 24, base - 6, '#2f5f9a');
  fill(ctx, 4, 6, 24, 4, '#1e3f6a');
  fill(ctx, 7, 12, 18, 30, 'rgba(180,210,240,0.55)'); // glass
  fill(ctx, 15, 12, 2, 30, '#1e3f6a');
  fill(ctx, 9, 20, 5, 9, '#333'); // phone
  fill(ctx, 6, 44, 20, 3, '#1e3f6a');
  fill(ctx, 5, 8, 22, 2, '#f2c94c'); // sign strip
}

/** 24×56 street sign */
export function drawSign(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 5, 2);
  fill(ctx, w / 2 - 1, 14, 2, base - 14, '#8a9099');
  fill(ctx, 3, 4, 18, 12, '#2c6e49');
  fill(ctx, 3, 4, 18, 1, '#5aa87a');
  fill(ctx, 5, 8, 12, 1.5, '#ffffff');
  fill(ctx, 5, 11, 8, 1.5, '#ffffff');
  fill(ctx, 18, 7, 2, 6, '#ffffff');
}

/** 64×80 street tree (canopy over trunk) */
export function drawTree(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 4;
  shadow(ctx, cx, base, 20, 7);
  fill(ctx, cx - 3, base - 26, 6, 26, '#4a3524');
  fill(ctx, cx - 1, base - 26, 2, 26, '#6a4f36');
  const blobs: [number, number, number, string][] = [
    [cx, 30, 22, '#3f6b33'],
    [cx - 14, 36, 14, '#35592b'],
    [cx + 14, 38, 14, '#35592b'],
    [cx - 4, 22, 12, '#4d7d3c'],
    [cx + 8, 26, 10, '#4d7d3c'],
  ];
  for (const [x, y, r, c] of blobs) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(cx - 6, 20, 8, 0, Math.PI * 2);
  ctx.fill();
}

/** 16×28 fire hydrant */
export function drawHydrant(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, w / 2, base, 6, 2);
  fill(ctx, 5, 8, 6, base - 8, '#c8402a');
  fill(ctx, 3, 12, 10, 3, '#c8402a');
  fill(ctx, 6, 5, 4, 4, '#a33222');
  fill(ctx, 6, 9, 1, base - 12, 'rgba(255,255,255,0.3)');
}

/** 48×24 bench */
export function drawBench(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, w / 2, base, 20, 3);
  fill(ctx, 4, 6, 40, 4, '#6b4a2e');
  fill(ctx, 4, 12, 40, 4, '#6b4a2e');
  fill(ctx, 4, 6, 40, 1, '#8a6a48');
  fill(ctx, 4, 12, 40, 1, '#8a6a48');
  fill(ctx, 6, 16, 3, base - 16, '#2f3439');
  fill(ctx, 39, 16, 3, base - 16, '#2f3439');
}

/** 64×72 bus stop shelter */
export function drawBusStop(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 3;
  shadow(ctx, w / 2, base, 28, 5);
  fill(ctx, 2, 6, 60, 5, '#3a3d42'); // roof
  fill(ctx, 2, 6, 60, 1, '#6b7077');
  fill(ctx, 4, 11, 3, base - 11, '#5b6069');
  fill(ctx, 57, 11, 3, base - 11, '#5b6069');
  fill(ctx, 7, 12, 50, 30, 'rgba(170,200,230,0.35)'); // back glass
  fill(ctx, 10, 16, 20, 22, '#e8e2d0'); // ad poster
  fill(ctx, 12, 20, 16, 2, '#c23b3b');
  fill(ctx, 12, 26, 10, 2, '#3b7bc2');
  fill(ctx, 34, 20, 18, 10, '#2c6e49'); // route sign
  fill(ctx, 8, 44, 48, 3, '#6b4a2e'); // bench
}

/** 32×72 parking-garage pillar (drawn tall so it occludes) */
export function drawPillar(ctx: Ctx, _f: number, w: number, h: number): void {
  const base = h - 2;
  shadow(ctx, w / 2, base, 14, 4);
  fill(ctx, 6, 4, 20, base - 4, '#a29d96');
  fill(ctx, 6, 4, 20, 2, '#c4bfb8');
  fill(ctx, 6, 4, 3, base - 4, '#8b867f');
  fill(ctx, 6, base - 22, 20, 6, '#c9b23a');
  fill(ctx, 6, base - 16, 20, 3, '#1b1b1f');
  fill(ctx, 6, base - 13, 20, 6, '#c9b23a');
  fill(ctx, 6, base - 7, 20, 3, '#1b1b1f');
}
