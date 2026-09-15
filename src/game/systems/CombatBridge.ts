import Phaser from 'phaser';
import { balance } from '@data/balance';
import { registry } from '@data/registry';
import type { MonsterDef } from '@data/schema/monster';
import { angleTo, dist, fromAngle, type Vec2 } from '@core/math/vec';
import { gameRng } from '@core/rng';
import type { BuiltMap } from '@core/map/mapBuild';
import { castRay, type RayTarget } from '@core/combat/hitscan';
import { computeHit, type AttackerCtx } from '@core/combat/damage';
import { spreadRadians } from '@core/combat/accuracy';
import { applyBurn, isBurning, isInvulnerable, tickBurn } from '@core/combat/statusEffects';
import { rollConsciousness } from '@core/combat/consciousness';
import { enemyHitChance, playerDamageTaken } from '@core/combat/enemyAttack';
import { markFired, toggleSubFire, tryFire } from '@core/weapons/fireController';
import { fireProfile, subFireParams } from '@core/weapons/weaponMath';
import { targetsInArc } from '@core/combat/meleeArc';
import type { WeaponDef } from '@data/schema/item';
import { isMeleeClass } from '@data/schema/enums';
import { addItem, consumeRound } from '@core/inventory/inventory';
import { totalWeightKg } from '@core/inventory/weight';
import { thinkEnemy, type BrainAction, type Perception } from '@core/ai/enemyBrain';
import { applyXp, xpForKill } from '@core/world/xp';
import { applyDeathPenalty } from '@core/world/death';
import { rollLoot } from '@core/world/loot';
import { gameState } from '../state/GameState';
import { questService } from '../state/questService';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import type { Objective } from '../entities/Objective';
import type { Player } from '../entities/Player';
import type { InputIntent } from './input/InputMapper';
import { CombatFx } from './CombatFx';
import { FloatingText } from './FloatingText';

export interface CombatHost {
  scene: Phaser.Scene;
  player: Player;
  enemies: Phaser.Physics.Arcade.Group;
  pickups: Phaser.Physics.Arcade.Group;
  built: BuiltMap;
  onPlayerDeath(): void;
  onEnemyKilled(e: Enemy): void;
  /** Destructible structures that also stop bullets (assault maps). */
  objectives?(): Objective[];
  onObjectiveDestroyed?(id: string): void;
  /** Launcher fired: the scene spawns the projectile (see ProjectileSystem). */
  onLaunch?(def: WeaponDef, origin: Vec2, angle: number, ctx: AttackerCtx): void;
}

const OBJ_PREFIX = 'obj:';

const PLAYER_RADIUS = 10;
const MUZZLE_OFFSET = 16;
const MSG_THROTTLE_MS = 1500;
const ENEMY_TRACER = 0xff8a7a;
const AI_LOD_DISTANCE = 720; // px — beyond roughly a screen away
const AI_LOD_INTERVAL_MS = 180;

/**
 * Glue between input/entities and the pure combat rules: player hitscan fire, enemy AI ticks and
 * their attacks, burning, loot, XP, and death → respawn.
 */
export class CombatBridge {
  readonly fx: CombatFx;
  readonly floating: FloatingText;
  private lastMsgAt: Record<string, number> = {};
  playerDead = false;

  constructor(private host: CombatHost) {
    this.fx = new CombatFx(host.scene);
    this.floating = new FloatingText(host.scene);
    host.scene.physics.add.overlap(host.player, host.pickups, (_p, obj) => this.collect(obj as Pickup));
  }

