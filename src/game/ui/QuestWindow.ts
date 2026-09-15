import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { progressText } from '@core/quest/questState';
import { gameState } from '../state/GameState';
import { Window } from './Window';
import { theme } from './theme';

export class QuestWindow extends Window {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'quest', x, y, 460, 440, '퀘스트 (Q)');
    this.refresh();
  }

  refresh(): void {
    this.clearBody();
    const s = gameState.quests;
    let y = 4;
    this.label(14, y, `진행 중 (${s.active.length})`, theme.colors.brass, 13, { fontStyle: 'bold' });
    y += 22;
    if (!s.active.length) {
      this.label(24, y, '진행 중인 퀘스트가 없습니다. 중곡동 경찰서 앞의 김훈 소대장을 찾아가 보세요.', theme.colors.muted, 12, { wordWrap: { width: this.w - 48 } });
      y += 40;
    }
    for (const q of s.active) {
      const def = registry.quest(q.id);
      this.content.add(this.scene.add.rectangle(10, y - 4, this.w - 20, 24 + def.steps.length * 18 + 26, 0xffffff, 0.04).setOrigin(0, 0));
      this.label(18, y, def.name, '#ffffff', 14, { fontStyle: 'bold' });
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
    if (gameState.flags.parallelPermit) this.label(14, this.h - 66, '패러렐 시스템 허가증 보유 — 다른 연도로 이동할 수 있습니다.', theme.colors.good, 11);
  }
}
