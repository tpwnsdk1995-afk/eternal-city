import { describe, expect, it } from 'vitest';
import { createRng } from '@core/rng';
import { initialBrain, thinkEnemy, type Perception } from '@core/ai/enemyBrain';
import { pickSpawnTile, pickWeighted, zoneOnDeath, zoneTick, initialZoneRuntime } from '@core/world/spawnRules';
import { rollLoot } from '@core/world/loot';
import { enemyHitChance, playerDamageTaken } from '@core/combat/enemyAttack';
import { registry } from '@data/registry';

const rng = createRng(7);
const home = { x: 500, y: 500 };
const perceive = (over: Partial<Perception>): Perception => ({ now: 0, self: home, home, player: { x: 900, y: 500 }, playerAlive: true, hasLOS: true, hpRatio: 1, ...over });

describe('enemyBrain — melee', () => {
  const def = registry.monster('zombie_casual_f');

  it('idles when the player is out of aggro range', () => {
    const o = thinkEnemy(def, initialBrain(0), perceive({ player: { x: 2000, y: 500 } }), rng);
    expect(['idle', 'wander']).toContain(o.state.mode);
  });

  it('chases toward the player inside aggro range with LOS', () => {
    const o = thinkEnemy(def, initialBrain(0), perceive({ player: { x: 700, y: 500 } }), rng);
    expect(o.state.mode).toBe('chase');
    expect(o.move.x).toBeGreaterThan(0.99);
  });

  it('does not aggro through walls', () => {
    const o = thinkEnemy(def, initialBrain(0), perceive({ player: { x: 700, y: 500 }, hasLOS: false }), rng);
    expect(o.state.mode).not.toBe('chase');
  });

  it('winds up, then strikes once the windup elapses and respects cooldown', () => {
    let s = initialBrain(0);
    let o = thinkEnemy(def, s, perceive({ player: { x: 520, y: 500 } }), rng);
    expect(o.state.mode).toBe('windup');
    expect(o.action).toBeNull();
    s = o.state;
    o = thinkEnemy(def, s, perceive({ now: def.attack.windupMs, player: { x: 520, y: 500 } }), rng);
    expect(o.action).toEqual({ kind: 'melee' });
    expect(o.state.meleeReadyAt).toBe(def.attack.windupMs + def.attack.cooldownMs);
    // still in reach but on cooldown → no new windup
    o = thinkEnemy(def, o.state, perceive({ now: def.attack.windupMs + 10, player: { x: 520, y: 500 } }), rng);
    expect(o.state.mode).toBe('chase');
    expect(o.action).toBeNull();
  });

  it('returns home when leashed too far', () => {
    const o = thinkEnemy(def, { ...initialBrain(0), mode: 'chase' }, perceive({ self: { x: 500 + def.leashRange + 50, y: 500 }, player: { x: 500 + def.leashRange + 100, y: 500 } }), rng);
    expect(o.state.mode).toBe('return');
    expect(o.move.x).toBeLessThan(0);
  });
});

describe('enemyBrain — banshee', () => {
  const def = registry.monster('zombie_banshee');

  it('leaps when the player is inside the jump band and lands with an AoE action', () => {
    let s = { ...initialBrain(0), jumpReadyAt: 0 };
    let o = thinkEnemy(def, s, perceive({ player: { x: 750, y: 500 } }), rng);
    expect(o.state.mode).toBe('jump');
    expect(o.speedMult).toBeGreaterThan(1);
    s = o.state;
    o = thinkEnemy(def, s, perceive({ now: def.jump!.airMs, self: { x: 740, y: 500 }, player: { x: 750, y: 500 } }), rng);
    expect(o.action).toEqual({ kind: 'jumpLand', at: { x: 750, y: 500 } });
    expect(o.state.mode).toBe('chase');
    expect(o.state.jumpReadyAt).toBe(def.jump!.cooldownMs);
  });

  it('walks instead of jumping when too close', () => {
    const o = thinkEnemy(def, { ...initialBrain(0), jumpReadyAt: 0 }, perceive({ player: { x: 600, y: 500 } }), rng);
    expect(o.state.mode).toBe('chase');
  });
});

