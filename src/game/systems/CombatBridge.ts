import Phaser from 'phaser';
import { balance } from '@data/balance';
import { registry } from '@data/registry';
import type { MonsterDef } from '@data/schema/monster';
import { angleTo, dist, fromAngle, type Vec2 } from '@core/math/vec';
import { gameRng } from '@core/rng';
import type { BuiltMap } from '@core/map/mapBuild';
import { castRay, type RayTarget } from '@core/combat/hitscan';
import { computeHit, gradeMult, type AttackerCtx } from '@core/combat/damage';
import { aoeFalloff, targetsInBlast } from '@core/combat/projectile';
import { spreadOffset, stanceSpread } from '@core/combat/accuracy';
import { applyBurn, isBurning, isInvulnerable, tickBurn } from '@core/combat/statusEffects';
import { rollConsciousness } from '@core/combat/consciousness';
import { enemyHitChance, playerDamageTaken } from '@core/combat/enemyAttack';
import { markFired, toggleSubFire, tryFire } from '@core/weapons/fireController';
import { fireProfile, subFireParams } from '@core/weapons/weaponMath';
import { audio } from '../audio/AudioManager';
import { targetsInArc } from '@core/combat/meleeArc';
import type { WeaponDef } from '@data/schema/item';
import { isMeleeClass } from '@data/schema/enums';
import { addItem, consumeRound } from '@core/inventory/inventory';
import { totalWeightKg } from '@core/inventory/weight';
import { thinkEnemy, type BrainAction, type Perception } from '@core/ai/enemyBrain';
import { applyXp, xpForKill } from '@core/world/xp';
import { applyDeathPenalty } from '@core/world/death';
import { rollLoot } from '@core/world/loot';
import { drainAp } from '@core/skills/skillState';
import { hubForYear } from '@core/world/parallel';
import { gameState } from '../state/GameState';
import { questService } from '../state/questService';
import { progressService } from '../state/progressService';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import { Projectile } from '../entities/Projectile';
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
  /**
   * Something other than the player this enemy should hunt right now (어설트 부스 방어). Returning
   * null means "the player". The target takes the enemy's melee/shots/leap damage.
   */
  enemyTarget?(e: Enemy): EnemyTarget | null;
  /** boss summons (데스웜 라바): the scene spawns a minion at a point */
  spawnMinion?(monsterId: string, x: number, y: number): Enemy | null;
}

export interface EnemyTarget {
  pos: Vec2;
  radius: number;
  /** returns true when this hit destroyed it */
  damage(n: number): boolean;
}

const OBJ_PREFIX = 'obj:';

const PLAYER_RADIUS = 10;
const MUZZLE_OFFSET = 16;
const MSG_THROTTLE_MS = 1500;
const ENEMY_TRACER = 0xff8a7a;
const AI_LOD_DISTANCE = 720; // px — beyond roughly a screen away
const AI_LOD_INTERVAL_MS = 180;
/** 기물 take extra blast damage — launchers are the 어설트 breaching tool. */
const OBJECTIVE_BLAST_MULT = 1.5;
/** own blast → own HP, before armour */
const SELF_BLAST_MULT = 0.5;

/**
 * Glue between input/entities and the pure combat rules: player hitscan fire, enemy AI ticks and
 * their attacks, burning, loot, XP, and death → respawn.
 */
export class CombatBridge {
  readonly fx: CombatFx;
  readonly floating: FloatingText;
  private lastMsgAt: Record<string, number> = {};
  private projectiles: Projectile[] = [];
  playerDead = false;

