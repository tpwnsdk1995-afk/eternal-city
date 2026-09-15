import { drawHumanoid, type HumanoidStyle } from './characters';

type Ctx = CanvasRenderingContext2D;

const RECON: HumanoidStyle = { skin: '#e3bd95', shirt: '#5c6b3a', hair: '#3a3a2a', gun: true, gunColor: '#111' };
const AIRBORNE: HumanoidStyle = { skin: '#e3bd95', shirt: '#3f4a2f', hair: '#2a2a2a', gun: true, gunColor: '#111' };

function helmet(ctx: Ctx, w: number, h: number, color: string): void {
  const cx = w / 2;
  const cy = h / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx + 1, cy, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(cx - 4, cy - 1, 10, 2);
}

export function drawWitoRecon(ctx: Ctx, frame: number, w: number, h: number): void {
  drawHumanoid(ctx, frame, w, h, RECON);
  helmet(ctx, w, h, '#4a5530');
}

export function drawWitoAirborne(ctx: Ctx, frame: number, w: number, h: number): void {
  drawHumanoid(ctx, frame, w, h, AIRBORNE);
  helmet(ctx, w, h, '#2f3626');
  // pack straps
  ctx.fillStyle = '#c9c9c9';
  ctx.fillRect(w / 2 - 8, h / 2 - 6, 2, 12);
  ctx.fillRect(w / 2 - 4, h / 2 - 6, 2, 12);
}
