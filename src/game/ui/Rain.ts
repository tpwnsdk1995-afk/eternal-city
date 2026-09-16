import Phaser from 'phaser';

/** Cheap rain overlay for menu screens: a few dozen streaks redrawn each frame. */
export class Rain {
  private g: Phaser.GameObjects.Graphics;
  private drops: { x: number; y: number; len: number; speed: number }[] = [];

  constructor(
    scene: Phaser.Scene,
    private w: number,
    private h: number,
    count = 90,
    depth = 5,
    private alpha = 0.28,
  ) {
    this.g = scene.add.graphics().setDepth(depth);
    for (let i = 0; i < count; i++) this.drops.push({ x: Math.random() * w, y: Math.random() * h, len: 8 + Math.random() * 14, speed: 380 + Math.random() * 260 });
  }

  update(dtMs: number): void {
    const g = this.g;
    g.clear();
    g.lineStyle(1, 0xaebfd6, this.alpha);
    for (const d of this.drops) {
      d.y += (d.speed * dtMs) / 1000;
      d.x -= (d.speed * 0.12 * dtMs) / 1000;
      if (d.y > this.h + 20) {
        d.y = -20;
        d.x = Math.random() * (this.w + 100);
      }
      g.lineBetween(d.x, d.y, d.x - d.len * 0.12, d.y - d.len);
    }
  }

  /** World scenes: pin the streak field to the camera's visible rectangle (works with zoom). */
  follow(cam: Phaser.Cameras.Scene2D.Camera): void {
    const v = cam.worldView;
    this.g.setPosition(v.x, v.y);
    this.w = v.width;
    this.h = v.height;
  }

  destroy(): void {
    this.g.destroy();
  }
}
