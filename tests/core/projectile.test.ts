import { describe, expect, it } from 'vitest';
import { CollisionGrid } from '@core/map/collisionGrid';
import { aoeFalloff, arcHeight, launch, stepProjectile, targetsInBlast, type ProjectileState } from '@core/combat/projectile';

function grid(): CollisionGrid {
  const g = new CollisionGrid(20, 10, 32);
  g.fillRect(10, 0, 1, 10); // wall at x 320..352
  return g;
}

function flyToEnd(s: ProjectileState, g: CollisionGrid, targets: Parameters<typeof stepProjectile>[3] = []) {
  for (let i = 0; i < 500; i++) {
    const r = stepProjectile(s, 16, g, targets);
    if (r.kind === 'detonate') return r;
    s = r.state;
  }
  throw new Error('never detonated');
}

describe('projectile', () => {
  it('arcing shell lands at the aimed distance, ignoring walls and targets on the way', () => {
    const s = launch({ origin: { x: 16, y: 100 }, angle: 0, speed: 400, range: 420, aimDist: 200, arc: true, aoeRadius: 70 });
    const r = flyToEnd(s, grid(), [{ id: 'z', x: 100, y: 100, r: 12 }]);
    expect(r.reason).toBe('landed');
    expect(r.at.x).toBeCloseTo(216, 0);
  });

  it('arcing shell never lands at the shooter’s feet and is clamped to range', () => {
    const near = launch({ origin: { x: 0, y: 0 }, angle: 0, speed: 400, range: 420, aimDist: 5, arc: true, aoeRadius: 70 });
    expect(near.maxDist).toBe(48);
    const far = launch({ origin: { x: 0, y: 0 }, angle: 0, speed: 400, range: 420, aimDist: 900, arc: true, aoeRadius: 70 });
    expect(far.maxDist).toBe(420);
  });

  it('rocket detonates on the first wall', () => {
    const s = launch({ origin: { x: 16, y: 100 }, angle: 0, speed: 520, range: 800, aimDist: 700, arc: false, aoeRadius: 90 });
    const r = flyToEnd(s, grid());
    expect(r.reason).toBe('wall');
    expect(r.at.x).toBeLessThan(320);
    expect(r.at.x).toBeGreaterThan(300);
  });

  it('rocket detonates on entering a target circle and at max range otherwise', () => {
    const s = launch({ origin: { x: 16, y: 100 }, angle: 0, speed: 520, range: 250, aimDist: 250, arc: false, aoeRadius: 90 });
    const hit = flyToEnd({ ...s }, grid(), [{ id: 'z', x: 150, y: 104, r: 12 }]);
    expect(hit.reason).toBe('target');
    expect(hit.at.x).toBeGreaterThan(130);
    const miss = flyToEnd({ ...s }, grid(), []);
    expect(miss.reason).toBe('range');
    expect(miss.at.x).toBeCloseTo(266, 0);
  });

  it('blast falloff and target ordering', () => {
    expect(aoeFalloff(0, 70)).toBe(1);
    expect(aoeFalloff(70, 70)).toBe(0);
    expect(aoeFalloff(35, 70)).toBeCloseTo(0.675);
    expect(aoeFalloff(75, 70, 10)).toBeCloseTo(0.35 + 0.65 * (5 / 70), 5); // radius slack
    const hits = targetsInBlast({ x: 0, y: 0 }, 70, [
      { id: 'far', x: 60, y: 0, r: 10 },
      { id: 'near', x: 10, y: 0, r: 10 },
      { id: 'out', x: 100, y: 0, r: 10 },
    ]);
    expect(hits.map((h) => h.id)).toEqual(['near', 'far']);
    expect(hits[0].mult).toBe(1);
  });

  it('arc height peaks mid-flight and is zero at both ends', () => {
    expect(arcHeight(0, 300)).toBeCloseTo(0);
    expect(arcHeight(1, 300)).toBeCloseTo(0);
    expect(arcHeight(0.5, 300)).toBeGreaterThan(arcHeight(0.25, 300));
    expect(arcHeight(0.5, 2000)).toBe(64);
  });
});