  update(intent: InputIntent, now: number, dtMs: number): void {
    if (this.playerDead) return;
    const { player } = this.host;

    if (intent.subFirePressed) {
      gameState.setFire(toggleSubFire(gameState.fire));
      gameState.message(gameState.fire.subFire ? '서브연사 ON (연사 120rpm · 피해 50%)' : '서브연사 OFF', 'system');
    }
    if (intent.fireHeld && player.canFire) this.playerFire(now, intent.aimWorld);

    // enemies — far ones (off-screen) think at a lower rate to keep big fields cheap
    const grid = this.host.built.collision;
    for (const e of this.aliveEnemies()) {
      if (now < e.nextThinkAt) continue;
      const far = dist(e.pos, player.pos) > AI_LOD_DISTANCE;
      e.nextThinkAt = far ? now + AI_LOD_INTERVAL_MS : 0;
      const p: Perception = {
        now,
        self: e.pos,
        home: e.home,
        player: player.pos,
        playerAlive: !this.playerDead,
        hasLOS: grid.hasLineOfSight(e.pos, player.pos),
        hpRatio: e.hpRatio,
      };
      const o = thinkEnemy(e.def, e.brain, p, gameRng);
      e.brain = o.state;
      e.applyBrain(o);
      if (o.action && !e.isKnockedBack) this.enemyAction(e, o.action, now);
      const wallDmg = e.tickKnockback(now);
      if (wallDmg > 0) {
        this.fx.spark({ x: e.x, y: e.y });
        this.floating.spawn(e.x, e.y - 6, `${wallDmg}`, '#ffb347', 13, true);
        if (e.damage(wallDmg)) this.killEnemy(e, now);
      }

      if (isBurning(e.status, now)) {
        const r = tickBurn(e.status, now, dtMs, e.maxHp);
        e.status = r.state;
        if (r.damage > 0) {
          this.floating.spawn(e.x, e.y, `${r.damage}`, '#ffb347', 12);
          if (e.damage(r.damage)) this.killEnemy(e, now);
        }
      } else if (e.status.burningUntil) {
        e.status = { ...e.status, burningUntil: 0 };
        e.setBurning(false);
      }
    }

    // player burning
    if (isBurning(gameState.status, now)) {
      const r = tickBurn(gameState.status, now, dtMs, gameState.derived().maxHp);
      gameState.status = r.state;
      if (r.damage > 0) this.hurtPlayerFinal(r.damage, now);
    }
  }

  aliveEnemies(): Enemy[] {
    return (this.host.enemies.getChildren() as Enemy[]).filter((e) => e.alive && e.active);
  }

  // --- player firing ------------------------------------------------------------------------

