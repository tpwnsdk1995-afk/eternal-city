import { describe, expect, it } from 'vitest';
import { FRAMES_PER_DIR, WALK_FRAMES, aimFrame, deathFrame, dirFromAngle, figureFrame, walkFrameAt } from '../../src/game/systems/facing';

describe('figure sheet frame layout (8 dirs × 6 frames)', () => {
  it('lays rows per direction with walk, aim and death columns', () => {
    expect(FRAMES_PER_DIR).toBe(6);
    expect(figureFrame(0, 0)).toBe(0);
    expect(figureFrame(2, 3)).toBe(2 * 6 + 3);
    expect(figureFrame(7, 4)).toBe(7 * 6 + 0); // walk index wraps inside the 4 walk frames
    expect(aimFrame(2)).toBe(2 * 6 + 4);
    expect(deathFrame(6)).toBe(6 * 6 + 5);
    for (let d = 0; d < 8; d++) {
      expect(aimFrame(d as never)).toBeGreaterThan(figureFrame(d as never, WALK_FRAMES - 1));
      expect(deathFrame(d as never)).toBeLessThan((d + 1) * FRAMES_PER_DIR);
    }
  });

  it('walk cycle is step → pass → step → idle, repeating', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => walkFrameAt(i * 150, 150))).toEqual([1, 2, 3, 0, 1, 2]);
    expect(walkFrameAt(149, 150)).toBe(1);
  });

  it('maps angles to the 8 screen directions', () => {
    expect(dirFromAngle(0)).toBe(0);
    expect(dirFromAngle(Math.PI / 2)).toBe(2);
    expect(dirFromAngle(Math.PI)).toBe(4);
    expect(dirFromAngle(-Math.PI / 2)).toBe(6);
    expect(dirFromAngle(Math.PI / 4)).toBe(1);
  });
});
