import type Phaser from 'phaser';
import { ACHIEVEMENTS, CAMPAIGNS, registry } from '@data/registry';
import { progressText } from '@core/quest/questState';
import { chapterStatus, claimedCount, requirementLines } from '@core/progress/campaign';
import { condProgress } from '@core/progress/achievements';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { progressService } from '../state/progressService';
import { Window } from './Window';
import { theme } from './theme';

export type QuestTab = 'quests' | 'campaign' | 'achievements';

const TABS: { key: QuestTab; label: string }[] = [
  { key: 'quests', label: '퀘스트' },
  { key: 'campaign', label: '캠페인' },
  { key: 'achievements', label: '업적' },
];

const FLAG_NAMES: Record<string, string> = { parallelPermit: '패러렐 시스템 허가증 보유' };

/** 퀘스트 / 캠페인 / 업적 — one window, three tabs (Q). */
export class QuestWindow extends Window {
  tab: QuestTab = 'quests';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'quest', x, y, 460, 560, '퀘스트 (Q)');
    this.refresh();
  }

  setTab(tab: QuestTab): void {
    this.tab = tab;
    this.refresh();
  }

  refresh(): void {
    this.clearBody();
    // tab strip
    let x = 12;
    const ready = progressService.readyChapters();
    for (const t of TABS) {
      const on = t.key === this.tab;
      const label = t.key === 'campaign' && ready ? `${t.label} (${ready})` : t.label;
      const b = this.button(x, 0, label, () => this.setTab(t.key), on ? '#ffffff' : t.key === 'campaign' && ready ? theme.colors.good : theme.colors.muted, 12);
      if (on) b.setStyle({ backgroundColor: '#3a4048' });
      x += b.width + 6;
    }
    this.content.add(this.scene.add.rectangle(10, 26, this.w - 20, 1, 0xc9a227, 0.35).setOrigin(0, 0));
    switch (this.tab) {
      case 'quests':
        return this.renderQuests(36);
      case 'campaign':
        return this.renderCampaign(36);
      case 'achievements':
        return this.renderAchievements(36);
    }
  }

  // ---------------------------------------------------------------- 퀘스트

  private renderQuests(y0: number): void {
    const s = gameState.quests;
    let y = y0;
    this.label(14, y, `진행 중 (${s.active.length})`, theme.colors.brass, 13, { fontStyle: 'bold' });
    y += 22;
    if (!s.active.length) {
      this.label(24, y, '진행 중인 퀘스트가 없습니다. 중곡동 경찰서 앞의 김훈 소대장, 구청 지하의 오민석 과장(메인스트림)을 찾아가 보세요.', theme.colors.muted, 12, { wordWrap: { width: this.w - 48 } });
      y += 52;
    }
    for (const q of s.active) {
      const def = registry.quest(q.id);
      this.content.add(this.scene.add.rectangle(10, y - 4, this.w - 20, 24 + def.steps.length * 18 + 26, 0xffffff, 0.04).setOrigin(0, 0));
      this.label(18, y, `${def.daily ? (def.cl ? '[CL 메인스트림] ' : '[메인스트림] ') : ''}${def.name}`, def.cl ? '#e0a0ff' : '#ffffff', 14, { fontStyle: 'bold' });
      this.label(this.w - 18, y + 1, registry.npc(def.giver).name, theme.colors.muted, 11).setOrigin(1, 0);
      y += 20;
      for (const line of progressText(s, def)) {
        this.label(26, y, `· ${line}`, line.endsWith('✓') || /(\d+) \/ \1$/.test(line) ? theme.colors.good : theme.colors.text, 12);
        y += 18;
      }
      this.label(26, y, def.text.progress, theme.colors.muted, 11, { wordWrap: { width: this.w - 60 } });
      y += 34;
    }
    y += 6;
    this.label(14, y, `완료 (${s.completed.length})`, theme.colors.brass, 13, { fontStyle: 'bold' });
    y += 22;
    for (const id of s.completed) {
      this.label(24, y, `✓ ${registry.quest(id).name}`, theme.colors.muted, 12);
      y += 18;
    }
    const dailies = Object.keys(gameState.flags).filter((f) => f.startsWith('daily:'));
    if (dailies.length) {
      this.label(24, y, `오늘 완료한 메인스트림 ${dailies.length}건 — 내일(UTC) 다시 수락할 수 있습니다.`, theme.colors.muted, 11);
      y += 18;
    }
    if (gameState.flags.parallelPermit) this.label(14, this.h - 66, '패러렐 시스템 허가증 보유 — 다른 연도로 이동할 수 있습니다.', theme.colors.good, 11);
  }

  // ---------------------------------------------------------------- 캠페인

  private renderCampaign(y0: number): void {
    const ctx = progressService.campaignCtx();
    const names = {
      quest: (id: string) => registry.quest(id).name,
      assault: (id: string) => registry.assault(id).name,
      monster: (id: string) => registry.monster(id).name,
      achievement: (id: string) => registry.achievement(id).name,
      flag: (id: string) => FLAG_NAMES[id] ?? id,
    };
    let y = y0;
    for (const c of CAMPAIGNS) {
      const done = claimedCount(c, gameState.flags);
      this.label(14, y, c.name, '#ffffff', 15, { fontStyle: 'bold' });
      this.label(this.w - 14, y + 2, `${done} / ${c.chapters.length} 챕터`, done === c.chapters.length ? theme.colors.good : theme.colors.muted, 12).setOrigin(1, 0);
      y += 22;
      this.label(14, y, c.desc, theme.colors.muted, 11, { wordWrap: { width: this.w - 28 } });
      y += 34;
      c.chapters.forEach((ch, i) => {
        const status = chapterStatus(c, i, ctx);
        if (status === 'locked' && i > 0 && chapterStatus(c, i - 1, ctx) === 'locked') return; // show one locked chapter ahead
        const lines = requirementLines(ch, ctx, names);
        const h = 24 + lines.length * 16 + (status === 'claimed' ? 4 : 22);
        this.content.add(this.scene.add.rectangle(10, y - 4, this.w - 20, h, 0xffffff, status === 'ready' ? 0.08 : 0.04).setOrigin(0, 0));
        const color = status === 'claimed' ? theme.colors.muted : status === 'ready' ? theme.colors.good : status === 'locked' ? '#4b5563' : '#ffffff';
        this.label(18, y, `${status === 'claimed' ? '✓ ' : ''}${ch.title}`, color, 13, { fontStyle: 'bold' });
        this.label(this.w - 18, y + 1, `₩${ch.rewards.won.toLocaleString('ko-KR')} · ${ch.rewards.xp} XP`, theme.colors.brass, 11).setOrigin(1, 0);
        y += 18;
        if (status !== 'locked') {
          for (const l of lines) {
            this.label(26, y, `· ${l.text}${l.target > 1 ? ` ${l.cur} / ${l.target}` : ''} ${l.done ? '✓' : ''}`, l.done ? theme.colors.good : theme.colors.text, 11);
            y += 16;
          }
        } else {
          this.label(26, y, '이전 챕터를 완료하면 열립니다.', '#4b5563', 11);
          y += 16;
        }
        if (status === 'ready') {
          const b = this.button(0, y, '보상 수령', () => actions.claimCampaign(c.id, ch.id), theme.colors.good, 12);
          b.setX(this.w - 18 - b.width);
          y += 24;
        } else if (status === 'inProgress') {
          this.label(26, y, ch.desc, theme.colors.muted, 10, { wordWrap: { width: this.w - 60 } });
          y += 22;
        }
        y += 10;
      });
      if (gameState.flags[c.finalFlag]) this.label(14, y, '캠페인 완주! 다음 연도의 서울이 기다립니다.', theme.colors.good, 12);
    }
  }

  // ---------------------------------------------------------------- 업적

  private renderAchievements(y0: number): void {
    const ctx = progressService.ctx();
    const unlocked = gameState.achievements.unlocked;
    let y = y0;
    this.label(14, y, `달성 ${unlocked.length} / ${ACHIEVEMENTS.length}${gameState.achievements.title ? `  ·  칭호 [${gameState.achievements.title}]` : ''}`, theme.colors.brass, 13, { fontStyle: 'bold' });
    y += 24;
    const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(unlocked.includes(b.id)) - Number(unlocked.includes(a.id)));
    const rowH = 30;
    const maxRows = Math.floor((this.h - 40 - y - 20) / rowH);
    sorted.slice(0, maxRows).forEach((a) => {
      const on = unlocked.includes(a.id);
      const p = condProgress(a.cond, ctx);
      const hidden = a.hidden && !on;
      this.content.add(this.scene.add.rectangle(10, y - 3, this.w - 20, rowH - 4, 0xffffff, on ? 0.07 : 0.03).setOrigin(0, 0));
      this.label(18, y, `${on ? '★' : '☆'} ${hidden ? '???' : a.name}`, on ? '#ffd166' : theme.colors.text, 12, { fontStyle: 'bold' });
      this.label(150, y + 1, hidden ? '숨겨진 업적' : a.desc, theme.colors.muted, 10);
      const right = on ? (a.reward.title ? `[${a.reward.title}]` : '달성') : p.target > 1 ? `${Math.min(p.cur, p.target).toLocaleString('ko-KR')} / ${p.target.toLocaleString('ko-KR')}` : '—';
      this.label(this.w - 18, y + 1, right, on ? theme.colors.good : theme.colors.muted, 10).setOrigin(1, 0);
      y += rowH;
    });
    if (sorted.length > maxRows) this.label(14, y, `… 외 ${sorted.length - maxRows}개`, theme.colors.muted, 11);
  }
}