  private playerFire(now: number, aim: Vec2): void {
    const w = gameState.weapon();
    if (!w) return this.throttled('noWeapon', '장착된 무기가 없습니다.', 'bad');
    const d = gameState.derived();
    const attempt = tryFire(gameState.fire, now, w.def, d.attackSpeedMult, gameState.inventory, registry.item);
    if (!attempt.ok) {
      if (attempt.reason === 'noAmmo') this.throttled('noAmmo', `탄약이 없습니다 (${w.def.caliber} ${gameState.fire.ammoKind})`, 'bad');
      else if (attempt.reason === 'incompatibleAmmo') this.throttled('incompat', `${w.def.name}에는 ${gameState.fire.ammoKind}을 사용할 수 없습니다.`, 'bad');
      return;
    }
    if (attempt.boxUid) gameState.setInventory(consumeRound(gameState.inventory, attempt.boxUid));
    gameState.setFire(markFired(gameState.fire, now));

    const { player } = this.host;
    const origin = { x: player.x, y: player.y - 6 }; // chest height in the oblique view
    const baseAngle = angleTo(origin, aim);
    const tech = gameState.character.base['기술'];
    const profile = fireProfile(w.def.class);
    const spread = spreadRadians(w.def.spreadDeg, tech) * (player.crouching ? profile.crouchSpreadMult : 1) * (player.moving ? profile.moveSpreadMult : 1);
    const muzzle = { x: origin.x + Math.cos(baseAngle) * MUZZLE_OFFSET, y: origin.y + Math.sin(baseAngle) * MUZZLE_OFFSET };
    const melee = isMeleeClass(w.def.class);

    const enemies = this.aliveEnemies();
    const objectives = this.host.objectives?.() ?? [];
    const targets: RayTarget[] = [
      ...enemies.map((e) => ({ id: e.uid, x: e.x, y: e.y, r: e.radius })),
      ...objectives.map((o) => ({ id: OBJ_PREFIX + o.def.id, x: o.x, y: o.y, r: o.radius })),
    ];
    const byUid = new Map(enemies.map((e) => [e.uid, e]));
    const objById = new Map(objectives.map((o) => [OBJ_PREFIX + o.def.id, o]));
    const mods = gameState.mods();
    const ctx: AttackerCtx = {
      baseDamage: w.def.baseDamage * (player.crouching ? profile.crouchDmgMult : 1),
      grade: w.grade,
      subFire: gameState.fire.subFire,
      subFireDmgMult: subFireParams(w.def).dmgMult,
      pellets: attempt.pellets,
      isMelee: melee,
      ammoKind: melee ? null : gameState.fire.ammoKind,
      baseAccuracy: w.def.baseAccuracy,
      range: w.def.range,
      tech,
      statMult: melee ? d.meleeMult : d.rangedMult,
      critChance: d.critChance,
      critMult: d.critMult,
      mods: player.moving ? { ...mods, accPct: mods.accPct - profile.moveAccPenalty } : mods,
      moving: player.moving,
      crouching: player.crouching,
    };

    if (melee) return this.meleeSwing(w.def.range, origin, baseAngle, targets, byUid, objById, ctx, now);
    if (w.def.projectile) return this.launchProjectile(w.def, origin, baseAngle, ctx);

    this.fx.muzzle(muzzle, baseAngle);
    this.fx.casing({ x: origin.x + Math.cos(baseAngle) * 6, y: origin.y + Math.sin(baseAngle) * 6 }, baseAngle);
    this.host.scene.cameras.main.shake(40, w.def.class === '기관총' || w.def.class === '산탄총' ? 0.003 : 0.0012);

    for (let i = 0; i < attempt.pellets; i++) {
      const dir = fromAngle(baseAngle + gameRng.range(-spread, spread));
      const hit = castRay(this.host.built.collision, origin, dir, w.def.range, targets);
      this.fx.tracer(muzzle, hit.point);
      if (hit.kind === 'wall') this.fx.spark(hit.point);
      if (hit.kind !== 'target') continue;
      const obj = objById.get(hit.id);
      if (obj) {
        const res = computeHit(ctx, { skin: '강성', defense: 0, maxHp: obj.maxHp, burning: false }, hit.dist, gameRng);
        if (!res.hit) continue;
        this.fx.spark(hit.point);
        this.floating.spawn(obj.x, obj.y - 20, `${res.damage}`, '#ffd166', 12);
        if (obj.damage(res.damage)) this.host.onObjectiveDestroyed?.(obj.def.id);
        continue;
      }
      const e = byUid.get(hit.id);
      if (!e || !e.alive) continue;
      const res = computeHit(ctx, { skin: e.def.skin, defense: e.def.defense, maxHp: e.maxHp, burning: isBurning(e.status, now) }, hit.dist, gameRng);
      if (!res.hit) {
        this.floating.spawn(e.x, e.y, 'MISS', '#9aa0a6', 11);
        continue;
      }
      this.fx.blood(hit.point);
      this.floating.spawn(e.x, e.y, `${res.damage}`, res.crit ? '#ffe066' : '#ffffff', res.crit ? 16 : 13, res.crit);
      if (res.appliesBurn) {
        e.status = applyBurn(e.status, now);
        e.setBurning(true);
      }
      if (res.knockback) e.knockback(dir, now, res.damage);
      if (e.damage(res.damage)) {
        this.killEnemy(e, now);
        break;
      }
    }
  }

  /** 근접무기: everything inside the swing arc takes a hit; no ammo, no tracer. */
  private meleeSwing(range: number, origin: Vec2, angle: number, targets: RayTarget[], byUid: Map<string, Enemy>, objById: Map<string, Objective>, ctx: AttackerCtx, now: number): void {
    this.fx.swing(origin, angle, range);
    const hits = targetsInArc(origin, angle, range, targets);
    for (const t of hits) {
      const obj = objById.get(t.id);
      if (obj) {
        const res = computeHit(ctx, { skin: '강성', defense: 0, maxHp: obj.maxHp, burning: false }, t.dist, gameRng);
        if (!res.hit) continue;
        this.fx.spark({ x: obj.x, y: obj.y });
        this.floating.spawn(obj.x, obj.y - 20, `${res.damage}`, '#ffd166', 12);
        if (obj.damage(res.damage)) this.host.onObjectiveDestroyed?.(obj.def.id);
        continue;
      }
      const e = byUid.get(t.id);
      if (!e || !e.alive) continue;
      const res = computeHit(ctx, { skin: e.def.skin, defense: e.def.defense, maxHp: e.maxHp, burning: isBurning(e.status, now) }, t.dist, gameRng);
      if (!res.hit) {
        this.floating.spawn(e.x, e.y, 'MISS', '#9aa0a6', 11);
        continue;
      }
      this.fx.blood({ x: e.x, y: e.y });
      this.floating.spawn(e.x, e.y, `${res.damage}`, res.crit ? '#ffe066' : '#ffffff', res.crit ? 16 : 13, res.crit);
      e.knockback(fromAngle(angle), now, Math.round(res.damage * 0.3), 0.35);
      if (e.damage(res.damage)) this.killEnemy(e, now);
    }
  }

