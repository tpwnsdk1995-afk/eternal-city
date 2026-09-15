import type { Rect, SpawnZoneDef } from '@data/schema/map';
import type { Rng } from '../rng';

export function pickWeighted<T extends { weight: number }>(items: readonly T[], rng: Rng): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = rng.range(0, total);
  for (const it of items) {
    roll -= it.weight;
    if (roll <= 0) return it;
  }
  return items[items.length - 1];
}

export interface SpawnAvoid {
  x: number; // tile
  y: number;
  radiusTiles: number;
}

/**
 * Random walkable tile inside `rect`, at least `avoid.radiusTiles` from `avoid` (usually the player
 * so nothing pops in on top of them). Null when no tile qualified after `attempts` tries.
 */
export function pickSpawnTile(rect: Rect, isBlocked: (tx: number, ty: number) => boolean, avoid: SpawnAvoid | null, rng: Rng, attempts = 24): { x: number; y: number } | null {
  for (let i = 0; i < attempts; i++) {
    const x = rng.int(rect.x, rect.x + rect.w - 1);
    const y = rng.int(rect.y, rect.y + rect.h - 1);
    if (isBlocked(x, y)) continue;
    if (avoid && Math.hypot(x - avoid.x, y - avoid.y) < avoid.radiusTiles) continue;
    return { x, y };
  }
  return null;
}

export interface ZoneRuntime {
  alive: number;
  nextSpawnAt: number;
  /** true once the zone has reached maxAlive for the first time; afterwards respawns are slow */
  filled: boolean;
}

export const initialZoneRuntime = (now: number): ZoneRuntime => ({ alive: 0, nextSpawnAt: now, filled: false });

/**
 * Decides whether a zone should spawn one monster this tick. The initial fill spawns quickly;
 * replacements wait `respawnSec` (±30%).
 */
export function zoneTick(zone: SpawnZoneDef, rt: ZoneRuntime, now: number, rng: Rng): { monsterId: string | null; rt: ZoneRuntime } {
  if (rt.alive >= zone.maxAlive || now < rt.nextSpawnAt) return { monsterId: null, rt };
  const monsterId = pickWeighted(zone.monsters, rng).id;
  const alive = rt.alive + 1;
  const filled = rt.filled || alive >= zone.maxAlive;
  const delayMs = rt.filled ? respawnDelayMs(zone, rng) : 350;
  return { monsterId, rt: { alive, nextSpawnAt: now + delayMs, filled } };
}

const respawnDelayMs = (zone: SpawnZoneDef, rng: Rng): number => zone.respawnSec * 1000 * rng.range(0.7, 1.3);

/** A monster from this zone died: free the slot and start its respawn timer from now. */
export function zoneOnDeath(zone: SpawnZoneDef, rt: ZoneRuntime, now: number, rng: Rng): ZoneRuntime {
  return { ...rt, alive: Math.max(0, rt.alive - 1), nextSpawnAt: Math.max(rt.nextSpawnAt, now + respawnDelayMs(zone, rng)) };
}
