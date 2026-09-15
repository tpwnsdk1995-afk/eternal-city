import Phaser from 'phaser';
import { ANIM, TEX } from '@data/textureKeys';
import { balance } from '@data/balance';
import type { ControlScheme } from '@data/schema/enums';
import type { Vec2 } from '@core/math/vec';
import { angleTo } from '@core/math/vec';
import { newStuckTracker, steerToward, trackStuck, type StuckTracker } from '@core/map/pathing';
import { totalWeightKg } from '@core/inventory/weight';
import { registry } from '@data/registry';
import { gameState } from '../state/GameState';
import type { InputIntent } from '../systems/input/InputMapper';

const JUMP_MS = 500;
const ARRIVE_RADIUS = 6;

/** The 헌터 avatar. Movement/stance only — firing is handled by CombatBridge reading `intent`. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  moveTarget: Vec2 | null = null;
  private runLatched = false;
  crouching = false;
  jumping = false;
  private jumpT = 0;
  private stuck: StuckTracker;
  private idleSince = 0;
  moving = false;
  running = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.player, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCircle(10, 6, 6);
    this.setDepth(10);
    this.setCollideWorldBounds(true);
    this.stuck = newStuckTracker({ x, y });
  }

  get pos(): Vec2 {
    return { x: this.x, y: this.y };
  }

  get canFire(): boolean {
    return !this.jumping;
  }

  stopMoving(): void {
    this.moveTarget = null;
    this.setVelocity(0, 0);
  }

  applyIntent(intent: InputIntent, dtMs: number, scheme: ControlScheme): void {
    const derived = gameState.derived();
    const vit = gameState.vitals;

    if (intent.crouchPressed) this.crouching = !this.crouching;
    if (intent.jumpPressed && !this.jumping && vit.stamina >= balance.stamina.jumpCost) {
      this.jumping = true;
      this.jumpT = 0;
      this.crouching = false;
      gameState.setVitals({ stamina: vit.stamina - balance.stamina.jumpCost });
    }

    const overweight = totalWeightKg(gameState.inventory, registry.item) > derived.maxWeightKg;
    const wantsRun = (intent.runHeld || intent.runToggled || this.runLatched) && !this.crouching && vit.stamina > 0;

    let dir: Vec2 = { x: 0, y: 0 };
    if (scheme === 'classic') {
      if (intent.clickedWorld) {
        this.moveTarget = intent.clickedWorld;
        this.runLatched = intent.clickedWithShift;
        this.stuck = newStuckTracker(this.pos);
      }
      if (this.moveTarget) {
        const steer = steerToward(this.pos, this.moveTarget, ARRIVE_RADIUS);
        if (steer.arrived) this.stopMoving();
        else {
          dir = steer.dir;
          this.stuck = trackStuck(this.stuck, this.pos, dtMs);
          if (this.stuck.stuckMs > balance.ai.stuckMs) this.stopMoving();
        }
      }
    } else if (intent.moveDir) {
      dir = intent.moveDir;
    }

    this.moving = dir.x !== 0 || dir.y !== 0;
    this.running = this.moving && wantsRun;

    let speed = derived.moveSpeed;
    if (this.running) speed *= balance.derived.runMult;
    if (this.crouching) speed *= balance.derived.crouchMult;
    if (overweight) speed *= balance.derived.overweightMult;
    this.setVelocity(dir.x * speed, dir.y * speed);

    // stamina
    if (this.running) {
      this.idleSince = 0;
      gameState.setVitals({ stamina: vit.stamina - balance.stamina.runDrainPerSec * (dtMs / 1000) });
    } else {
      this.idleSince += dtMs;
      if (this.idleSince >= balance.stamina.regenDelayMs && vit.stamina < derived.maxStamina) {
        gameState.setVitals({ stamina: vit.stamina + balance.stamina.regenPerSec * (dtMs / 1000) });
      }
    }
    // AP regen
    if (vit.ap < derived.maxAp) gameState.setVitals({ ap: gameState.vitals.ap + balance.ap.regenPerSec * (dtMs / 1000) });

    // facing
    this.setRotation(angleTo(this.pos, intent.aimWorld));

    // jump arc (visual scale pulse; body keeps colliding)
    if (this.jumping) {
      this.jumpT += dtMs;
      const t = Math.min(1, this.jumpT / JUMP_MS);
      const s = 1 + Math.sin(t * Math.PI) * 0.35;
      this.setScale(s);
      if (t >= 1) {
        this.jumping = false;
        this.setScale(1);
      }
    } else {
      this.setScale(this.crouching ? 0.85 : 1);
    }

    // walk animation
    if (this.moving) {
      if (!this.anims.isPlaying) this.play(ANIM.player_walk);
    } else if (this.anims.isPlaying) {
      this.anims.stop();
      this.setFrame(0);
    }
  }
}
