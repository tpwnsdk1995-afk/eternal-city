import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { accept, canAccept, complete, emptyQuestState, isReadyToComplete, onKill, onReach, onTalk, progressText, syncCollect } from '@core/quest/questState';

const q1 = registry.quest('q_junggok_cleanup');
const q2 = registry.quest('q_wito_documents');
const lookup = registry.quest;
const ctx = { level: 1, flags: {} };

describe('questState', () => {
  it('accepts, counts faction kills, and completes', () => {
    let s = emptyQuestState();
    expect(canAccept(s, q1, ctx)).toEqual({ ok: true });
    s = accept(s, q1);
    expect(canAccept(s, q1, ctx)).toEqual({ ok: false, reason: 'active' });
    for (let i = 0; i < 10; i++) s = onKill(s, lookup, registry.monster(i % 2 ? 'zombie_casual_f' : 'zombie_stripe')).state;
    // WITO kills do not count
    const before = s;
    s = onKill(s, lookup, registry.monster('wito_recon')).state;
    expect(s).toBe(before);
    expect(progressText(s, q1)).toEqual(['중곡동 좀비 처치 10 / 10']);
    expect(isReadyToComplete(s, q1)).toBe(true);
    s = complete(s, q1);
    expect(s.completed).toEqual(['q_junggok_cleanup']);
    expect(s.active).toEqual([]);
    expect(canAccept(s, q1, ctx)).toEqual({ ok: false, reason: 'completed' });
  });

  it('does not overshoot kill counts and ignores kills before acceptance', () => {
    let s = onKill(emptyQuestState(), lookup, registry.monster('zombie_casual_f')).state;
    expect(s.active).toEqual([]);
    s = accept(s, q1);
    for (let i = 0; i < 25; i++) s = onKill(s, lookup, registry.monster('zombie_casual_f')).state;
    expect(s.active[0].progress).toEqual([10]);
  });

  it('gates Q2 on Q1 completion and level, then tracks reach + held item', () => {
    let s = emptyQuestState();
    expect(canAccept(s, q2, { level: 5, flags: {} })).toEqual({ ok: false, reason: 'quests' });
    s = complete(accept(s, q1), { ...q1, steps: [] });
    expect(canAccept(s, q2, { level: 1, flags: {} })).toEqual({ ok: false, reason: 'level' });
    expect(canAccept(s, q2, { level: 3, flags: {} })).toEqual({ ok: true });
    s = accept(s, q2);
    expect(isReadyToComplete(s, q2)).toBe(false);
    s = onReach(s, lookup, 'yonggok-middle-school').state;
    s = syncCollect(s, lookup, 'wito_dispatch_doc', 1).state;
    expect(progressText(s, q2)).toEqual(['용곡중학교 도착 ✓', '위토군 배치문서 회수 ✓']);
    expect(isReadyToComplete(s, q2)).toBe(true);
    // dropping the document un-completes the collect step
    s = syncCollect(s, lookup, 'wito_dispatch_doc', 0).state;
    expect(isReadyToComplete(s, q2)).toBe(false);
    expect(onTalk(s, lookup, 'npc_kimhun').changed).toEqual([]);
  });

  it('content is consistent', () => {
    for (const q of [q1, q2]) {
      expect(() => registry.npc(q.giver)).not.toThrow();
      for (const it of q.rewards.items ?? []) expect(() => registry.item(it.itemId)).not.toThrow();
    }
    expect(registry.item('wito_dispatch_doc').kind).toBe('misc');
    expect(registry.monster('wito_soldier').drops.some((d) => d.itemId === 'wito_dispatch_doc')).toBe(true);
  });
});
