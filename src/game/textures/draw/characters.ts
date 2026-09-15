type Ctx = CanvasRenderingContext2D;

export interface HumanoidStyle {
  skin: string;
  shirt: string;
  hair: string;
  pants?: string;
  gun?: boolean;
  gunColor?: string;
  stripes?: boolean;
  tall?: boolean;
  glow?: string;
}

/**
 * Top-down humanoid facing +x (right). Sprites rotate toward their aim, so every character
 * shares this orientation. `frame` 1 offsets the shoulders for a 2-frame walk bob.
 */
export function drawHumanoid(ctx: Ctx, frame: number, w: number, h: number, s: HumanoidStyle): void {
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / 32;
  const bob = frame % 2 === 1 ? 1 * scale : 0;

  if (s.glow) {
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, w / 2);
    g.addColorStop(0, s.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3 * scale, 11 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // gun (drawn under the arm), pointing right
  if (s.gun) {
    ctx.fillStyle = s.gunColor ?? '#1f2328';
    ctx.fillRect(cx + 4 * scale, cy + 2 * scale - bob, 13 * scale, 3 * scale);
  }

  // shoulders/torso
  ctx.fillStyle = s.shirt;
  ctx.beginPath();
  ctx.ellipse(cx - 1 * scale, cy - bob, (s.tall ? 9 : 10) * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  if (s.stripes) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = -6; i <= 6; i += 4) ctx.fillRect(cx - 9 * scale, cy + i * scale - bob, 16 * scale, 1.5 * scale);
  }

  // arms toward the gun / forward
  ctx.fillStyle = s.skin;
  ctx.fillRect(cx + 2 * scale, cy - 5 * scale - bob, 6 * scale, 3 * scale);
  ctx.fillRect(cx + 2 * scale, cy + 2 * scale - bob, 6 * scale, 3 * scale);

  // head
  ctx.fillStyle = s.skin;
  ctx.beginPath();
  ctx.arc(cx + 1 * scale, cy - bob, 5.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  // hair (back half of the head, since we look from above and face right)
  ctx.fillStyle = s.hair;
  ctx.beginPath();
  ctx.arc(cx - 0.5 * scale, cy - bob, 5 * scale, Math.PI * 0.6, Math.PI * 1.4);
  ctx.lineTo(cx - 0.5 * scale, cy - bob);
  ctx.fill();
}

export const PLAYER_STYLE: HumanoidStyle = { skin: '#f1c9a5', shirt: '#2f5fa8', hair: '#2b2118', gun: true };

export function drawPlayer(ctx: Ctx, frame: number, w: number, h: number): void {
  drawHumanoid(ctx, frame, w, h, PLAYER_STYLE);
}

const NPC_STYLES: Record<'elia' | 'shop' | 'assault', HumanoidStyle> = {
  elia: { skin: '#f1c9a5', shirt: '#e8e6ef', hair: '#6b4fbb', glow: 'rgba(120,120,255,0.25)' },
  shop: { skin: '#e0b48c', shirt: '#4b5a3a', hair: '#3a3a3a' },
  assault: { skin: '#f1c9a5', shirt: '#7a2e2e', hair: '#1a1a1a' },
};

export const drawNpc = (kind: keyof typeof NPC_STYLES) => (ctx: Ctx, frame: number, w: number, h: number) => drawHumanoid(ctx, frame, w, h, NPC_STYLES[kind]);
