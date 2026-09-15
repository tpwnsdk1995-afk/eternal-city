import Phaser from 'phaser';
import { TEX } from '@data/textureKeys';
import type { Vec2 } from '@core/math/vec';

/** Short-lived combat visuals: tracers, muzzle flashes, blood, AoE markers, hit flashes. */
export class CombatFx {
  constructor(private scene: Phaser.Scene) {}

  tracer(from: Vec2, to: Vec2, tint = 0xffffff): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const img = this.scene.add
      .image((from.x + to.x) / 2, (from.y + to.y) / 2, TEX.tracer)
      .setDepth(12)
      .setRotation(Math.atan2(dy, dx))
      .setDisplaySize(len, 2)
      .setTint(tint)
      .setAlpha(0.9);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: 90, onComplete: () => img.destroy() });
  }

  muzzle(at: Vec2, rotation: number): void {
    const img = this.scene.add.image(at.x, at.y, TEX.muzzle).setDepth(12).setRotation(rotation).setScale(0.9 + Math.random() * 0.4);
    this.scene.tweens.add({ targets: img, alpha: 0, scale: 0.4, duration: 70, onComplete: () => img.destroy() });
  }

  blood(at: Vec2): void {
    const img = this.scene.add.image(at.x, at.y, TEX.blood).setDepth(6).setRotation(Math.random() * Math.PI * 2).setScale(0.6 + Math.random() * 0.5);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: 2500, delay: 400, onComplete: () => img.destroy() });
  }

  spark(at: Vec2): void {
    const img = this.scene.add.image(at.x, at.y, TEX.muzzle).setDepth(12).setScale(0.5).setTint(0xffe9a8);
    this.scene.tweens.add({ targets: img, alpha: 0, scale: 0.1, duration: 90, onComplete: () => img.destroy() });
  }

  /** Red ring showing where a leap will land / landed. */
  aoeMarker(at: Vec2, radius: number, durationMs: number): void {
    const img = this.scene.add.image(at.x, at.y, TEX.jump_marker).setDepth(6).setDisplaySize(radius * 2, radius * 2).setAlpha(0.9);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: durationMs, onComplete: () => img.destroy() });
  }

  hitFlash(target: Phaser.GameObjects.Sprite, color = 0xff5555): void {
    target.setTint(color);
    this.scene.time.delayedCall(110, () => target.active && target.clearTint());
  }
}
