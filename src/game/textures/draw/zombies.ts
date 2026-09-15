import { drawHumanoid, type HumanoidStyle } from './characters';

type Ctx = CanvasRenderingContext2D;

const ZOMBIE_SKIN = '#a7b58a';

const styles: Record<string, HumanoidStyle> = {
  casual: { skin: ZOMBIE_SKIN, shirt: '#d96b9a', hair: '#4a2c1f' },
  suit: { skin: ZOMBIE_SKIN, shirt: '#2b2f3a', hair: '#1a1a1a' },
  stripe: { skin: ZOMBIE_SKIN, shirt: '#3a5aa8', hair: '#5a3a1f', stripes: true },
  banshee: { skin: '#9a8fb5', shirt: '#4a2a6a', hair: '#e8e0f0', tall: true, glow: 'rgba(150,80,220,0.35)' },
  lord: { skin: '#7f8f68', shirt: '#5a1a1a', hair: '#000000', glow: 'rgba(200,40,40,0.35)' },
};

const bloodSplatter = (ctx: Ctx, w: number, h: number, seed: number) => {
  ctx.fillStyle = 'rgba(120,20,20,0.7)';
  let s = seed;
  for (let i = 0; i < 6; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * w;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280) * h;
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
  }
};

export const drawZombie = (kind: keyof typeof styles) => (ctx: Ctx, frame: number, w: number, h: number) => {
  drawHumanoid(ctx, frame, w, h, styles[kind]);
  bloodSplatter(ctx, w, h, kind.length * 17 + 3);
};
