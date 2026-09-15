import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { currentPhase, onAssaultEnemyDied, onObjectiveDestroyed, startAssault, tickAssault, type AssaultRuntime } from '@core/assault/assaultMachine';

const def = registry.assault('assault-d');
const map = registry.map(def.mapId);

describe('assaultMachine — 패러사이트 근절 (GUEST · 뿌리 기물 · 루트)', () => {
  it('clear → advance → destroy(4 roots, membrane opens) → advance → boss → success', () => {
    let rt: AssaultRuntime = startAssault(def, 0).rt;
    let now = 0;
    const seen: string[] = [];
    const destroyed = new Set<string>();
    let gate = false;
    for (let i = 0; i < 800 && rt.status === 'running'; i++) {
      now += 500;
      const phase = currentPhase(rt)!;
      const zone = phase.kind === 'advance' || phase.kind === 'moveTo' ? phase.toZone : null;
      const step = tickAssault(rt, { now, playerInZone: (z) => z === zone });
      rt = step.rt;
      for (const e of step.events) {
        if (e.kind === 'phase') seen.push(e.phase.kind);
        if (e.kind === 'spawn') rt = onAssaultEnemyDied(rt, e.tag);
        if (e.kind === 'openGate') gate = true;
      }
      if (currentPhase(rt)?.kind === 'destroy' && rt.objectivesLeft.length && i % 3 === 0) {
        const id = rt.objectivesLeft[0];
        const o = onObjectiveDestroyed(rt, id, map, destroyed);
        destroyed.add(id);
        rt = o.rt;
        if (o.events.some((e) => e.kind === 'openGate')) gate = true;
      }
    }
    expect(rt.status).toBe('success');
    expect(seen).toEqual(['advance', 'destroy', 'advance', 'boss']);
    expect(gate).toBe(true);
    expect(destroyed.size).toBe(4);
  });

  it('GUEST and the root are wired: faction, stationary root with long reach, 고급 variant registered', () => {
    expect(registry.monster('guest_scout').faction).toBe('GUEST');
    expect(registry.monster('guest_warrior').ranged).toBeTruthy();
    const root = registry.monster('parasite_root');
    expect(root.moveSpeed).toBe(0);
    expect(root.attack.reach).toBeGreaterThan(100);
    expect(root.boss).toBe(true);
    expect(registry.assault('assault-d-adv').advanced).toBe(true);
    expect(map.objectives?.every((o) => o.tex === 'root_node')).toBe(true);
  });
});
