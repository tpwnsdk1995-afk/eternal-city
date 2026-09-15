import { ANIM, TEX, type AnimKey, type TexKey } from '@data/textureKeys';
import { drawTilesAtlas, TILE_COUNT } from './draw/tiles';
import { FIGURE_STYLES, figureDrawer, drawPortrait, type FigureKey } from './draw/figures';
import { WALK_FRAMES } from '../systems/facing';
import {
  drawBarricade,
  drawBooth,
  drawCasing,
  drawGate,
  drawIconAmmoIncendiary,
  drawIconAmmoNormal,
  drawIconArmorBottom,
  drawIconArmorTop,
  drawIconBandage,
  drawIconConsumable,
  drawIconDocument,
  drawIconPainkiller,
  drawIconEnergyDrink,
  drawIconGlock17,
  drawIconM1911,
  drawIconMp5,
  drawIconPistol,
  drawIconSkillMastery,
  drawIconSkillPassive,
  drawIconSmg,
  drawIconUzi,
  drawPickupItem,
  drawPickupWon,
} from './draw/items';
import { drawTitleBackground } from './draw/title';
import { drawBlood, drawFire, drawJumpMarker, drawMuzzle, drawTracer } from './draw/fx';
import { drawBench, drawBusStop, drawFlagpole, drawGoal, drawHydrant, drawLamp, drawPhone, drawPillar, drawSign, drawTrash, drawTree, drawVending } from './draw/decor';
import { drawCrosshair, drawUiPanel, drawUiSlot } from './draw/ui';

export type DrawFn = (ctx: CanvasRenderingContext2D, frame: number, w: number, h: number) => void;

export interface TextureSpec {
  frameW: number;
  frameH: number;
  frames: number;
  /** frame layout; omitted = one horizontal strip */
  grid?: { cols: number; rows: number };
  draw: DrawFn;
  anim?: { key: AnimKey; frameRate: number; repeat: number };
}

/** 8 directions × 4 walk frames, row per direction. */
const figure = (key: FigureKey, size = 48): TextureSpec => ({
  frameW: size,
  frameH: size,
  frames: 8 * WALK_FRAMES,
  grid: { cols: WALK_FRAMES, rows: 8 },
  draw: figureDrawer(FIGURE_STYLES[key]),
});

const single = (draw: DrawFn, w: number, h = w): TextureSpec => ({ frameW: w, frameH: h, frames: 1, draw });

/**
 * Every texture the game uses. Swapping a procedural entry for real art later means replacing
 * its `draw` with a spritesheet load — no game code references how a key was produced.
 */
export const TEXTURE_MANIFEST: Record<TexKey, TextureSpec> = {
  [TEX.tiles]: { frameW: 32 * TILE_COUNT, frameH: 32, frames: 1, draw: (ctx) => drawTilesAtlas(ctx) },

  [TEX.player]: figure('player'),
  [TEX.portrait_player]: single((ctx, _f, w, h) => drawPortrait(ctx, FIGURE_STYLES.player, w, h), 64),

  [TEX.zombie_casual_f]: figure('zombie_casual_f'),
  [TEX.zombie_suit_m]: figure('zombie_suit_m'),
  [TEX.zombie_stripe]: figure('zombie_stripe'),
  [TEX.zombie_banshee]: figure('zombie_banshee'),
  [TEX.zombie_lord]: figure('zombie_lord', 64),
  [TEX.zombie_dog]: figure('zombie_dog'),
  [TEX.zombie_hardened]: figure('zombie_hardened', 56),
  [TEX.zombie_worker]: figure('zombie_worker'),
  [TEX.ogurin]: figure('ogurin', 64),

  [TEX.wito_recon]: figure('wito_recon'),
  [TEX.wito_airborne]: figure('wito_airborne'),

  [TEX.npc_elia]: figure('npc_elia'),
  [TEX.npc_shop]: figure('npc_shop'),
  [TEX.npc_assault]: figure('npc_assault'),
  [TEX.npc_kimhun]: figure('npc_kimhun'),
  [TEX.npc_taxi]: figure('npc_taxi'),
  [TEX.wito_soldier]: figure('wito_soldier'),

  [TEX.deco_lamp]: single(drawLamp, 32, 80),
  [TEX.deco_vending]: single(drawVending, 32, 56),
  [TEX.deco_trash]: single(drawTrash, 24, 32),
  [TEX.deco_phone]: single(drawPhone, 32, 64),
  [TEX.deco_sign]: single(drawSign, 24, 56),
  [TEX.deco_tree]: single(drawTree, 64, 80),
  [TEX.deco_hydrant]: single(drawHydrant, 16, 28),
  [TEX.deco_bench]: single(drawBench, 48, 24),
  [TEX.deco_busstop]: single(drawBusStop, 64, 72),
  [TEX.deco_pillar]: single(drawPillar, 32, 72),
  [TEX.deco_goal]: single(drawGoal, 64, 40),
  [TEX.deco_flagpole]: single(drawFlagpole, 24, 96),

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

  [TEX.casing]: single(drawCasing, 5, 3),
  [TEX.title_bg]: single(drawTitleBackground, 1280, 720),

  [TEX.icon_pistol]: single(drawIconPistol, 32),
  [TEX.icon_smg]: single(drawIconSmg, 32),
  [TEX.icon_glock17]: single(drawIconGlock17, 32),
  [TEX.icon_m1911]: single(drawIconM1911, 32),
  [TEX.icon_mp5]: single(drawIconMp5, 32),
  [TEX.icon_uzi]: single(drawIconUzi, 32),
  [TEX.icon_bandage]: single(drawIconBandage, 32),
  [TEX.icon_energy_drink]: single(drawIconEnergyDrink, 32),
  [TEX.icon_document]: single(drawIconDocument, 32),
  [TEX.icon_painkiller]: single(drawIconPainkiller, 32),
  [TEX.icon_ammo_normal]: single(drawIconAmmoNormal, 32),
  [TEX.icon_ammo_incendiary]: single(drawIconAmmoIncendiary, 32),
  [TEX.icon_armor_top]: single(drawIconArmorTop, 32),
  [TEX.icon_armor_bottom]: single(drawIconArmorBottom, 32),
  [TEX.icon_skill_passive]: single(drawIconSkillPassive, 32),
  [TEX.icon_skill_mastery]: single(drawIconSkillMastery, 32),
  [TEX.icon_consumable]: single(drawIconConsumable, 32),
};
