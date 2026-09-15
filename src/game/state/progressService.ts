import { ACHIEVEMENTS, CAMPAIGNS, registry } from '@data/registry';
import type { MonsterDef } from '@data/schema/monster';
import type { AchievementDef } from '@data/schema/progress';
import { newlyUnlocked, unlock, type ProgressCtx } from '@core/progress/achievements';
import { chapterStatus, claimChapter, type CampaignCtx } from '@core/progress/campaign';
import { recordAssault, recordDeath, recordEnhance, recordKill, recordQuest, recordWon, type PlayerStats } from '@core/world/stats';
import { addItem } from '@core/inventory/inventory';
import { applyXp } from '@core/world/xp';
import { gameState } from './GameState';
import type { ActionResult } from './actions';

/**
 * Lifetime progress: stats counters → achievements (auto-unlock with rewards) and campaign
 * chapters (claimed by hand). Every recorder ends in `check()` so unlocks fire immediately.
 */
export const progressService = {
  ctx(): ProgressCtx {
    return { stats: gameState.stats, level: gameState.character.level, flags: gameState.flags };
  },

  campaignCtx(): CampaignCtx {
    return { quests: gameState.quests, flags: gameState.flags, stats: gameState.stats, level: gameState.character.level, achievements: gameState.achievements.unlocked };
  },

  private_set(stats: PlayerStats): void {
    gameState.setStats(stats);
    this.check();
  },

  recordKill(m: MonsterDef): void {
    this.private_set(recordKill(gameState.stats, m));
  },

  recordAssault(assaultId: string, success: boolean): void {
    this.private_set(recordAssault(gameState.stats, assaultId, success));
  },

  recordQuest(): void {
    this.private_set(recordQuest(gameState.stats));
  },

  recordDeath(): void {
    this.private_set(recordDeath(gameState.stats));
  },

  recordWon(amount: number): void {
    if (amount <= 0) return;
    this.private_set(recordWon(gameState.stats, amount));
  },

  recordEnhance(level: number): void {
    this.private_set(recordEnhance(gameState.stats, level));
  },

  /** Unlocks every achievement whose condition is met; pays its reward and announces it. */
  check(): AchievementDef[] {
    const fresh = newlyUnlocked(ACHIEVEMENTS, gameState.achievements, this.ctx());
    if (!fresh.length) return fresh;
    let ach = gameState.achievements;
    let won = 0;
    let xp = 0;
    for (const d of fresh) {
      ach = unlock(ach, d);
      won += d.reward.won ?? 0;
      xp += d.reward.xp ?? 0;
      gameState.message(`★ 업적 달성: ${d.name}${d.reward.title ? ` — 칭호 [${d.reward.title}]` : ''}`, 'good');
    }
    gameState.setAchievements(ach);
    if (won || xp) {
      const r = applyXp({ ...gameState.character, won: gameState.character.won + won }, xp);
      gameState.setCharacter(r.character);
      if (r.levelUps.length) {
        const d = gameState.derived();
        gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
      }
    }
    // rewards may satisfy further achievements (level / ₩) — one more pass is enough in practice
    const more = newlyUnlocked(ACHIEVEMENTS, gameState.achievements, this.ctx());
    if (more.length) this.check();
    return fresh;
  },

  /** Claim a campaign chapter's reward once its requirements are met (chapters go in order). */
  claimCampaign(campaignId: string, chapterId: string): ActionResult {
    const def = registry.campaign(campaignId);
    const index = def.chapters.findIndex((c) => c.id === chapterId);
    if (index < 0) return this.fail('알 수 없는 챕터입니다.');
    const r = claimChapter(def, index, this.campaignCtx());
    if (!r.ok) {
      const why = { claimed: '이미 수령한 보상입니다.', locked: '이전 챕터를 먼저 완료하세요.', inProgress: '아직 조건을 달성하지 않았습니다.', ready: '' }[r.reason];
      return this.fail(why);
    }
    const ch = def.chapters[index];
    let inv = gameState.inventory;
    for (const it of ch.rewards.items ?? []) inv = addItem(inv, registry.item(it.itemId), it.qty);
    gameState.setInventory(inv);
    const xr = applyXp({ ...gameState.character, won: gameState.character.won + ch.rewards.won }, ch.rewards.xp);
    gameState.setCharacter(xr.character);
    if (xr.levelUps.length) {
      const d = gameState.derived();
      gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
      gameState.message(`레벨 업! Lv.${xr.character.level}`, 'good');
    }
    gameState.flags = r.flags;
    gameState.events.emit('flags', gameState.flags);
    const items = (ch.rewards.items ?? []).map((i) => `${registry.item(i.itemId).name} ×${i.qty}`).join(' · ');
    gameState.message(`[캠페인] ${ch.title} 보상 — ₩${ch.rewards.won.toLocaleString('ko-KR')} · ${ch.rewards.xp} XP${items ? ` · ${items}` : ''}`, 'good');
    if (r.completed) gameState.message(`캠페인 완주: ${def.name}!`, 'good');
    this.private_set(recordWon(gameState.stats, ch.rewards.won));
    return { ok: true };
  },

  /** Number of chapters whose reward is waiting (for the HUD hint). */
  readyChapters(): number {
    const ctx = this.campaignCtx();
    let n = 0;
    for (const c of CAMPAIGNS) c.chapters.forEach((_, i) => chapterStatus(c, i, ctx) === 'ready' && n++);
    return n;
  },

  fail(message: string): ActionResult {
    gameState.message(message, 'bad');
    return { ok: false, message };
  },
};
