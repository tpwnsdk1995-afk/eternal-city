import type Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { saveService } from '../state/SaveService';
import { schemeHints } from '../systems/input/InputMapper';
import { Window } from './Window';
import { theme } from './theme';

/** Esc menu: control scheme, FPS overlay, manual save, back to title. */
export class MenuWindow extends Window {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'menu', x, y, 440, 400, '메뉴 (Esc)');
  }

  refresh(): void {
    this.clearBody();
    const s = gameState.settings;
    let y = 8;
    this.label(20, y, '조작 방식', theme.colors.muted, 12);
    y += 20;
    const scheme = s.controlScheme === 'classic' ? '원작식 — 좌클릭 이동 · 우클릭 공격' : '현대식 — WASD 이동 · 좌클릭 공격';
    this.button(20, y, `◀ ${scheme} ▶`, () => gameState.setSettings({ controlScheme: s.controlScheme === 'classic' ? 'modern' : 'classic' }), '#ffffff', 13);
    y += 34;
    for (const h of schemeHints(s.controlScheme)) {
      this.label(28, y, `· ${h}`, theme.colors.text, 12);
      y += 18;
    }
    y += 10;
    this.button(20, y, `FPS 표시: ${s.showFps ? '켬' : '끔'}`, () => gameState.setSettings({ showFps: !s.showFps }), theme.colors.brass, 13);
    y += 40;
    this.button(20, y, '지금 저장', () => void saveService.save().then(() => gameState.message('저장했습니다.', 'good')), theme.colors.good, 13);
    this.button(130, y, '타이틀로 (저장 후)', () => gameState.events.emit('goTitle', undefined), theme.colors.bad, 13);
    y += 40;
    this.label(20, y, '자동 저장: 맵 이동 · 레벨 업 · 장비/스킬 변경 · 60초마다 · 창 닫을 때', '#6b7280', 11);
  }
}
