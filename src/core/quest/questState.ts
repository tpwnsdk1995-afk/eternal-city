import type { QuestDef, QuestStep } from '@data/schema/quest';
import type { MonsterDef } from '@data/schema/monster';

export interface ActiveQuest {
  id: string;
  /** progress per step (kill/collect counts; talk/reach 0|1) */
  progress: number[];
}

export interface QuestState {
  active: ActiveQuest[];
  completed: string[];
}

export type QuestLookup = (id: string) => QuestDef;

export const emptyQuestState = (): QuestState => ({ active: [], completed: [] });

export const isActive = (s: QuestState, id: string): boolean => s.active.some((q) => q.id === id);
export const isCompleted = (s: QuestState, id: string): boolean => s.completed.includes(id);

/** UTC day index used to reset 메인스트림 quests. */
export const dayKey = (now = Date.now()): number => Math.floor(now / 86_400_000);
export const dailyFlag = (id: string): string => `daily:${id}`;
/** whether a daily quest was already turned in today */
export const doneToday = (def: QuestDef, flags: Record<string, boolean | number>, day = dayKey()): boolean => !!def.daily && flags[dailyFlag(def.id)] === day;

export function stepTarget(step: QuestStep): number {
  return step.kind === 'kill' || step.kind === 'collect' ? step.count : 1;
}

/** Whether the character may take the quest right now. */
export type AcceptReason = 'active' | 'completed' | 'level' | 'flags' | 'quests' | 'daily';

export function canAccept(s: QuestState, def: QuestDef, ctx: { level: number; flags: Record<string, boolean | number>; day?: number }): { ok: true } | { ok: false; reason: AcceptReason } {
  if (isActive(s, def.id)) return { ok: false, reason: 'active' };
  if (isCompleted(s, def.id)) return { ok: false, reason: 'completed' };
  if (doneToday(def, ctx.flags, ctx.day)) return { ok: false, reason: 'daily' };
  const p = def.prereq;
  if (p?.level && ctx.level < p.level) return { ok: false, reason: 'level' };
  if (p?.flags && !p.flags.every((f) => !!ctx.flags[f])) return { ok: false, reason: 'flags' };
  if (p?.quests && !p.quests.every((q) => isCompleted(s, q))) return { ok: false, reason: 'quests' };
  return { ok: true };
}

export function accept(s: QuestState, def: QuestDef): QuestState {
  if (isActive(s, def.id) || isCompleted(s, def.id)) return s;
  return { ...s, active: [...s.active, { id: def.id, progress: def.steps.map(() => 0) }] };
}

function bump(s: QuestState, lookup: QuestLookup, match: (step: QuestStep) => boolean, amount = 1): { state: QuestState; changed: { questId: string; stepIndex: number }[] } {
  const changed: { questId: string; stepIndex: number }[] = [];
  const active = s.active.map((q) => {
    const def = lookup(q.id);
    let progress = q.progress;
    def.steps.forEach((step, i) => {
      if (!match(step)) return;
      const target = stepTarget(step);
      if (progress[i] >= target) return;
      progress = progress.map((p, j) => (j === i ? Math.min(target, p + amount) : p));
      changed.push({ questId: q.id, stepIndex: i });
    });
    return progress === q.progress ? q : { ...q, progress };
  });
  return { state: changed.length ? { ...s, active } : s, changed };
}

export function onKill(s: QuestState, lookup: QuestLookup, monster: MonsterDef) {
  return bump(s, lookup, (st) => st.kind === 'kill' && (st.monsterId ? st.monsterId === monster.id : true) && (st.faction ? st.faction === monster.faction : true));
}

/** Collect steps track the *held* quantity, so pass the current inventory count. */
export function syncCollect(s: QuestState, lookup: QuestLookup, itemId: string, held: number): { state: QuestState; changed: { questId: string; stepIndex: number }[] } {
  const changed: { questId: string; stepIndex: number }[] = [];
  const active = s.active.map((q) => {
    const def = lookup(q.id);
    let progress = q.progress;
    def.steps.forEach((step, i) => {
      if (step.kind !== 'collect' || step.itemId !== itemId) return;
      const next = Math.min(step.count, held);
      if (next === progress[i]) return;
      progress = progress.map((p, j) => (j === i ? next : p));
      changed.push({ questId: q.id, stepIndex: i });
    });
    return progress === q.progress ? q : { ...q, progress };
  });
  return { state: changed.length ? { ...s, active } : s, changed };
}

export function onTalk(s: QuestState, lookup: QuestLookup, npcId: string) {
  return bump(s, lookup, (st) => st.kind === 'talk' && st.npcId === npcId);
}

export function onReach(s: QuestState, lookup: QuestLookup, mapId: string) {
  return bump(s, lookup, (st) => st.kind === 'reach' && st.mapId === mapId);
}

export function isReadyToComplete(s: QuestState, def: QuestDef): boolean {
  const q = s.active.find((a) => a.id === def.id);
  if (!q) return false;
  return def.steps.every((step, i) => q.progress[i] >= stepTarget(step));
}

/** Turns the quest in. Caller applies rewards/consumes (and, for dailies, sets the day flag). */
export function complete(s: QuestState, def: QuestDef): QuestState {
  if (!isReadyToComplete(s, def)) return s;
  const active = s.active.filter((a) => a.id !== def.id);
  return def.daily ? { ...s, active } : { active, completed: [...s.completed, def.id] };
}

export function abandon(s: QuestState, id: string): QuestState {
  return { ...s, active: s.active.filter((a) => a.id !== id) };
}

/** "3 / 10" style per-step summary. */
export function progressText(s: QuestState, def: QuestDef): string[] {
  const q = s.active.find((a) => a.id === def.id);
  return def.steps.map((step, i) => {
    const cur = q?.progress[i] ?? 0;
    const target = stepTarget(step);
    return target === 1 ? `${step.label} ${cur >= 1 ? '✓' : '…'}` : `${step.label} ${cur} / ${target}`;
  });
}
