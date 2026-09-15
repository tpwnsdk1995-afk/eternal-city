import type Phaser from 'phaser';
import type { AssaultResult } from '../state/GameState';
import { Window } from './Window';
import { theme } from './theme';

/** 어설트 결과 screen. */
export class ResultWindow extends Window {
  private result: AssaultResult | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'result', x, y, 460, 300, '어설트 결과');
  }

  show(r: AssaultResult): void {
    this.result = r;
    this.refresh();
  }

  refresh(): void {
    this.clearBody();
    const r = this.result;
    if (!r) return;
    const m = Math.floor(r.timeSec / 60);
    const s = r.timeSec % 60;
    this.label(this.w / 2, 6, r.success ? '작전 성공' : '작전 실패', r.success ? theme.colors.good : theme.colors.bad, 26, { fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.label(this.w / 2, 42, r.name, theme.colors.muted, 13).setOrigin(0.5, 0);
    if (!r.success) this.label(this.w / 2, 62, r.reason === 'timeout' ? '제한 시간을 초과했습니다.' : '작전 중 사망했습니다.', theme.colors.muted, 12).setOrigin(0.5, 0);

    let y = 92;
    const row = (k: string, v: string, color = theme.colors.text) => {
      this.label(24, y, k, theme.colors.muted, 13);
      this.label(this.w - 24, y, v, color, 13).setOrigin(1, 0);
      y += 24;
    };
    row('처치', `${r.kills}`);
    row('소요 시간', `${m}분 ${s}초`);
    row('₩', `${r.won >= 0 ? '+' : '−'}₩${Math.abs(r.won).toLocaleString('ko-KR')}`, r.won >= 0 ? theme.colors.brass : theme.colors.bad);
    if (r.success) row('경험치', `+${r.xp} XP`, theme.colors.good);
    for (const it of r.items) row('보상 아이템', `${it.name} ×${it.qty}`, theme.colors.good);

    this.button(this.w / 2 - 30, this.h - 78, '확인', () => this.emit('close'), theme.colors.brass, 14);
  }
}
