import type Phaser from 'phaser';
import { gameState } from '../state/GameState';
import { saveService } from '../state/SaveService';
import { cloudSave } from '../state/CloudSave';
import { schemeHints, touchHints } from '../systems/input/InputMapper';
import { isTouchDevice, touchControlsEnabled } from '../systems/input/touchState';
import { Window } from './Window';
import { theme } from './theme';

/** Esc menu: control scheme, FPS overlay, manual save, back to title. */
export class MenuWindow extends Window {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'menu', x, y, 440, 666, '메뉴 (Esc)');
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
    const touchOn = touchControlsEnabled(s.touchControls);
    const touchLabel = { auto: `자동 (${isTouchDevice() ? '터치 기기 감지됨 → 켬' : '터치 기기 아님 → 끔'})`, on: '항상 켬', off: '항상 끔' }[s.touchControls];
    const nextTouch = { auto: 'on', on: 'off', off: 'auto' } as const;
    this.button(20, y, `터치 조작: ${touchLabel}`, () => gameState.setSettings({ touchControls: nextTouch[s.touchControls] }), touchOn ? theme.colors.good : theme.colors.brass, 13);
    y += 30;
    if (touchOn) {
      for (const h of touchHints()) {
        this.label(28, y, `· ${h}`, theme.colors.text, 12);
        y += 18;
      }
      y += 6;
    }
    this.button(20, y, `FPS 표시: ${s.showFps ? '켬' : '끔'}`, () => gameState.setSettings({ showFps: !s.showFps }), theme.colors.brass, 13);
    y += 34;
    // sound
    const vol = Math.round(s.soundVolume * 100);
    this.button(20, y, `효과음: ${s.sfxOn ? '켬' : '끔'}`, () => gameState.setSettings({ sfxOn: !s.sfxOn }), s.sfxOn ? theme.colors.good : theme.colors.muted, 13);
    this.button(120, y, `환경음: ${s.ambientOn ? '켬' : '끔'}`, () => gameState.setSettings({ ambientOn: !s.ambientOn }), s.ambientOn ? theme.colors.good : theme.colors.muted, 13);
    this.button(222, y, '−', () => gameState.setSettings({ soundVolume: Math.max(0, Math.round((s.soundVolume - 0.1) * 10) / 10) }), theme.colors.brass, 13);
    this.label(252, y + 3, `볼륨 ${vol}%`, theme.colors.text, 12);
    this.button(330, y, '+', () => gameState.setSettings({ soundVolume: Math.min(1, Math.round((s.soundVolume + 0.1) * 10) / 10) }), theme.colors.brass, 13);
    this.button(362, y, `비: ${s.weatherOn ? '켬' : '끔'}`, () => gameState.setSettings({ weatherOn: !s.weatherOn }), s.weatherOn ? theme.colors.good : theme.colors.muted, 13);
    y += 32;
    const bvol = Math.round(s.bgmVolume * 100);
    this.button(20, y, `배경음악: ${s.bgmOn ? '켬' : '끔'}`, () => gameState.setSettings({ bgmOn: !s.bgmOn }), s.bgmOn ? theme.colors.good : theme.colors.muted, 13);
    this.button(130, y, '−', () => gameState.setSettings({ bgmVolume: Math.max(0, Math.round((s.bgmVolume - 0.1) * 10) / 10) }), theme.colors.brass, 13);
    this.label(160, y + 3, `BGM ${bvol}%`, theme.colors.text, 12);
    this.button(226, y, '+', () => gameState.setSettings({ bgmVolume: Math.min(1, Math.round((s.bgmVolume + 0.1) * 10) / 10) }), theme.colors.brass, 13);
    this.button(270, y, `글자 크기: ${s.uiScale > 1 ? '크게' : '보통'}`, () => gameState.setSettings({ uiScale: s.uiScale > 1 ? 1 : 1.15 }), theme.colors.brass, 13);
    y += 40;
    this.label(this.w - 20, y + 4, `슬롯 ${saveService.currentSlot}`, theme.colors.muted, 11).setOrigin(1, 0);
    this.button(20, y, '지금 저장', () => void saveService.save().then(() => gameState.message('저장했습니다.', 'good')), theme.colors.good, 13);
    this.button(130, y, '타이틀로 (저장 후)', () => gameState.events.emit('goTitle', undefined), theme.colors.bad, 13);
    y += 40;
    this.label(20, y, '자동 저장: 맵 이동 · 레벨 업 · 장비/스킬 변경 · 60초마다 · 창 닫을 때', '#6b7280', 11);
    y += 16;
    this.label(20, y, cloudSave.describe(), cloudSave.state === 'error' ? theme.colors.bad : cloudSave.state === 'offline' ? '#6b7280' : theme.colors.good, 11);
    y += 24;
    this.label(20, y, '다른 기기로 옮기기 — 세이브 파일', theme.colors.muted, 12);
    y += 20;
    this.button(20, y, '내보내기 (파일)', () => void saveService.exportToFile().then((n) => gameState.message(n ? `세이브 파일을 내려받았습니다: ${n}` : '내보낼 세이브가 없습니다.', n ? 'good' : 'bad')), '#9be7ff', 13);
    this.button(150, y, '클립보드 복사', () => void saveService.exportToClipboard().then((ok) => gameState.message(ok ? '세이브를 클립보드에 복사했습니다. 다른 기기에서 "클립보드 붙여넣기"로 불러오세요.' : '클립보드 복사에 실패했습니다.', ok ? 'good' : 'bad')), '#9be7ff', 13);
    y += 32;
    this.button(20, y, '불러오기 (파일)', () => void saveService.importFromPicker().then((r) => this.afterImport(r)), '#ffd166', 13);
    this.button(150, y, '클립보드 붙여넣기', () => void saveService.importFromClipboard().then((r) => this.afterImport(r ?? { ok: false, reason: 'parse' })), '#ffd166', 13);
    y += 30;
    this.label(20, y, '불러오면 현재 캐릭터를 덮어쓰고 그 세이브의 위치로 이동합니다.', '#6b7280', 11);
  }

  /** Imported into the slot → swap the live character and travel to where it was saved. */
  private afterImport(r: Awaited<ReturnType<typeof saveService.importFromPicker>>): void {
    if (!r) return; // picker cancelled
    if (!r.ok) {
      gameState.message(saveService.describeImportFail(r), 'bad');
      return;
    }
    void saveService.load().then((save) => {
      if (!save) return gameState.message('불러온 세이브를 적용하지 못했습니다.', 'bad');
      gameState.message(`${save.character.name} Lv.${save.character.level} 세이브를 불러왔습니다.`, 'good');
      gameState.events.emit('travel', { mapId: save.location.mapId, spawn: save.location.spawn });
    });
  }
}
