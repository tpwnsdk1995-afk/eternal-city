import type { MonsterDef } from '@data/schema/monster';
import type { Rng } from '../rng';
import { dist, normalize, perp, scale, sub, type Vec2 } from '../math/vec';

export type BrainMode = 'idle' | 'wander' | 'chase' | 'windup' | 'shoot' | 'jump' | 'flee' | 'return' | 'dead';

export interface BrainState {
  mode: BrainMode;
  since: number; // when `mode` was entered
  meleeReadyAt: number;
  rangedReadyAt: number;
  jumpReadyAt: number;
  burstLeft: number;
  nextShotAt: number;
  wanderTarget: Vec2 | null;
  wanderUntil: number;
  strafeSign: 1 | -1;
  strafeFlipAt: number;
  jumpFrom: Vec2 | null;
  jumpTarget: Vec2 | null;
}

/** What the enemy knows this frame. Built by the Phaser layer, consumed by pure logic. */
export interface Perception {
  now: number;
  self: Vec2;
  home: Vec2;
  player: Vec2;
  playerAlive: boolean;
  hasLOS: boolean;
  hpRatio: number;
}

export type BrainAction = { kind: 'melee' } | { kind: 'shoot' } | { kind: 'jumpLand'; at: Vec2 } | null;

export interface BrainOutput {
  state: BrainState;
  /** desired unit direction (zero vector = stand still) */
  move: Vec2;
  /** multiplier on def.moveSpeed (jumps travel faster, wandering slower) */
  speedMult: number;
  /** point to face, or null to face the movement direction */
  face: Vec2 | null;
  action: BrainAction;
}

const ZERO: Vec2 = { x: 0, y: 0 };
const WANDER_RADIUS = 96;
const RETURN_ARRIVE = 24;
const STRAFE_FLIP_MS = 1400;
const WANDER_SPEED = 0.45;

export function initialBrain(now: number): BrainState {
  return {
    mode: 'idle',
    since: now,
    meleeReadyAt: 0,
    rangedReadyAt: 0,
    jumpReadyAt: now + 1500,
    burstLeft: 0,
    nextShotAt: 0,
    wanderTarget: null,
    wanderUntil: 0,
    strafeSign: 1,
    strafeFlipAt: now + STRAFE_FLIP_MS,
    jumpFrom: null,
    jumpTarget: null,
  };
}

/** Speed multiplier so a leap of `jumpDist` px lands exactly after `airMs`. */
const jumpSpeedMult = (def: MonsterDef, jumpDist: number): number => Math.max(1.01, jumpDist / (def.jump!.airMs / 1000) / Math.max(1, def.moveSpeed));

const enter = (s: BrainState, mode: BrainMode, now: number): BrainState => (s.mode === mode ? s : { ...s, mode, since: now });
const out = (state: BrainState, move: Vec2 = ZERO, speedMult = 1, face: Vec2 | null = null, action: BrainAction = null): BrainOutput => ({ state, move, speedMult, face, action });

/**
 * One tick of the enemy FSM. Pure: given the definition, previous state and what the enemy
 * perceives, returns the new state plus movement/attack intent. Damage is applied by the caller.
 *
 * melee      chase → windup → strike, leash back home, optional flee
 * banshee    melee + leaping AoE attack when the player is in the jump band
 * rangedKite keeps preferredRange (backs off / strafes), burst fire with LOS, flees when hurt
 * assaulter  pushes toward preferredRange and keeps shooting; melee when touched
 */
