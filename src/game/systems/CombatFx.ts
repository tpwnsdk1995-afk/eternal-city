import Phaser from 'phaser';
import { ANIM, TEX } from '@data/textureKeys';
import type { Vec2 } from '@core/math/vec';
import { audio } from '../audio/AudioManager';
import { gameState } from '../state/GameState';

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
    audio.at('hit_flesh', at.x, at.y);
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

  /** Melee swing arc that fades quickly. */
  swing(origin: Vec2, angle: number, range: number): void {
    audio.gunshot(gameState.weapon()?.def.class ?? '근접무기', gameState.fire.subFire);
    const g = this.scene.add.graphics().setDepth(12);
    g.lineStyle(3, 0xf3f4f6, 0.85);
    g.beginPath();
    g.arc(origin.x, origin.y, range, angle - 0.9, angle + 0.9, false);
    g.strokePath();
    g.lineStyle(1, 0xffffff, 0.4);
    g.beginPath();
    g.arc(origin.x, origin.y, range - 8, angle - 0.7, angle + 0.7, false);
    g.strokePath();
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 140, onComplete: () => g.destroy() });
  }

  spark(at: Vec2): void {
    audio.at('hit_wall', at.x, at.y);
    const img = this.scene.add.image(at.x, at.y, TEX.muzzle).setDepth(12).setScale(0.5).setTint(0xffe9a8).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: img, alpha: 0, scale: 0.1, duration: 90, onComplete: () => img.destroy() });
  }

  /** Red ring showing where a leap will land / landed. */
  aoeMarker(at: Vec2, radius: number, durationMs: number): void {
    const img = this.scene.add.image(at.x, at.y, TEX.jump_marker).setDepth(6).setDisplaySize(radius * 2, radius * 2).setAlpha(0.9);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: durationMs, onComplete: () => img.destroy() });
  }

  /** Launcher blast: animated fireball sized to the AoE radius, a fading ring and a scorch decal. */
  explosion(at: Vec2, radius: number): void {
    audio.at('explode', at.x, at.y);
    const scorch = this.scene.add.image(at.x, at.y, TEX.scorch).setDepth(3).setDisplaySize(radius * 1.6, radius * 1.6).setRotation(Math.random() * Math.PI * 2);
    this.decals.push(scorch);
    if (this.decals.length > DECAL_CAP) this.decals.shift()?.destroy();
    this.scene.tweens.add({
      targets: scorch,
      alpha: 0,
      duration: 5000,
      delay: 12000,
      onComplete: () => {
        this.decals = this.decals.filter((d) => d !== scorch);
        scorch.destroy();
      },
    });
    const ring = this.scene.add.image(at.x, at.y, TEX.jump_marker).setDepth(6).setDisplaySize(radius * 0.6, radius * 0.6).setAlpha(0.8).setTint(0xffb060);
    this.scene.tweens.add({ targets: ring, displayWidth: radius * 2.2, displayHeight: radius * 2.2, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    const boom = this.scene.add.sprite(at.x, at.y - 10, TEX.explosion, 0).setDepth(13).setDisplaySize(radius * 2.4, radius * 2.4).setBlendMode(Phaser.BlendModes.ADD);
    boom.play(ANIM.explosion_blast);
    boom.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => boom.destroy());
    // lingering smoke
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.random();
      const d = radius * 0.4 * Math.random();
      const puff = this.scene.add.image(at.x + Math.cos(a) * d, at.y - 8 + Math.sin(a) * d, TEX.smoke_puff).setDepth(12).setScale(1.5 + Math.random()).setAlpha(0.7);
      this.scene.tweens.add({ targets: puff, y: puff.y - 30 - Math.random() * 20, alpha: 0, scale: puff.scale * 2.2, duration: 900 + Math.random() * 500, onComplete: () => puff.destroy() });
    }
  }

  hitFlash(target: Phaser.GameObjects.Sprite, color = 0xff5555): void {
    target.setTint(color);
    this.scene.time.delayedCall(110, () => target.active && target.clearTint());
  }
}
