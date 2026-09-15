import type Phaser from 'phaser';
import type { TexKey } from '@data/textureKeys';
import { TEXTURE_MANIFEST, type TextureSpec } from './manifest';

/** Draws every manifest entry into a canvas texture and registers frames + animations. Idempotent. */
export function generateAllTextures(scene: Phaser.Scene): void {
  for (const [key, spec] of Object.entries(TEXTURE_MANIFEST) as [TexKey, TextureSpec][]) {
    if (scene.textures.exists(key)) continue;

    const canvasTexture = scene.textures.createCanvas(key, spec.frameW * spec.frames, spec.frameH);
    if (!canvasTexture) continue;
    const ctx = canvasTexture.getContext();

    for (let f = 0; f < spec.frames; f++) {
      ctx.save();
      ctx.translate(f * spec.frameW, 0);
      ctx.beginPath();
      ctx.rect(0, 0, spec.frameW, spec.frameH);
      ctx.clip();
      spec.draw(ctx, f, spec.frameW, spec.frameH);
      ctx.restore();
      canvasTexture.add(f, 0, f * spec.frameW, 0, spec.frameW, spec.frameH);
    }
    canvasTexture.refresh();

    if (spec.anim && !scene.anims.exists(spec.anim.key)) {
      scene.anims.create({
        key: spec.anim.key,
        frames: scene.anims.generateFrameNumbers(key, { start: 0, end: spec.frames - 1 }),
        frameRate: spec.anim.frameRate,
        repeat: spec.anim.repeat,
      });
    }
  }
}
