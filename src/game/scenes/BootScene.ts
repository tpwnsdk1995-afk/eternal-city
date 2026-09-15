import Phaser from 'phaser';

/** Boots the game: later validates content data, opens the save DB, and loads settings. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.scene.start('Title');
  }
}
