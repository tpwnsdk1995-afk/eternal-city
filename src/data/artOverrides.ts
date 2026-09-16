import { TEX, type TexKey } from './textureKeys';

/**
 * Real art that replaces a procedurally drawn texture. Paths are relative to the page (served from
 * `public/art` in dev/preview and published next to `index.html` on the play page). A missing or
 * failing file just leaves the drawn fallback in place, so the game never depends on these.
 *
 * Generated with Higgsfield (z_image) from prompts in the 2003 Korean PC-MMORPG portrait style and
 * downscaled to the sizes the HUD/dialog actually display (128px faces, 1280×720 title).
 */
/**
 * A single image, or a sprite sheet (frame grid, numbered row-major) for figure keys whose 8×6
 * layout is fixed by `systems/facing` — see `tools/render-sprites.mjs`, which pre-renders 3D models
 * into that layout the way the original game did.
 */
/** top: idle head height above the frame centre in sheet px (tools/ec-extract.py prints it); labels hang there, not at the cell edge. */
export type ArtOverride = string | { url: string; frameW: number; frameH: number; scale?: number; top?: number };

/** Display scale a figure sheet needs so its native pixels match the drawn 48px figures' world size. */
export const artScale = (key: TexKey): number => {
  const art = ART_OVERRIDES[key];
  return typeof art === 'object' ? (art.scale ?? 1) : 1;
};

/** Idle head height above the frame centre (sheet px), or undefined for drawn figures. */
export const artTop = (key: TexKey): number | undefined => {
  const art = ART_OVERRIDES[key];
  return typeof art === 'object' ? art.top : undefined;
};

