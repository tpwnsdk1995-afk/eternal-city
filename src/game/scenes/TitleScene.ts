import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, fitCamera } from '../../config/gameConfig';
import { TEX } from '@data/textureKeys';
import { gameState } from '../state/GameState';
import { SLOTS, saveService } from '../state/SaveService';
import { db } from '../state/db';
import { RACE_NAME } from '@data/schema/enums';
import { cloudSave } from '../state/CloudSave';
import { audio } from '../audio/AudioManager';
import { migrateSave } from '@core/save/saveSchema';
import type { SaveRow } from '../state/db';
import { theme } from '../ui/theme';
import { Rain } from '../ui/Rain';
import { sceneKeyForMap, type WorldSceneData } from './BaseWorldScene';
import { isTouchDevice, touchControlsEnabled, type TouchSetting } from '../systems/input/touchState';
import { registry } from '@data/registry';
import { balance } from '@data/balance';

export class TitleScene extends Phaser.Scene {
  private busy = false;
  private rain!: Rain;
  private importStatus!: Phaser.GameObjects.Text;
  private cloudReady: Promise<void> = Promise.resolve();
  private slotLayer!: Phaser.GameObjects.Container;
  private rows: (SaveRow | null)[] = [null, null, null];
  /** highlighted slot index; −1 until the rows are known */
  private selected = -1;
  private confirmDelete: number | null = null;

  constructor() {
    super('Title');
  }