  /** 투척/중화기: a visible shell that explodes on impact or at the aimed distance (M3-3 fleshes this out). */
  private launchProjectile(def: WeaponDef, origin: Vec2, angle: number, ctx: AttackerCtx): void {
    this.fx.muzzle({ x: origin.x + Math.cos(angle) * MUZZLE_OFFSET, y: origin.y + Math.sin(angle) * MUZZLE_OFFSET }, angle);
    this.host.scene.cameras.main.shake(80, 0.004);
    this.host.onLaunch?.(def, origin, angle, ctx);
  }

  killEnemy(e: Enemy, now: number): void {
    e.kill();
    this.fx.blood({ x: e.x, y: e.y + 8 }, 1.6 * (e.def.scale ?? 1));
    const xp = xpForKill(e.def, gameState.character.level);
    const r = applyXp(gameState.character, xp);
    gameState.setCharacter(r.character);
    gameState.message(`${e.def.name} 처치  +${xp} XP`, 'info');
    if (r.levelUps.length) {
      const d = gameState.derived();
      gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
      gameState.message(`레벨 업! Lv.${r.character.level}  (+${r.pointsGained} 스탯 포인트 — C키 상태창에서 배분)`, 'good');
      this.floating.spawn(this.host.player.x, this.host.player.y - 10, 'LEVEL UP', '#7bd88f', 18, true);
    }
    this.dropLoot(e.def, e.pos);
    questService.onKill(e.def);
    this.host.onEnemyKilled(e);
    void now;
  }

  private dropLoot(def: MonsterDef, at: Vec2): void {
    const loot = rollLoot(def, gameRng);
    const drops: Pickup[] = [];
    if (loot.won > 0) drops.push(new Pickup(this.host.scene, at.x, at.y, { kind: 'won', amount: loot.won }));
    for (const it of loot.items) drops.push(new Pickup(this.host.scene, at.x, at.y, { kind: 'item', itemId: it.itemId, qty: it.qty }));
    drops.forEach((p, i) => {
      const a = (i / Math.max(1, drops.length)) * Math.PI * 2 + gameRng.range(0, 1);
      const r = drops.length > 1 ? 14 + gameRng.range(0, 8) : 0;
      p.setPosition(at.x + Math.cos(a) * r, at.y + Math.sin(a) * r);
      this.host.pickups.add(p);
    });
  }

  private collect(p: Pickup): void {
    if (!p.active) return;
    const pay = p.payload;
    if (pay.kind === 'won') {
      gameState.setCharacter({ ...gameState.character, won: gameState.character.won + pay.amount });
      this.floating.spawn(this.host.player.x, this.host.player.y - 16, `+₩${pay.amount}`, '#c9a227', 12);
    } else {
      const def = registry.item(pay.itemId);
      const next = addItem(gameState.inventory, def, pay.qty);
      if (totalWeightKg(next, registry.item) > gameState.derived().maxWeightKg) {
        return this.throttled('overweight', '무게 초과 — 더 이상 들 수 없습니다.', 'bad');
      }
      gameState.setInventory(next);
      gameState.message(`획득: ${def.name}${pay.qty > 1 ? ` ×${pay.qty}` : ''}`, def.kind === 'misc' && def.quest ? 'system' : 'good');
      questService.syncCollect(def.id);
    }
    p.destroy();
  }

  // --- enemy attacks --------------------------------------------------------------------------

