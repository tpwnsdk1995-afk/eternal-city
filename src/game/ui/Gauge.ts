import Phaser from 'phaser';
import { theme } from './theme';

/** Segmented HUD gauge: sunken track, two-tone fill, 10% tick marks, label + value text. */
export class Gauge extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private value = -1;
  private max = -1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly barW: number,
    private readonly barH: number,
    private readonly color: number,
    private caption: string,
    private readonly showText = true,
  ) {
    super(scene, x, y);
    this.g = scene.add.graphics();
    this.label = scene.add.text(barW / 2, barH / 2, '', theme.textStyle(Math.max(9, barH - 4), '#f3f4f6', { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5);
    this.label.setVisible(showText);
    this.add([this.g, this.label]);
    scene.add.existing(this);
  }

  set(value: number, max: number): void {
    if (value === this.value && max === this.max) return;
    this.value = value;
    this.max = max;
    const ratio = max > 0 ? Phaser.Math.Clamp(value / max, 0, 1) : 0;
    const g = this.g;
    const w = this.barW;
    const h = this.barH;
    g.clear();
    g.fillStyle(0x07080a, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x1a1e24, 1).fillRect(1, 1, w - 2, h - 2);
    const fw = Math.max(0, Math.round((w - 2) * ratio));
    if (fw > 0) {
      const c = Phaser.Display.Color.IntegerToColor(this.color);
      const light = Phaser.Display.Color.GetColor(Math.min(255, c.red + 50), Math.min(255, c.green + 50), Math.min(255, c.blue + 50));
      const dark = Phaser.Display.Color.GetColor(Math.floor(c.red * 0.65), Math.floor(c.green * 0.65), Math.floor(c.blue * 0.65));
      g.fillStyle(dark, 1).fillRect(1, 1, fw, h - 2);
      g.fillStyle(this.color, 1).fillRect(1, 1, fw, Math.ceil((h - 2) * 0.55));
      g.fillStyle(light, 0.6).fillRect(1, 1, fw, Math.max(1, Math.floor((h - 2) * 0.2)));
    }
    // ticks every 10%
    g.fillStyle(0x000000, 0.45);
    for (let i = 1; i < 10; i++) g.fillRect(1 + Math.round(((w - 2) * i) / 10), 1, 1, h - 2);
    g.lineStyle(1, 0x4b5058, 1).strokeRect(0.5, 0.5, w - 1, h - 1);
    if (this.showText) this.label.setText(`${this.caption ? `${this.caption} ` : ''}${Math.round(value)} / ${Math.round(max)}`);
  }
}