  constructor(private host: CombatHost) {
    this.fx = new CombatFx(host.scene);
    this.floating = new FloatingText(host.scene);
    host.scene.physics.add.overlap(host.player, host.pickups, (_p, obj) => this.collect(obj as Pickup));
    host.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.projectiles.forEach((p) => p.destroy());
      this.projectiles = [];
    });
  }

  /** Rounds currently in flight (debug/e2e). */
  projectilesSnapshot(): { x: number; y: number; travelled: number; maxDist: number }[] {
    return this.projectiles.map((p) => ({ x: p.state.pos.x, y: p.state.pos.y, travelled: p.state.travelled, maxDist: p.state.maxDist }));
  }

  update(intent: InputIntent, now: number, dtMs: number): void {
    if (this.playerDead) return;
    const { player } = this.host;

    if (intent.subFirePressed) {
      gameState.setFire(toggleSubFire(gameState.fire));
      gameState.message(gameState.fire.subFire ? '서브연사 ON (연사 120rpm · 피해 50%)' : '서브연사 OFF', 'system');
    }
    if (intent.fireHeld && player.canFire) this.playerFire(now, intent.aimWorld);
    this.updateProjectiles(dtMs, now);
    this.drainActiveSkill(dtMs);

    // enemies — far ones (off-screen) think at a lower rate to keep big fields cheap
    const grid = this.host.built.collision;
    for (const e of this.aliveEnemies()) {
      if (now < e.nextThinkAt) continue;
      const far = dist(e.pos, player.pos) > AI_LOD_DISTANCE;
      e.nextThinkAt = far ? now + AI_LOD_INTERVAL_MS : 0;
      const target = this.host.enemyTarget?.(e) ?? null;
      const focus = target ? target.pos : player.pos;
      const p: Perception = {
        now,
        self: e.pos,
        home: e.home,
        player: focus,
        playerAlive: target ? true : !this.playerDead,
        hasLOS: grid.hasLineOfSight(e.pos, focus),
        hpRatio: e.hpRatio,
        forceAggro: !!target || e.tag === 'wave' || e.tag === 'adds' || e.tag === 'boss',
      };
      const o = thinkEnemy(e.def, e.brain, p, gameRng);
      e.brain = o.state;
      if (e.def.burrow) e.setBurrowed(o.state.mode === 'burrow');
      e.applyBrain(o);
      if (o.action && !e.isKnockedBack) this.enemyAction(e, o.action, now, target);
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

  /** 퍼스널 액티브 skills burn 행동력 while on; they switch off when it runs dry. */
  private drainActiveSkill(dtMs: number): void {
    const activeId = gameState.skills.active['퍼스널액티브'];
    if (!activeId) return;
    const r = drainAp(gameState.skills, registry.skill, gameState.vitals.ap, dtMs);
    if (r.state !== gameState.skills) {
      gameState.setSkills(r.state);
      gameState.message(`${registry.skill(activeId).name} 해제 — 행동력이 바닥났습니다.`, 'bad');
    }
    gameState.setVitals({ ap: r.ap });
  }

  aliveEnemies(): Enemy[] {
    return (this.host.enemies.getChildren() as Enemy[]).filter((e) => e.alive && e.active);
  }

  /** alive and above ground — what the hunter can actually hit */
  targetableEnemies(): Enemy[] {
    return this.aliveEnemies().filter((e) => e.targetable);
  }

  // --- player firing ------------------------------------------------------------------------

  private playerFire(now: number, aim: Vec2): void {
    const w = gameState.weapon();
    if (!w) return this.throttled('noWeapon', '장착된 무기가 없습니다.', 'bad');
    const d = gameState.derived();
    const eff = w.eff.def; // 강화/부품/유니크 folded in
    const attempt = tryFire(gameState.fire, now, eff, d.attackSpeedMult, gameState.inventory, registry.item);
    if (!attempt.ok) {
      if (attempt.reason === 'noAmmo' || attempt.reason === 'incompatibleAmmo') audio.play('no_ammo');
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
    const spread = stanceSpread({ spreadDeg: eff.spreadDeg, tech, crouching: player.crouching, moving: player.moving, crouchSpreadMult: profile.crouchSpreadMult, moveSpreadMult: profile.moveSpreadMult, pellets: attempt.pellets });
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
    const skillMods = gameState.mods();
    const mods = { ...skillMods, dmgPct: skillMods.dmgPct + w.eff.dmgPct, accPct: skillMods.accPct - (player.moving ? profile.moveAccPenalty : 0) };
    const ctx: AttackerCtx = {
      baseDamage: eff.baseDamage * (player.crouching ? profile.crouchDmgMult : 1),
      grade: w.grade,
      subFire: gameState.fire.subFire,
      subFireDmgMult: subFireParams(eff).dmgMult,
      pellets: attempt.pellets,
      isMelee: melee,
      ammoKind: melee ? null : gameState.fire.ammoKind,
      baseAccuracy: eff.baseAccuracy,
      range: eff.range,
      tech,
      statMult: melee ? d.meleeMult : d.rangedMult,
      critChance: Math.min(balance.derived.critMax, d.critChance + w.eff.critPct),
      critMult: d.critMult,
      mods,
      moving: player.moving,
      crouching: player.crouching,
    };

    if (eff.projectile) {
      audio.gunshot(w.def.class === '변이무기' ? '변이무기' : '투척중화기', false);
      return this.launchProjectile(eff, origin, baseAngle, aim, ctx); // 산성 토사 is a 변이무기 that lobs
    }
    if (melee) return this.meleeSwing(eff.range, origin, baseAngle, targets, byUid, objById, ctx, now);

    audio.gunshot(w.def.class, gameState.fire.subFire);
    this.fx.muzzle(muzzle, baseAngle);
    this.host.player.markFired(this.host.scene.time.now);
    if (w.def.caliber !== 'none') this.fx.casing({ x: origin.x + Math.cos(baseAngle) * 6, y: origin.y + Math.sin(baseAngle) * 6 }, baseAngle);
    this.host.scene.cameras.main.shake(40, w.def.class === '기관총' || w.def.class === '산탄총' ? 0.003 : 0.0012);

    for (let i = 0; i < attempt.pellets; i++) {
      const dir = fromAngle(baseAngle + spreadOffset(gameRng, spread, attempt.pellets));
      const hit = castRay(this.host.built.collision, origin, dir, eff.range, targets);
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
      this.fleshOrSpark(e, hit.point);
      if (res.crit) audio.play('hit_crit');
      this.floating.spawn(e.x, e.y, `${res.damage}`, res.crit ? '#ffb347' : '#ffd23f', res.crit ? 16 : 13, res.crit);
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
      this.fleshOrSpark(e, { x: e.x, y: e.y });
      this.floating.spawn(e.x, e.y, `${res.damage}`, res.crit ? '#ffb347' : '#ffd23f', res.crit ? 16 : 13, res.crit);
      e.knockback(fromAngle(angle), now, Math.round(res.damage * 0.3), 0.35);
      if (e.damage(res.damage)) this.killEnemy(e, now);
    }
  }

  /** 투척/중화기: a visible shell that arcs to the aimed point (M79) or flies straight until impact (RPG-7). */
  private launchProjectile(def: WeaponDef, origin: Vec2, angle: number, aim: Vec2, ctx: AttackerCtx): void {
    this.fx.muzzle({ x: origin.x + Math.cos(angle) * MUZZLE_OFFSET, y: origin.y + Math.sin(angle) * MUZZLE_OFFSET }, angle);
    this.host.player.markFired(this.host.scene.time.now);
    this.host.scene.cameras.main.shake(80, 0.004);
    this.projectiles.push(new Projectile(this.host.scene, def, origin, angle, dist(origin, aim), ctx));
    this.host.onLaunch?.(def, origin, angle, ctx);
  }

  private updateProjectiles(dtMs: number, now: number): void {
    if (this.projectiles.length === 0) return;
    const enemies = this.targetableEnemies();
    const objectives = this.host.objectives?.() ?? [];
    const targets: RayTarget[] = [
      ...enemies.map((e) => ({ id: e.uid, x: e.x, y: e.y, r: e.radius })),
      ...objectives.map((o) => ({ id: OBJ_PREFIX + o.def.id, x: o.x, y: o.y, r: o.radius })),
    ];
    for (const p of this.projectiles) {
      const at = p.step(dtMs, this.host.built.collision, targets);
      if (at) this.explode(at, p.state.aoeRadius, p.ctx, now, p.def.projectile?.selfDamage !== false);
    }
    this.projectiles = this.projectiles.filter((p) => !p.done);
  }

  /** Blast damage: every enemy/objective in the radius takes falloff-scaled damage; the shooter too. */
  private explode(at: Vec2, radius: number, ctx: AttackerCtx, now: number, selfDamage = true): void {
    this.fx.explosion(at, radius);
    this.host.scene.cameras.main.shake(180, 0.008);
    const enemies = this.targetableEnemies();
    const objectives = this.host.objectives?.() ?? [];
    const byUid = new Map(enemies.map((e) => [e.uid, e]));
    const objById = new Map(objectives.map((o) => [OBJ_PREFIX + o.def.id, o]));
    const targets: RayTarget[] = [
      ...enemies.map((e) => ({ id: e.uid, x: e.x, y: e.y, r: e.radius })),
      ...objectives.map((o) => ({ id: OBJ_PREFIX + o.def.id, x: o.x, y: o.y, r: o.radius })),
    ];
    // blasts don't roll to-hit — inside the radius you're hit; accuracy stayed with the launch
    const blastCtx: AttackerCtx = { ...ctx, baseAccuracy: 1, moving: false, crouching: false, mods: { ...ctx.mods, accPct: 1 } };
    for (const t of targetsInBlast(at, radius, targets)) {
      const obj = objById.get(t.id);
      if (obj) {
        const res = computeHit(blastCtx, { skin: '강성', defense: 0, maxHp: obj.maxHp, burning: false }, 0, gameRng);
        const dmg = Math.max(1, Math.round(res.damage * t.mult * OBJECTIVE_BLAST_MULT));
        this.fx.spark({ x: obj.x, y: obj.y });
        this.floating.spawn(obj.x, obj.y - 20, `${dmg}`, '#ffd166', 13, true);
        if (obj.damage(dmg)) this.host.onObjectiveDestroyed?.(obj.def.id);
        continue;
      }
      const e = byUid.get(t.id);
      if (!e || !e.alive) continue;
      const res = computeHit(blastCtx, { skin: e.def.skin, defense: e.def.defense, maxHp: e.maxHp, burning: isBurning(e.status, now) }, 0, gameRng);
      const dmg = Math.max(1, Math.round(res.damage * t.mult));
      this.fleshOrSpark(e, { x: e.x, y: e.y });
      this.floating.spawn(e.x, e.y, `${dmg}`, res.crit ? '#ffe066' : '#ffb347', res.crit ? 16 : 14, true);
      const away = fromAngle(angleTo(at, e.pos));
      e.knockback(away, now, Math.round(dmg * 0.3), 0.6);
      if (e.damage(dmg)) this.killEnemy(e, now);
    }
    // self-damage: standing inside your own blast hurts (halved, armour applies)
    const { player } = this.host;
    const selfMult = selfDamage ? aoeFalloff(dist(at, player.pos), radius, PLAYER_RADIUS) : 0;
    if (selfMult > 0) {
      const base = ctx.baseDamage * gradeMult(ctx.grade) * selfMult * SELF_BLAST_MULT;
      this.hurtPlayer(base, now);
      this.throttled('selfBlast', '폭발 범위 안에 있습니다!', 'bad');
    }
  }

  /** Armoured skins (장갑/중장갑) throw sparks on impact; everything else bleeds. Moving targets smear. */
  private fleshOrSpark(e: Enemy, at: Vec2): void {
    if (e.def.skin === '장갑' || e.def.skin === '중장갑') this.fx.armorSpark(at);
    else this.fx.blood(at, 1, e.body && (Math.abs(e.body.velocity.x) + Math.abs(e.body.velocity.y) > 20) ? 2 : 0);
  }

  killEnemy(e: Enemy, now: number): void {
    e.kill();
    audio.at('enemy_die', e.x, e.y);
    this.fx.blood({ x: e.x, y: e.y + 8 }, 1.6 * (e.def.scale ?? 1), 1);
    const xp = Math.round(xpForKill(e.def, gameState.character.level) * gameState.xpMult());
    const r = applyXp(gameState.character, xp);
    gameState.setCharacter(r.character);
    gameState.message(`${e.def.name} 처치  +${xp} XP`, 'info');
    if (r.levelUps.length) {
      const d = gameState.derived();
      gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
      gameState.message(`레벨 업! Lv.${r.character.level}  (+${r.pointsGained} 스탯 포인트 — C키 상태창에서 배분)`, 'good');
      this.floating.spawn(this.host.player.x, this.host.player.y - 10, 'LEVEL UP', '#7bd88f', 18, true);
      audio.play('level_up');
    }
    this.dropLoot(e.def, e.pos);
    questService.onKill(e.def);
    progressService.recordKill(e.def);
    this.host.onEnemyKilled(e);
    void now;
  }

  private dropLoot(def: MonsterDef, at: Vec2): void {
    const loot = rollLoot(def, gameRng, registry.item);
    const drops: Pickup[] = [];
    if (loot.won > 0) drops.push(new Pickup(this.host.scene, at.x, at.y, { kind: 'won', amount: loot.won }));
    for (const it of loot.items) drops.push(new Pickup(this.host.scene, at.x, at.y, { kind: 'item', itemId: it.itemId, qty: it.qty, prefix: it.prefix }));
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
      const amount = Math.round(pay.amount * gameState.wonMult());
      gameState.setCharacter({ ...gameState.character, won: gameState.character.won + amount });
      progressService.recordWon(amount);
      audio.play('pickup_won');
      this.floating.spawn(this.host.player.x, this.host.player.y - 16, `+₩${amount}`, '#c9a227', 12);
    } else {
      const def = registry.item(pay.itemId);
      const next = addItem(gameState.inventory, def, pay.qty, { prefix: pay.prefix });
      if (totalWeightKg(next, registry.item) > gameState.derived().maxWeightKg) {
        return this.throttled('overweight', '무게 초과 — 더 이상 들 수 없습니다.', 'bad');
      }
      gameState.setInventory(next);
      gameState.message(`획득: ${pay.prefix ? `${pay.prefix} ` : ''}${def.name}${pay.qty > 1 ? ` ×${pay.qty}` : ''}`, pay.prefix ? 'system' : def.kind === 'misc' && def.quest ? 'system' : 'good');
      audio.play('pickup_item');
      questService.syncCollect(def.id);
    }
    p.destroy();
  }

  // --- enemy attacks --------------------------------------------------------------------------

  private enemyAction(e: Enemy, action: BrainAction, now: number, target: EnemyTarget | null = null): void {
    if (!action) return;
    if (target) return this.enemyActionOnTarget(e, action, target);
    if (this.playerDead) return;
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
        audio.at('enemy_shot', e.x, e.y);
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
      case 'emerge': {
        const B = e.def.burrow;
        if (!B) return;
        this.eruption(e, action.at, action.summon);
        if (dist(player.pos, action.at) <= B.aoeRadius + PLAYER_RADIUS) this.hurtPlayer(e.def.attack.dmg * B.dmgMult, now);
        break;
      }
    }
  }

  /** The same attacks aimed at a structure (부스): no armour, no dodge, hits land on the circle. */
  private enemyActionOnTarget(e: Enemy, action: BrainAction, t: EnemyTarget): void {
    if (!action) return;
    const hit = (dmg: number) => {
      this.fx.spark({ x: t.pos.x + gameRng.range(-8, 8), y: t.pos.y + gameRng.range(-8, 8) });
      this.floating.spawn(t.pos.x, t.pos.y - 18, `-${Math.round(dmg)}`, '#9be7ff', 12);
      t.damage(Math.round(dmg));
    };
    switch (action.kind) {
      case 'melee':
        if (dist(e.pos, t.pos) <= e.def.attack.reach + t.radius + 6) hit(e.def.attack.dmg);
        break;
      case 'shoot': {
        const R = e.def.ranged;
        if (!R) return;
        const angle = angleTo(e.pos, t.pos) + gameRng.range(-0.04, 0.04);
        const dir = fromAngle(angle);
        const from = { x: e.x + dir.x * 14, y: e.y + dir.y * 14 };
        this.fx.muzzle(from, angle);
        const ray = castRay(this.host.built.collision, from, dir, R.range, [{ id: 'target', x: t.pos.x, y: t.pos.y, r: t.radius }]);
        this.fx.tracer(from, ray.point, ENEMY_TRACER);
        if (ray.kind === 'target') hit(R.dmg);
        else if (ray.kind === 'wall') this.fx.spark(ray.point);
        break;
      }
      case 'jumpLand': {
        const J = e.def.jump;
        if (!J) return;
        this.fx.aoeMarker(action.at, J.aoeRadius, 350);
        if (dist(t.pos, action.at) <= J.aoeRadius + t.radius) hit(e.def.attack.dmg * J.dmgMult);
        break;
      }
      case 'emerge': {
        const B = e.def.burrow;
        if (!B) return;
        this.eruption(e, action.at, action.summon);
        if (dist(t.pos, action.at) <= B.aoeRadius + t.radius) hit(e.def.attack.dmg * B.dmgMult);
        break;
      }
    }
  }

  /** 데스웜 eruption: ground burst FX, heavy shake, and a larva brood every other time. */
  private eruption(e: Enemy, at: Vec2, summon: boolean): void {
    const B = e.def.burrow!;
    this.fx.aoeMarker(at, B.aoeRadius, 600);
    this.fx.explosion(at, B.aoeRadius * 0.7);
    this.host.scene.cameras.main.shake(320, 0.012);
    this.floating.spawn(at.x, at.y - 40, `${e.def.name} 출현!`, '#ff9b9b', 16, true);
    if (summon && B.summon && this.host.spawnMinion) {
      for (let i = 0; i < B.summon.count; i++) {
        const a = (i / B.summon.count) * Math.PI * 2 + gameRng.range(0, 1);
        const m = this.host.spawnMinion(B.summon.monsterId, at.x + Math.cos(a) * 56, at.y + Math.sin(a) * 56);
        if (m) {
          m.tag = 'adds';
          m.home = { x: at.x, y: at.y };
        }
      }
      gameState.message(`${e.def.name}이(가) 라바 군집을 토해 냈다!`, 'bad');
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
    gameState.lastHurtAt = Date.now();
    const { player } = this.host;
    let hp = gameState.vitals.hp - dmg;
    this.fx.hitFlash(player);
    audio.play('player_hurt');
    this.floating.spawn(player.x, player.y, `-${dmg}`, '#ff6b6b', 13);
    if (hp <= 0) {
      const roll = rollConsciousness(gameState.derived().consciousnessChance, gameState.consciousness, now, gameRng);
      if (roll.survived) {
        gameState.consciousness = roll.state;
        gameState.status = { ...gameState.status, invulnUntil: roll.invulnUntil };
        hp = 1;
        gameState.message('의식 회복! 잠시 무적 상태입니다.', 'good');
        audio.play('consciousness');
        this.floating.spawn(player.x, player.y - 14, '의식 회복', '#7bd88f', 15, true);
      } else {
        gameState.setVitals({ hp: 0 });
        return this.playerDied();
      }
    }
    gameState.setVitals({ hp });
  }

  private playerDied(): void {
    audio.play('player_die');
    this.playerDead = true;
    const before = gameState.character.won;
    gameState.setCharacter(applyDeathPenalty(gameState.character));
    const lost = before - gameState.character.won;
    gameState.message(`사망했습니다. ₩${lost.toLocaleString('ko-KR')}을 잃고 ${registry.map(hubForYear(this.host.built.def.year)).name}에서 부활합니다.`, 'bad');
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