  create(): void {
    fitCamera(this.cameras.main);
    this.busy = false;
    audio.ambient('rain');
    audio.bgm('title');
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.title_bg); // real art may be a smaller file; cover the canvas (phones are wider than 16:9)
    bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height));
    // darken the painted street so the logo, slot panel and footer stay readable on top of it
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05070a, 0.42).setOrigin(0, 0);
    this.add.rectangle(0, GAME_HEIGHT - 120, GAME_WIDTH, 120, 0x05070a, 0.55).setOrigin(0, 0);
    this.rain = new Rain(this, GAME_WIDTH, GAME_HEIGHT);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.rain.destroy());

    const cx = GAME_WIDTH / 2;
    // logo
    this.add.text(cx + 3, 168, '이터널시티', theme.textStyle(84, '#000000', { fontStyle: 'bold' })).setOrigin(0.5).setAlpha(0.6);
    const logo = this.add.text(cx, 165, '이터널시티', theme.textStyle(84, '#e8e2d2', { fontStyle: 'bold', stroke: '#5a1f1f', strokeThickness: 6 })).setOrigin(0.5);
    this.add.text(cx, 222, 'E T E R N A L   C I T Y', theme.textStyle(16, theme.colors.brass)).setOrigin(0.5);
    this.add.text(cx, 250, '2002년 서울 · 중곡동', theme.textStyle(18, theme.colors.muted)).setOrigin(0.5);
    this.tweens.add({ targets: logo, alpha: 0.86, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // 세이브 슬롯 패널
    const panelW = 620;
    const panelH = 318;
    const py = GAME_HEIGHT / 2 - 40;
    this.add.nineslice(cx, py, TEX.ui_panel, 0, panelW, panelH, 8, 8, 8, 8).setOrigin(0.5, 0).setAlpha(0.92);
    this.add.text(cx, py + 12, '세이브 슬롯 — 숫자 1~3 선택 · Enter 시작/계속하기 · Delete 삭제', theme.textStyle(12, theme.colors.muted)).setOrigin(0.5, 0);
    this.slotLayer = this.add.container(cx - panelW / 2 + 16, py + 38);
    this.renderSlots();
    // 세이브 파일 불러오기 (다른 기기에서 내보낸 .json) → 선택한 슬롯
    const imp = this.add.text(cx, py + 252, '세이브 파일 불러오기… (선택한 슬롯에)', theme.textStyle(14, theme.colors.muted)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    imp.on('pointerover', () => imp.setColor('#ffffff'));
    imp.on('pointerout', () => imp.setColor(theme.colors.muted));
    imp.on('pointerdown', () => void this.importSave());
    this.importStatus = this.add.text(cx, py + 278, '', theme.textStyle(11, '#8a8f9c')).setOrigin(0.5);

    // 터치 조작 전환 (휴대폰에서 자동 감지가 빗나갈 때 손으로 켬) — 설정은 슬롯과 무관하게 저장
    this.touchToggle = this.add.text(GAME_WIDTH - 16, 14, '', theme.textStyle(13, theme.colors.muted, { backgroundColor: '#1a1e24', padding: { left: 10, right: 10, top: 4, bottom: 4 } })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.touchToggle.on('pointerover', () => this.touchToggle.setStyle({ backgroundColor: '#2a3038' }));
    this.touchToggle.on('pointerout', () => this.touchToggle.setStyle({ backgroundColor: '#1a1e24' }));
    this.touchToggle.on('pointerdown', () => this.cycleTouch());
    this.renderTouchToggle();
    // 전체화면 (F) — 앱 뷰어/브라우저 창 안의 검은 띠를 없앰; 터치 탭줄의 ⛶와 Esc 메뉴 버튼도 같은 토글
    const fs = this.add.text(GAME_WIDTH - 16, 44, '⛶ 전체화면  (F)', theme.textStyle(16, theme.colors.muted, { backgroundColor: '#1a1e24', padding: { left: 14, right: 14, top: 8, bottom: 8 } })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    fs.on('pointerover', () => fs.setStyle({ backgroundColor: '#2a3038' }));
    fs.on('pointerout', () => fs.setStyle({ backgroundColor: '#1a1e24' }));
    fs.on('pointerup', () => this.scale.toggleFullscreen()); // pointerup: touch needs a release to count as user activation
    void saveService.loadSettings().then(() => this.scene.isActive() && this.renderTouchToggle());
    const cloudText = this.add.text(cx, GAME_HEIGHT - 48, cloudSave.describe(), theme.textStyle(11, '#8a8f9c')).setOrigin(0.5);
    // local slots first (instant), then the account-bound cloud copies if the play page provides them
    void saveService.peekAll().then((rows) => {
      if (!this.scene.isActive()) return;
      this.rows = rows;
      this.rowsLoaded = true;
      if (this.selected < 0) this.selected = this.defaultSelection();
      this.renderSlots();
      // a key pressed before the slots were known is replayed now, so an early Enter never starts a
      // new game over a slot that turns out to hold a save
      const queued = this.queuedKey;
      this.queuedKey = null;
      if (queued === 'enter') this.pressEnter();
      else if (queued === 'continue') this.pressContinue();
    });
    this.cloudReady = cloudSave
      .reconcileAll(SLOTS)
      .then((rows) => {
        if (!this.scene.isActive()) return;
        cloudText.setText(cloudSave.describe()).setColor(cloudSave.state === 'pulled' ? theme.colors.good : cloudSave.state === 'error' ? theme.colors.bad : '#8a8f9c');
        this.rows = rows.map((r) => (r && migrateSave(r.data) ? r : null));
        if (this.selected < 0) this.selected = this.defaultSelection();
        this.renderSlots();
      })
      .catch(() => undefined);

    const kb = this.input.keyboard;
    kb?.on('keydown-ONE', () => this.select(0));
    kb?.on('keydown-TWO', () => this.select(1));
    kb?.on('keydown-THREE', () => this.select(2));
    kb?.on('keydown-ENTER', () => this.pressEnter());
    kb?.on('keydown-C', () => this.pressContinue());
    kb?.on('keydown-DELETE', () => {
      const i = this.selected < 0 ? this.defaultSelection() : this.selected;
      void this.deleteSlot(i + 1);
    });
    kb?.on('keydown-T', () => this.cycleTouch());
    kb?.on('keydown-F', () => this.scale.toggleFullscreen());

    this.add
      .text(cx, GAME_HEIGHT - 24, `팬 재현 개발 빌드 ${__COMMIT__} · 원작식(좌클릭 이동/우클릭 공격) 또는 현대식(좌클릭 공격) — 둘 다 WASD 이동 가능, Esc 메뉴에서 전환 · 휴대폰/태블릿은 화면 조작 자동 (우상단 또는 T로 전환)`, theme.textStyle(12, '#6b7280'))
      .setOrigin(0.5);
  }

  private touchToggle!: Phaser.GameObjects.Text;

  private renderTouchToggle(): void {
    const s = gameState.settings.touchControls;
    const on = touchControlsEnabled(s);
    const label = s === 'auto' ? `자동 · ${isTouchDevice() ? '터치 기기 → 켬' : '데스크톱 → 끔'}` : s === 'on' ? '항상 켬' : '항상 끔';
    this.touchToggle.setText(`📱 터치 조작: ${label}  (T)`).setColor(on ? theme.colors.good : theme.colors.muted);
  }

  /** auto → on → off → auto; persisted right away since no save slot is open on the title. */
  private cycleTouch(): void {
    const next: Record<TouchSetting, TouchSetting> = { auto: 'on', on: 'off', off: 'auto' };
    gameState.setSettings({ touchControls: next[gameState.settings.touchControls] });
    void db.settings.put({ key: 'settings', value: gameState.settings });
    this.renderTouchToggle();
    audio.play('ui_open');
  }

  update(_t: number, dt: number): void {
    this.rain.update(dt);
  }

  private rowsLoaded = false;
  private queuedKey: 'enter' | 'continue' | null = null;

  /** Enter: continue the selected slot when it holds a save, otherwise start a new game there. */
  private pressEnter(): void {
    if (!this.rowsLoaded) {
      this.queuedKey = 'enter';
      return;
    }
    const i = this.selected < 0 ? this.defaultSelection() : this.selected;
    if (this.rows[i]) void this.continueGame(i + 1);
    else this.newGame(i + 1);
  }

  /** C: continue the most recently played slot. */
  private pressContinue(): void {
    if (!this.rowsLoaded) {
      this.queuedKey = 'continue';
      return;
    }
    const i = this.mostRecent();
    if (i >= 0) void this.continueGame(i + 1);
  }

  /** First empty slot, else the most recently played one, else slot 1. */
  private defaultSelection(): number {
    const empty = this.rows.findIndex((r) => !r);
    if (empty >= 0 && this.rows.every((r) => !r)) return 0;
    const recent = this.mostRecent();
    return recent >= 0 ? recent : Math.max(0, empty);
  }

  private mostRecent(): number {
    let best = -1;
    let at = -1;
    this.rows.forEach((r, i) => {
      if (r && r.updatedAt > at) {
        at = r.updatedAt;
        best = i;
      }
    });
    return best;
  }

  private select(i: number): void {
    this.selected = i;
    this.confirmDelete = null;
    this.renderSlots();
  }

  private renderSlots(): void {
    this.slotLayer.removeAll(true);
    const w = 620 - 32;
    const sel = this.selected < 0 ? this.defaultSelection() : this.selected;
    for (let i = 0; i < 3; i++) {
      const row = this.rows[i];
      const y = i * 68;
      const bg = this.add.rectangle(0, y, w, 60, 0xffffff, i === sel ? 0.1 : 0.04).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      if (i === sel) bg.setStrokeStyle(1, 0xc9a227, 0.8);
      bg.on('pointerdown', () => this.select(i));
      const num = this.add.text(12, y + 8, `${i + 1}`, theme.textStyle(26, i === sel ? theme.colors.brass : theme.colors.muted, { fontStyle: 'bold' }));
      const title = this.add.text(52, y + 8, row ? `${row.name}  Lv.${row.level}` : '빈 슬롯', theme.textStyle(17, row ? '#ffffff' : theme.colors.muted, { fontStyle: 'bold' }));
      const sub = this.add.text(52, y + 34, row ? `${RACE_NAME[row.data.character.race ?? 'human']} · ${row.mapName} · ${new Date(row.updatedAt).toLocaleString('ko-KR')}` : '새 게임을 시작할 수 있습니다', theme.textStyle(11, '#8a8f9c'));
      const items: Phaser.GameObjects.GameObject[] = [bg, num, title, sub];
      const btn = (x: number, label: string, color: string, onPick: () => void) => {
        const t = this.add.text(x, y + 18, label, theme.textStyle(14, color, { backgroundColor: '#1a1e24', padding: { left: 10, right: 10, top: 3, bottom: 3 } })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        t.on('pointerover', () => t.setStyle({ backgroundColor: '#2a3038' }));
        t.on('pointerout', () => t.setStyle({ backgroundColor: '#1a1e24' }));
        t.on('pointerdown', onPick);
        items.push(t);
        return t;
      };
      if (row) {
        btn(w - 12, this.confirmDelete === i ? '정말 삭제?' : '삭제', this.confirmDelete === i ? theme.colors.bad : theme.colors.muted, () => void this.deleteSlot(i + 1));
        btn(w - 110, '계속하기', theme.colors.brass, () => void this.continueGame(i + 1));
      } else {
        btn(w - 12, '▶ 새 게임', theme.colors.brass, () => this.newGame(i + 1));
      }
      this.slotLayer.add(items);
    }
  }

  private newGame(slot: number): void {
    if (this.busy) return;
    this.busy = true;
    this.scene.start('CharacterCreate', { slot });
  }

  private async deleteSlot(slot: number): Promise<void> {
    if (this.busy || !this.rows[slot - 1]) return;
    if (this.confirmDelete !== slot - 1) {
      this.confirmDelete = slot - 1;
      this.selected = slot - 1;
      this.renderSlots();
      return;
    }
    await saveService.deleteSave(slot);
    this.rows = [...this.rows];
    this.rows[slot - 1] = null;
    this.confirmDelete = null;
    this.importStatus.setText(`슬롯 ${slot}을 삭제했습니다.`).setColor(theme.colors.muted);
    this.renderSlots();
  }

  /** Pick an exported .json → store it in the selected slot → continue straight into it. */
  private async importSave(): Promise<void> {
    if (this.busy) return;
    const slot = (this.selected < 0 ? this.defaultSelection() : this.selected) + 1;
    const r = await saveService.importFromPicker();
    if (!r || !this.scene.isActive()) return;
    if (!r.ok) {
      this.importStatus.setText(saveService.describeImportFail(r)).setColor(theme.colors.bad);
      return;
    }
    // importFromPicker stored into the service's current slot; move the row to the chosen one if needed
    if (r.row && r.row.slot !== slot) {
      await saveService.deleteSave(r.row.slot);
      await db.saves.put({ ...r.row, slot });
    }
    this.rows = await saveService.peekAll();
    this.renderSlots();
    this.importStatus.setText(`${r.row?.name ?? ''} 세이브를 슬롯 ${slot}에 불러왔습니다 — 이어서 시작합니다.`).setColor(theme.colors.good);
    await this.continueGame(slot);
  }

  private async continueGame(slot: number): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    await this.cloudReady; // don't start on a stale local slot while a newer cloud save is arriving
    const save = await saveService.load(slot);
    if (!save) {
      this.busy = false;
      gameState.message('저장 데이터를 불러올 수 없습니다.', 'bad');
      return;
    }
    saveService.attach();
    const target = registry.hasMap(save.location.mapId) ? registry.map(save.location.mapId) : registry.map(balance.death.respawnMap);
    this.scene.start(sceneKeyForMap(target), { mapId: target.id, spawn: registry.hasMap(save.location.mapId) ? save.location.spawn : balance.death.respawnPoint } satisfies WorldSceneData);
  }
}
