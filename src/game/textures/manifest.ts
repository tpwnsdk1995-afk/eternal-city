import { ANIM, TEX, type AnimKey, type TexKey } from '@data/textureKeys';
import { drawTilesAtlas, TILE_COUNT } from './draw/tiles';
import { drawNpc, drawPlayer } from './draw/characters';
import { drawZombie } from './draw/zombies';
import { drawWitoAirborne, drawWitoRecon } from './draw/wito';
import {
  drawBarricade,
  drawBooth,
  drawGate,
  drawIconAmmoIncendiary,
  drawIconAmmoNormal,
  drawIconArmorBottom,
  drawIconArmorTop,
  drawIconConsumable,
  drawIconPistol,
  drawIconSkillMastery,
  drawIconSkillPassive,
  drawIconSmg,
  drawPickupItem,
  drawPickupWon,
} from './draw/items';
import { drawBlood, drawFire, drawJumpMarker, drawMuzzle, drawTracer } from './draw/fx';
import { drawCrosshair, drawUiPanel, drawUiSlot } from './draw/ui';

export type DrawFn = (ctx: CanvasRenderingContext2D, frame: number, w: number, h: number) => void;

export interface TextureSpec {
  frameW: number;
  frameH: number;
  frames: number;
  draw: DrawFn;
  anim?: { key: AnimKey; frameRate: number; repeat: number };
}

const humanoid = (draw: DrawFn, size = 32, anim?: AnimKey): TextureSpec => ({
  frameW: size,
  frameH: size,
  frames: 2,
  draw,
  anim: anim ? { key: anim, frameRate: 6, repeat: -1 } : undefined,
});

const single = (draw: DrawFn, w: number, h = w): TextureSpec => ({ frameW: w, frameH: h, frames: 1, draw });

/**
 * Every texture the game uses. Swapping a procedural entry for real art later means replacing
 * its `draw` with a spritesheet load — no game code references how a key was produced.
 */
export const TEXTURE_MANIFEST: Record<TexKey, TextureSpec> = {
  [TEX.tiles]: { frameW: 32 * TILE_COUNT, frameH: 32, frames: 1, draw: (ctx) => drawTilesAtlas(ctx) },

  [TEX.player]: humanoid(drawPlayer, 32, ANIM.player_walk),

  [TEX.zombie_casual_f]: humanoid(drawZombie('casual'), 32, ANIM.zombie_walk),
  [TEX.zombie_suit_m]: humanoid(drawZombie('suit')),
  [TEX.zombie_stripe]: humanoid(drawZombie('stripe')),
  [TEX.zombie_banshee]: humanoid(drawZombie('banshee')),
  [TEX.zombie_lord]: humanoid(drawZombie('lord'), 48),

  [TEX.wito_recon]: humanoid(drawWitoRecon),
  [TEX.wito_airborne]: humanoid(drawWitoAirborne),

  [TEX.npc_elia]: humanoid(drawNpc('elia')),
  [TEX.npc_shop]: humanoid(drawNpc('shop')),
  [TEX.npc_assault]: humanoid(drawNpc('assault')),

  [TEX.barricade]: single(drawBarricade, 64),
  [TEX.gate]: single(drawGate, 32),
  [TEX.booth]: { frameW: 64, frameH: 64, frames: 3, draw: drawBooth },
  [TEX.pickup_won]: single(drawPickupWon, 16),
  [TEX.pickup_item]: single(drawPickupItem, 16),

  [TEX.tracer]: single(drawTracer, 16, 4),
  [TEX.muzzle]: single(drawMuzzle, 16),
  [TEX.blood]: single(drawBlood, 24),
  [TEX.fire]: { frameW: 16, frameH: 16, frames: 3, draw: drawFire, anim: { key: ANIM.fire_burn, frameRate: 10, repeat: -1 } },
  [TEX.jump_marker]: single(drawJumpMarker, 80),

  [TEX.ui_panel]: single(drawUiPanel, 48),
  [TEX.ui_slot]: single(drawUiSlot, 48),
  [TEX.crosshair]: single(drawCrosshair, 24),

  [TEX.icon_pistol]: single(drawIconPistol, 32),
  [TEX.icon_smg]: single(drawIconSmg, 32),
  [TEX.icon_ammo_normal]: single(drawIconAmmoNormal, 32),
  [TEX.icon_ammo_incendiary]: single(drawIconAmmoIncendiary, 32),
  [TEX.icon_armor_top]: single(drawIconArmorTop, 32),
  [TEX.icon_armor_bottom]: single(drawIconArmorBottom, 32),
  [TEX.icon_skill_passive]: single(drawIconSkillPassive, 32),
  [TEX.icon_skill_mastery]: single(drawIconSkillMastery, 32),
  [TEX.icon_consumable]: single(drawIconConsumable, 32),
};
