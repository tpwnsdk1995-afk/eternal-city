import type { Vec2 } from '../math/vec';
import type { RayTarget } from './hitscan';

export const MELEE_HALF_ANGLE = (50 * Math.PI) / 180;

/** Targets whose circle overlaps a swing of `range` px inside ±halfAngle of `aimAngle`, nearest first. */
export function targetsInArc(origin: Vec2, aimAngle: number, range: number, targets: readonly RayTarget[], halfAngle = MELEE_HALF_ANGLE): (RayTarget & { dist: number })[] {
  const out: (RayTarget & { dist: number })[] = [];
  for (const t of targets) {
    const dx = t.x - origin.x;
    const dy = t.y - origin.y;
    const d = Math.hypot(dx, dy);
    if (d - t.r > range) continue;
    if (d > 0.001) {
      let diff = Math.atan2(dy, dx) - aimAngle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // wrap to [-π, π]
      // allow the target's radius to widen the acceptable angle when it's close
      const slack = Math.min(Math.PI / 2, Math.asin(Math.min(1, t.r / Math.max(d, t.r))));
      if (Math.abs(diff) > halfAngle + slack) continue;
    }
    out.push({ ...t, dist: d });
  }
  return out.sort((a, b) => a.dist - b.dist);
}