  private enemyAction(e: Enemy, action: BrainAction, now: number): void {
    if (!action || this.playerDead) return;
    const { player } = this.host;
    switch (action.kind) {
      case 'melee': {
        if (dist(e.pos, player.pos) <= e.def.attack.reach + PLAYER_RADIUS + 4) {
          if (player.jumping) return this.floating.spawn(player.x, player.y, '회피', '#9be7ff', 11);
          this.hurtPlayer(e.def.attack.dmg, now);
        }
        break;
      }
      case 'shoot': {
        const R = e.def.ranged;
        if (!R) return;
        const d = dist(e.pos, player.pos);
        const chance = enemyHitChance(R.accuracy, d, R.range, player.moving);
        const willHit = gameRng.chance(chance);
        const jitter = willHit ? 0 : gameRng.range(0.12, 0.3) * (gameRng.chance(0.5) ? 1 : -1);
        const angle = angleTo(e.pos, player.pos) + jitter;
        const dir = fromAngle(angle);
        const from = { x: e.x + dir.x * 14, y: e.y + dir.y * 14 };
        this.fx.muzzle(from, angle);
        const hit = castRay(this.host.built.collision, from, dir, R.range, willHit ? [{ id: 'player', x: player.x, y: player.y, r: PLAYER_RADIUS }] : []);
        this.fx.tracer(from, hit.point, ENEMY_TRACER);
        if (hit.kind === 'target') this.hurtPlayer(R.dmg, now);
        else if (hit.kind === 'wall') this.fx.spark(hit.point);
        break;
      }
      case 'jumpLand': {
        const J = e.def.jump;
        if (!J) return;
        this.fx.aoeMarker(action.at, J.aoeRadius, 350);
        this.host.scene.cameras.main.shake(120, 0.004);
        if (dist(player.pos, action.at) <= J.aoeRadius + PLAYER_RADIUS) this.hurtPlayer(e.def.attack.dmg * J.dmgMult, now);
        break;
      }
    }
  }

  /** Raw enemy damage → armour → HP, with 의식회복 on a lethal hit. */
  hurtPlayer(raw: number, now: number): void {
    if (this.playerDead || isInvulnerable(gameState.status, now)) return;
    if (gameState.flags.god) return;
    this.hurtPlayerFinal(playerDamageTaken(raw, gameState.defense(), gameRng), now);
  }

  private hurtPlayerFinal(dmg: number, now: number): void {
    if (this.playerDead) return;
    const { player } = this.host;
    let hp = gameState.vitals.hp - dmg;
    this.fx.hitFlash(player);
    this.floating.spawn(player.x, player.y, `-${dmg}`, '#ff6b6b', 13);
    if (hp <= 0) {
      const roll = rollConsciousness(gameState.derived().consciousnessChance, gameState.consciousness, now, gameRng);
      if (roll.survived) {
        gameState.consciousness = roll.state;
        gameState.status = { ...gameState.status, invulnUntil: roll.invulnUntil };
        hp = 1;
        gameState.message('의식 회복! 잠시 무적 상태입니다.', 'good');
        this.floating.spawn(player.x, player.y - 14, '의식 회복', '#7bd88f', 15, true);
      } else {
        gameState.setVitals({ hp: 0 });
        return this.playerDied();
      }
    }
    gameState.setVitals({ hp });
  }

  private playerDied(): void {
    this.playerDead = true;
    const before = gameState.character.won;
    gameState.setCharacter(applyDeathPenalty(gameState.character));
    const lost = before - gameState.character.won;
    gameState.message(`사망했습니다. ₩${lost.toLocaleString('ko-KR')}을 잃고 ${registry.map(balance.death.respawnMap).name}에서 부활합니다.`, 'bad');
    gameState.status = { burningUntil: 0, burnAccumulator: 0, invulnUntil: 0 };
    this.host.player.stopMoving();
    this.host.player.setTint(0x555555);
    this.host.onPlayerDeath();
  }

  private throttled(key: string, text: string, tone: 'info' | 'bad' | 'good' | 'system'): void {
    const now = this.host.scene.time.now;
    if (now - (this.lastMsgAt[key] ?? -Infinity) < MSG_THROTTLE_MS) return;
    this.lastMsgAt[key] = now;
    gameState.message(text, tone);
  }
}
