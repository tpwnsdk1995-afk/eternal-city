import Phaser from 'phaser';
import type { MonsterDef } from '@data/schema/monster';
import { ANIM, TEX } from '@data/textureKeys';
import { angleTo, type Vec2 } from '@core/math/vec';
import { initialBrain, type BrainOutput, type BrainState } from '@core/ai/enemyBrain';
import { emptyStatus, type StatusState } from '@core/combat/statusEffects';
import { theme } from '../ui/theme';
import { DIR_S, depthForY, dirFromAngle, figureFrame, type Dir } from '../systems/facing';
import { balance } from '@data/balance';

let nextUid = 1;

/** A monster on the map. Decisions come from `core/ai/enemyBrain`; this class only renders + moves. */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly uid = `e${nextUid++}`;
  readonly def: MonsterDef;
  readonly maxHp: number;
  hp: number;
  brain: BrainState;
  status: StatusState = emptyStatus();
  readonly home: Vec2;
  alive = true;
  /** index into the map's spawnZones, or -1 for scripted spawns */
  zoneIndex: number;
  /** who spawned it: a field zone, an assault wave/boss/adds, or the debug hook */
  tag: 'zone' | 'wave' | 'boss' | 'adds' | 'debug' = 'zone';
  /** AI LOD: far-away enemies think less often (CombatBridge) */
  nextThinkAt = 0;
  private bar: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text | null = null;
  private fireFx: Phaser.GameObjects.Sprite | null = null;
  private walkT = 0;
  private movingNow = false;
  dir: Dir = DIR_S;

  constructor(scene: Phaser.Scene, x: number, y: number, def: MonsterDef, now: number, zoneIndex = -1) {
    super(scene, x, y, def.tex, figureFrame(DIR_S, 0));
    this.def = def;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.brain = initialBrain(now);
    this.home = { x, y };
    this.zoneIndex = zoneIndex;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    const s = def.scale ?? 1;
    this.setScale(s);
    const frame = this.width; // unscaled frame size
    const r = def.bodyRadius / s;
    // circle around the lower body (figures stand with feet near the frame bottom)
    this.setCircle(r, frame / 2 - r, frame * 0.6 - r);
    this.setDepth(depthForY(y));
    this.setCollideWorldBounds(true);
    this.setImmovable(true);

    this.bar = scene.add.graphics().setDepth(11);
    if (def.boss) {
      this.label = scene.add.text(x, y - 30 * s, def.name, theme.textStyle(13, '#ff9b9b', { stroke: '#000', strokeThickness: 3, fontStyle: 'bold' })).setOrigin(0.5).setDepth(11);
    }
  }

  get pos(): Vec2 {
    return { x: this.x, y: this.y };
  }

  get radius(): number {
    return this.def.bodyRadius;
  }

  get hpRatio(): number {
    return this.hp / this.maxHp;
  }

  private knockbackUntil = 0;
  private knockbackWallBonus = 0;
  private knockbackDir: Vec2 = { x: 0, y: 0 };

  /**
   * Shove the enemy along `dir` (Slug / melee). While shoved the brain's movement is ignored; hitting
   * a wall mid-shove deals `wallBonus` extra damage once (original: Slug 벽 충돌 1.5배).
   */
  knockback(dir: Vec2, now: number, wallBonus: number, strength = 1): void {
    if (!this.alive || this.def.boss) return;
    const speed = (balance.combat.slugKnockbackPx / (balance.combat.slugKnockbackMs / 1000)) * strength;
    this.knockbackDir = dir;
    this.knockbackUntil = now + balance.combat.slugKnockbackMs * strength;
    this.knockbackWallBonus = Math.round(wallBonus * balance.combat.slugWallBonus);
    this.setVelocity(dir.x * speed, dir.y * speed);
  }

  /** Returns extra wall-impact damage to apply this frame (0 when none). */
  tickKnockback(now: number): number {
    if (now >= this.knockbackUntil) return 0;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const hitWall = (body.blocked.left && this.knockbackDir.x < 0) || (body.blocked.right && this.knockbackDir.x > 0) || (body.blocked.up && this.knockbackDir.y < 0) || (body.blocked.down && this.knockbackDir.y > 0);
    if (hitWall && this.knockbackWallBonus > 0) {
      const bonus = this.knockbackWallBonus;
      this.knockbackWallBonus = 0;
      this.knockbackUntil = now;
      return bonus;
    }
    return 0;
  }

  get isKnockedBack(): boolean {
    return this.scene.time.now < this.knockbackUntil;
  }

  /** Applies the brain's movement/facing. Slides along walls instead of grinding into them. */
  applyBrain(o: BrainOutput): void {
    if (!this.alive) return;
    if (this.isKnockedBack) return; // shove in progress; velocity was set by knockback()
    const speed = this.def.moveSpeed * o.speedMult;
    let vx = o.move.x * speed;
    let vy = o.move.y * speed;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if ((body.blocked.left && vx < 0) || (body.blocked.right && vx > 0)) {
      vx = 0;
      if (Math.abs(vy) < speed * 0.4) vy = (vy >= 0 ? 1 : -1) * speed * 0.8;
    }
    if ((body.blocked.up && vy < 0) || (body.blocked.down && vy > 0)) {
      vy = 0;
      if (Math.abs(vx) < speed * 0.4) vx = (vx >= 0 ? 1 : -1) * speed * 0.8;
    }
    this.setVelocity(vx, vy);
    this.movingNow = vx !== 0 || vy !== 0;
    if (o.face) this.dir = dirFromAngle(angleTo(this.pos, o.face));
    else if (this.movingNow) this.dir = dirFromAngle(Math.atan2(vy, vx));
  }

  /** Subtracts HP and flashes. Returns true when this hit killed it (caller runs `kill`). */
  damage(n: number): boolean {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - n);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.alive && this.clearTint());
    this.drawBar();
    return this.hp <= 0;
  }

  setBurning(on: boolean): void {
    if (on && !this.fireFx) {
      this.fireFx = this.scene.add.sprite(this.x, this.y - 8, TEX.fire, 0).setDepth(12).setScale(1.2);
      this.fireFx.play(ANIM.fire_burn);
    } else if (!on && this.fireFx) {
      this.fireFx.destroy();
      this.fireFx = null;
    }
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.alive) return;
    if (this.movingNow) this.walkT += delta * (this.def.moveSpeed > 80 ? 1.4 : 1);
    else this.walkT = 0;
    const walkFrame = this.movingNow ? 1 + (Math.floor(this.walkT / 160) % 3) : 0;
    this.setFrame(figureFrame(this.dir, walkFrame));
    this.setDepth(depthForY(this.y));
    if (this.hp < this.maxHp) this.drawBar();
    if (this.fireFx) this.fireFx.setPosition(this.x, this.y - 8);
    if (this.label) this.label.setPosition(this.x, this.y - 30 * this.scale);
  }

  private drawBar(): void {
    this.bar.clear();
    if (!this.alive || this.hp >= this.maxHp) return;
    const w = 28 * this.scale;
    const x = this.x - w / 2;
    const y = this.y - 20 * this.scale;
    this.bar.fillStyle(0x000000, 0.7).fillRect(x - 1, y - 1, w + 2, 5);
    this.bar.fillStyle(this.def.faction === 'zombie' ? 0xd94b4b : 0xd9a441, 1).fillRect(x, y, w * this.hpRatio, 3);
  }

  /** Death: stop physics, fade out, then destroy. */
  kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.brain = { ...this.brain, mode: 'dead' };
    this.setVelocity(0, 0);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.bar.clear();
    this.setBurning(false);
    this.label?.destroy();
    this.label = null;
    this.clearTint();
    this.setDepth(4);
    // collapse: tip over sideways and sink, then fade
    this.scene.tweens.add({ targets: this, angle: this.dir < 4 ? 80 : -80, y: this.y + 6, scaleY: this.scaleY * 0.85, duration: 260, ease: 'Quad.easeIn' });
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 900, delay: 700, onComplete: () => this.destroy() });
  }

  destroy(fromScene?: boolean): void {
    this.bar.destroy();
    this.fireFx?.destroy();
    this.label?.destroy();
    super.destroy(fromScene);
  }
}
