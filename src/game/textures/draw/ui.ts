type Ctx = CanvasRenderingContext2D;

/** 9-slice-able dark panel with a thin brass edge (original EC UI leaned dark steel + gold trim). */
export function drawUiPanel(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(14,17,22,0.94)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#6f6a55';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1;
  ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
}

export function drawUiSlot(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(30,34,40,0.95)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#4b5058';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
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
