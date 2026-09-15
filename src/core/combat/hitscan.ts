import type { Vec2 } from '../math/vec';
import type { CollisionGrid } from '../map/collisionGrid';

export interface RayTarget {
  id: string;
  x: number;
  y: number;
  r: number;
}

export type RayHit = { kind: 'target'; id: string; dist: number; point: Vec2 } | { kind: 'wall'; dist: number; point: Vec2 } | { kind: 'none'; dist: number; point: Vec2 };

/** Ray vs circle: returns entry distance along the ray or null. */
function rayCircle(origin: Vec2, dir: Vec2, c: RayTarget): number | null {
  const ox = origin.x - c.x;
  const oy = origin.y - c.y;
  const b = ox * dir.x + oy * dir.y;
  const cc = ox * ox + oy * oy - c.r * c.r;
  if (cc > 0 && b > 0) return null; // outside and pointing away
  const disc = b * b - cc;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t < 0 ? 0 : t;
}

/** Hitscan: nearest target circle before the first wall, within `range`. */
export function castRay(grid: CollisionGrid, origin: Vec2, dir: Vec2, range: number, targets: readonly RayTarget[]): RayHit {
  const wallDist = grid.raycast(origin, dir, range);
  let best: { id: string; dist: number } | null = null;
  for (const t of targets) {
    const d = rayCircle(origin, dir, t);
    if (d === null || d > wallDist || d > range) continue;
    if (!best || d < best.dist) best = { id: t.id, dist: d };
  }
  if (best) return { kind: 'target', id: best.id, dist: best.dist, point: { x: origin.x + dir.x * best.dist, y: origin.y + dir.y * best.dist } };
  if (wallDist < range) return { kind: 'wall', dist: wallDist, point: { x: origin.x + dir.x * wallDist, y: origin.y + dir.y * wallDist } };
  return { kind: 'none', dist: range, point: { x: origin.x + dir.x * range, y: origin.y + dir.y * range } };
}
