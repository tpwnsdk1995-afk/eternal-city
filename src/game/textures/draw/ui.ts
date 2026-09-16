type Ctx = CanvasRenderingContext2D;

/**
 * HUD chrome in the original's language: blue-grey riveted steel plates, sunken slots, a thin
 * brass accent. Everything here is 9-sliced, so detail lives in the corners/edges and the centre
 * stays a flat, brushed fill.
 */

function bevel(ctx: Ctx, x: number, y: number, w: number, h: number, light: string, dark: string): void {
  ctx.fillStyle = light;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = dark;
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
}

function rivet(ctx: Ctx, x: number, y: number, r = 1.8): void {
  ctx.fillStyle = '#0b0d11';
  ctx.beginPath();
  ctx.arc(x + 0.6, y + 0.6, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9aa3b2';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d7dde8';
  ctx.beginPath();
  ctx.arc(x - 0.5, y - 0.5, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

/** 9-slice-able HUD panel: riveted blue-grey steel with worn highlights and a thin brass inner line. */
export function drawUiPanel(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(40,46,58,0.97)');
  g.addColorStop(0.45, 'rgba(24,28,36,0.97)');
  g.addColorStop(1, 'rgba(15,17,22,0.98)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // brushed grain
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = 2; y < h - 2; y += 3) ctx.fillRect(2, y, w - 4, 1);
  // worn diagonal streaks
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = -h; i < w; i += 11) {
    ctx.beginPath();
    ctx.moveTo(i, h);
    ctx.lineTo(i + h, 0);
    ctx.stroke();
  }
  // plate edges: bright top-left, dark bottom-right, twice
  bevel(ctx, 0, 0, w, h, '#6b7385', '#07080b');
  bevel(ctx, 1, 1, w - 2, h - 2, '#39404d', '#151920');
  // brass accent line
  ctx.strokeStyle = 'rgba(201,162,39,0.55)';
  ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
  // corner rivets
  for (const [x, y] of [
    [7, 7],
    [w - 8, 7],
    [7, h - 8],
    [w - 8, h - 8],
  ])
    rivet(ctx, x, y);
}

/** Inset slot (quickslot / item cell / list row): sunken bevel, a shade lighter than the panel so icons read. */
export function drawUiSlot(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = '#07080a';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1f242c');
  g.addColorStop(1, '#2a3038');
  ctx.fillStyle = g;
  ctx.fillRect(2, 2, w - 4, h - 4);
  // sunken: dark top-left, light bottom-right
  ctx.fillStyle = '#0a0b0d';
  ctx.fillRect(0, 0, w, 2);
  ctx.fillRect(0, 0, 2, h);
  ctx.fillStyle = '#525a66';
  ctx.fillRect(0, h - 2, w, 2);
  ctx.fillRect(w - 2, 0, 2, h);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(2, 2, w - 4, 1);
}

/** 8×N vertical groove that separates HUD sections (9-sliced vertically). */
export function drawUiDivider(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = Math.floor(w / 2);
  ctx.fillStyle = '#07080b';
  ctx.fillRect(cx - 1, 4, 2, h - 8);
  ctx.fillStyle = '#4a5261';
  ctx.fillRect(cx + 1, 4, 1, h - 8);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(cx - 2, 4, 1, h - 8);
  rivet(ctx, cx, 8, 1.6);
  rivet(ctx, cx, h - 8, 1.6);
}

/** Small raised steel button (window close / toggles). */
export function drawUiButton(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#4a5261');
  g.addColorStop(1, '#262b34');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  bevel(ctx, 0, 0, w, h, '#8a94a6', '#0a0b0d');
  bevel(ctx, 1, 1, w - 2, h - 2, '#5c6575', '#1a1e25');
}

export function drawCrosshair(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy);
  ctx.lineTo(cx - 4, cy);
  ctx.moveTo(cx + 4, cy);
  ctx.lineTo(cx + 11, cy);
  ctx.moveTo(cx, cy - 11);
  ctx.lineTo(cx, cy - 4);
  ctx.moveTo(cx, cy + 4);
  ctx.lineTo(cx, cy + 11);
  ctx.stroke();
}
