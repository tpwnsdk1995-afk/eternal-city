import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, CAMPAIGNS, registry } from '@data/registry';
import { emptyStats, recordAssault, recordAssaultBest, recordEnhance, recordKill, recordWon, totalAssaultClears } from '@core/world/stats';
import { condProgress, emptyAchievements, newlyUnlocked, unlock } from '@core/progress/achievements';
import { chapterFlag, chapterStatus, claimChapter, claimedCount, requirementsMet } from '@core/progress/campaign';
import { accept, canAccept, complete, dailyFlag, dayKey, doneToday, emptyQuestState, onKill } from '@core/quest/questState';

const zombie = registry.monster('zombie_casual_f');
const ogurin = registry.monster('ogurin');
const recon = registry.monster('wito_recon');

describe('stats', () => {
  it('counts kills by monster/faction/boss and assault clears (고급 counts toward the base mission)', () => {
    let s = emptyStats();
    s = recordKill(s, zombie);
    s = recordKill(s, zombie);
    s = recordKill(s, ogurin);
    s = recordKill(s, recon);
    expect(s.kills).toBe(4);
    expect(s.bossKills).toBe(1);
    expect(s.killsByMonster.zombie_casual_f).toBe(2);
    expect(s.killsByFaction.zombie).toBe(2);
    expect(s.killsByFaction.WITO).toBe(1);
    s = recordAssault(s, 'assault-a', true);
    s = recordAssault(s, 'assault-a-adv', true);
    s = recordAssault(s, 'assault-b', false);
    expect(s.assaultClears['assault-a']).toBe(2);
    expect(s.assaultClears['assault-a-adv']).toBe(1);
    expect(s.assaultFails).toBe(1);
    expect(totalAssaultClears(s)).toBe(2);
    s = recordEnhance(recordEnhance(s, 5), 3);
    expect(s.maxEnhance).toBe(5);
    expect(recordWon(s, -5).wonEarned).toBe(0);
    expect(recordWon(s, 500).wonEarned).toBe(500);
  });
});

describe('achievements', () => {
  it('unlocks in definition order once conditions are met, never twice, and carries a title', () => {
    let stats = emptyStats();
    let state = emptyAchievements();
    const ctx = () => ({ stats, level: 1, flags: {} });
    expect(newlyUnlocked(ACHIEVEMENTS, state, ctx())).toEqual([]);
    stats = recordKill(stats, zombie);
    let fresh = newlyUnlocked(ACHIEVEMENTS, state, ctx());
    expect(fresh.map((a) => a.id)).toEqual(['ach_first_blood']);
    for (const d of fresh) state = unlock(state, d);
    expect(newlyUnlocked(ACHIEVEMENTS, state, ctx())).toEqual([]);
    for (let i = 0; i < 99; i++) stats = recordKill(stats, zombie);
    fresh = newlyUnlocked(ACHIEVEMENTS, state, ctx());
    expect(fresh.map((a) => a.id)).toEqual(['ach_zombie_100']);
    state = unlock(state, fresh[0]);
    expect(state.title).toBe('좀비 사냥꾼');
    expect(condProgress(registry.achievement('ach_zombie_1000').cond, ctx())).toEqual({ cur: 100, target: 1000 });
    expect(condProgress(registry.achievement('ach_permit').cond, { ...ctx(), flags: { parallelPermit: true } })).toEqual({ cur: 1, target: 1 });
    expect(condProgress(registry.achievement('ach_level_10').cond, { ...ctx(), level: 12 })).toEqual({ cur: 12, target: 10 });
  });

  it('assaultGrade counts distinct assaults whose best run is that grade', () => {
    const run = (score: number, grade: string) => ({ score, grade, timeSec: 60, kills: 10, at: 0 });
    let stats = emptyStats();
    const ctx = () => ({ stats, level: 1, flags: {} });
    stats = recordAssaultBest(stats, 'assault-a', run(50, 'A')).stats;
    expect(condProgress(registry.achievement('ach_assault_s').cond, ctx())).toEqual({ cur: 0, target: 1 });
    stats = recordAssaultBest(stats, 'assault-a', run(100, 'S')).stats;
    stats = recordAssaultBest(stats, 'assault-b', run(100, 'S')).stats;
    expect(condProgress(registry.achievement('ach_assault_s_6').cond, ctx())).toEqual({ cur: 2, target: 6 });
    const fresh = newlyUnlocked(ACHIEVEMENTS, emptyAchievements(), ctx()).map((a) => a.id);
    expect(fresh).toContain('ach_assault_s');
    expect(fresh).not.toContain('ach_assault_s_6');
  });
});

