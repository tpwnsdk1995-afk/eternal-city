import type { Dir } from '../../systems/facing';

type Ctx = CanvasRenderingContext2D;

export type GunKind = 'pistol' | 'smg' | 'rifle' | 'shotgun' | 'sniper' | 'mg' | 'launcher' | 'melee' | 'claws';

export interface FigureStyle {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes?: string;
  hairStyle?: 'short' | 'long' | 'bald' | 'helmet' | 'cap';
  helmetColor?: string;
  gun?: GunKind | null;
  /** hunched, arms reaching forward, torn clothes, wounds */
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
  /** four-legged (좀비견): uses the animal renderer; `shirt` = fur, `skin` = muzzle/belly */
  quadruped?: boolean;
  /** segmented crawler (라바·데스웜·패러사이트) — quadruped renderer draws a chain of segments */
  worm?: boolean;
  /** tactical visor under the helmet rim (W.I.T.O) */
  goggles?: boolean;
  /** chest plate colour (body armour) */
  armor?: string;
  /** cape/cloak colour hanging from the shoulders */
  cape?: string;
}

/** Frame layout inside a figure sheet row: 0 idle, 1–3 walk, 4 aim, 5 death. */
export const FRAME_IDLE = 0;
export const FRAME_AIM = 4;
export const FRAME_DEATH = 5;

// ---------------------------------------------------------------------------------------------
// paint helpers — every part is filled, two-tone shaded (light from the top-left) and outlined
// ---------------------------------------------------------------------------------------------

export const shade = (color: string, amt: number): string => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (!m) return color;
  const f = (h: string) => Math.max(0, Math.min(255, Math.round(parseInt(h, 16) * amt)));
  return `rgb(${f(m[1])},${f(m[2])},${f(m[3])})`;
};

const OUTLINE = 'rgba(8,8,12,0.6)';
let outW = 1;

function rrPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/** Rounded box with a dark right band, a light left strip and an outline. */
function box(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string, flat = false): void {
  ctx.save();
  rrPath(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
  if (!flat) {
    ctx.clip();
    ctx.fillStyle = shade(color, 0.68);
    ctx.fillRect(x + w * 0.64, y, w * 0.4, h);
    ctx.fillStyle = shade(color, 1.22);
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x + 0.5, y + 0.5, Math.max(0.8, w * 0.2), h - 1);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.save();
  rrPath(ctx, x, y, w, h, r);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = outW;
  ctx.stroke();
  ctx.restore();
}

/** Sphere-ish circle: base colour, shadow crescent bottom-right, highlight top-left, outline. */
function ball(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = shade(color, 0.7);
  ctx.beginPath();
  ctx.arc(x + r * 0.45, y + r * 0.35, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - r * 0.1, y - r * 0.1, r * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(color, 1.25);
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.4, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = outW;
  ctx.stroke();
  ctx.restore();
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, w = 1): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ---------------------------------------------------------------------------------------------
// weapons — side profile pointing +x, grip at (0,0)
// ---------------------------------------------------------------------------------------------

const METAL = '#1c1f24';
const METAL_HI = '#4a4f58';
const WOOD = '#5a3a1f';
const OLIVE = '#4a5530';

export const GUN_LEN: Record<GunKind, number> = { pistol: 7, smg: 10, rifle: 15, shotgun: 15, sniper: 18, mg: 15, launcher: 14, melee: 12, claws: 6 };

/** Weapon silhouette in side view; `s` scales the whole gun (diagonal poses use ~0.85). */
export function drawGunSide(ctx: Ctx, kind: GunKind, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const metal = (x0: number, y0: number, w: number, h: number, c = METAL) => box(ctx, x0, y0, w, h, 0.6, c);
  switch (kind) {
    case 'pistol':
      metal(-1, -1.2, 7, 2.2);
      metal(0, 0.8, 2, 3.2, shade(METAL, 1.3)); // grip
      line(ctx, 0.5, -0.8, 5.5, -0.8, METAL_HI, 0.6);
      break;
    case 'smg':
      metal(-3, -1.4, 10, 2.8);
      metal(7, -0.8, 2.5, 1.4); // barrel
      metal(1.5, 1.2, 2, 4.5, shade(METAL, 1.25)); // magazine
      metal(-6, -0.8, 3.5, 1.6, METAL_HI); // folding stock
      break;
    case 'rifle':
      metal(-4, -1.3, 13, 2.6);
      metal(9, -0.8, 5, 1.5); // barrel
      metal(1.5, 1.1, 2.2, 4.5, shade(METAL, 1.25)); // magazine
      metal(4, 1.1, 5, 1.6, WOOD); // handguard
      metal(-8.5, -0.6, 5, 2.8, WOOD); // stock
      break;
    case 'shotgun':
      metal(-3, -1.1, 12, 2.2);
      metal(9, -0.7, 4, 1.4);
      metal(3, 1, 4.5, 2.4, WOOD); // pump
      metal(-7.5, -0.6, 5, 2.8, WOOD); // stock
      break;
    case 'sniper':
      metal(-4, -1.1, 14, 2.2);
      metal(10, -0.6, 7, 1.2); // long barrel
      metal(-1, -3.6, 6, 2, METAL_HI); // scope
      metal(1, 1, 1.8, 3.5, shade(METAL, 1.25));
      metal(-9, -0.4, 5.5, 2.8, WOOD);
      break;
    case 'mg':
      metal(-4, -1.8, 13, 3.6);
      metal(9, -1, 6, 2);
      metal(-1, 1.6, 4.5, 3.5, OLIVE); // ammo box
      line(ctx, 8, 1.6, 6, 5.5, METAL_HI, 0.8); // bipod
      line(ctx, 9, 1.6, 11, 5.5, METAL_HI, 0.8);
      metal(-8, -1, 4, 3, shade(METAL, 1.3));
      break;
    case 'launcher':
      metal(-5, -2, 15, 4, OLIVE); // tube
      metal(10, -2.6, 4, 5.2, shade(OLIVE, 0.8)); // muzzle bell
      metal(0, 2, 2, 3.5, METAL);
      metal(-4, -3.6, 4, 1.6, METAL_HI); // sight
      break;
    case 'melee':
      metal(0, -0.9, 12, 1.8, METAL_HI); // baton / blade
      metal(-3, -1.2, 3.5, 2.4, WOOD); // handle
      break;
    case 'claws':
      claws(ctx, 0, 0, 1, 6);
      break;
  }
  ctx.restore();
}

/** three bone talons fanning out from the hand */
function claws(ctx: Ctx, x: number, y: number, dir: 1 | -1 | 0, len: number): void {
  ctx.strokeStyle = '#e8e2c8';
  ctx.lineWidth = 1.4;
  for (const off of [-2.2, 0, 2.2]) {
    ctx.beginPath();
    ctx.moveTo(x, y + off * 0.6);
    if (dir === 0) ctx.lineTo(x + off, y + len);
    else ctx.lineTo(x + dir * len, y + off);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.5;
  for (const off of [-2.2, 0, 2.2]) {
    ctx.beginPath();
    ctx.moveTo(x, y + off * 0.6 + 0.6);
    if (dir === 0) ctx.lineTo(x + off + 0.5, y + len);
    else ctx.lineTo(x + dir * len, y + off + 0.6);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------------------------
// figure
// ---------------------------------------------------------------------------------------------

type Pose = 'front' | 'back' | 'side' | 'dfront' | 'dback';

const poseOf = (dir: Dir): Pose => (dir === 2 ? 'front' : dir === 6 ? 'back' : dir === 0 || dir === 4 ? 'side' : dir === 1 || dir === 3 ? 'dfront' : 'dback');
const mirrored = (dir: Dir): boolean => dir === 3 || dir === 4 || dir === 5;

/** Figure height in local units (feet at 0); the frame scale is clamped so bosses still fit. */
const FIG_H = 39;

/**
 * Oblique (3/4 top-down) human figure, ~36px tall at size 1 inside a 48px frame, feet near the
 * bottom. Five base poses (front / back / side / two diagonals) cover the 8 directions; W-facing
 * dirs mirror E-facing ones. Frames: 0 idle, 1 left step, 2 passing (bob), 3 right step, 4 aim, 5 death.
 */
export function drawFigure(ctx: Ctx, dir: Dir, frame: number, w: number, h: number, s: FigureStyle): void {
  if (s.quadruped) return drawQuadruped(ctx, dir, frame, w, h, s);
  const k = Math.min((s.size ?? 1) * (w / 48), (h - 3) / FIG_H);
  outW = 1 / Math.max(1, k * 0.85);
  const pose = poseOf(dir);
  const mirror = mirrored(dir);

  ctx.save();
  if (frame === FRAME_DEATH) {
    // lying on the ground: rotate the side pose onto its back, over a blood pool
    const toRight = dir < 4;
    ctx.translate(w / 2 + (toRight ? -14 : 14) * k, h - 9 * k);
    ctx.scale(k, k);
    ctx.fillStyle = 'rgba(90,10,10,0.75)';
    ctx.beginPath();
    ctx.ellipse(toRight ? 14 : -14, 3, 15, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(toRight ? Math.PI / 2 : -Math.PI / 2);
    ctx.scale(1, 0.85);
    drawBody(ctx, 'side', FRAME_IDLE, s, { lying: true, mirror: false });
    ctx.restore();
    return;
  }
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.translate(w / 2, h - 3 * k);
  ctx.scale(k, k);
  drawBody(ctx, pose, frame, s, { lying: false, mirror });
  ctx.restore();
}

interface BodyOpts {
  lying: boolean;
  mirror: boolean;
}

/** Draws the figure with its feet at the origin (up is −y), in local units. */
function drawBody(ctx: Ctx, pose: Pose, frame: number, s: FigureStyle, o: BodyOpts): void {
  const aim = frame === FRAME_AIM;
  const walk = frame >= 1 && frame <= 3;
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0; // leg phase
  const passing = frame === 2;
  const bob = passing ? -1 : 0;
  const z = !!s.zombie;
  const hunch = z ? 3 : 0;
  const lean = z ? 1.5 : 0; // zombie leans forward (toward +x in side view)

  if (s.glow && !o.lying) {
    const g = ctx.createRadialGradient(0, -16, 2, 0, -16, 24);
    g.addColorStop(0, s.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-26, -44, 52, 50);
  }
  if (!o.lying) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, pose === 'side' ? 8 : 9.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const skin = s.skin;
  const shoes = s.shoes ?? '#1f1f22';
  const pants = s.pants;
  const shirt = s.shirt;
  const legH = 13;
  const legW = 4.4;
  const torsoH = 13;
  const torsoTop = -26 + hunch + bob;
  const headR = 5;
  const headY = torsoTop - 6.2 + (z ? 1.5 : 0);
  const sideish = pose === 'side' || pose === 'dfront' || pose === 'dback';
  const facingViewer = pose === 'front' || pose === 'dfront';
  // horizontal spread of the two legs / shoulders per pose
  const spread = pose === 'front' || pose === 'back' ? 3.6 : pose === 'side' ? 1.2 : 2.6;

  // ---------------- legs ----------------
  const drag = z ? 0.5 : 1; // zombies shuffle: shorter stride on one leg
  const stepL = walk ? swing * (pose === 'side' ? 3.6 : 1.6) : 0;
  const stepR = walk ? -swing * (pose === 'side' ? 3.6 : 1.6) * drag : 0;
  const leg = (cx: number, step: number, far: boolean) => {
    const c = far ? shade(pants, 0.78) : pants;
    if (sideish) {
      box(ctx, cx + step - legW / 2 + lean * 0.3, -legH, legW, legH, 1.5, c);
      box(ctx, cx + step - legW / 2 - 0.5 + lean * 0.3, -2.6, legW + 2, 2.6, 1, far ? shade(shoes, 0.8) : shoes);
    } else {
      const lift = Math.max(0, step) * 0.8;
      box(ctx, cx - legW / 2, -legH + lift, legW, legH - lift, 1.5, step > 0.2 ? shade(pants, 0.88) : c);
      box(ctx, cx - legW / 2 - 0.6, -2.6 + lift * 0.5, legW + 1.2, 2.6, 1, shoes);
    }
  };
  // far leg first so the near one overlaps
  leg(-spread, stepL, true);
  leg(spread, stepR, false);
  if (s.dress) {
    // skirt hides the upper legs
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-7, torsoTop + torsoH - 1);
    ctx.lineTo(7, torsoTop + torsoH - 1);
    ctx.lineTo(9.5, -5);
    ctx.lineTo(-9.5, -5);
    ctx.closePath();
    ctx.fillStyle = shirt;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = shade(shirt, 0.7);
    ctx.fillRect(2, torsoTop, 10, 30);
    ctx.restore();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = outW;
    ctx.stroke();
  }

  // ---------------- torso ----------------
  const torsoW = pose === 'side' ? 9 : sideish ? 11.5 : 13.5;
  const tx = -torsoW / 2 + (pose === 'side' ? lean : sideish ? lean * 0.6 : 0);
  box(ctx, tx, torsoTop, torsoW, torsoH, 3, shirt);
  if (s.stripes && !z) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let y = torsoTop + 2.5; y < torsoTop + torsoH - 1.5; y += 3.2) ctx.fillRect(tx + 1, y, torsoW - 2, 1.2);
  } else if (s.stripes) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let y = torsoTop + 2.5; y < torsoTop + torsoH - 1.5; y += 3.2) ctx.fillRect(tx + 1, y, torsoW - 2 - (y % 2), 1.2);
  }
  if (s.coat) {
    box(ctx, tx - 1, torsoTop + 0.5, torsoW + 2, torsoH + 7, 3, s.coat);
    if (facingViewer) box(ctx, -1.6, torsoTop + 1, 3.2, torsoH + 6, 1, shade(s.coat, 0.6), true); // lapel seam
    line(ctx, tx - 1 + (torsoW + 2) * 0.5, torsoTop + 3, tx - 1 + (torsoW + 2) * 0.5, torsoTop + torsoH + 6, 'rgba(0,0,0,0.25)', 0.6);
  }
  if (s.vest && facingViewer) box(ctx, tx + 1.5, torsoTop + 1, torsoW - 3, torsoH - 1.5, 2, s.vest);
  if (s.armor) {
    box(ctx, tx + 1, torsoTop + 1.5, torsoW - 2, torsoH - 3, 1.5, s.armor);
    line(ctx, tx + 2, torsoTop + 6, tx + torsoW - 2, torsoTop + 6, 'rgba(0,0,0,0.3)', 0.6);
  }
  if (s.cape && (pose === 'back' || pose === 'dback' || pose === 'side')) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tx - 1.5, torsoTop + 1);
    ctx.lineTo(tx + torsoW + 1.5, torsoTop + 1);
    ctx.lineTo(tx + torsoW + 3, -3);
    ctx.lineTo(tx - 3, -3);
    ctx.closePath();
    ctx.fillStyle = s.cape;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = outW;
    ctx.stroke();
    ctx.restore();
  }
  if (s.pack && (pose === 'back' || pose === 'dback')) box(ctx, tx + 1, torsoTop + 1, torsoW - 2, 10, 2, '#3a3d2c');
  if (s.pack && pose === 'side') box(ctx, tx - 3, torsoTop + 1.5, 3.5, 9, 1.5, '#3a3d2c');
  if (s.pack && facingViewer) {
    ctx.fillStyle = '#bfc2b0';
    ctx.fillRect(tx + 2, torsoTop, 1.6, torsoH);
    ctx.fillRect(tx + torsoW - 3.6, torsoTop, 1.6, torsoH);
  }
  if (z) {
    // torn cloth + wounds
    ctx.fillStyle = shade(shirt, 0.5);
    ctx.fillRect(tx + 2, torsoTop + 6, 3, 4.5);
    ctx.fillRect(tx + torsoW - 4.5, torsoTop + 2.5, 2.5, 3.5);
    if (facingViewer) {
      ctx.fillStyle = '#7a1a14';
      ctx.fillRect(tx + 2.5, torsoTop + 6.5, 2, 3.5); // exposed wound
      ctx.fillStyle = '#d8cfc0';
      ctx.fillRect(tx + 2.5, torsoTop + 7.5, 2, 0.6); // rib
      ctx.fillRect(tx + 2.5, torsoTop + 9, 2, 0.6);
    }
  } else if (!s.coat && !s.armor && !s.vest) {
    line(ctx, tx + torsoW * 0.5, torsoTop + 2, tx + torsoW * 0.5, torsoTop + torsoH - 2, 'rgba(0,0,0,0.18)', 0.6); // shirt fold
  }
  // neck
  box(ctx, (pose === 'side' ? 1 + lean : sideish ? 0.6 : 0) - 1.6, torsoTop - 1.6, 3.2, 2.6, 1, shade(skin, 0.85), true);

  // ---------------- arms ----------------
  const armW = 3.4;
  const armSwing = walk ? -swing * 2.4 : 0;
  const shoulderY = torsoTop + 1.2;
  const hand = (x: number, y: number, far = false) => ball(ctx, x, y, 2, far ? shade(skin, 0.8) : skin);
  const gun = s.gun ?? null;
  const twoHanded = gun && gun !== 'pistol' && gun !== 'melee' && gun !== 'claws';

  if (z) {
    // both arms reaching forward
    if (pose === 'side' || pose === 'dfront' || pose === 'dback') {
      const reach = pose === 'side' ? 11 : 8;
      box(ctx, tx + torsoW - 3, shoulderY + 4.5 + (walk ? swing : 0), reach, armW, 1.5, shade(shirt, 0.8));
      hand(tx + torsoW - 3 + reach, shoulderY + 6.2 + (walk ? swing : 0), true);
      box(ctx, tx + torsoW - 2, shoulderY + 0.5 - (walk ? swing : 0), reach + 1.5, armW, 1.5, shirt);
      hand(tx + torsoW - 0.5 + reach, shoulderY + 2.2 - (walk ? swing : 0));
    } else if (pose === 'front') {
      box(ctx, tx - 2.8, shoulderY, armW, 9.5, 1.5, shirt);
      box(ctx, tx + torsoW - 0.6, shoulderY, armW, 9.5, 1.5, shirt);
      hand(tx - 1.1, shoulderY + 11.2);
      hand(tx + torsoW + 1.1, shoulderY + 11.2);
    } else {
      box(ctx, tx - 2.8, shoulderY, armW, 7, 1.5, shade(shirt, 0.85));
      box(ctx, tx + torsoW - 0.6, shoulderY, armW, 7, 1.5, shade(shirt, 0.85));
    }
  } else if (pose === 'side') {
    const ax = tx + torsoW - 1.5; // shoulder x (front of the body)
    if (aim && gun) {
      // both arms straight out, weapon level
      box(ctx, ax - 2, shoulderY + 3, 10, armW, 1.5, shade(shirt, 0.78));
      box(ctx, ax - 1, shoulderY + 0.8, 10.5, armW, 1.5, shirt);
      hand(ax + 9.5, shoulderY + 2.4);
      if (twoHanded) hand(ax + 7, shoulderY + 4.8, true);
      drawGunSide(ctx, gun, ax + 9.5, shoulderY + 2.2);
    } else {
      // far arm swings behind, near arm holds the weapon low across the body
      box(ctx, tx - 1.5 - armSwing * 0.5, shoulderY + 0.5, armW, 10, 1.5, shade(shirt, 0.72));
      if (gun) {
        box(ctx, ax - 3, shoulderY + 1, 8, armW, 1.5, shirt);
        hand(ax + 5, shoulderY + 3);
        drawGunSide(ctx, gun, ax + 5, shoulderY + 3.2, 0.95);
      } else {
        box(ctx, ax - 3 + armSwing * 0.5, shoulderY + 0.5, armW, 10.5, 1.5, shirt);
        hand(ax - 1.3 + armSwing * 0.5, shoulderY + 12.5);
      }
    }
  } else if (pose === 'dfront' || pose === 'dback') {
    // 3/4 view: far arm partly hidden, near arm forward-right
    const nearX = tx + torsoW - 1.2;
    box(ctx, tx - 2.2, shoulderY + 0.5, armW, 9.5 + armSwing * 0.3, 1.5, shade(shirt, 0.72));
    if (!(pose === 'dback' && gun)) hand(tx - 0.5, shoulderY + 11.5 + armSwing * 0.3, true);
    if (gun && (aim || pose === 'dfront')) {
      ctx.save();
      ctx.translate(nearX, shoulderY + 1.5);
      const ang = pose === 'dfront' ? Math.PI / 4 : -Math.PI / 4;
      ctx.rotate(ang);
      box(ctx, 0, -armW / 2, aim ? 10 : 7.5, armW, 1.5, shirt);
      hand(aim ? 10 : 7.5, 0);
      drawGunSide(ctx, gun, aim ? 10.5 : 8, 0, 0.85);
      ctx.restore();
    } else if (gun) {
      // dback, not aiming: barrel over the shoulder
      box(ctx, nearX - 1.5, shoulderY + 0.5, armW, 9.5 - armSwing * 0.3, 1.5, shirt);
      ctx.save();
      ctx.translate(nearX + 1, shoulderY - 2);
      ctx.rotate(-Math.PI / 2 + 0.35);
      drawGunSide(ctx, gun, 0, 0, 0.75);
      ctx.restore();
    } else {
      box(ctx, nearX - 1.5, shoulderY + 0.5, armW, 9.5 - armSwing * 0.3, 1.5, shirt);
      hand(nearX + 0.2, shoulderY + 11.5 - armSwing * 0.3);
    }
  } else if (pose === 'front') {
    if (aim && gun) {
      // arms converge toward the viewer holding the weapon
      box(ctx, tx - 1.5, shoulderY + 0.5, armW, 8, 1.5, shirt);
      box(ctx, tx + torsoW - 1.9, shoulderY + 0.5, armW, 8, 1.5, shirt);
      box(ctx, tx + 1, shoulderY + 6, torsoW - 2, 3.2, 1.5, shirt, true); // forearms across
      hand(-1.2, shoulderY + 9.5);
      hand(1.6, shoulderY + 9.2, true);
      ctx.fillStyle = METAL;
      const len = 4 + GUN_LEN[gun] * 0.25;
      box(ctx, -1.7, shoulderY + 9, 3.4, len, 0.8, METAL);
      ball(ctx, 0, shoulderY + 9 + len, 1.4, '#050608'); // muzzle toward the viewer
    } else {
      box(ctx, tx - 2.6, shoulderY, armW, 10 + armSwing * 0.35, 1.5, shirt);
      box(ctx, tx + torsoW - 0.8, shoulderY, armW, 10 - armSwing * 0.35, 1.5, shirt);
      hand(tx - 0.9, shoulderY + 11.8 + armSwing * 0.35);
      hand(tx + torsoW + 0.9, shoulderY + 11.8 - armSwing * 0.35);
      if (gun) {
        const gx = tx + torsoW + 0.9;
        if (gun === 'melee') box(ctx, gx - 1, shoulderY + 2, 2, 12, 0.6, METAL_HI); // held upright
        else if (gun === 'claws') {
          claws(ctx, tx - 0.9, shoulderY + 13.5, 0, 5);
          claws(ctx, gx, shoulderY + 13.5, 0, 5);
        } else {
          const len = 4.5 + GUN_LEN[gun] * 0.2;
          box(ctx, gx - 1.3, shoulderY + 11.5, 2.6, len, 0.6, METAL);
        }
      }
    }
  } else {
    // back
    box(ctx, tx - 2.6, shoulderY, armW, 10 - armSwing * 0.35, 1.5, shade(shirt, 0.85));
    box(ctx, tx + torsoW - 0.8, shoulderY, armW, 10 + armSwing * 0.35, 1.5, shade(shirt, 0.85));
    if (gun && gun !== 'claws') {
      ctx.save();
      ctx.translate(tx + torsoW - 1, shoulderY - (aim ? 4 : 1.5));
      ctx.rotate(aim ? -Math.PI / 2 + 0.15 : -Math.PI / 2 + 0.4);
      drawGunSide(ctx, gun, 0, 0, aim ? 0.85 : 0.65);
      ctx.restore();
    }
  }

  // ---------------- head ----------------
  const hx = pose === 'side' ? 1.5 + lean : sideish ? 1 + lean * 0.5 : 0;
  ball(ctx, hx, headY, headR, skin);
  if (z) {
    ctx.fillStyle = 'rgba(60,90,40,0.22)';
    ctx.beginPath();
    ctx.arc(hx, headY, headR, 0, Math.PI * 2);
    ctx.fill();
  }
  const style = s.hairStyle ?? 'short';
  if (style === 'helmet') {
    const hc = s.helmetColor ?? '#4a5530';
    ctx.save();
    ctx.beginPath();
    ctx.arc(hx, headY - 0.6, headR + 1.1, Math.PI, Math.PI * 2);
    ctx.lineTo(hx + headR + 1.1, headY + 1.2);
    ctx.lineTo(hx - headR - 1.1, headY + 1.2);
    ctx.closePath();
    ctx.fillStyle = hc;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = shade(hc, 0.68);
    ctx.fillRect(hx + 1.5, headY - 8, 8, 12);
    ctx.fillStyle = shade(hc, 1.25);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(hx - headR, headY - 6, 2.5, 6);
    ctx.restore();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = outW;
    ctx.beginPath();
    ctx.arc(hx, headY - 0.6, headR + 1.1, Math.PI, Math.PI * 2);
    ctx.lineTo(hx + headR + 1.1, headY + 1.2);
    ctx.lineTo(hx - headR - 1.1, headY + 1.2);
    ctx.closePath();
    ctx.stroke();
    if (s.goggles && pose !== 'back' && pose !== 'dback') {
      box(ctx, hx - headR + 0.4, headY + 0.6, headR * 2 - 0.8, 2.4, 0.8, '#101820', true);
      ctx.fillStyle = 'rgba(120,200,255,0.55)';
      ctx.fillRect(hx - headR + 1.2, headY + 1, 2.2, 1.2);
    }
  } else if (style !== 'bald') {
    ctx.save();
    ctx.beginPath();
    if (pose === 'back' || pose === 'dback') ctx.arc(hx, headY, headR + 0.4, 0, Math.PI * 2);
    else if (pose === 'side') {
      ctx.arc(hx - 0.8, headY - 0.6, headR + 0.4, Math.PI * 0.8, Math.PI * 1.98);
      ctx.lineTo(hx + 0.5, headY - 0.6);
    } else {
      ctx.arc(hx, headY - 0.6, headR + 0.4, Math.PI * 1.02, Math.PI * 1.98);
      ctx.lineTo(hx, headY - 0.6);
    }
    ctx.closePath();
    ctx.fillStyle = s.hair;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = shade(s.hair, 0.7);
    ctx.fillRect(hx + 1.5, headY - 8, 8, 10);
    ctx.fillStyle = shade(s.hair, 1.35);
    ctx.globalAlpha = 0.45;
    ctx.fillRect(hx - 3.5, headY - 5.5, 2, 2);
    ctx.restore();
    if (style === 'long') {
      box(ctx, hx - headR - 0.8, headY - 2, 3, 11, 1.5, s.hair);
      box(ctx, hx + headR - 2.2, headY - 2, 3, 11, 1.5, s.hair);
    }
    if (style === 'cap') {
      box(ctx, hx - headR - 1.2, headY - 2.2, (headR + 1.2) * 2, 2.4, 1, s.hair);
      if (pose !== 'back' && pose !== 'dback') box(ctx, hx + (pose === 'side' ? 2 : -3), headY - 0.6, pose === 'side' ? 5 : 6, 1.4, 0.5, shade(s.hair, 0.8), true); // brim
    }
  } else {
    // bald: bright spot
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(hx - 1.5, headY - 2.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // face
  if (pose !== 'back' && pose !== 'dback') {
    const eye = s.eyes ?? (z ? '#c62828' : '#1a1a1a');
    ctx.fillStyle = eye;
    if (pose === 'side') ctx.fillRect(hx + 2.6, headY - 0.6, 1.5, 1.6);
    else if (pose === 'dfront') {
      ctx.fillRect(hx - 1.2, headY - 0.4, 1.5, 1.6);
      ctx.fillRect(hx + 2.4, headY - 0.4, 1.5, 1.6);
    } else {
      ctx.fillRect(hx - 2.9, headY - 0.4, 1.6, 1.6);
      ctx.fillRect(hx + 1.3, headY - 0.4, 1.6, 1.6);
    }
    if (s.eyes && !z) {
      ctx.fillStyle = s.eyes;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(hx, headY + 0.3, headR * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (z) {
      // gaping jaw with teeth
      const mx = pose === 'side' ? hx + 1.5 : hx - 1.6;
      ctx.fillStyle = '#3a0a0a';
      ctx.fillRect(mx, headY + 2.4, pose === 'side' ? 2.8 : 3.4, 1.8);
      ctx.fillStyle = '#e8e0c8';
      ctx.fillRect(mx + 0.4, headY + 2.4, 0.8, 0.8);
      ctx.fillRect(mx + 1.8, headY + 2.4, 0.8, 0.8);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(pose === 'side' ? hx + 2.2 : hx - 1, headY + 2.6, pose === 'side' ? 1.6 : 2.2, 0.7); // mouth
    }
  }

  bloodSplatter(ctx, s, pose === 'side' ? 0 : 2);
}

function bloodSplatter(ctx: Ctx, s: FigureStyle, salt: number): void {
  if (!s.blood) return;
  let seed = Math.floor(s.blood * 1000) + salt * 7;
  const n = Math.round(s.blood * 10);
  for (let i = 0; i < n; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const x = -8 + (seed / 233280) * 16;
    seed = (seed * 9301 + 49297) % 233280;
    const y = -32 + (seed / 233280) * 28;
    seed = (seed * 9301 + 49297) % 233280;
    const r = 0.7 + (seed / 233280) * 1.1;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(150,20,20,0.8)' : 'rgba(100,10,10,0.85)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------------------------
// quadruped / crawler
// ---------------------------------------------------------------------------------------------

/** Dog-sized four-legged creature (~24px long at size 1), or a segmented crawler when `worm`. */
function drawQuadruped(ctx: Ctx, dir: Dir, frame: number, w: number, h: number, s: FigureStyle): void {
  const k = Math.min((s.size ?? 1) * (w / 48), (w - 2) / 30);
  outW = 1 / Math.max(1, k * 0.85);
  const mirror = mirrored(dir);
  const pose: 'front' | 'back' | 'side' = dir === 2 || dir === 1 || dir === 3 ? 'front' : dir === 6 || dir === 5 || dir === 7 ? 'back' : 'side';
  const diagonal = dir % 2 === 1;
  const dead = frame === FRAME_DEATH;
  ctx.save();
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.translate(w / 2, h - 5 * k);
  ctx.scale(k, k);
  const walk = frame >= 1 && frame <= 3;
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const fur = s.shirt;
  const dark = shade(fur, 0.7);
  const eye = s.eyes ?? '#c62828';

  if (s.glow && !dead) {
    const g = ctx.createRadialGradient(0, -8, 2, 0, -8, 18);
    g.addColorStop(0, s.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-24, -30, 48, 36);
  }
  if (dead) {
    ctx.fillStyle = 'rgba(90,10,10,0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 1, 13, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(0, 2);
    ctx.scale(1.05, 0.55);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, pose === 'side' ? 12 : 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (s.worm) {
    // segmented crawler: head at the front, shrinking segments behind
    const segs = 5;
    if (pose === 'side') {
      for (let i = segs - 1; i >= 0; i--) {
        const r = 5.5 - i * 0.7;
        const x = 9 - i * 5;
        const y = -r - (walk ? Math.sin((i + frame) * 1.3) * 0.8 : 0);
        ball(ctx, x, y, r, i === 0 ? fur : shade(fur, 1 - i * 0.07));
      }
      ball(ctx, 11.5, -5.5, 3.5, s.skin); // maw
      ctx.fillStyle = '#2a0a10';
      ctx.fillRect(12.5, -6.5, 3, 2);
      ctx.fillStyle = eye;
      ctx.fillRect(9.5, -8.5, 1.6, 1.6);
    } else {
      for (let i = segs - 1; i >= 0; i--) {
        const r = 5.5 - i * 0.7;
        const y = pose === 'front' ? -r - i * 3.2 : -r - (segs - 1 - i) * 3.2;
        ball(ctx, (diagonal ? 1 : 0) + (walk ? Math.sin((i + frame) * 1.3) * 0.8 : 0), y, r, i === 0 ? fur : shade(fur, 1 - i * 0.07));
      }
      if (pose === 'front') {
        ctx.fillStyle = '#2a0a10';
        ctx.fillRect((diagonal ? 1 : 0) - 2, -4.5, 4, 2);
        ctx.fillStyle = eye;
        ctx.fillRect((diagonal ? 1 : 0) - 3, -7.5, 1.6, 1.6);
        ctx.fillRect((diagonal ? 1 : 0) + 1.4, -7.5, 1.6, 1.6);
      }
    }
    bloodSplatter(ctx, s, dir);
    ctx.restore();
    return;
  }

  if (pose === 'side') {
    // run cycle: diagonal leg pairs
    box(ctx, -9 - swing * 2.2, -8, 3, 8.5, 1, dark);
    box(ctx, 6 + swing * 2.2, -8, 3, 8.5, 1, dark);
    box(ctx, -7 + swing * 2.2, -8, 3, 8.5, 1, fur);
    box(ctx, 8 - swing * 2.2, -8, 3, 8.5, 1, fur);
    // body
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -11, 11.5, 5.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = dark;
    ctx.fillRect(-12, -9.5, 24, 6);
    ctx.fillStyle = shade(fur, 1.2);
    ctx.globalAlpha = 0.4;
    ctx.fillRect(-8, -15.5, 12, 2.5);
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(0, -11, 11.5, 5.2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = outW;
    ctx.stroke();
    if (s.zombie) {
      ctx.fillStyle = '#7a1a14';
      ctx.fillRect(-3, -12, 3, 2.5);
      ctx.fillStyle = '#d8cfc0';
      ctx.fillRect(-3, -11, 3, 0.5);
    }
    // tail
    box(ctx, -15, -14.5, 5.5, 2, 1, dark);
    // head + open jaw + ear
    ball(ctx, 11, -14.5, 4.6, fur);
    box(ctx, 13.5, -14, 5, 2.6, 1, s.skin); // muzzle
    box(ctx, 13.5, -11, 4.5, 1.6 + (walk ? 1 : 0), 0.6, '#3a0a0a', true); // jaw
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(14, -11.2, 0.7, 0.9);
    ctx.fillRect(16, -11.2, 0.7, 0.9);
    box(ctx, 9, -20, 2.6, 4.5, 1, dark); // ear
    ctx.fillStyle = eye;
    ctx.fillRect(12, -16, 1.6, 1.6);
  } else {
    const front = pose === 'front';
    box(ctx, -6, -8 + (front ? 0 : 1), 3, 8.5, 1, swing > 0 ? fur : dark);
    box(ctx, 3, -8 + (front ? 0 : 1), 3, 8.5, 1, swing > 0 ? dark : fur);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(diagonal ? 1 : 0, -12, 6.8, 8.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = fur;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = dark;
    ctx.fillRect(2 + (diagonal ? 1 : 0), -22, 8, 22);
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(diagonal ? 1 : 0, -12, 6.8, 8.2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = outW;
    ctx.stroke();
    const cx = diagonal ? 2 : 0;
    if (front) {
      ball(ctx, cx, -8, 5, fur);
      box(ctx, cx - 2.2, -6.5, 4.4, 2.6, 1, s.skin);
      box(ctx, cx - 2, -4, 4, 1.4 + (walk ? 0.8 : 0), 0.5, '#3a0a0a', true);
      box(ctx, cx - 5.5, -13.5, 2.6, 4.5, 1, dark);
      box(ctx, cx + 2.9, -13.5, 2.6, 4.5, 1, dark);
      ctx.fillStyle = eye;
      ctx.fillRect(cx - 2.8, -10.2, 1.6, 1.6);
      ctx.fillRect(cx + 1.2, -10.2, 1.6, 1.6);
    } else {
      ball(ctx, 0, -18.5, 4.6, fur);
      box(ctx, -5.2, -22.5, 2.6, 4.5, 1, dark);
      box(ctx, 2.6, -22.5, 2.6, 4.5, 1, dark);
      box(ctx, -1, -5.5, 2, 5.5, 1, dark); // tail
    }
  }
  bloodSplatter(ctx, s, dir);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// portrait bust (HUD / dialog fallback when no real art is provided)
// ---------------------------------------------------------------------------------------------

/** Head-and-shoulders bust lit from the top-left, drawn straight into a w×h frame. */
export function drawBust(ctx: Ctx, s: FigureStyle, w: number, h: number): void {
  const u = h / 64; // unit
  outW = 1.2 * u;
  // backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1b2028');
  bg.addColorStop(1, '#0c0f14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const vg = ctx.createRadialGradient(w * 0.5, h * 0.4, 2 * u, w * 0.5, h * 0.4, w * 0.75);
  vg.addColorStop(0, s.glow ?? 'rgba(110,120,140,0.45)');
  vg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2, h);
  ctx.scale(u, u);
  const skin = s.skin;
  const z = !!s.zombie;
  // shoulders / torso
  box(ctx, -26, -24, 52, 30, 9, s.coat ?? s.shirt);
  if (s.vest && !s.coat) box(ctx, -12, -22, 24, 26, 4, s.vest);
  if (s.armor) box(ctx, -16, -21, 32, 22, 3, s.armor);
  if (s.coat) box(ctx, -3, -23, 6, 28, 1, shade(s.coat, 0.6), true);
  if (s.stripes) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let y = -20; y < 4; y += 5) ctx.fillRect(-24, y, 48, 1.6);
  }
  if (z) {
    ctx.fillStyle = shade(s.shirt, 0.5);
    ctx.fillRect(-14, -14, 7, 9);
    ctx.fillStyle = '#7a1a14';
    ctx.fillRect(-13, -12, 4, 5);
  }
  // neck
  box(ctx, -5, -32, 10, 11, 3, shade(skin, 0.88));
  // head
  const hy = -44;
  const hr = 13;
  ball(ctx, 0, hy, hr, skin);
  if (z) {
    ctx.fillStyle = 'rgba(60,90,40,0.25)';
    ctx.beginPath();
    ctx.arc(0, hy, hr, 0, Math.PI * 2);
    ctx.fill();
  }
  // ears
  ball(ctx, -hr + 0.5, hy + 1, 2.4, skin);
  ball(ctx, hr - 0.5, hy + 1, 2.4, skin);
  // hair / helmet
  const style = s.hairStyle ?? 'short';
  if (style === 'helmet') {
    const hc = s.helmetColor ?? '#4a5530';
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, hy - 1.5, hr + 2.5, Math.PI, Math.PI * 2);
    ctx.lineTo(hr + 2.5, hy + 2);
    ctx.lineTo(-hr - 2.5, hy + 2);
    ctx.closePath();
    ctx.fillStyle = hc;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = shade(hc, 0.68);
    ctx.fillRect(3, hy - 20, 20, 30);
    ctx.restore();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = outW;
    ctx.stroke();
    if (s.goggles) {
      box(ctx, -hr + 1, hy - 1, hr * 2 - 2, 6, 2, '#101820', true);
      ctx.fillStyle = 'rgba(120,200,255,0.5)';
      ctx.fillRect(-hr + 3, hy, 5, 2.5);
    }
  } else if (style !== 'bald') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, hy - 1.5, hr + 1.2, Math.PI * 1.02, Math.PI * 1.98);
    ctx.lineTo(hr + 1.2, hy - 3);
    ctx.quadraticCurveTo(0, hy - 6, -hr - 1.2, hy - 3);
    ctx.closePath();
    ctx.fillStyle = s.hair;
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = shade(s.hair, 0.7);
    ctx.fillRect(3, hy - 22, 20, 30);
    ctx.fillStyle = shade(s.hair, 1.4);
    ctx.globalAlpha = 0.4;
    ctx.fillRect(-9, hy - 13, 5, 4);
    ctx.restore();
    if (style === 'long') {
      box(ctx, -hr - 2.5, hy - 6, 6, 30, 3, s.hair);
      box(ctx, hr - 3.5, hy - 6, 6, 30, 3, s.hair);
    }
    if (style === 'cap') {
      box(ctx, -hr - 2, hy - 5, hr * 2 + 4, 5, 2, s.hair);
      box(ctx, -hr - 4, hy - 1.5, hr * 2 + 8, 3, 1.5, shade(s.hair, 0.8));
    }
  }
  // face: brows, eyes, nose, mouth
  const eye = s.eyes ?? (z ? '#c62828' : '#1a1a1a');
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-8, hy - 4.5, 5, 1.2);
  ctx.fillRect(3, hy - 4.5, 5, 1.2);
  ctx.fillStyle = '#f4f0e8';
  ctx.fillRect(-8, hy - 1.5, 5.5, 3);
  ctx.fillRect(2.5, hy - 1.5, 5.5, 3);
  ctx.fillStyle = eye;
  ctx.fillRect(-6, hy - 1.2, 2.4, 2.4);
  ctx.fillRect(4.2, hy - 1.2, 2.4, 2.4);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-0.8, hy + 1, 1.6, 4);
  if (z) {
    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(-4.5, hy + 6.5, 9, 3.5);
    ctx.fillStyle = '#e8e0c8';
    for (let x = -3.5; x < 4; x += 2.2) ctx.fillRect(x, hy + 6.5, 1.2, 1.4);
    ctx.fillStyle = 'rgba(120,14,14,0.8)';
    ctx.fillRect(5, hy - 8, 3, 6);
  } else {
    ctx.fillStyle = 'rgba(60,20,20,0.75)';
    ctx.fillRect(-3.5, hy + 7, 7, 1.4);
  }
  ctx.restore();
  // light from the top-left, shadow bottom-right
  const lg = ctx.createLinearGradient(0, 0, w, h);
  lg.addColorStop(0, 'rgba(255,255,255,0.08)');
  lg.addColorStop(0.55, 'rgba(0,0,0,0)');
  lg.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, w, h);
}
