import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { YEARS } from '@data/years';
import { canTravel, unlockText } from '@core/world/parallel';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { theme } from './theme';

/** 패러렐 시스템 — pick a year; you arrive at that year's safe-zone hub. */
export class ParallelWindow extends Window {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'parallel', x, y, 560, 470, '패러렐 시스템 — 연도 이동');
    this.refresh();
  }

  refresh(): void {
    this.clearBody();
    const here = registry.map(gameState.currentMapId);
    const permit = !!gameState.flags.parallelPermit;
    this.label(14, 4, `현재 ${here.year}년 · ${here.name}`, '#ffffff', 14, { fontStyle: 'bold' });
    this.label(this.w - 14, 6, permit ? '허가증 보유' : '허가증 없음', permit ? theme.colors.good : theme.colors.bad, 12).setOrigin(1, 0);
    this.label(14, 26, '허가증은 중곡동 경찰서 앞 김훈 소대장의 퀘스트로 발급됩니다. 이동하면 그 연도의 안전지역에 도착합니다.', theme.colors.muted, 11, { wordWrap: { width: this.w - 28 } });

    let y = 64;
    for (const yd of YEARS) {
      const r = canTravel(yd.year, { flags: gameState.flags, level: gameState.character.level, currentYear: here.year });
      const current = yd.year === here.year;
      this.content.add(this.scene.add.rectangle(10, y - 4, this.w - 20, 74, 0xffffff, current ? 0.08 : r.ok ? 0.06 : 0.03).setOrigin(0, 0));
      this.label(18, y, `${yd.year}`, current ? theme.colors.brass : r.ok ? '#ffffff' : theme.colors.muted, 22, { fontStyle: 'bold' });
      this.label(86, y + 2, yd.name, current ? theme.colors.brass : r.ok ? '#ffffff' : theme.colors.muted, 14, { fontStyle: 'bold' });
      this.label(86, y + 22, yd.desc, theme.colors.muted, 11, { wordWrap: { width: this.w - 230 } });
      this.label(86, y + 52, `${unlockText(yd)} · 도착: ${registry.map(yd.hubMapId).name}`, '#6b7280', 10);
      if (current) this.label(this.w - 18, y + 4, '현재 연도', theme.colors.brass, 12).setOrigin(1, 0);
      else if (r.ok) {
        const b = this.button(0, y + 2, `${yd.year}년으로 이동`, () => actions.travelYear(yd.year), '#9be7ff', 13);
        b.setX(this.w - 18 - b.width);
      } else {
        const why = { same: '', permit: '허가증 필요', milestone: '조건 미달', unknown: '' }[r.reason];
        this.label(this.w - 18, y + 4, why, theme.colors.bad, 12).setOrigin(1, 0);
      }
      y += 84;
    }
  }
}
