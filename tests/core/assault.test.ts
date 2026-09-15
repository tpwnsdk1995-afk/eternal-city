import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import {
  assaultProgressText,
  currentPhase,
  onAssaultEnemyDied,
  onAssaultPlayerDied,
  onObjectiveDestroyed,
  startAssault,
  tickAssault,
  type AssaultEvent,
  type AssaultRuntime,
} from '@core/assault/assaultMachine';

const def = registry.assault('assault-a');
const map = registry.map(def.mapId);

/** Drives the machine like the scene would: kill everything that spawns, destroy objectives when asked. */
function run(rt: AssaultRuntime, now: number, zone: string | null, killAll = true): { rt: AssaultRuntime; events: AssaultEvent[] } {
  const step = tickAssault(rt, { now, playerInZone: (z) => z === zone });
  let next = step.rt;
  if (killAll) for (const e of step.events) if (e.kind === 'spawn') next = onAssaultEnemyDied(next, e.tag);
  return { rt: next, events: step.events };
}

describe('assaultMachine — 중곡동 봉쇄선 돌파', () => {
  it('starts in the first clear phase and spawns the first wave after its delay', () => {
    const s = startAssault(def, 0);
    expect(currentPhase(s.rt)?.kind).toBe('clear');
    expect(s.events[0]).toMatchObject({ kind: 'phase', index: 0 });
    let r = tickAssault(s.rt, { now: 1000, playerInZone: () => false });
    expect(r.events.filter((e) => e.kind === 'spawn')).toHaveLength(0);
    r = tickAssault(r.rt, { now: 2000, playerInZone: () => false });
    expect(r.events.filter((e) => e.kind === 'spawn').length).toBeGreaterThan(0);
    expect(r.rt.pending.length + r.rt.aliveWave).toBe(4);
  });

  it('runs the whole mission: clear → destroy (gate opens) → advance → clear → advance → boss → success', () => {
    let rt = startAssault(def, 0).rt;
    let now = 0;
    const seen: string[] = [];
    const destroyed = new Set<string>();
    let gateOpened = false;

    for (let i = 0; i < 400 && rt.status === 'running'; i++) {
      now += 500;
      const phase = currentPhase(rt)!;
      const zone = phase.kind === 'advance' ? phase.toZone : null;
      const r = run(rt, now, zone);
      rt = r.rt;
      for (const e of r.events) {
        if (e.kind === 'phase') seen.push(e.phase.kind);
        if (e.kind === 'openGate') gateOpened = true;
      }
      // objectives: knock one down every other tick during the destroy phase
      if (currentPhase(rt)?.kind === 'destroy' && rt.objectivesLeft.length && i % 2 === 0) {
        const id = rt.objectivesLeft[0];
        const o = onObjectiveDestroyed(rt, id, map, destroyed);
        destroyed.add(id);
        rt = o.rt;
        if (o.events.some((e) => e.kind === 'openGate')) gateOpened = true;
      }
    }

    expect(rt.status).toBe('success');
    expect(seen).toEqual(['destroy', 'advance', 'clear', 'advance', 'boss']);
    expect(gateOpened).toBe(true);
    expect(rt.kills).toBeGreaterThan(10);
  });

  it('gate only opens once every listed barricade is down', () => {
    let rt = startAssault(def, 0).rt;
    rt = { ...rt, phaseIndex: 1, objectivesLeft: ['barricade_1', 'barricade_2', 'barricade_3'] };
    const destroyed = new Set<string>();
    let r = onObjectiveDestroyed(rt, 'barricade_1', map, destroyed);
    destroyed.add('barricade_1');
    expect(r.events).toEqual([]);
    r = onObjectiveDestroyed(r.rt, 'barricade_2', map, destroyed);
    destroyed.add('barricade_2');
    expect(r.events).toEqual([]);
    r = onObjectiveDestroyed(r.rt, 'barricade_3', map, destroyed);
    expect(r.events).toEqual([{ kind: 'openGate', gateId: 'gate_1' }]);
    expect(r.rt.objectivesLeft).toEqual([]);
    expect(assaultProgressText(r.rt)).toContain('0 / 3');
  });

  it('boss phase spawns the boss immediately and completes when it dies', () => {
    let rt = startAssault(def, 0).rt;
    const bossIndex = def.phases.findIndex((p) => p.kind === 'boss');
    // fast-forward: enter the boss phase via a completed advance
    rt = { ...rt, phaseIndex: bossIndex - 1 };
    let r = tickAssault(rt, { now: 1000, playerInZone: () => true });
    expect(r.events.some((e) => e.kind === 'spawn' && e.tag === 'boss')).toBe(true);
    expect(r.rt.bossAlive).toBe(true);
    r = tickAssault(r.rt, { now: 1500, playerInZone: () => false });
    expect(r.rt.status).toBe('running');
    const dead = onAssaultEnemyDied(r.rt, 'boss');
    r = tickAssault(dead, { now: 2000, playerInZone: () => false });
    expect(r.rt.status).toBe('success');
    expect(r.events[r.events.length - 1]).toEqual({ kind: 'success' });
  });

  it('player death fails the assault exactly once', () => {
    const rt = startAssault(def, 0).rt;
    const f = onAssaultPlayerDied(rt);
    expect(f.rt.status).toBe('failed');
    expect(f.events).toEqual([{ kind: 'failed', reason: 'death' }]);
    expect(onAssaultPlayerDied(f.rt).events).toEqual([]);
    expect(tickAssault(f.rt, { now: 99999, playerInZone: () => true }).events).toEqual([]);
  });
});
