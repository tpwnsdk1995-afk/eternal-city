import type { AchievementCond, AchievementDef } from '@data/schema/progress';
import { assaultClears, totalAssaultClears, type PlayerStats } from '../world/stats';

export interface AchievementState {
  unlocked: string[];
  /** title currently shown next to the name (from an unlocked achievement) */
  title: string | null;
}

export const emptyAchievements = (): AchievementState => ({ unlocked: [], title: null });

export interface ProgressCtx {
  stats: PlayerStats;
  level: number;
  flags: Record<string, boolean | number>;
  rebirth?: number;
}

/** Current value vs target for a condition (target 1 for flags). */
export function condProgress(c: AchievementCond, ctx: ProgressCtx): { cur: number; target: number } {
  const s = ctx.stats;
  switch (c.kind) {
    case 'kills':
      return { cur: s.kills, target: c.count };
    case 'killMonster':
      return { cur: s.killsByMonster[c.monsterId] ?? 0, target: c.count };
    case 'killFaction':
      return { cur: s.killsByFaction[c.faction] ?? 0, target: c.count };
    case 'bossKills':
      return { cur: s.bossKills, target: c.count };
    case 'level':
      return { cur: ctx.level, target: c.level };
    case 'assaultClears':
      return { cur: c.assaultId ? assaultClears(s, c.assaultId) : totalAssaultClears(s), target: c.count };
    case 'assaultGrade':
      return { cur: Object.values(s.assaultBest ?? {}).filter((b) => b.grade === c.grade).length, target: c.count };
    case 'questsCompleted':
      return { cur: s.questsCompleted, target: c.count };
    case 'enhance':
      return { cur: s.maxEnhance, target: c.level };
    case 'wonEarned':
      return { cur: s.wonEarned, target: c.amount };
    case 'deaths':
      return { cur: s.deaths, target: c.count };
    case 'flag':
      return { cur: ctx.flags[c.flag] ? 1 : 0, target: 1 };
    case 'rebirth':
      return { cur: ctx.rebirth ?? 0, target: c.count };
  }
}

export const condMet = (c: AchievementCond, ctx: ProgressCtx): boolean => {
  const p = condProgress(c, ctx);
  return p.cur >= p.target;
};

/** Achievements whose condition is now met and weren't unlocked before, in definition order. */
export function newlyUnlocked(defs: readonly AchievementDef[], state: AchievementState, ctx: ProgressCtx): AchievementDef[] {
  return defs.filter((d) => !state.unlocked.includes(d.id) && condMet(d.cond, ctx));
}

export function unlock(state: AchievementState, def: AchievementDef): AchievementState {
  if (state.unlocked.includes(def.id)) return state;
  return { unlocked: [...state.unlocked, def.id], title: def.reward.title ?? state.title };
}
