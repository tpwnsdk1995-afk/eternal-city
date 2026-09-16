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

  /** Directional 3-frame flash anchored at the barrel tip (origin near the left edge of the cone). */
  muzzle(at: Vec2, rotation: number): void {
    const img = this.scene.add
      .image(at.x, at.y, TEX.muzzle, 0)
      .setOrigin(0.1, 0.5)
      .setDepth(12)
      .setRotation(rotation)
      .setScale(0.9 + Math.random() * 0.4, 0.8 + Math.random() * 0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    const glow = this.scene.add.image(at.x, at.y, TEX.smoke_puff).setDepth(11).setScale(3).setAlpha(0.45).setTint(0xffb060).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.time.delayedCall(28, () => img.active && img.setFrame(1));
    this.scene.time.delayedCall(56, () => img.active && img.setFrame(2).setAlpha(0.7));
    this.scene.time.delayedCall(90, () => img.destroy());
    this.scene.tweens.add({ targets: glow, alpha: 0, scale: 1.5, duration: 120, onComplete: () => glow.destroy() });
    // lingering wisp of gun smoke drifting off the barrel
    const smoke = this.scene.add.image(at.x + Math.cos(rotation) * 6, at.y + Math.sin(rotation) * 6, TEX.smoke_puff).setDepth(11).setScale(0.5).setAlpha(0.35);
    this.scene.tweens.add({ targets: smoke, y: smoke.y - 10, x: smoke.x + Math.cos(rotation) * 8, alpha: 0, scale: 1.3, duration: 420, onComplete: () => smoke.destroy() });
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

  /**
   * Blood decal. Variant 0 = splatter (hit), 1 = pool (kill), 2 = smear (hit on a moving target).
   * Undefined → random splatter/smear.
   */
  blood(at: Vec2, scale = 1, variant?: 0 | 1 | 2): void {
    audio.at('hit_flesh', at.x, at.y);
    const v = variant ?? (Math.random() < 0.3 ? 2 : 0);
    const img = this.scene.add
      .image(at.x, at.y, TEX.blood, v)
      .setDepth(3)
      .setRotation(Math.random() * Math.PI * 2)
      .setScale((0.6 + Math.random() * 0.5) * scale);
    this.decals.push(img);
    if (this.decals.length > DECAL_CAP) this.decals.shift()?.destroy();
    // a few droplets flying off the impact
    if (v !== 1) {
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const drop = this.scene.add.image(at.x, at.y, TEX.blood, 0).setDepth(12).setScale(0.18).setAlpha(0.9);
        this.scene.tweens.add({ targets: drop, x: at.x + Math.cos(a) * (10 + Math.random() * 14), y: at.y + Math.sin(a) * 8 + 10, alpha: 0, duration: 220 + Math.random() * 120, ease: 'Quad.easeOut', onComplete: () => drop.destroy() });
      }
    }
    this.scene.tweens.add({
      targets: img,
      alpha: 0,
      duration: 4000,
      delay: v === 1 ? 14000 : 9000,
      onComplete: () => {
        this.decals = this.decals.filter((d) => d !== img);
        img.destroy();
      },
    });
  }

  /** Sparks off an armoured target (장갑/중장갑) — bullets ping instead of drawing blood. */
  armorSpark(at: Vec2): void {
    audio.at('hit_wall', at.x, at.y);
    const burst = this.scene.add.image(at.x, at.y, TEX.spark, 0).setDepth(12).setScale(1.2).setRotation(Math.random() * Math.PI).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.time.delayedCall(40, () => burst.active && burst.setFrame(1));
    this.scene.tweens.add({ targets: burst, alpha: 0, scale: 1.6, duration: 130, onComplete: () => burst.destroy() });
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const d = 10 + Math.random() * 12;
      const dot = this.scene.add.image(at.x, at.y, TEX.spark, 1).setDepth(12).setScale(0.3).setTint(0xffd070).setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({ targets: dot, x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d + 12, alpha: 0, duration: 260 + Math.random() * 100, ease: 'Quad.easeIn', onComplete: () => dot.destroy() });
    }
  }

  /** Dust puff kicked up under a running foot. */
  dust(at: Vec2): void {
    const puff = this.scene.add.image(at.x + (Math.random() - 0.5) * 6, at.y, TEX.dust).setDepth(4).setScale(0.8 + Math.random() * 0.4).setAlpha(0.7);
    this.scene.tweens.add({ targets: puff, y: at.y - 6, alpha: 0, scale: puff.scale * 1.8, duration: 380, onComplete: () => puff.destroy() });
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

  /** Bullet hitting a wall/objective: short spark burst + a puff of dust. */
  spark(at: Vec2): void {
    audio.at('hit_wall', at.x, at.y);
    const img = this.scene.add.image(at.x, at.y, TEX.spark, 0).setDepth(12).setScale(0.8).setRotation(Math.random() * Math.PI).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.time.delayedCall(35, () => img.active && img.setFrame(1));
    this.scene.tweens.add({ targets: img, alpha: 0, scale: 1.1, duration: 110, onComplete: () => img.destroy() });
    const puff = this.scene.add.image(at.x, at.y, TEX.dust).setDepth(12).setScale(0.7).setAlpha(0.6);
    this.scene.tweens.add({ targets: puff, alpha: 0, scale: 1.6, duration: 300, onComplete: () => puff.destroy() });
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
