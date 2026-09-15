import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { assaultProgressText, currentPhase, defendedBoothId, onAssaultEnemyDied, onBoothDestroyed, startAssault, tickAssault, type AssaultRuntime } from '@core/assault/assaultMachine';

const def = registry.assault('assault-b');

describe('assaultMachine — 중곡역 부스 방어 (defend)', () => {
  it('runs clear → moveTo → defend (three waves) → boss → success', () => {
    let rt: AssaultRuntime = startAssault(def, 0).rt;
    let now = 0;
    const seen: string[] = [];
    for (let i = 0; i < 600 && rt.status === 'running'; i++) {
      now += 500;
      const phase = currentPhase(rt)!;
      const zone = phase.kind === 'moveTo' || phase.kind === 'advance' ? phase.toZone : null;
      const step = tickAssault(rt, { now, playerInZone: (z) => z === zone });
      rt = step.rt;
      for (const e of step.events) {
        if (e.kind === 'phase') seen.push(e.phase.kind);
        if (e.kind === 'spawn') rt = onAssaultEnemyDied(rt, e.tag);
      }
    }
    expect(rt.status).toBe('success');
    expect(seen).toEqual(['moveTo', 'defend', 'boss']);
    expect(rt.kills).toBeGreaterThan(20);
  });

  it('exposes the defended booth only during the defend phase and fails when it falls', () => {
    let rt = startAssault(def, 0).rt;
    expect(defendedBoothId(rt)).toBeNull();
    const defendIndex = def.phases.findIndex((p) => p.kind === 'defend');
    rt = { ...rt, phaseIndex: defendIndex - 1 }; // moveTo → step into the zone
    rt = tickAssault(rt, { now: 1000, playerInZone: () => true }).rt;
    expect(currentPhase(rt)?.kind).toBe('defend');
    expect(defendedBoothId(rt)).toBe('booth_3');
    expect(assaultProgressText(rt)).toContain('부스를 지켜라');
    const fell = onBoothDestroyed(rt);
    expect(fell.rt.status).toBe('failed');
    expect(fell.rt.failReason).toBe('booth');
    expect(fell.events).toEqual([{ kind: 'failed', reason: 'booth' }]);
    expect(onBoothDestroyed(fell.rt).events).toEqual([]);
  });

  it('moveTo phases time out into a failure', () => {
    let rt = startAssault(def, 0).rt;
    const moveIndex = def.phases.findIndex((p) => p.kind === 'moveTo');
    rt = { ...rt, phaseIndex: moveIndex - 1 };
    // finish the clear phase by killing everything it spawns
    for (let now = 500; now < 60_000 && currentPhase(rt)?.kind !== 'moveTo'; now += 500) {
      const step = tickAssault(rt, { now, playerInZone: () => false });
      rt = step.rt;
      for (const e of step.events) if (e.kind === 'spawn') rt = onAssaultEnemyDied(rt, e.tag);
    }
    expect(currentPhase(rt)?.kind).toBe('moveTo');
    const limit = (currentPhase(rt) as { timeLimitSec: number }).timeLimitSec;
    const r = tickAssault(rt, { now: rt.phaseStartedAt + limit * 1000 + 1, playerInZone: () => false });
    expect(r.rt.status).toBe('failed');
    expect(r.rt.failReason).toBe('timeout');
  });
});
