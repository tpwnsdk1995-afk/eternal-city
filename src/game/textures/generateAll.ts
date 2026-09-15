import type Phaser from 'phaser';
import type { TexKey } from '@data/textureKeys';
import { TEXTURE_MANIFEST, type TextureSpec } from './manifest';

/**
 * Draws every manifest entry into a canvas texture and registers frames + animations. Idempotent.
 * Frames are laid out in a grid (`cols` × `rows`, row-major); a plain strip is a 1-row grid.
 */
export function generateAllTextures(scene: Phaser.Scene): void {
  for (const [key, spec] of Object.entries(TEXTURE_MANIFEST) as [TexKey, TextureSpec][]) {
    if (scene.textures.exists(key)) continue;

    const cols = spec.grid?.cols ?? spec.frames;
    const rows = spec.grid?.rows ?? 1;
    const canvasTexture = scene.textures.createCanvas(key, spec.frameW * cols, spec.frameH * rows);
    if (!canvasTexture) continue;
    const ctx = canvasTexture.getContext();

    for (let f = 0; f < spec.frames; f++) {
      const cx = (f % cols) * spec.frameW;
      const cy = Math.floor(f / cols) * spec.frameH;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.rect(0, 0, spec.frameW, spec.frameH);
      ctx.clip();
      spec.draw(ctx, f, spec.frameW, spec.frameH);
      ctx.restore();
      canvasTexture.add(f, 0, cx, cy, spec.frameW, spec.frameH);
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
