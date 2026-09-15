import Phaser from 'phaser';
import { TEX } from '@data/textureKeys';
import { DIR_S, depthForY, dirFromAngle, figureFrame, type Dir } from '../systems/facing';
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

  /** facing direction (screen space), drives the sprite frame instead of rotation */
  dir: Dir = DIR_S;
  /** aim angle in radians (used for muzzle position / bullet direction) */
  aimAngle = Math.PI / 2;
  private walkT = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.player, figureFrame(DIR_S, 0));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // 48px frame; collision circle sits around the lower body
    this.setCircle(10, 14, 18);
    this.setDepth(depthForY(y));
    this.setCollideWorldBounds(true);
    this.stuck = newStuckTracker({ x, y });
    this.refreshWeaponLook();
    const off = gameState.events.on('equipment', () => this.refreshWeaponLook());
    const off2 = gameState.events.on('character', () => this.refreshWeaponLook());
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      off();
      off2();
    });
  }

  /** Swap the figure sheet so the held weapon matches the equipped class. */
  refreshWeaponLook(): void {
    const cls = gameState.weapon()?.def.class;
    const tex = gameState.character.race === 'infected' ? TEX.player_infected :
      cls === '근접무기' ? TEX.player_melee
      : cls === '기관단총' ? TEX.player_smg
      : cls === '돌격소총' || cls === '저격소총' || cls === '기관총' || cls === '산탄총' || cls === '투척중화기' ? TEX.player_rifle
      : TEX.player;
    if (this.texture.key !== tex) this.setTexture(tex, this.frame.name);
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
    if (intent.moveDir) {
      // direct vector (WASD or the virtual stick) always wins over a pending click-move
      dir = intent.moveDir;
      this.moveTarget = null;
    } else if (scheme === 'classic') {
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
    // 감염체 natural regeneration (pauses after being hit — CombatBridge stamps lastHurtAt)
    if (gameState.character.race === 'infected' && vit.hp < derived.maxHp && Date.now() - gameState.lastHurtAt > balance.infected.regenDelayMs) {
      gameState.setVitals({ hp: gameState.vitals.hp + derived.maxHp * balance.infected.regenPctPerSec * (dtMs / 1000) });
    }
    // AP regen
    if (vit.ap < derived.maxAp) gameState.setVitals({ ap: gameState.vitals.ap + balance.ap.regenPerSec * (dtMs / 1000) });

    // facing: aim direction when the pointer is away from the body, else movement direction
    const aimDist = Math.hypot(intent.aimWorld.x - this.x, intent.aimWorld.y - this.y);
    if (aimDist > 14) this.aimAngle = angleTo(this.pos, intent.aimWorld);
    else if (this.moving) this.aimAngle = Math.atan2(dir.y, dir.x);
    this.dir = dirFromAngle(this.aimAngle);
    this.setDepth(depthForY(this.y));

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

    // walk cycle (frame 0 = neutral stance); faster cadence while running
    if (this.moving) this.walkT += dtMs * (this.running ? 1.5 : 1);
    else this.walkT = 0;
    const walkFrame = this.moving ? 1 + (Math.floor(this.walkT / 140) % 3) : 0;
    this.setFrame(figureFrame(this.dir, walkFrame));
  }
}
