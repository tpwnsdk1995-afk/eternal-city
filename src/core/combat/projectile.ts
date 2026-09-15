import type { Vec2 } from '../math/vec';
import type { CollisionGrid } from '../map/collisionGrid';
import type { RayTarget } from './hitscan';

/** Pure flight state for a launcher shell (M79 유탄) or rocket (RPG-7). */
export interface ProjectileState {
  pos: Vec2;
  dir: Vec2; // unit
  speed: number; // px/s
  travelled: number;
  /** distance at which an arcing shell lands (aimed point) or a rocket self-detonates (range) */
  maxDist: number;
  arc: boolean;
  aoeRadius: number;
}

export interface LaunchParams {
  origin: Vec2;
  angle: number;
  speed: number;
  range: number;
  aimDist: number;
  arc: boolean;
  aoeRadius: number;
}

export function launch(p: LaunchParams): ProjectileState {
  const dir = { x: Math.cos(p.angle), y: Math.sin(p.angle) };
  // arcing shells land where the player aimed (clamped to range, but never right at the feet)
  const maxDist = p.arc ? Math.min(p.range, Math.max(48, p.aimDist)) : p.range;
  return { pos: { ...p.origin }, dir, speed: p.speed, travelled: 0, maxDist, arc: p.arc, aoeRadius: p.aoeRadius };
}

export type ProjectileStep = { kind: 'flying'; state: ProjectileState } | { kind: 'detonate'; at: Vec2; reason: 'wall' | 'target' | 'range' | 'landed' };

/**
 * Advance one frame. Arcing shells fly over targets and walls until they land; rockets detonate on
 * the first wall or target circle they enter, or at max range.
 */
export function stepProjectile(s: ProjectileState, dtMs: number, grid: CollisionGrid, targets: readonly RayTarget[]): ProjectileStep {
  const stepLen = (s.speed * dtMs) / 1000;
  const remaining = s.maxDist - s.travelled;
  const advance = Math.min(stepLen, remaining);
  // sub-step so fast rockets don't tunnel through thin walls / small targets
  const sub = Math.max(1, Math.ceil(advance / 8));
  let pos = s.pos;
  for (let i = 0; i < sub; i++) {
    const next = { x: pos.x + (s.dir.x * advance) / sub, y: pos.y + (s.dir.y * advance) / sub };
    if (!s.arc) {
      if (grid.isBlockedWorld(next.x, next.y)) return { kind: 'detonate', at: pos, reason: 'wall' };
      for (const t of targets) {
        if (Math.hypot(t.x - next.x, t.y - next.y) <= t.r) return { kind: 'detonate', at: next, reason: 'target' };
      }
    }
    pos = next;
  }
  const travelled = s.travelled + advance;
  if (travelled >= s.maxDist - 0.01) return { kind: 'detonate', at: pos, reason: s.arc ? 'landed' : 'range' };
  return { kind: 'flying', state: { ...s, pos, travelled } };
}

/** Visual height (px) of an arcing shell at flight progress t∈[0,1]; peak scales with distance. */
export function arcHeight(t: number, maxDist: number): number {
  const peak = Math.min(64, 12 + maxDist * 0.12);
  return Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * peak;
}

/** AoE falloff: 1 at the centre, `edge` at the blast edge, 0 outside (target radius widens the reach). */
export function aoeFalloff(distToCenter: number, radius: number, targetRadius = 0, edge = 0.35): number {
  const d = Math.max(0, distToCenter - targetRadius);
  if (d >= radius) return 0;
  return 1 - (1 - edge) * (d / radius);
}

export interface AoeHit extends RayTarget {
  dist: number;
  mult: number;
}

/** Every target inside the blast, nearest first, with its damage multiplier. Walls do not shield. */
export function targetsInBlast(center: Vec2, radius: number, targets: readonly RayTarget[]): AoeHit[] {
  const out: AoeHit[] = [];
  for (const t of targets) {
    const d = Math.hypot(t.x - center.x, t.y - center.y);
    const mult = aoeFalloff(d, radius, t.r);
    if (mult > 0) out.push({ ...t, dist: d, mult });
  }
  return out.sort((a, b) => a.dist - b.dist);
}