export function thinkEnemy(def: MonsterDef, prev: BrainState, p: Perception, rng: Rng): BrainOutput {
  const { now } = p;
  let s = prev;
  if (s.mode === 'dead') return out(s);

  const toPlayer = sub(p.player, p.self);
  const d = dist(p.self, p.player);
  const dirToPlayer = d > 0 ? scale(toPlayer, 1 / d) : ZERO;
  const dHome = dist(p.self, p.home);

  // --- committed animations first -------------------------------------------------------------
  if (s.mode === 'jump' && def.jump && s.jumpTarget && s.jumpFrom) {
    const t = now - s.since;
    if (t >= def.jump.airMs) {
      const at = s.jumpTarget;
      s = { ...enter(s, 'chase', now), jumpFrom: null, jumpTarget: null };
      return out(s, ZERO, 1, p.player, { kind: 'jumpLand', at });
    }
    const remaining = dist(p.self, s.jumpTarget);
    return out(s, remaining < 4 ? ZERO : normalize(sub(s.jumpTarget, p.self)), jumpSpeedMult(def, dist(s.jumpFrom, s.jumpTarget)), s.jumpTarget);
  }

  if (s.mode === 'windup') {
    if (now - s.since >= def.attack.windupMs) {
      s = { ...enter(s, 'chase', now), meleeReadyAt: now + def.attack.cooldownMs };
      return out(s, ZERO, 1, p.player, { kind: 'melee' });
    }
    return out(s, ZERO, 1, p.player);
  }

  // --- flee / leash ---------------------------------------------------------------------------
  if (def.fleeBelowHp !== undefined && p.hpRatio < def.fleeBelowHp && p.playerAlive && d < def.aggroRange * 1.5) {
    s = enter(s, 'flee', now);
    return out(s, scale(dirToPlayer, -1), 1.1, p.player);
  }

  if (dHome > def.leashRange || (s.mode === 'return' && dHome > RETURN_ARRIVE)) {
    s = enter(s, 'return', now);
    return out(s, normalize(sub(p.home, p.self)), 1, null);
  }

  const engaged = s.mode === 'chase' || s.mode === 'shoot' || s.mode === 'flee';
  const aggro = p.playerAlive && (d <= def.aggroRange && (p.hasLOS || engaged) || (engaged && d <= def.leashRange));

  if (!aggro) return wander(def, s, p, rng);

  // --- ranged factions ------------------------------------------------------------------------
  if (def.ranged && (def.ai === 'rangedKite' || def.ai === 'assaulter')) {
    const R = def.ranged;
    if (d <= def.attack.reach && now >= s.meleeReadyAt) return out(enter(s, 'windup', now), ZERO, 1, p.player);

    s = enter(s, 'shoot', now);
    let action: BrainAction = null;
    if (p.hasLOS && d <= R.range) {
      if (s.burstLeft > 0) {
        if (now >= s.nextShotAt) {
          const left = s.burstLeft - 1;
          s = { ...s, burstLeft: left, nextShotAt: now + R.burstIntervalMs, rangedReadyAt: left === 0 ? now + R.cooldownMs : s.rangedReadyAt };
          action = { kind: 'shoot' };
        }
      } else if (now >= s.rangedReadyAt) {
        s = { ...s, burstLeft: R.burst - 1, nextShotAt: now + R.burstIntervalMs, rangedReadyAt: R.burst === 1 ? now + R.cooldownMs : s.rangedReadyAt };
        action = { kind: 'shoot' };
      }
    }

    if (now >= s.strafeFlipAt) s = { ...s, strafeSign: s.strafeSign === 1 ? -1 : 1, strafeFlipAt: now + STRAFE_FLIP_MS + rng.range(-300, 300) };

    let move: Vec2;
    let speedMult = 1;
    if (!p.hasLOS) move = dirToPlayer;
    else if (def.ai === 'rangedKite') {
      if (d < R.preferredRange * 0.7) move = scale(dirToPlayer, -1);
      else if (d > R.preferredRange * 1.15) move = dirToPlayer;
      else {
        move = scale(perp(dirToPlayer), s.strafeSign);
        speedMult = 0.7;
      }
    } else {
      if (d > R.preferredRange * 0.8) move = dirToPlayer;
      else {
        move = scale(perp(dirToPlayer), s.strafeSign);
        speedMult = 0.5;
      }
    }
    return out(s, move, speedMult, p.player, action);
  }

  // --- melee / banshee ------------------------------------------------------------------------
  if (def.ai === 'banshee' && def.jump && p.hasLOS && now >= s.jumpReadyAt && d >= def.jump.minRange && d <= def.jump.maxRange) {
    s = { ...enter(s, 'jump', now), jumpFrom: p.self, jumpTarget: p.player, jumpReadyAt: now + def.jump.cooldownMs };
    return out(s, dirToPlayer, jumpSpeedMult(def, d), p.player);
  }

  if (d <= def.attack.reach) {
    if (now >= s.meleeReadyAt) return out(enter(s, 'windup', now), ZERO, 1, p.player);
    return out(enter(s, 'chase', now), ZERO, 1, p.player);
  }

  return out(enter(s, 'chase', now), dirToPlayer, 1, p.player);
}

function wander(def: MonsterDef, prev: BrainState, p: Perception, rng: Rng): BrainOutput {
  let s = prev;
  if (s.mode !== 'wander' && s.mode !== 'idle') s = { ...enter(s, 'idle', p.now), wanderTarget: null };

  if (s.wanderTarget) {
    if (dist(p.self, s.wanderTarget) < 6 || p.now > s.wanderUntil) {
      s = { ...enter(s, 'idle', p.now), wanderTarget: null, wanderUntil: p.now + rng.range(800, 2500) };
      return out(s);
    }
    return out(enter(s, 'wander', p.now), normalize(sub(s.wanderTarget, p.self)), WANDER_SPEED);
  }

  if (p.now >= s.wanderUntil && rng.chance(0.02)) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(WANDER_RADIUS * 0.3, WANDER_RADIUS);
    const target = { x: p.home.x + Math.cos(a) * r, y: p.home.y + Math.sin(a) * r };
    s = { ...enter(s, 'wander', p.now), wanderTarget: target, wanderUntil: p.now + 4000 };
    return out(s, normalize(sub(target, p.self)), WANDER_SPEED);
  }
  void def;
  return out(enter(s, 'idle', p.now));
}
