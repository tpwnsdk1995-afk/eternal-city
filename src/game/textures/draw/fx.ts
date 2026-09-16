type Ctx = CanvasRenderingContext2D;

export function drawTracer(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, 'rgba(255,230,150,0)');
  g.addColorStop(0.6, 'rgba(255,230,150,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Directional muzzle flash, 3 frames (32×16, fired from the left edge → drawn with origin 0.1,0.5):
 * 0 hard white core + short petals, 1 long orange cone with side spikes, 2 thin fading wisp.
 */
export function drawMuzzle(ctx: Ctx, frame: number, w: number, h: number): void {
  const ox = w * 0.1;
  const cy = h / 2;
  const len = [w * 0.55, w * 0.88, w * 0.7][frame % 3];
  const spread = [h * 0.42, h * 0.5, h * 0.3][frame % 3];
  const alpha = [0.95, 0.9, 0.55][frame % 3];
  const cone = ctx.createLinearGradient(ox, 0, ox + len, 0);
  cone.addColorStop(0, `rgba(255,250,220,${alpha})`);
  cone.addColorStop(0.35, `rgba(255,200,90,${alpha * 0.9})`);
  cone.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(ox, cy);
  ctx.quadraticCurveTo(ox + len * 0.35, cy - spread, ox + len, cy - spread * 0.25);
  ctx.lineTo(ox + len, cy + spread * 0.25);
  ctx.quadraticCurveTo(ox + len * 0.35, cy + spread, ox, cy);
  ctx.closePath();
  ctx.fill();
  // side spikes (frames 0/1) — the classic star-shaped flash silhouette
  if (frame % 3 !== 2) {
    ctx.fillStyle = `rgba(255,220,130,${alpha * 0.8})`;
    const n = frame % 3 === 0 ? 4 : 6;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.75 + (i / (n - 1)) * Math.PI * 1.5;
      const r = i % 2 ? spread * 0.6 : spread * 1.05;
      const bx = ox + len * 0.22;
      ctx.beginPath();
      ctx.moveTo(bx, cy - 1.5);
      ctx.lineTo(bx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(bx, cy + 1.5);
      ctx.closePath();
      ctx.fill();
    }
  }
  // hot core
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(ox + len * 0.16, cy, len * 0.16, spread * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Blood decal, 3 variants: 0 splatter (hit), 1 pool (kill), 2 smear/drag (hit while moving). */
export function drawBlood(ctx: Ctx, frame: number, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2;
  const dark = 'rgba(110,12,14,0.9)';
  const mid = 'rgba(150,20,20,0.85)';
  const v = frame % 3;
  if (v === 0) {
    ctx.fillStyle = mid;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    const pts = [
      [-8, -4, 2],
      [7, -6, 2.5],
      [8, 5, 2],
      [-6, 7, 1.5],
      [0, -9, 1.5],
      [10, -1, 1],
      [-10, 1, 1],
    ];
    for (const [dx, dy, r] of pts) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(cx - 1, cy + 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (v === 1) {
    // pool: lumpy dark puddle with a glossy highlight
    ctx.fillStyle = dark;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = (w / 2 - 2) * (0.8 + ((i * 7) % 4) * 0.06);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mid;
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy, w * 0.28, h * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,120,120,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy - 2, 3, 1.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // smear: streaks dragged to the right
  ctx.fillStyle = mid;
  for (let i = 0; i < 4; i++) {
    const y = cy - 5 + i * 3.2;
    const l = w * (0.45 + ((i * 5) % 3) * 0.12);
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.2 + l / 2, y, l / 2, 1.3 + (i % 2) * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(cx - w * 0.22, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Metal-hit spark burst (2 frames): white-yellow rays + a few hot dots. */
export function drawSpark(ctx: Ctx, frame: number, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2;
  const n = 7;
  ctx.strokeStyle = frame ? 'rgba(255,200,120,0.75)' : 'rgba(255,245,200,0.95)';
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + frame * 0.35;
    const r0 = frame ? 3 : 1;
    const r1 = (frame ? w * 0.48 : w * 0.34) * (i % 2 ? 0.7 : 1);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, frame ? 1 : 2, 0, Math.PI * 2);
  ctx.fill();
}

/** Footstep dust: soft grey-brown puff kicked up while running. */
export function drawDust(ctx: Ctx, _f: number, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(170,160,140,0.55)');
  g.addColorStop(0.6, 'rgba(150,140,125,0.25)');
  g.addColorStop(1, 'rgba(140,130,115,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
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

/** Warm street-lamp glow (ADD-blended over the scene at dusk). */
export function drawLampGlow(ctx: CanvasRenderingContext2D, _f: number, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,214,140,0.55)');
  g.addColorStop(0.35, 'rgba(255,190,110,0.22)');
  g.addColorStop(1, 'rgba(255,170,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
