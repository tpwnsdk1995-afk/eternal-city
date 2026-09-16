import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { ART_OVERRIDES, type ArtOverride } from '@data/artOverrides';
import type { TexKey } from '@data/textureKeys';
import { generateAllTextures } from '../textures/generateAll';

/**
 * Loads the real-art overrides first (see `data/artOverrides`), then draws every remaining manifest
 * entry procedurally. A key the loader could not fetch simply falls back to its drawn version.
 */
export class TextureGenScene extends Phaser.Scene {
  constructor() {
    super('TextureGen');
  }

  preload(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '리소스 불러오는 중…', {
        fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        fontSize: '20px',
        color: '#9ca3af',
      })
      .setOrigin(0.5);
    for (const [key, art] of Object.entries(ART_OVERRIDES) as [TexKey, ArtOverride][]) {
      if (!art || this.textures.exists(key)) continue;
      if (typeof art === 'string') this.load.image(key, art);
      // pre-rendered figure sheet: frames are numbered left-to-right, top-to-bottom, matching figureFrame()
      else this.load.spritesheet(key, art.url, { frameWidth: art.frameW, frameHeight: art.frameH });
    }
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[art] ${file.key}: could not load ${file.url}; using the drawn version`);
    });
  }

  create(): void {
    // defer one tick so the text paints before the (synchronous) generation
    this.time.delayedCall(0, () => {
      generateAllTextures(this);
      // Drain the texture uploads now. The ~190 generated canvases (≈9.5M texels) are queued to the GPU
      // process asynchronously; without this the first world scene stalls for many seconds on software
      // GL (test runners, GPU-less laptops) while the queue empties. On a real GPU this returns at once.
      const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
      if (renderer.gl) renderer.gl.finish();
      this.scene.start('Title');
    });
  }
}
