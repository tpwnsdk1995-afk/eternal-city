import Phaser from 'phaser';
import { theme } from './theme';

/** Horizontal bar with label + value text, redrawn only when set() changes it. */
export class Gauge extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private value = 0;
  private max = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly barW: number,
    h: number,
    color: number,
    private caption: string,
  ) {
    super(scene, x, y);
    const w = this.barW;
    this.bg = scene.add.rectangle(0, 0, w, h, 0x1a1e24).setOrigin(0, 0).setStrokeStyle(1, 0x3a3f47);
    this.fill = scene.add.rectangle(1, 1, w - 2, h - 2, color).setOrigin(0, 0);
    this.label = scene.add.text(w / 2, h / 2, '', theme.textStyle(11, '#f3f4f6', { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5);
    this.add([this.bg, this.fill, this.label]);
    scene.add.existing(this);
  }

  set(value: number, max: number): void {
    if (value === this.value && max === this.max) return;
    this.value = value;
    this.max = max;
    const ratio = max > 0 ? Phaser.Math.Clamp(value / max, 0, 1) : 0;
    this.fill.width = Math.max(0, (this.barW - 2) * ratio);
    this.label.setText(`${this.caption ? `${this.caption} ` : ''}${Math.round(value)} / ${Math.round(max)}`);
  }
}