export const ART_OVERRIDES: Partial<Record<TexKey, ArtOverride>> = {
  [TEX.portrait_player]: 'art/portrait_player.webp',
  [TEX.portrait_infected]: 'art/portrait_infected.webp',
  [TEX.face_elia]: 'art/face_elia.webp',
  [TEX.face_shop]: 'art/face_shop.webp',
  [TEX.face_tech]: 'art/face_tech.webp',
  [TEX.face_blackmarket]: 'art/face_blackmarket.webp',
  [TEX.face_mainstream]: 'art/face_mainstream.webp',
  [TEX.face_parallel]: 'art/face_parallel.webp',
  [TEX.face_kimhun]: 'art/face_kimhun.webp',
  [TEX.face_trainer]: 'art/face_trainer.webp',
  [TEX.face_taxi]: 'art/face_taxi.webp',
  [TEX.face_assault]: 'art/face_assault.webp',
  [TEX.title_bg]: 'art/title_bg.webp',
  // HUD chrome cut from the original client's window frame / 닫기 button (tools/ec-ui.py); 9-sliced 8px (panel) and 3px (button)
  [TEX.ui_panel]: 'art/ui_panel.png',
  [TEX.ui_button]: 'art/ui_button.png',
  // weapon icons: 64×64 lossless, chroma-keyed to transparency; every UI draws them via setDisplaySize
  [TEX.icon_glock17]: 'art/icon_glock17.webp',
  [TEX.icon_m1911]: 'art/icon_m1911.webp',
  [TEX.icon_mp5]: 'art/icon_mp5.webp',
  [TEX.icon_uzi]: 'art/icon_uzi.webp',
  [TEX.icon_m16]: 'art/icon_m16.webp',
  [TEX.icon_ak47]: 'art/icon_ak47.webp',
  [TEX.icon_shotgun]: 'art/icon_shotgun.webp',
  [TEX.icon_sniper]: 'art/icon_sniper.webp',
  [TEX.icon_mg]: 'art/icon_mg.webp',
  [TEX.icon_baton]: 'art/icon_baton.webp',
  [TEX.icon_machete]: 'art/icon_machete.webp',
  [TEX.icon_axe]: 'art/icon_axe.webp',
  [TEX.icon_launcher]: 'art/icon_launcher.webp',
  [TEX.icon_claws]: 'art/icon_claws.webp',
  [TEX.icon_tentacle]: 'art/icon_tentacle.webp',
  [TEX.icon_acid]: 'art/icon_acid.webp',
  [TEX.icon_bone]: 'art/icon_bone.webp',
  // original-client sprites extracted with tools/ec-extract.py (8 dirs × 6 frames, native ~62px figures)
  // player: one model (00046) in three firing poses; the six long-gun classes share a sheet, so weapon swaps keep the frame size
  [TEX.player]: { url: 'art/player.png', frameW: 150, frameH: 156, scale: 0.6 },
  [TEX.player_melee]: { url: 'art/player_melee.png', frameW: 150, frameH: 156, scale: 0.6 },
  // NPCs: single-pose figures from the original client (03xxx/04xxx, 00012, 00061); Npc.ts shows the S idle frame only
  [TEX.npc_elia]: { url: 'art/npc_elia.png', frameW: 30, frameH: 82, scale: 0.6 },
  [TEX.npc_shop]: { url: 'art/npc_shop.png', frameW: 38, frameH: 88, scale: 0.6 },
  [TEX.npc_tech]: { url: 'art/npc_tech.png', frameW: 34, frameH: 82, scale: 0.6 },
  [TEX.npc_blackmarket]: { url: 'art/npc_blackmarket.png', frameW: 42, frameH: 88, scale: 0.6 },
  [TEX.npc_storage]: { url: 'art/npc_storage.png', frameW: 60, frameH: 96, scale: 0.6 },
  [TEX.npc_mainstream]: { url: 'art/npc_mainstream.png', frameW: 38, frameH: 86, scale: 0.6 },
  [TEX.npc_parallel]: { url: 'art/npc_parallel.png', frameW: 40, frameH: 88, scale: 0.6 },
  [TEX.npc_cyber]: { url: 'art/npc_cyber.png', frameW: 46, frameH: 94, scale: 0.6 },
  [TEX.npc_kimhun]: { url: 'art/npc_kimhun.png', frameW: 58, frameH: 92, scale: 0.6 },
  [TEX.npc_taxi]: { url: 'art/npc_taxi.png', frameW: 64, frameH: 88, scale: 0.6 },
  [TEX.npc_assault]: { url: 'art/npc_assault.png', frameW: 34, frameH: 82, scale: 0.6 },
  [TEX.player_smg]: { url: 'art/player_long.png', frameW: 150, frameH: 156, scale: 0.6 },
  [TEX.player_rifle]: { url: 'art/player_long.png', frameW: 150, frameH: 156, scale: 0.6 },
  [TEX.player_shotgun]: { url: 'art/player_long.png', frameW: 150, frameH: 156, scale: 0.6 },
  [TEX.player_sniper]: { url: 'art/player_long.png', frameW: 150, frameH: 156, scale: 0.6 },
  [TEX.player_mg]: { url: 'art/player_long.png', frameW: 150, frameH: 156, scale: 0.6 },
  [TEX.player_launcher]: { url: 'art/player_long.png', frameW: 150, frameH: 156, scale: 0.6 },
  [TEX.zombie_casual_f]: { url: 'art/zombie_casual_f.png', frameW: 98, frameH: 152, scale: 0.6, top: 30 },
  [TEX.zombie_suit_m]: { url: 'art/zombie_suit_m.png', frameW: 146, frameH: 144, scale: 0.6, top: 34 },
  [TEX.zombie_stripe]: { url: 'art/zombie_stripe.png', frameW: 174, frameH: 150, scale: 0.6, top: 38 },
  [TEX.zombie_banshee]: { url: 'art/zombie_banshee.png', frameW: 158, frameH: 152, scale: 0.6, top: 31 },
  [TEX.zombie_office]: { url: 'art/zombie_office.png', frameW: 192, frameH: 150, scale: 0.6, top: 43 },
  [TEX.zombie_worker]: { url: 'art/zombie_worker.png', frameW: 202, frameH: 172, scale: 0.6, top: 40 },
  // monsters: original sheets, 6 columns (idle, walk x3, attack, death) x 8 directions; sizes come from tools/ec-extract.py
  [TEX.zombie_dog]: { url: 'art/zombie_dog.png', frameW: 114, frameH: 132, scale: 0.6, top: -2 },
  [TEX.zombie_hardened]: { url: 'art/zombie_hardened.png', frameW: 180, frameH: 164, scale: 0.6, top: 45 },
  [TEX.ogurin]: { url: 'art/ogurin.png', frameW: 352, frameH: 302, scale: 0.6, top: 70 },
  [TEX.ogurin_mutant]: { url: 'art/ogurin_mutant.png', frameW: 320, frameH: 412, scale: 0.6, top: 89 },
  [TEX.wito_recon]: { url: 'art/wito_recon.png', frameW: 162, frameH: 170, scale: 0.6, top: 20 },
  [TEX.wito_soldier]: { url: 'art/wito_soldier.png', frameW: 114, frameH: 134, scale: 0.6, top: 30 },
  [TEX.wito_airborne]: { url: 'art/wito_airborne.png', frameW: 176, frameH: 162, scale: 0.6, top: 38 },
  [TEX.wito_elite]: { url: 'art/wito_elite.png', frameW: 112, frameH: 126, scale: 0.6, top: 35 },
  [TEX.zombie_police]: { url: 'art/zombie_police.png', frameW: 150, frameH: 144, scale: 0.6, top: 38 },
  [TEX.zombie_firefighter]: { url: 'art/zombie_firefighter.png', frameW: 176, frameH: 158, scale: 0.6, top: 29 },
  [TEX.wito_engineer]: { url: 'art/wito_engineer.png', frameW: 66, frameH: 90, scale: 0.6, top: 38 },
  [TEX.wito_turret]: { url: 'art/wito_turret.png', frameW: 168, frameH: 200, scale: 0.6, top: 59 },
  [TEX.zombie_fire_chief]: { url: 'art/zombie_fire_chief.png', frameW: 266, frameH: 228, scale: 0.6, top: 77 },
  [TEX.zombie_soldier]: { url: 'art/zombie_soldier.png', frameW: 220, frameH: 192, scale: 0.6, top: 36 },
  [TEX.larva]: { url: 'art/larva.png', frameW: 334, frameH: 326, scale: 0.6, top: 88 },
  [TEX.wito_elite_trooper]: { url: 'art/wito_elite_trooper.png', frameW: 138, frameH: 134, scale: 0.6, top: 40 },
  [TEX.mongolian_deathworm]: { url: 'art/mongolian_deathworm.png', frameW: 352, frameH: 232, scale: 0.6, top: 63 },
  [TEX.guest_scout]: { url: 'art/guest_scout.png', frameW: 152, frameH: 152, scale: 0.6, top: 32 },
  [TEX.guest_warrior]: { url: 'art/guest_warrior.png', frameW: 156, frameH: 154, scale: 0.6, top: 38 },
  [TEX.guest_hunter]: { url: 'art/guest_hunter.png', frameW: 152, frameH: 152, scale: 0.6, top: 32 },
  [TEX.guest_elite]: { url: 'art/guest_elite.png', frameW: 162, frameH: 162, scale: 0.6, top: 39 },
  [TEX.parasite_root]: { url: 'art/parasite_root.png', frameW: 222, frameH: 336, scale: 0.6, top: 117 },
  [TEX.zombie_lord]: { url: 'art/zombie_lord.png', frameW: 270, frameH: 266, scale: 0.6, top: 67 },
  [TEX.wito_heavy_gunner]: { url: 'art/wito_heavy_gunner.png', frameW: 202, frameH: 188, scale: 0.6, top: 49 },
  [TEX.zombie_ceo]: { url: 'art/zombie_ceo.png', frameW: 102, frameH: 122, scale: 0.6, top: 41 },
  [TEX.zombie_riot_police]: { url: 'art/zombie_riot_police.png', frameW: 184, frameH: 166, scale: 0.6, top: 50 },
  [TEX.wito_drone]: { url: 'art/wito_drone.png', frameW: 52, frameH: 92, scale: 0.6, top: 41 },
  [TEX.parasite_spawn]: { url: 'art/parasite_spawn.png', frameW: 208, frameH: 178, scale: 0.6, top: 11 },
  [TEX.wito_commander]: { url: 'art/wito_commander.png', frameW: 80, frameH: 92, scale: 0.6, top: 40 },
  [TEX.zombie_ancient]: { url: 'art/zombie_ancient.png', frameW: 250, frameH: 166, scale: 0.6, top: 63 },
  [TEX.parasite_horror]: { url: 'art/parasite_horror.png', frameW: 332, frameH: 304, scale: 0.6, top: 82 },
  [TEX.the_wise_one]: { url: 'art/the_wise_one.png', frameW: 280, frameH: 192, scale: 0.6, top: 60 },
};
