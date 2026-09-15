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

  zombie_dog: { skin: '#8a7a68', hair: '#000', shirt: '#4a3a30', pants: '#3a2c24', quadruped: true, zombie: true, blood: 0.4, eyes: '#ff3030' } as FigureStyle,
  zombie_hardened: { skin: '#6f7a6a', hair: '#1a1a1a', shirt: '#2a2d33', pants: '#1f2126', coat: '#3a3d44', zombie: true, blood: 0.9, size: 1.12, eyes: '#ffb03b' } as FigureStyle,
  zombie_worker: { skin: ZOMBIE_SKIN, hair: '#3a2a1a', hairStyle: 'cap', shirt: '#3a4a5a', pants: '#2a3440', vest: '#e08a2a', zombie: true, blood: 0.55 } as FigureStyle,
  ogurin: { skin: '#5f7a5a', hair: '#1a2a1a', shirt: '#3a5a3a', pants: '#2a3a2a', zombie: true, blood: 0.8, size: 1.3, glow: 'rgba(80,220,120,0.35)', eyes: '#b6ff6b' } as FigureStyle,

  wito_recon: { skin: '#e3bd95', hair: '#3a3a2a', hairStyle: 'helmet', helmetColor: '#4a5530', shirt: '#5c6b3a', pants: '#4a5530', shoes: '#26281c', gun: 'rifle' } as FigureStyle,
  wito_airborne: { skin: '#e3bd95', hair: '#2a2a2a', hairStyle: 'helmet', helmetColor: '#2f3626', shirt: '#3f4a2f', pants: '#3a4228', shoes: '#1e2016', gun: 'rifle', pack: true } as FigureStyle,

  npc_elia: { skin: '#f1c9a5', hair: '#6b4fbb', hairStyle: 'long', shirt: '#e8e6ef', pants: '#d8d6e0', coat: '#f4f2f8', glow: 'rgba(120,120,255,0.22)' } as FigureStyle,
  npc_shop: { skin: '#e0b48c', hair: '#3a3a3a', hairStyle: 'cap', shirt: '#4b5a3a', pants: '#2f3a2a', vest: '#8a7a4a' } as FigureStyle,
  npc_assault: { skin: '#f1c9a5', hair: '#1a1a1a', shirt: '#7a2e2e', pants: '#2a2a33', coat: '#5a1f1f' } as FigureStyle,
  npc_taxi: { skin: '#e8c0a0', hair: '#4a4a4a', hairStyle: 'cap', shirt: '#d9b74a', pants: '#2a2a33', vest: '#3a3a44' } as FigureStyle,
  npc_kimhun: { skin: '#e8c0a0', hair: '#2a2a2a', hairStyle: 'cap', shirt: '#2f3d5c', pants: '#1f2738', shoes: '#111', vest: '#1a2233', gun: 'pistol' } as FigureStyle,
  wito_soldier: { skin: '#e3bd95', hair: '#3a3a2a', hairStyle: 'helmet', helmetColor: '#5a5f45', shirt: '#6b7a48', pants: '#55603a', shoes: '#26281c', gun: 'smg' } as FigureStyle,
} satisfies Record<string, FigureStyle>;

export type FigureKey = keyof typeof FIGURE_STYLES;

/** Manifest draw fn for an 8×4 figure grid: frame index → (dir, walk frame). */
export const figureDrawer = (style: FigureStyle) => (ctx: Ctx, frame: number, w: number, h: number) => drawFigure(ctx, Math.floor(frame / WALK_FRAMES) as Dir, frame % WALK_FRAMES, w, h, style);

/** Portrait (front-facing head + shoulders), used by the HUD and dialogs. */
export function drawPortrait(ctx: Ctx, style: FigureStyle, w: number, h: number): void {
  ctx.fillStyle = '#12161c';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.45, 4, w / 2, h * 0.45, w * 0.7);
  g.addColorStop(0, 'rgba(90,100,120,0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // render the front pose at 96px, then crop head + shoulders into the frame
  const off = document.createElement('canvas');
  off.width = 96;
  off.height = 96;
  const octx = off.getContext('2d');
  if (!octx) return;
  drawFigure(octx, 2, 0, 96, 96, { ...style, glow: undefined });
  // figure spans roughly y 22..92 at this size; take the top 40px (head/torso) and the middle 44px
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 26, 20, 44, 40, 0, 4, w, h - 4);
}
