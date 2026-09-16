import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { ART_OVERRIDES } from '@data/artOverrides';
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
    for (const [key, url] of Object.entries(ART_OVERRIDES) as [TexKey, string][]) {
      if (!url || this.textures.exists(key)) continue;
      this.load.image(key, url);
    }
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[art] ${file.key}: could not load ${file.url}; using the drawn version`);
    });
  }

  create(): void {
    // defer one tick so the text paints before the (synchronous) generation
    this.time.delayedCall(0, () => {
      generateAllTextures(this);
      this.scene.start('Title');
    });
  }
}
