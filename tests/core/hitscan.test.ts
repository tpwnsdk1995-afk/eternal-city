import { describe, expect, it } from 'vitest';
import { CollisionGrid } from '@core/map/collisionGrid';
import { castRay } from '@core/combat/hitscan';

function gridWithWall(): CollisionGrid {
  const g = new CollisionGrid(10, 10, 32);
  g.fillRect(5, 0, 1, 10); // vertical wall at tile column 5 (x 160..192)
  return g;
}

describe('CollisionGrid', () => {
  it('raycasts to the first solid tile', () => {
    const g = gridWithWall();
    expect(g.raycast({ x: 16, y: 16 }, { x: 1, y: 0 }, 320)).toBeCloseTo(144);
    expect(g.raycast({ x: 16, y: 16 }, { x: 0, y: 1 }, 100)).toBe(100);
  });

  it('treats outside the map as solid', () => {
    const g = gridWithWall();
    expect(g.isBlockedTile(-1, 0)).toBe(true);
    expect(g.raycast({ x: 16, y: 16 }, { x: -1, y: 0 }, 100)).toBeCloseTo(16);
  });

  it('reports line of sight', () => {
    const g = gridWithWall();
    expect(g.hasLineOfSight({ x: 16, y: 16 }, { x: 100, y: 16 })).toBe(true);
    expect(g.hasLineOfSight({ x: 16, y: 16 }, { x: 220, y: 16 })).toBe(false);
  });
});

describe('castRay', () => {
  const origin = { x: 16, y: 16 };
  const right = { x: 1, y: 0 };

  it('hits the nearest target in front of the wall', () => {
    const hit = castRay(gridWithWall(), origin, right, 320, [
      { id: 'far', x: 116, y: 16, r: 10 },
      { id: 'near', x: 76, y: 16, r: 10 },
    ]);
    expect(hit.kind).toBe('target');
    expect(hit.kind === 'target' && hit.id).toBe('near');
    expect(hit.dist).toBeCloseTo(50);
  });

  it('stops at the wall when the only target is behind it', () => {
    const hit = castRay(gridWithWall(), origin, right, 320, [{ id: 'behind', x: 220, y: 16, r: 10 }]);
    expect(hit.kind).toBe('wall');
    expect(hit.dist).toBeCloseTo(144);
  });

  it('ignores targets beyond range and off the ray', () => {
    const hit = castRay(gridWithWall(), origin, { x: 0, y: 1 }, 100, [
      { id: 'tooFar', x: 16, y: 200, r: 10 },
      { id: 'aside', x: 80, y: 60, r: 10 },
    ]);
    expect(hit.kind).toBe('none');
  });
});
