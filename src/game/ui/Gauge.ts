import Phaser from 'phaser';
import { theme } from './theme';

const SEGMENTS = 10;

/**
 * Segmented HUD gauge in the original's style: a sunken track split into 10 blocks with 1px grooves,
 * each block lit in two tones as it fills; caption on the left, value right-aligned.
 */
export class Gauge extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics;
  private captionText: Phaser.GameObjects.Text;
  private valueText: Phaser.GameObjects.Text;
  private value = -1;
  private max = -1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly barW: number,
    private readonly barH: number,
    private readonly color: number,
    caption: string,
    private readonly showText = true,
  ) {
    super(scene, x, y);
    this.g = scene.add.graphics();
    const size = Math.max(9, barH - 5);
    const style = theme.textStyle(size, '#f3f4f6', { stroke: '#000', strokeThickness: 3 });
    this.captionText = scene.add.text(5, barH / 2, caption, style).setOrigin(0, 0.5);
    this.valueText = scene.add.text(barW - 5, barH / 2, '', style).setOrigin(1, 0.5);
    this.captionText.setVisible(showText && !!caption);
    this.valueText.setVisible(showText);
    this.add([this.g, this.captionText, this.valueText]);
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
    if (h <= 10) {
      // thin strip like the original's stacked bars: black track, grey frame, solid fill with a gloss line
      g.fillStyle(0x3a3b3f, 1).fillRect(0, 0, w, h);
      g.fillStyle(0x08090a, 1).fillRect(1, 1, w - 2, h - 2);
      const fw = Math.round((w - 2) * ratio);
      if (fw > 0) {
        const c0 = Phaser.Display.Color.IntegerToColor(this.color);
        const dk = Phaser.Display.Color.GetColor(Math.floor(c0.red * 0.6), Math.floor(c0.green * 0.6), Math.floor(c0.blue * 0.6));
        const lt = Phaser.Display.Color.GetColor(Math.min(255, c0.red + 70), Math.min(255, c0.green + 70), Math.min(255, c0.blue + 70));
        g.fillStyle(dk, 1).fillRect(1, 1, fw, h - 2);
        g.fillStyle(this.color, 1).fillRect(1, 1, fw, Math.max(1, h - 4));
        g.fillStyle(lt, 0.8).fillRect(1, 1, fw, 1);
      }
      if (this.showText) this.valueText.setText(`${Math.round(value)}/${Math.round(max)}`);
      return;
    }
    // sunken track
    g.fillStyle(0x07080a, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x151920, 1).fillRect(1, 1, w - 2, h - 2);
    g.fillStyle(0x000000, 0.5).fillRect(1, 1, w - 2, 1);
    // blocks
    const inner = w - 2;
    const gap = 1;
    const blockW = (inner - gap * (SEGMENTS - 1)) / SEGMENTS;
    const c = Phaser.Display.Color.IntegerToColor(this.color);
    const light = Phaser.Display.Color.GetColor(Math.min(255, c.red + 60), Math.min(255, c.green + 60), Math.min(255, c.blue + 60));
    const dark = Phaser.Display.Color.GetColor(Math.floor(c.red * 0.55), Math.floor(c.green * 0.55), Math.floor(c.blue * 0.55));
    const filled = ratio * SEGMENTS;
    for (let i = 0; i < SEGMENTS; i++) {
      const bx = 1 + Math.round(i * (blockW + gap));
      const bw = Math.max(1, Math.round((i + 1) * (blockW + gap)) - gap - Math.round(i * (blockW + gap)));
      const part = Phaser.Math.Clamp(filled - i, 0, 1);
      // empty block face
      g.fillStyle(0x1c2129, 1).fillRect(bx, 1, bw, h - 2);
      if (part > 0) {
        const fw = Math.max(1, Math.round(bw * part));
        g.fillStyle(dark, 1).fillRect(bx, 1, fw, h - 2);
        g.fillStyle(this.color, 1).fillRect(bx, 1, fw, Math.ceil((h - 2) * 0.6));
        g.fillStyle(light, 0.7).fillRect(bx, 1, fw, Math.max(1, Math.floor((h - 2) * 0.2)));
      }
    }
    g.lineStyle(1, 0x525a66, 1).strokeRect(0.5, 0.5, w - 1, h - 1);
    if (this.showText) this.valueText.setText(`${Math.round(value)} / ${Math.round(max)}`);
  }
}
