type Ctx = CanvasRenderingContext2D;

export function drawTracer(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, 'rgba(255,230,150,0)');
  g.addColorStop(0.6, 'rgba(255,230,150,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function drawMuzzle(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2;
  ctx.fillStyle = 'rgba(255,220,120,0.95)';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = i % 2 ? 3 : 7;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBlood(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(150,20,20,0.85)';
  const cx = w / 2;
  const cy = h / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  const pts = [
    [-8, -4, 2],
    [7, -6, 2.5],
    [8, 5, 2],
    [-6, 7, 1.5],
    [0, -9, 1.5],
  ];
  for (const [dx, dy, r] of pts) {
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawFire(ctx: Ctx, frame: number, w: number, h: number): void {
  const cx = w / 2;
  const base = h - 2;
  const heights = [10, 13, 11];
  const hh = heights[frame % heights.length];
  const outer = ctx.createLinearGradient(0, base - hh, 0, base);
  outer.addColorStop(0, 'rgba(255,200,60,0)');
  outer.addColorStop(0.4, 'rgba(255,140,30,0.9)');
  outer.addColorStop(1, 'rgba(220,60,20,0.95)');
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.moveTo(cx - 6, base);
  ctx.quadraticCurveTo(cx - 7, base - hh * 0.5, cx + (frame % 2 ? 1 : -1), base - hh);
  ctx.quadraticCurveTo(cx + 7, base - hh * 0.5, cx + 6, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,240,180,0.9)';
  ctx.beginPath();
  ctx.moveTo(cx - 2, base);
  ctx.quadraticCurveTo(cx - 2, base - hh * 0.4, cx, base - hh * 0.55);
  ctx.quadraticCurveTo(cx + 2, base - hh * 0.4, cx + 2, base);
  ctx.closePath();
  ctx.fill();
}

export function drawJumpMarker(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.strokeStyle = 'rgba(230,60,60,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,60,60,0.18)';
  ctx.fill();
}
