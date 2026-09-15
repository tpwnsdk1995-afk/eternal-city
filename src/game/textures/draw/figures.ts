import type { Dir } from '../../systems/facing';
import { WALK_FRAMES } from '../../systems/facing';
import { drawFigure, type FigureStyle } from './figure';

type Ctx = CanvasRenderingContext2D;

const ZOMBIE_SKIN = '#9fae86';

/** Every character look in the game, by texture key. */
export const FIGURE_STYLES = {
  player: { skin: '#f1c9a5', hair: '#2b2118', shirt: '#2f5fa8', pants: '#2a3244', shoes: '#1a1a1a', gun: 'pistol' } as FigureStyle,

  zombie_casual_f: { skin: ZOMBIE_SKIN, hair: '#4a2c1f', hairStyle: 'long', shirt: '#d96b9a', pants: '#3b3b4a', zombie: true, blood: 0.5 } as FigureStyle,
  zombie_suit_m: { skin: ZOMBIE_SKIN, hair: '#1a1a1a', shirt: '#2b2f3a', pants: '#23262e', vest: '#d8d8d8', zombie: true, blood: 0.6 } as FigureStyle,
  zombie_stripe: { skin: ZOMBIE_SKIN, hair: '#5a3a1f', shirt: '#3a5aa8', pants: '#4a4a55', stripes: true, zombie: true, blood: 0.45 } as FigureStyle,
  zombie_banshee: { skin: '#9a8fb5', hair: '#e8e0f0', hairStyle: 'long', shirt: '#4a2a6a', pants: '#3a2050', dress: true, zombie: true, blood: 0.3, glow: 'rgba(150,80,220,0.35)', eyes: '#f0e0ff' } as FigureStyle,
  zombie_lord: { skin: '#7f8f68', hair: '#000000', shirt: '#5a1a1a', pants: '#2a1a1a', coat: '#3a0f0f', zombie: true, blood: 0.9, glow: 'rgba(200,40,40,0.35)', size: 1.35 } as FigureStyle,

  wito_recon: { skin: '#e3bd95', hair: '#3a3a2a', hairStyle: 'helmet', helmetColor: '#4a5530', shirt: '#5c6b3a', pants: '#4a5530', shoes: '#26281c', gun: 'rifle' } as FigureStyle,
  wito_airborne: { skin: '#e3bd95', hair: '#2a2a2a', hairStyle: 'helmet', helmetColor: '#2f3626', shirt: '#3f4a2f', pants: '#3a4228', shoes: '#1e2016', gun: 'rifle', pack: true } as FigureStyle,

  npc_elia: { skin: '#f1c9a5', hair: '#6b4fbb', hairStyle: 'long', shirt: '#e8e6ef', pants: '#d8d6e0', coat: '#f4f2f8', glow: 'rgba(120,120,255,0.22)' } as FigureStyle,
  npc_shop: { skin: '#e0b48c', hair: '#3a3a3a', hairStyle: 'cap', shirt: '#4b5a3a', pants: '#2f3a2a', vest: '#8a7a4a' } as FigureStyle,
  npc_assault: { skin: '#f1c9a5', hair: '#1a1a1a', shirt: '#7a2e2e', pants: '#2a2a33', coat: '#5a1f1f' } as FigureStyle,
} satisfies Record<string, FigureStyle>;

export type FigureKey = keyof typeof FIGURE_STYLES;

/** Manifest draw fn for an 8×4 figure grid: frame index → (dir, walk frame). */
export const figureDrawer = (style: FigureStyle) => (ctx: Ctx, frame: number, w: number, h: number) => drawFigure(ctx, Math.floor(frame / WALK_FRAMES) as Dir, frame % WALK_FRAMES, w, h, style);

/** Portrait (front-facing head + shoulders), used by the HUD and dialogs. */
export function drawPortrait(ctx: Ctx, style: FigureStyle, w: number, h: number): void {
  ctx.save();
  ctx.fillStyle = '#12161c';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.45, 4, w / 2, h * 0.45, w * 0.7);
  g.addColorStop(0, 'rgba(90,100,120,0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // zoom in on the upper body of the front pose
  ctx.translate(0, h * 0.62);
  ctx.scale(2.2, 2.2);
  ctx.translate(0, 4 * (w / 48) - (h * 0.62) / 2.2 + 12);
  drawFigure(ctx, 2, 0, w, h, { ...style, glow: undefined });
  ctx.restore();
}
