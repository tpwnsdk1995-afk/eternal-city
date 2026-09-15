import type { SkillCategory } from '@data/schema/enums';
import type { SkillDef } from '@data/schema/skill';

export interface LearnedSkill {
  id: string;
  rank: number;
}

export interface SkillState {
  learned: LearnedSkill[];
  active: Partial<Record<SkillCategory, string>>;
}

export type SkillLookup = (id: string) => SkillDef;

export const emptySkillState = (): SkillState => ({ learned: [], active: {} });

export const learnedRank = (state: SkillState, id: string): number => state.learned.find((s) => s.id === id)?.rank ?? 0;

export type LearnResult = { ok: true; state: SkillState; cost: number } | { ok: false; reason: 'techGradeTooLow' | 'maxRank' | 'noMoney' };

/** Learns a skill (rank 1) or raises its rank by one. Cost scales with the next rank. */
export function learnOrRankUp(state: SkillState, def: SkillDef, char: { techGrade: number; won: number }): LearnResult {
  const current = learnedRank(state, def.id);
  if (char.techGrade < def.reqTechGrade) return { ok: false, reason: 'techGradeTooLow' };
  if (current >= def.maxRank) return { ok: false, reason: 'maxRank' };
  const cost = def.price * (current + 1);
  if (char.won < cost) return { ok: false, reason: 'noMoney' };

  const learned = current === 0 ? [...state.learned, { id: def.id, rank: 1 }] : state.learned.map((s) => (s.id === def.id ? { ...s, rank: s.rank + 1 } : s));
  return { ok: true, state: { ...state, learned }, cost };
}

/** Sum of reqTechGrade over active skills — must stay within the character's 기술등급. */
export function activeTechGradeUsed(state: SkillState, lookup: SkillLookup): number {
  return Object.values(state.active).reduce((sum, id) => sum + (id ? lookup(id).reqTechGrade : 0), 0);
}

export type ToggleResult = { ok: true; state: SkillState; nowActive: boolean } | { ok: false; reason: 'notLearned' | 'techGradeBudget' };

/**
 * Toggles a learned skill. Activating replaces whatever occupies its category (one per category),
 * and the total tech-grade cost of active skills may not exceed the character's 기술등급.
 */
export function toggleActive(state: SkillState, def: SkillDef, lookup: SkillLookup, techGrade: number): ToggleResult {
  if (learnedRank(state, def.id) === 0) return { ok: false, reason: 'notLearned' };

  if (state.active[def.category] === def.id) {
    const active = { ...state.active };
    delete active[def.category];
    return { ok: true, state: { ...state, active }, nowActive: false };
  }

  const next: SkillState = { ...state, active: { ...state.active, [def.category]: def.id } };
  if (activeTechGradeUsed(next, lookup) > techGrade) return { ok: false, reason: 'techGradeBudget' };
  return { ok: true, state: next, nowActive: true };
}

/** Drains 행동력 for the active 퍼스널액티브 skill; deactivates it when AP runs out. */
export function drainAp(state: SkillState, lookup: SkillLookup, ap: number, dtMs: number): { ap: number; state: SkillState } {
  const activeId = state.active['퍼스널액티브'];
  if (!activeId) return { ap, state };
  const def = lookup(activeId);
  const drained = ap - (def.apDrainPerSec ?? 0) * (dtMs / 1000);
  if (drained > 0) return { ap: drained, state };
  const active = { ...state.active };
  delete active['퍼스널액티브'];
  return { ap: 0, state: { ...state, active } };
}