describe('campaign 2002', () => {
  const def = registry.campaign('2002');
  const base = () => ({ quests: emptyQuestState(), flags: {} as Record<string, boolean | number>, stats: emptyStats(), level: 1, achievements: [] as string[] });

  it('chapters unlock in order and are claimable only when their requirements are met', () => {
    const ctx = base();
    expect(chapterStatus(def, 0, ctx)).toBe('inProgress');
    expect(chapterStatus(def, 1, ctx)).toBe('locked');
    expect(claimChapter(def, 0, ctx)).toEqual({ ok: false, reason: 'inProgress' });
    ctx.quests = { active: [], completed: ['q_junggok_cleanup'] };
    expect(chapterStatus(def, 0, ctx)).toBe('ready');
    const r = claimChapter(def, 0, ctx);
    expect(r.ok && r.flags[chapterFlag('2002', 'ch1')]).toBe(true);
    if (!r.ok) return;
    ctx.flags = r.flags;
    expect(chapterStatus(def, 0, ctx)).toBe('claimed');
    expect(claimChapter(def, 0, ctx)).toEqual({ ok: false, reason: 'claimed' });
    expect(chapterStatus(def, 1, ctx)).toBe('inProgress');
    expect(claimedCount(def, ctx.flags)).toBe(1);
  });

  it('assault / kill / level requirements read the stats, and the final claim sets the campaign flag', () => {
    const ctx = base();
    ctx.quests = { active: [], completed: ['q_junggok_cleanup', 'q_wito_documents'] };
    ctx.flags = { parallelPermit: true };
    ctx.level = 30;
    let stats = emptyStats();
    stats = recordAssault(stats, 'assault-a-adv', true); // 고급 counts
    stats = recordKill(stats, ogurin);
    stats = recordAssault(stats, 'assault-b', true);
    stats = recordAssault(stats, 'assault-c', true);
    ctx.stats = stats;
    for (let i = 0; i < def.chapters.length; i++) {
      expect(requirementsMet(def.chapters[i], ctx), def.chapters[i].id).toBe(true);
      const r = claimChapter(def, i, ctx);
      expect(r.ok).toBe(true);
      if (r.ok) {
        ctx.flags = r.flags;
        expect(r.completed).toBe(i === def.chapters.length - 1);
      }
    }
    expect(ctx.flags['campaign:2002:complete']).toBe(true);
    expect(CAMPAIGNS.length).toBeGreaterThan(0);
  });
});

describe('메인스트림 (daily quests)', () => {
  const ms = registry.quest('ms_2002_normal');
  const cl = registry.quest('ms_2002_cl');

  it('can be accepted once per day: completion sets the day flag instead of the completed list', () => {
    const today = dayKey();
    let s = emptyQuestState();
    expect(canAccept(s, ms, { level: 1, flags: {}, day: today })).toEqual({ ok: true });
    s = accept(s, ms);
    for (let i = 0; i < 25; i++) s = onKill(s, registry.quest, zombie).state;
    for (let i = 0; i < 5; i++) s = onKill(s, registry.quest, recon).state;
    s = complete(s, ms);
    expect(s.completed).toEqual([]);
    expect(s.active).toEqual([]);
    const flags = { [dailyFlag(ms.id)]: today };
    expect(doneToday(ms, flags, today)).toBe(true);
    expect(canAccept(s, ms, { level: 1, flags, day: today })).toEqual({ ok: false, reason: 'daily' });
    expect(canAccept(s, ms, { level: 1, flags, day: today + 1 })).toEqual({ ok: true });
  });

  it('CL 메인스트림 needs the permit and Lv.15 and rolls CL gear', () => {
    expect(canAccept(emptyQuestState(), cl, { level: 20, flags: {} })).toEqual({ ok: false, reason: 'flags' });
    expect(canAccept(emptyQuestState(), cl, { level: 10, flags: { parallelPermit: true } })).toEqual({ ok: false, reason: 'level' });
    expect(canAccept(emptyQuestState(), cl, { level: 15, flags: { parallelPermit: true } })).toEqual({ ok: true });
    expect(cl.rewards.itemChances?.some((i) => registry.armor(i.itemId).cl)).toBe(true);
  });
});
