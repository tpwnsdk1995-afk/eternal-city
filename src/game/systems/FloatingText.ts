import Phaser from 'phaser';
import { theme } from '../ui/theme';

const MAX_LIVE = 48;

/** Damage numbers / status popups that drift up and fade. */
export class FloatingText {
  private live = 0;

  constructor(private scene: Phaser.Scene) {}

  spawn(x: number, y: number, text: string, color: string, size = 13, bold = false): void {
    if (this.live >= MAX_LIVE) return;
    this.live++;
    const jitter = (Math.random() - 0.5) * 10;
    const t = this.scene.add
      .text(x + jitter, y - 12, text, theme.textStyle(size, color, { stroke: '#000', strokeThickness: 3, fontStyle: bold ? 'bold' : 'normal' }))
      .setOrigin(0.5)
      .setDepth(20);
    this.scene.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 750,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        t.destroy();
        this.live--;
      },
    });
  }
}
