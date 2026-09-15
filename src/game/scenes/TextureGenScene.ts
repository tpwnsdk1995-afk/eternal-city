import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { generateAllTextures } from '../textures/generateAll';

/** Generates every procedural texture before any world scene needs them. */
export class TextureGenScene extends Phaser.Scene {
  constructor() {
    super('TextureGen');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '리소스 생성 중…', {
        fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        fontSize: '20px',
        color: '#9ca3af',
      })
      .setOrigin(0.5);

    // defer one tick so the text paints before the (synchronous) generation
    this.time.delayedCall(0, () => {
      generateAllTextures(this);
      this.scene.start('Title');
    });
  }
}
