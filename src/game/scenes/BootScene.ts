import Phaser from 'phaser';
import { validateAll } from '@data/registry';

/** Boots the game: validates content data, then hands off to texture generation. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    validateAll();
    this.scene.start('TextureGen');
  }
}
