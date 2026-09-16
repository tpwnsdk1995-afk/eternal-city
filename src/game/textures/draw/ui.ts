type Ctx = CanvasRenderingContext2D;

/**
 * HUD chrome in the original's language (checked against gameplay footage): near-black charcoal
 * frames with thin grey outlines and black slot wells. Everything here is 9-sliced, so detail lives
 * in the edges and the centre stays a flat fill.
 */

function bevel(ctx: Ctx, x: number, y: number, w: number, h: number, light: string, dark: string): void {
  ctx.fillStyle = light;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = dark;
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
}

/**
 * 9-slice-able HUD panel. Reference footage of the original shows a near-black charcoal frame with a
 * thin light-grey outline and a faint inner line — no rivets, no brass — so that is what this draws.
 */
export function drawUiPanel(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(30,31,34,0.96)');
  g.addColorStop(0.5, 'rgba(19,20,22,0.96)');
  g.addColorStop(1, 'rgba(12,12,14,0.97)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // faint horizontal brushing
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let y = 3; y < h - 3; y += 4) ctx.fillRect(3, y, w - 6, 1);
  // outline: light grey outer, dark inner, then a hairline highlight along the top
  bevel(ctx, 0, 0, w, h, '#55575c', '#2a2b2e');
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.strokeRect(2.5, 2.5, w - 5, h - 5);
}

/** Inset slot (quickslot / item cell / list row): black well with a grey hairline frame, like the original's F-key row. */
export function drawUiSlot(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = '#3a3b3f';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(1, 1, w - 2, h - 2);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#101113');
  g.addColorStop(1, '#1a1b1e');
  ctx.fillStyle = g;
  ctx.fillRect(2, 2, w - 4, h - 4);
  // sunken: dark top, faint light bottom edge
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(2, 2, w - 4, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(2, h - 3, w - 4, 1);
}

/** 8×N vertical groove that separates HUD sections (9-sliced vertically). */
export function drawUiDivider(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = Math.floor(w / 2);
  ctx.fillStyle = '#050506';
  ctx.fillRect(cx - 1, 4, 1, h - 8);
  ctx.fillStyle = '#3d3f44';
  ctx.fillRect(cx, 4, 1, h - 8);
}

/** Small raised button (window close / toggles): dark grey with a light top edge. */
export function drawUiButton(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#3a3c41');
  g.addColorStop(1, '#1c1d20');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  bevel(ctx, 0, 0, w, h, '#6a6d74', '#08090a');
  bevel(ctx, 1, 1, w - 2, h - 2, '#4a4d54', '#141517');
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
