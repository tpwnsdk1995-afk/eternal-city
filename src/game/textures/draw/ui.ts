type Ctx = CanvasRenderingContext2D;

/**
 * 9-slice-able HUD panel: dark brushed steel with a bevelled edge and a thin brass inner line —
 * the original's HUD leaned on dark grey metal frames with gold accents.
 */
export function drawUiPanel(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(30,34,40,0.96)');
  g.addColorStop(0.5, 'rgba(18,21,26,0.96)');
  g.addColorStop(1, 'rgba(12,14,18,0.97)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // brushed texture
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let y = 2; y < h - 2; y += 3) ctx.fillRect(2, y, w - 4, 1);
  // outer bevel
  ctx.fillStyle = '#5d6270';
  ctx.fillRect(0, 0, w, 1);
  ctx.fillRect(0, 0, 1, h);
  ctx.fillStyle = '#0a0b0d';
  ctx.fillRect(0, h - 1, w, 1);
  ctx.fillRect(w - 1, 0, 1, h);
  ctx.fillStyle = '#2c3038';
  ctx.fillRect(1, 1, w - 2, 1);
  ctx.fillRect(1, 1, 1, h - 2);
  // brass inner line
  ctx.strokeStyle = 'rgba(201,162,39,0.75)';
  ctx.lineWidth = 1;
  ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
  // rivets
  ctx.fillStyle = '#8a8f9c';
  for (const [x, y] of [
    [6, 6],
    [w - 7, 6],
    [6, h - 7],
    [w - 7, h - 7],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Inset slot (quickslot / item cell) with a sunken bevel. */
export function drawUiSlot(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(8,10,13,0.95)';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(22,26,32,1)');
  g.addColorStop(1, 'rgba(34,38,46,1)');
  ctx.fillStyle = g;
  ctx.fillRect(2, 2, w - 4, h - 4);
  ctx.fillStyle = '#0a0b0d';
  ctx.fillRect(0, 0, w, 2);
  ctx.fillRect(0, 0, 2, h);
  ctx.fillStyle = '#4b5058';
  ctx.fillRect(0, h - 2, w, 2);
  ctx.fillRect(w - 2, 0, 2, h);
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
