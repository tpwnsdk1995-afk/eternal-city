import { describe, expect, it } from 'vitest';
import { MAPS } from '@data/registry';
import { buildMap, openGate, tileAt } from '@core/map/mapBuild';
import { steerToward, newStuckTracker, trackStuck } from '@core/map/pathing';

describe('buildMap', () => {
  for (const def of MAPS) {
    it(`${def.id}: spawn points and portals are walkable, border is solid`, () => {
      const built = buildMap(def);
      for (const [name, p] of Object.entries(def.spawnPoints)) {
        expect(built.collision.isBlockedTile(p.x, p.y), `spawn ${name}`).toBe(false);
      }
      for (const portal of def.portals) {
        let walkable = 0;
        for (let y = portal.rect.y; y < portal.rect.y + portal.rect.h; y++)
          for (let x = portal.rect.x; x < portal.rect.x + portal.rect.w; x++) if (!built.collision.isBlockedTile(x, y)) walkable++;
        expect(walkable, `portal ${portal.id}`).toBeGreaterThan(0);
      }
      expect(built.collision.isBlockedTile(0, 0)).toBe(true);
      expect(tileAt(built, 0, 0)).toBe(def.borderTile);
      for (const n of def.npcs ?? []) expect(built.collision.isBlockedTile(n.at.x, n.at.y), `npc ${n.id}`).toBe(false);
    });
  }

  it('gates block until opened', () => {
    const def = MAPS.find((m) => m.gates?.length)!;
    const built = buildMap(def);
    const gate = def.gates![0];
    expect(built.collision.isBlockedTile(gate.rect.x, gate.rect.y)).toBe(true);
    const changed = openGate(built, gate);
    expect(changed.length).toBe(gate.rect.w * gate.rect.h);
    expect(built.collision.isBlockedTile(gate.rect.x, gate.rect.y)).toBe(false);
    expect(tileAt(built, gate.rect.x, gate.rect.y)).toBe(def.groundTile);
  });

  it('objectives block movement while alive', () => {
    const def = MAPS.find((m) => m.objectives?.length)!;
    const built = buildMap(def);
    const o = def.objectives![0];
    expect(built.collision.isBlockedTile(o.at.x, o.at.y)).toBe(true);
  });
});

describe('pathing', () => {
  it('steers toward the target and reports arrival', () => {
    const s = steerToward({ x: 0, y: 0 }, { x: 100, y: 0 }, 4);
    expect(s.dir).toEqual({ x: 1, y: 0 });
    expect(s.arrived).toBe(false);
    expect(steerToward({ x: 98, y: 0 }, { x: 100, y: 0 }, 4).arrived).toBe(true);
  });

  it('accumulates stuck time only without progress', () => {
    let t = newStuckTracker({ x: 0, y: 0 });
    t = trackStuck(t, { x: 0, y: 0 }, 200);
    t = trackStuck(t, { x: 0.1, y: 0 }, 200);
    expect(t.stuckMs).toBe(400);
    t = trackStuck(t, { x: 5, y: 0 }, 200);
    expect(t.stuckMs).toBe(0);
  });
});
