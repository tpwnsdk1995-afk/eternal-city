import type { CampaignChapter, CampaignDef } from '@data/schema/progress';
import type { QuestState } from '../quest/questState';
import { assaultClears, type PlayerStats } from '../world/stats';

export interface CampaignCtx {
  quests: QuestState;
  flags: Record<string, boolean | number>;
  stats: PlayerStats;
  level: number;
  achievements: readonly string[];
}

export type ChapterStatus = 'claimed' | 'ready' | 'inProgress' | 'locked';

export const chapterFlag = (campaignId: string, chapterId: string): string => `campaign:${campaignId}:${chapterId}`;

export interface RequirementLine {
  text: string;
  done: boolean;
  cur: number;
  target: number;
}

/** Human-readable requirement rows with progress; names are resolved by the caller-supplied lookups. */
export function requirementLines(
  ch: CampaignChapter,
  ctx: CampaignCtx,
  names: { quest: (id: string) => string; assault: (id: string) => string; monster: (id: string) => string; achievement: (id: string) => string; flag: (id: string) => string },
): RequirementLine[] {
  const R = ch.requires;
  const out: RequirementLine[] = [];
  for (const q of R.quests ?? []) {
    const done = ctx.quests.completed.includes(q);
    out.push({ text: `퀘스트 완료: ${names.quest(q)}`, done, cur: done ? 1 : 0, target: 1 });
  }
  for (const f of R.flags ?? []) {
    const done = !!ctx.flags[f];
    out.push({ text: names.flag(f), done, cur: done ? 1 : 0, target: 1 });
  }
  for (const a of R.assaultClears ?? []) {
    const cur = assaultClears(ctx.stats, a.assaultId);
    out.push({ text: `어설트 클리어: ${names.assault(a.assaultId)}`, done: cur >= a.count, cur: Math.min(cur, a.count), target: a.count });
  }
  for (const k of R.kills ?? []) {
    const cur = ctx.stats.killsByMonster[k.monsterId] ?? 0;
    out.push({ text: `${names.monster(k.monsterId)} 처치`, done: cur >= k.count, cur: Math.min(cur, k.count), target: k.count });
  }
  if (R.level) out.push({ text: `레벨 ${R.level} 달성`, done: ctx.level >= R.level, cur: Math.min(ctx.level, R.level), target: R.level });
  for (const a of R.achievements ?? []) {
    const done = ctx.achievements.includes(a);
    out.push({ text: `업적: ${names.achievement(a)}`, done, cur: done ? 1 : 0, target: 1 });
  }
  return out;
}

export function requirementsMet(ch: CampaignChapter, ctx: CampaignCtx): boolean {
  const R = ch.requires;
  if (R.quests?.some((q) => !ctx.quests.completed.includes(q))) return false;
  if (R.flags?.some((f) => !ctx.flags[f])) return false;
  if (R.assaultClears?.some((a) => assaultClears(ctx.stats, a.assaultId) < a.count)) return false;
  if (R.kills?.some((k) => (ctx.stats.killsByMonster[k.monsterId] ?? 0) < k.count)) return false;
  if (R.level && ctx.level < R.level) return false;
  if (R.achievements?.some((a) => !ctx.achievements.includes(a))) return false;
  return true;
}

/** Chapters unlock in order: a chapter is claimable only once the previous one was claimed. */
export function chapterStatus(def: CampaignDef, index: number, ctx: CampaignCtx): ChapterStatus {
  const ch = def.chapters[index];
  if (ctx.flags[chapterFlag(def.id, ch.id)]) return 'claimed';
  if (index > 0 && !ctx.flags[chapterFlag(def.id, def.chapters[index - 1].id)]) return 'locked';
  return requirementsMet(ch, ctx) ? 'ready' : 'inProgress';
}

export function claimedCount(def: CampaignDef, flags: Record<string, boolean | number>): number {
  return def.chapters.filter((ch) => !!flags[chapterFlag(def.id, ch.id)]).length;
}

export type ClaimResult = { ok: true; flags: Record<string, boolean | number>; completed: boolean } | { ok: false; reason: ChapterStatus };

/** Marks a chapter claimed (the caller hands out rewards). Sets the final flag when the last chapter goes. */
export function claimChapter(def: CampaignDef, index: number, ctx: CampaignCtx): ClaimResult {
  const status = chapterStatus(def, index, ctx);
  if (status !== 'ready') return { ok: false, reason: status };
  const ch = def.chapters[index];
  const flags = { ...ctx.flags, [chapterFlag(def.id, ch.id)]: true };
  for (const f of ch.rewards.flags ?? []) flags[f] = true;
  const completed = def.chapters.every((c) => !!flags[chapterFlag(def.id, c.id)]);
  if (completed) flags[def.finalFlag] = true;
  return { ok: true, flags, completed };
}
