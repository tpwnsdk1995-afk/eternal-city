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

/** 40mm grenade shell: brass case + olive warhead, drawn pointing right. */
export function drawShellGrenade(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, 1, w * 0.4, h - 2);
  ctx.fillStyle = '#5b6b3a';
  ctx.beginPath();
  ctx.moveTo(w * 0.4, 0);
  ctx.lineTo(w - 2, 0);
  ctx.arc(w - 2, h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(w * 0.4, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(1, 1, w - 3, 1);
}

/** RPG rocket: dark green body, grey nose cone, orange exhaust glow at the tail; points right. */
export function drawRocket(ctx: Ctx, _f: number, w: number, h: number): void {
  const cy = h / 2;
  ctx.fillStyle = '#3f4a2e';
  ctx.fillRect(4, cy - 2, w - 10, 4);
  ctx.fillStyle = '#8b939b';
  ctx.beginPath();
  ctx.moveTo(w - 6, cy - 3);
  ctx.lineTo(w, cy);
  ctx.lineTo(w - 6, cy + 3);
  ctx.closePath();
  ctx.fill();
  // fins
  ctx.fillStyle = '#2b3320';
  ctx.fillRect(4, cy - 4, 3, 8);
  // exhaust
  const g = ctx.createLinearGradient(0, 0, 5, 0);
  g.addColorStop(0, 'rgba(255,200,80,0)');
  g.addColorStop(1, 'rgba(255,170,60,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0, cy - 2, 5, 4);
}

/** 6-frame fireball: white core → orange bloom → grey smoke ring. */
export function drawExplosion(ctx: Ctx, frame: number, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2;
  const t = frame / 5;
  const R = w / 2 - 2;
  const r = R * (0.35 + 0.65 * Math.sqrt(t));
  // smoke ring (late frames)
  if (frame >= 2) {
    ctx.fillStyle = `rgba(70,64,60,${0.55 * (1 - t) + 0.15})`;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rr = r * (0.85 + ((i * 7) % 5) * 0.05);
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  // fireball
  const fire = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * (1 - t * 0.35));
  fire.addColorStop(0, `rgba(255,255,230,${1 - t * 0.6})`);
  fire.addColorStop(0.35, `rgba(255,190,70,${0.95 - t * 0.6})`);
  fire.addColorStop(0.75, `rgba(220,80,20,${0.8 - t * 0.7})`);
  fire.addColorStop(1, 'rgba(120,30,10,0)');
  ctx.fillStyle = fire;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // sparks
  if (frame <= 3) {
    ctx.fillStyle = 'rgba(255,240,180,0.9)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + frame * 0.4;
      const d = r * (0.6 + t * 0.6);
      ctx.fillRect(cx + Math.cos(a) * d - 1, cy + Math.sin(a) * d - 1, 2, 2);
    }
  }
}

/** Black scorch mark left on the ground after a blast. */
export function drawScorch(ctx: Ctx, _f: number, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, w / 2);
  g.addColorStop(0, 'rgba(20,16,14,0.85)');
  g.addColorStop(0.6, 'rgba(30,26,22,0.55)');
  g.addColorStop(1, 'rgba(30,26,22,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rr = (w / 2) * (0.8 + ((i * 5) % 4) * 0.06);
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawSmokePuff(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(200,200,200,0.7)');
  g.addColorStop(1, 'rgba(160,160,160,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
