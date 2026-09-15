import Phaser from 'phaser';
import { TEX } from '@data/textureKeys';
import type { Vec2 } from '@core/math/vec';

const DECAL_CAP = 70;

/** Short-lived combat visuals: tracers, muzzle flashes, blood, casings, AoE markers, hit flashes. */
export class CombatFx {
  private decals: Phaser.GameObjects.Image[] = [];

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
      .setAlpha(0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: 90, onComplete: () => img.destroy() });
  }

  muzzle(at: Vec2, rotation: number): void {
    const img = this.scene.add.image(at.x, at.y, TEX.muzzle).setDepth(12).setRotation(rotation).setScale(1 + Math.random() * 0.5).setBlendMode(Phaser.BlendModes.ADD);
    const glow = this.scene.add.image(at.x, at.y, TEX.muzzle).setDepth(11).setScale(2.6).setAlpha(0.35).setTint(0xffb060).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: img, alpha: 0, scale: 0.4, duration: 70, onComplete: () => img.destroy() });
    this.scene.tweens.add({ targets: glow, alpha: 0, duration: 110, onComplete: () => glow.destroy() });
  }

  /** Brass casing ejected sideways from the weapon. */
  casing(at: Vec2, aimAngle: number): void {
    const side = aimAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const dist = 14 + Math.random() * 12;
    const img = this.scene.add.image(at.x, at.y, TEX.casing).setDepth(6).setRotation(Math.random() * Math.PI);
    this.scene.tweens.add({
      targets: img,
      x: at.x + Math.cos(side) * dist,
      y: at.y + Math.sin(side) * dist + 10,
      angle: img.angle + 260,
      duration: 260,
      ease: 'Quad.easeOut',
    });
    this.scene.tweens.add({ targets: img, alpha: 0, delay: 2500, duration: 800, onComplete: () => img.destroy() });
  }

  blood(at: Vec2, scale = 1): void {
    const img = this.scene.add
      .image(at.x, at.y, TEX.blood)
      .setDepth(3)
      .setRotation(Math.random() * Math.PI * 2)
      .setScale((0.6 + Math.random() * 0.5) * scale);
    this.decals.push(img);
    if (this.decals.length > DECAL_CAP) this.decals.shift()?.destroy();
    this.scene.tweens.add({
      targets: img,
      alpha: 0,
      duration: 4000,
      delay: 9000,
      onComplete: () => {
        this.decals = this.decals.filter((d) => d !== img);
        img.destroy();
      },
    });
  }

  spark(at: Vec2): void {
    const img = this.scene.add.image(at.x, at.y, TEX.muzzle).setDepth(12).setScale(0.5).setTint(0xffe9a8).setBlendMode(Phaser.BlendModes.ADD);
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
