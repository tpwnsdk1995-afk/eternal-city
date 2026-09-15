import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import type { SkillDef } from '@data/schema/skill';
import { drainAp, emptySkillState, learnOrRankUp, toggleActive, type SkillState } from '@core/skills/skillState';
import { aggregateMods } from '@core/skills/modifiers';

const lookup = registry.skill;
const tough = lookup('skill_tough_body');
const pistol = lookup('skill_pistol_mastery');

function learned(...skills: { id: string; rank: number }[]): SkillState {
  return { learned: skills, active: {} };
}

describe('learning', () => {
  it('learns rank 1 for the base price, then charges more per rank', () => {
    const r1 = learnOrRankUp(emptySkillState(), tough, { techGrade: 1, won: 5000 });
    expect(r1.ok && r1.cost).toBe(5000);
    const r2 = learnOrRankUp(r1.ok ? r1.state : emptySkillState(), tough, { techGrade: 1, won: 5000 });
    expect(r2).toEqual({ ok: false, reason: 'noMoney' });
  });

  it('gates on tech grade and max rank', () => {
    expect(learnOrRankUp(emptySkillState(), tough, { techGrade: 0, won: 1e9 })).toEqual({ ok: false, reason: 'techGradeTooLow' });
    expect(learnOrRankUp(learned({ id: tough.id, rank: tough.maxRank }), tough, { techGrade: 9, won: 1e9 })).toEqual({ ok: false, reason: 'maxRank' });
  });
});

describe('activation', () => {
  it('requires the skill to be learned and toggles per category', () => {
    expect(toggleActive(emptySkillState(), tough, lookup, 5)).toEqual({ ok: false, reason: 'notLearned' });
    const on = toggleActive(learned({ id: tough.id, rank: 1 }), tough, lookup, 5);
    expect(on.ok && on.nowActive).toBe(true);
    const off = toggleActive(on.ok ? on.state : emptySkillState(), tough, lookup, 5);
    expect(off.ok && off.nowActive).toBe(false);
  });

  it('enforces the tech-grade budget across active skills', () => {
    const state = learned({ id: tough.id, rank: 1 }, { id: pistol.id, rank: 1 });
    const first = toggleActive(state, tough, lookup, 1);
    expect(first.ok).toBe(true);
    const second = toggleActive(first.ok ? first.state : state, pistol, lookup, 1);
    expect(second).toEqual({ ok: false, reason: 'techGradeBudget' });
    const roomy = toggleActive(first.ok ? first.state : state, pistol, lookup, 2);
    expect(roomy.ok).toBe(true);
  });
});

describe('modifiers', () => {
  it('scales by rank and gates weapon mastery on the equipped class', () => {
    const state: SkillState = {
      learned: [{ id: tough.id, rank: 2 }, { id: pistol.id, rank: 3 }],
      active: { 퍼스널패시브: tough.id, 웨폰마스터리: pistol.id },
    };
    expect(aggregateMods(state, lookup, '권총').maxHpPct).toBeCloseTo(0.08);
    expect(aggregateMods(state, lookup, '권총').dmgPct).toBeCloseTo(0.15);
    expect(aggregateMods(state, lookup, '기관단총').dmgPct).toBe(0);
  });
});

describe('active skill AP drain', () => {
  const active: SkillDef = { ...tough, id: 'test_active', category: '퍼스널액티브', apDrainPerSec: 10 };
  const customLookup = (id: string) => (id === active.id ? active : lookup(id));

  it('drains ap and deactivates at zero', () => {
    const state: SkillState = { learned: [{ id: active.id, rank: 1 }], active: { 퍼스널액티브: active.id } };
    const mid = drainAp(state, customLookup, 50, 1000);
    expect(mid.ap).toBe(40);
    expect(mid.state.active['퍼스널액티브']).toBe(active.id);
    const out = drainAp(mid.state, customLookup, 5, 1000);
    expect(out.ap).toBe(0);
    expect(out.state.active['퍼스널액티브']).toBeUndefined();
  });
});