describe('enemyBrain — rangedKite', () => {
  const def = registry.monster('wito_recon');
  const R = def.ranged!;

  it('backs away when the player is too close', () => {
    const o = thinkEnemy(def, initialBrain(0), perceive({ player: { x: 500 + R.preferredRange * 0.4, y: 500 } }), rng);
    expect(o.state.mode).toBe('shoot');
    expect(o.move.x).toBeLessThan(0);
  });

  it('strafes at preferred range and fires a full burst then cools down', () => {
    let s = initialBrain(0);
    const player = { x: 500 + R.preferredRange, y: 500 };
    let shots = 0;
    let now = 0;
    for (let i = 0; i < 40; i++) {
      const o = thinkEnemy(def, s, perceive({ now, player }), rng);
      if (o.action?.kind === 'shoot') shots++;
      s = o.state;
      now += R.burstIntervalMs;
    }
    // full bursts only, and the cooldown must have throttled firing well below one shot per tick
    expect(shots % R.burst).toBe(0);
    expect(shots).toBeGreaterThanOrEqual(R.burst);
    expect(shots).toBeLessThan(40);
    const strafe = thinkEnemy(def, s, perceive({ now, player }), rng);
    expect(Math.abs(strafe.move.y)).toBeGreaterThan(0.9);
  });

  it('flees when badly hurt', () => {
    const o = thinkEnemy(def, initialBrain(0), perceive({ player: { x: 700, y: 500 }, hpRatio: 0.1 }), rng);
    expect(o.state.mode).toBe('flee');
    expect(o.move.x).toBeLessThan(0);
  });
});

describe('spawnRules', () => {
  it('weighted pick favours heavier entries', () => {
    const r = createRng(3);
    const items = [{ id: 'a', weight: 9 }, { id: 'b', weight: 1 }];
    let a = 0;
    for (let i = 0; i < 1000; i++) if (pickWeighted(items, r).id === 'a') a++;
    expect(a).toBeGreaterThan(820);
    expect(a).toBeLessThan(980);
  });

  it('spawn tile avoids blocked cells and the player', () => {
    const r = createRng(5);
    const rect = { x: 0, y: 0, w: 10, h: 10 };
    const blocked = (x: number) => x < 5;
    for (let i = 0; i < 50; i++) {
      const t = pickSpawnTile(rect, blocked, { x: 9, y: 9, radiusTiles: 3 }, r);
      expect(t).not.toBeNull();
      expect(t!.x).toBeGreaterThanOrEqual(5);
      expect(Math.hypot(t!.x - 9, t!.y - 9)).toBeGreaterThanOrEqual(3);
    }
  });

  it('zone fills to maxAlive then waits for respawn', () => {
    const zone = registry.map('junggok-dong').spawnZones![0];
    let rt = initialZoneRuntime(0);
    let now = 0;
    let spawned = 0;
    for (let i = 0; i < 200; i++) {
      const r = zoneTick(zone, rt, now, rng);
      if (r.monsterId) spawned++;
      rt = r.rt;
      now += 100;
    }
    expect(spawned).toBe(zone.maxAlive);
    rt = zoneOnDeath(zone, rt, now, rng);
    expect(rt.alive).toBe(zone.maxAlive - 1);
    expect(zoneTick(zone, rt, now, rng).monsterId).toBeNull(); // respawn timer not elapsed
    expect(zoneTick(zone, rt, now + zone.respawnSec * 1400, rng).monsterId).not.toBeNull();
  });
});

describe('loot + enemy attack maths', () => {
  it('rolls won within range and only known items', () => {
    const def = registry.monster('zombie_lord');
    const l = rollLoot(def, createRng(1));
    expect(l.won).toBeGreaterThanOrEqual(def.wonMin);
    expect(l.won).toBeLessThanOrEqual(def.wonMax);
    expect(l.items.some((i) => i.itemId === 'ammo_9mm_incendiary')).toBe(true); // chance 1
    for (const it of l.items) expect(() => registry.item(it.itemId)).not.toThrow();
  });

  it('armour reduces player damage and never below 1', () => {
    const r = createRng(2);
    expect(playerDamageTaken(20, 0, r)).toBeGreaterThan(playerDamageTaken(20, 100, r) - 1);
    expect(playerDamageTaken(1, 1000, r)).toBe(1);
  });

  it('enemy hit chance drops with distance and rises vs a stationary player', () => {
    expect(enemyHitChance(0.6, 0, 300, true)).toBeGreaterThan(enemyHitChance(0.6, 300, 300, true));
    expect(enemyHitChance(0.6, 100, 300, false)).toBeGreaterThan(enemyHitChance(0.6, 100, 300, true));
  });
});
