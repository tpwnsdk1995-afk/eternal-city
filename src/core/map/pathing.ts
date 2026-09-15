import { dist, normalize, sub, type Vec2 } from '../math/vec';

export interface SteerResult {
  dir: Vec2; // unit vector, zero when arrived
  arrived: boolean;
  remaining: number;
}

/**
 * M1 movement: straight line toward the target; Arcade physics slides the body along walls.
 * A* over the collision grid can replace this without touching callers.
 */
export function steerToward(pos: Vec2, target: Vec2, arriveRadius: number): SteerResult {
  const remaining = dist(pos, target);
  if (remaining <= arriveRadius) return { dir: { x: 0, y: 0 }, arrived: true, remaining };
  return { dir: normalize(sub(target, pos)), arrived: false, remaining };
}

export interface StuckTracker {
  lastPos: Vec2;
  stuckMs: number;
}

export const newStuckTracker = (pos: Vec2): StuckTracker => ({ lastPos: pos, stuckMs: 0 });

/** Accumulates time during which the mover barely progressed; caller stops the move past a threshold. */
export function trackStuck(t: StuckTracker, pos: Vec2, dtMs: number, minProgressPx = 0.5): StuckTracker {
  const moved = dist(t.lastPos, pos);
  return { lastPos: pos, stuckMs: moved < minProgressPx ? t.stuckMs + dtMs : 0 };
}
