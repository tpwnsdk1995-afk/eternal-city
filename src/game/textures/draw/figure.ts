import type { Dir } from '../../systems/facing';

type Ctx = CanvasRenderingContext2D;

export type GunKind = 'pistol' | 'smg' | 'rifle';

export interface FigureStyle {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes?: string;
  hairStyle?: 'short' | 'long' | 'bald' | 'helmet' | 'cap';
  helmetColor?: string;
  gun?: GunKind | null;
  /** hunched, arms reaching forward, torn clothes */
  zombie?: boolean;
  blood?: number; // 0..1
  glow?: string;
  /** overall size multiplier (boss) */
  size?: number;
  coat?: string;
  dress?: boolean;
  stripes?: boolean;
  pack?: boolean;
  vest?: string;
  eyes?: string;
}

const shade = (hex: string, amt: number): string => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const f = (h: string) => Math.max(0, Math.min(255, Math.round(parseInt(h, 16) * amt)));
  return `rgb(${f(m[1])},${f(m[2])},${f(m[3])})`;
};

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();
}

function circle(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

const GUN_LEN: Record<GunKind, number> = { pistol: 7, smg: 11, rifle: 16 };

/**
 * Oblique (3/4 top-down) figure, ~34px tall at size 1 inside a 48px frame, feet near the bottom.
 * Three base poses (front / back / side) cover the 8 directions; W-facing dirs mirror E-facing ones.
 * `frame` 0..3 is the walk cycle with 0 as the neutral stance.
 */
export function drawFigure(ctx: Ctx, dir: Dir, frame: number, w: number, h: number, s: FigureStyle): void {
  const k = (s.size ?? 1) * (w / 48);
  const mirror = dir === 3 || dir === 4 || dir === 5; // SW, W, NW drawn as SE, E, NE mirrored
  const pose: 'front' | 'back' | 'side' = dir === 2 ? 'front' : dir === 6 ? 'back' : dir === 0 || dir === 4 ? 'side' : dir === 1 || dir === 3 ? 'front' : 'back';
  const diagonal = dir % 2 === 1;

  ctx.save();
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.translate(w / 2, h - 4 * k);
  ctx.scale(k, k);
  // origin is now at the feet; up is negative y

  const t = (frame % 4) / 4;
  const swing = Math.sin(t * Math.PI * 2); // -1..1 leg phase
  const bob = Math.abs(swing) * (s.zombie ? 0.6 : 1);
  const moving = frame % 4 !== 0;

  if (s.glow) {
    const g = ctx.createRadialGradient(0, -14, 2, 0, -14, 22);
    g.addColorStop(0, s.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-24, -40, 48, 46);
  }

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const skin = s.skin;
  const shoes = s.shoes ?? '#1f1f22';
  const pants = s.pants;
  const hunch = s.zombie ? 3 : 0;
  const headY = -30 + hunch + bob * 0.3;
  const torsoTop = -24 + bob * 0.3;

  // ---------------- legs ----------------
  const legW = 5;
  const legH = 12;
  if (pose === 'side') {
    const lx = moving ? swing * 3.5 : 0;
    // back leg
    rr(ctx, -lx - 3, -legH, legW, legH, 1.5, shade(pants, 0.75));
    rr(ctx, -lx - 3, -2.5, legW + 1, 2.5, 1, shade(shoes, 0.8));
    // front leg
    rr(ctx, lx - 2, -legH, legW, legH, 1.5, pants);
    rr(ctx, lx - 2, -2.5, legW + 1, 2.5, 1, shoes);
  } else {
    const dy = moving ? swing * 1.8 : 0;
    rr(ctx, -6, -legH + dy, legW, legH - dy, 1.5, dy > 0 ? shade(pants, 0.85) : pants);
    rr(ctx, 1, -legH - dy, legW, legH + dy, 1.5, dy < 0 ? shade(pants, 0.85) : pants);
    rr(ctx, -6.5, -2.5 + Math.max(0, dy) * 0.5, legW + 1, 2.5, 1, shoes);
    rr(ctx, 0.5, -2.5 + Math.max(0, -dy) * 0.5, legW + 1, 2.5, 1, shoes);
  }

  // ---------------- torso ----------------
  const torsoH = 13;
  const shirt = s.shirt;
  if (pose === 'side') {
    rr(ctx, -5, torsoTop, 10, torsoH, 3, shirt);
    if (s.coat) rr(ctx, -5.5, torsoTop + 2, 11, torsoH + 6, 3, s.coat);
    if (s.vest) rr(ctx, -4, torsoTop + 1, 8, torsoH - 2, 2, s.vest);
  } else {
    rr(ctx, -7, torsoTop, 14, torsoH, 3.5, shirt);
    if (s.dress) {
      ctx.fillStyle = shirt;
      ctx.beginPath();
      ctx.moveTo(-7, torsoTop + torsoH - 2);
      ctx.lineTo(7, torsoTop + torsoH - 2);
      ctx.lineTo(9, -3);
      ctx.lineTo(-9, -3);
      ctx.closePath();
      ctx.fill();
    }
    if (s.coat) {
      rr(ctx, -8, torsoTop + 1, 16, torsoH + 7, 3, s.coat);
      rr(ctx, -2.5, torsoTop + 1, 5, torsoH + 6, 1, pose === 'front' ? shade(s.coat, 0.7) : s.coat);
    }
    if (s.vest && pose === 'front') rr(ctx, -5, torsoTop + 1, 10, torsoH - 1, 2, s.vest);
    if (s.stripes) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let y = torsoTop + 2; y < torsoTop + torsoH - 1; y += 3.5) ctx.fillRect(-6.5, y, 13, 1.4);
    }
    if (s.pack && pose === 'back') rr(ctx, -5.5, torsoTop + 1, 11, 10, 2, '#3a3d2c');
    if (s.pack && pose === 'front') {
      ctx.fillStyle = '#bfc2b0';
      ctx.fillRect(-5, torsoTop, 1.6, torsoH);
      ctx.fillRect(3.4, torsoTop, 1.6, torsoH);
    }
    if (s.zombie && pose === 'front') {
      ctx.fillStyle = shade(shirt, 0.55);
      ctx.fillRect(-4, torsoTop + 6, 3, 5);
      ctx.fillRect(3, torsoTop + 3, 2.5, 4);
    }
  }
  // collar/neck
  circle(ctx, pose === 'side' ? 1 : 0, torsoTop + 0.5, 2.2, skin);

  // ---------------- arms ----------------
  const armW = 3.6;
  const armSwing = moving ? swing * 2.5 : 0;
  if (s.zombie) {
    // reaching forward
    if (pose === 'side') {
      rr(ctx, 2, torsoTop + 2, 11, armW, 1.5, shirt);
      circle(ctx, 13.5, torsoTop + 3.8, 2, skin);
      rr(ctx, 2, torsoTop + 6.5, 9, armW, 1.5, shade(shirt, 0.8));
      circle(ctx, 11.5, torsoTop + 8.3, 2, skin);
    } else if (pose === 'front') {
      rr(ctx, -10, torsoTop + 1, armW, 9, 1.5, shirt);
      rr(ctx, 6.4, torsoTop + 1, armW, 9, 1.5, shirt);
      circle(ctx, -8.2, torsoTop + 11, 2.3, skin);
      circle(ctx, 8.2, torsoTop + 11, 2.3, skin);
    } else {
      rr(ctx, -10, torsoTop + 1, armW, 7, 1.5, shirt);
      rr(ctx, 6.4, torsoTop + 1, armW, 7, 1.5, shirt);
    }
  } else if (pose === 'side') {
    // far arm (behind torso) + near arm holding gun forward
    rr(ctx, -3 - armSwing, torsoTop + 2, armW, 10, 1.5, shade(shirt, 0.75));
    if (s.gun) {
      rr(ctx, 1, torsoTop + 3, 9, armW, 1.5, shirt);
      circle(ctx, 10, torsoTop + 4.8, 2, skin);
      const len = GUN_LEN[s.gun];
      ctx.fillStyle = '#15171a';
      ctx.fillRect(9, torsoTop + 3.6, len, 2.4);
      if (s.gun !== 'pistol') ctx.fillRect(12, torsoTop + 5.5, 2, 4); // magazine
      if (s.gun === 'rifle') ctx.fillRect(3, torsoTop + 5, 6, 2.2); // stock
    } else {
      rr(ctx, 0 + armSwing, torsoTop + 2, armW, 10, 1.5, shirt);
      circle(ctx, 1.8 + armSwing, torsoTop + 12.5, 2, skin);
    }
  } else if (pose === 'front') {
    rr(ctx, -10.5, torsoTop + 1.5, armW, 10 + armSwing * 0.4, 1.5, shirt);
    rr(ctx, 6.9, torsoTop + 1.5, armW, 10 - armSwing * 0.4, 1.5, shirt);
    circle(ctx, -8.7, torsoTop + 12.5 + armSwing * 0.4, 2.1, skin);
    circle(ctx, 8.7, torsoTop + 12.5 - armSwing * 0.4, 2.1, skin);
    if (s.gun) {
      // held in the right hand, pointing at the viewer (slightly angled on diagonals)
      ctx.fillStyle = '#15171a';
      const gx = diagonal ? 9.5 : 8.7;
      ctx.fillRect(gx - 1.4, torsoTop + 12.5, 2.8, 5 + (s.gun === 'rifle' ? 3 : s.gun === 'smg' ? 1.5 : 0));
    }
  } else {
    rr(ctx, -10.5, torsoTop + 1.5, armW, 10 - armSwing * 0.4, 1.5, shade(shirt, 0.85));
    rr(ctx, 6.9, torsoTop + 1.5, armW, 10 + armSwing * 0.4, 1.5, shade(shirt, 0.85));
    if (s.gun) {
      ctx.fillStyle = '#15171a';
      const len = Math.min(8, GUN_LEN[s.gun]);
      ctx.fillRect(diagonal ? 7 : 6, torsoTop - len + 4, 2.4, len); // barrel peeking over the shoulder
    }
  }

  // ---------------- head ----------------
  const headR = 6.2;
  const hx = pose === 'side' ? 1.5 : diagonal ? 1 : 0;
  circle(ctx, hx, headY, headR, skin);
  if (s.zombie) {
    ctx.fillStyle = 'rgba(60,90,40,0.25)';
    ctx.beginPath();
    ctx.arc(hx, headY, headR, 0, Math.PI * 2);
    ctx.fill();
  }
  // hair / helmet
  const style = s.hairStyle ?? 'short';
  if (style === 'helmet') {
    circle(ctx, hx, headY - 0.8, headR + 1, s.helmetColor ?? '#4a5530');
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(hx - headR - 1, headY - 0.5, (headR + 1) * 2, 1.6);
    if (pose !== 'back') {
      // face visible below the rim
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(hx, headY + 1.5, headR - 1, 0, Math.PI);
      ctx.fill();
    }
  } else if (style !== 'bald') {
    ctx.fillStyle = s.hair;
    ctx.beginPath();
    if (pose === 'back') ctx.arc(hx, headY, headR + 0.4, 0, Math.PI * 2);
    else if (pose === 'side') ctx.arc(hx - 1, headY - 0.5, headR + 0.3, Math.PI * 0.85, Math.PI * 1.95);
    else ctx.arc(hx, headY - 0.5, headR + 0.3, Math.PI * 1.02, Math.PI * 1.98);
    ctx.lineTo(hx, headY - 0.5);
    ctx.fill();
    if (style === 'long') {
      rr(ctx, hx - headR - 0.5, headY - 2, 3, 12, 1.5, s.hair);
      rr(ctx, hx + headR - 2.5, headY - 2, 3, 12, 1.5, s.hair);
    }
    if (style === 'cap') {
      rr(ctx, hx - headR - 1, headY - 2, (headR + 1) * 2, 2.2, 1, s.hair);
    }
  }
  // face
  if (pose !== 'back') {
    const eye = s.eyes ?? (s.zombie ? '#c62828' : '#1a1a1a');
    ctx.fillStyle = eye;
    if (pose === 'side') ctx.fillRect(hx + 3, headY - 0.5, 1.6, 1.6);
    else {
      ctx.fillRect(hx - 2.8, headY - 0.3, 1.6, 1.6);
      ctx.fillRect(hx + 1.2, headY - 0.3, 1.6, 1.6);
    }
  }

  // blood splatter
  if (s.blood) {
    ctx.fillStyle = 'rgba(120,14,14,0.85)';
    let seed = Math.floor(s.blood * 1000) + dir * 7;
    const n = Math.round(s.blood * 9);
    for (let i = 0; i < n; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const x = -8 + (seed / 233280) * 16;
      seed = (seed * 9301 + 49297) % 233280;
      const y = -30 + (seed / 233280) * 26;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
  }

  ctx.restore();
}
