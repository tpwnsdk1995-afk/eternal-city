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
};
