import Phaser from 'phaser';
import { TEX } from '@data/textureKeys';
import type { WeaponDef } from '@data/schema/item';
import type { AttackerCtx } from '@core/combat/damage';
import type { RayTarget } from '@core/combat/hitscan';
import type { CollisionGrid } from '@core/map/collisionGrid';
import { arcHeight, launch, stepProjectile, type ProjectileState } from '@core/combat/projectile';
import type { Vec2 } from '@core/math/vec';
import { depthForY } from '../systems/facing';

/**
 * A launcher round in flight (M79 유탄 / RPG-7 로켓). Pure flight math lives in
 * `core/combat/projectile`; this class only renders the shell, its ground shadow and exhaust.
 */
export class Projectile {
  state: ProjectileState;
  readonly ctx: AttackerCtx;
  readonly def: WeaponDef;
  private sprite: Phaser.GameObjects.Image;
  private shadow: Phaser.GameObjects.Ellipse;
  private smokeT = 0;
  done = false;

  constructor(
    private scene: Phaser.Scene,
    def: WeaponDef,
    origin: Vec2,
    angle: number,
    aimDist: number,
    ctx: AttackerCtx,
  ) {
    const p = def.projectile!;
    this.def = def;
    this.ctx = ctx;
    this.state = launch({ origin, angle, speed: p.speed, range: def.range, aimDist, arc: p.arc, aoeRadius: p.aoeRadius });
    this.sprite = scene.add.image(origin.x, origin.y, p.arc ? TEX.shell_grenade : TEX.rocket).setRotation(angle).setDepth(depthForY(origin.y) + 1);
    this.shadow = scene.add.ellipse(origin.x, origin.y + 4, 10, 4, 0x000000, 0.35).setDepth(3);
  }

  /** Advance; returns the blast point when it detonates this frame. */
  step(dtMs: number, grid: CollisionGrid, targets: readonly RayTarget[]): Vec2 | null {
    if (this.done) return null;
    const r = stepProjectile(this.state, dtMs, grid, targets);
    if (r.kind === 'detonate') {
      this.done = true;
      this.sprite.destroy();
      this.shadow.destroy();
      return r.at;
    }
    this.state = r.state;
    const { pos } = this.state;
    const h = this.state.arc ? arcHeight(this.state.travelled / this.state.maxDist, this.state.maxDist) : 6;
    this.sprite.setPosition(pos.x, pos.y - h).setDepth(depthForY(pos.y) + 1);
    if (this.state.arc) this.sprite.rotation += dtMs * 0.012; // tumbling shell
    this.shadow.setPosition(pos.x, pos.y + 4).setScale(1 - h / 160);
    // rocket exhaust puffs
    if (!this.state.arc) {
      this.smokeT += dtMs;
      if (this.smokeT > 28) {
        this.smokeT = 0;
        const puff = this.scene.add.image(pos.x - this.state.dir.x * 10, pos.y - 6 - this.state.dir.y * 10, TEX.smoke_puff).setDepth(this.sprite.depth - 1).setAlpha(0.8).setScale(0.6);
        this.scene.tweens.add({ targets: puff, alpha: 0, scale: 1.6, duration: 380, onComplete: () => puff.destroy() });
      }
    }
    return null;
  }

  destroy(): void {
    this.done = true;
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
