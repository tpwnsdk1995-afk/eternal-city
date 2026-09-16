import { TEX, type TexKey } from './textureKeys';

/**
 * Real art that replaces a procedurally drawn texture. Paths are relative to the page (served from
 * `public/art` in dev/preview and published next to `index.html` on the play page). A missing or
 * failing file just leaves the drawn fallback in place, so the game never depends on these.
 *
 * Generated with Higgsfield (z_image) from prompts in the 2003 Korean PC-MMORPG portrait style and
 * downscaled to the sizes the HUD/dialog actually display (128px faces, 1280×720 title).
 */
export const ART_OVERRIDES: Partial<Record<TexKey, string>> = {
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
};
