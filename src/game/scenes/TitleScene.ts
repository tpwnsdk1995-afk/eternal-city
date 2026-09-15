import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { TEX } from '@data/textureKeys';
import { gameState } from '../state/GameState';
import { saveService } from '../state/SaveService';
import { cloudSave } from '../state/CloudSave';
import { audio } from '../audio/AudioManager';
import { migrateSave } from '@core/save/saveSchema';
import type { SaveRow } from '../state/db';
import { theme } from '../ui/theme';
import { Rain } from '../ui/Rain';
import { sceneKeyForMap, type WorldSceneData } from './BaseWorldScene';
import { registry } from '@data/registry';
import { balance } from '@data/balance';

export class TitleScene extends Phaser.Scene {
  private busy = false;
  private rain!: Rain;
  private importStatus!: Phaser.GameObjects.Text;
  private showSlot: ((row: SaveRow) => void) | null = null;
  private cloudReady: Promise<void> = Promise.resolve();

  constructor() {
    super('Title');
  }

  create(): void {
    this.busy = false;
    audio.ambient('rain');
    audio.bgm('title');
    this.add.image(0, 0, TEX.title_bg).setOrigin(0, 0);
    this.rain = new Rain(this, GAME_WIDTH, GAME_HEIGHT);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.rain.destroy());

    const cx = GAME_WIDTH / 2;
    // logo
    this.add.text(cx + 3, 168, '이터널시티', theme.textStyle(84, '#000000', { fontStyle: 'bold' })).setOrigin(0.5).setAlpha(0.6);
    const logo = this.add.text(cx, 165, '이터널시티', theme.textStyle(84, '#e8e2d2', { fontStyle: 'bold', stroke: '#5a1f1f', strokeThickness: 6 })).setOrigin(0.5);
    this.add.text(cx, 222, 'E T E R N A L   C I T Y', theme.textStyle(16, theme.colors.brass)).setOrigin(0.5);
    this.add.text(cx, 250, '2002년 서울 · 중곡동', theme.textStyle(18, theme.colors.muted)).setOrigin(0.5);
    this.tweens.add({ targets: logo, alpha: 0.86, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // menu panel
    const panelW = 420;
    const panelH = 214;
    const py = GAME_HEIGHT / 2 + 20;
    this.add.nineslice(cx, py, TEX.ui_panel, 0, panelW, panelH, 8, 8, 8, 8).setOrigin(0.5, 0).setAlpha(0.92);
    this.menuItem(py + 44, '▶ 새 게임 시작  (Enter)', () => this.newGame());
    const cont = this.menuItem(py + 94, '계속하기  (C)', () => void this.continueGame()).setVisible(false);
    const info = this.add.text(cx, py + 126, '', theme.textStyle(12, '#8a8f9c')).setOrigin(0.5);
    // 세이브 파일 불러오기 (다른 기기에서 내보낸 .json)
    const imp = this.add.text(cx, py + 172, '세이브 파일 불러오기…', theme.textStyle(15, theme.colors.muted)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    imp.on('pointerover', () => imp.setColor('#ffffff'));
    imp.on('pointerout', () => imp.setColor(theme.colors.muted));
    imp.on('pointerdown', () => void this.importSave());
    this.importStatus = this.add.text(cx, py + 196, '', theme.textStyle(11, '#8a8f9c')).setOrigin(0.5);

    void saveService.loadSettings();
    const showSlot = (row: SaveRow) => {
      cont.setVisible(true);
      info.setText(`${row.name}  Lv.${row.level} · ${row.mapName} · ${new Date(row.updatedAt).toLocaleString('ko-KR')}`);
    };
    this.showSlot = showSlot;
    const cloudText = this.add.text(cx, GAME_HEIGHT - 48, cloudSave.describe(), theme.textStyle(11, '#8a8f9c')).setOrigin(0.5);
    let keyArmed = false;
    const armContinue = () => {
      if (keyArmed) return;
      keyArmed = true;
      this.input.keyboard?.once('keydown-C', () => void this.continueGame());
    };
    // local slot first (instant), then the account-bound cloud copy if the play page provides one
    void saveService.peek().then((row: SaveRow | null) => {
      if (!row || !this.scene.isActive()) return;
      showSlot(row);
      armContinue();
    });
    this.cloudReady = cloudSave
      .reconcileSlot()
      .then(({ row }) => {
        if (!this.scene.isActive()) return;
        cloudText.setText(cloudSave.describe()).setColor(cloudSave.state === 'pulled' ? theme.colors.good : cloudSave.state === 'error' ? theme.colors.bad : '#8a8f9c');
        if (row && migrateSave(row.data)) {
          showSlot(row);
          armContinue();
        }
      })
      .catch(() => undefined);
    this.input.keyboard?.once('keydown-ENTER', () => this.newGame());

    this.add
      .text(cx, GAME_HEIGHT - 24, '팬 재현 개발 빌드 · 원작식(좌클릭 이동/우클릭 공격) 또는 현대식(WASD) — Esc 메뉴에서 전환 · 터치 기기는 화면 조작 자동', theme.textStyle(12, '#6b7280'))
      .setOrigin(0.5);
  }

  update(_t: number, dt: number): void {
    this.rain.update(dt);
  }

  private menuItem(y: number, label: string, onPick: () => void): Phaser.GameObjects.Text {
    const t = this.add.text(GAME_WIDTH / 2, y, label, theme.textStyle(24, theme.colors.brass)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setColor('#ffffff'));
    t.on('pointerout', () => t.setColor(theme.colors.brass));
    t.on('pointerdown', onPick);
    return t;
  }

  private newGame(): void {
    if (this.busy) return;
    this.busy = true;
    this.scene.start('CharacterCreate');
  }

  /** Pick an exported .json → store it in the slot → continue straight into it. */
  private async importSave(): Promise<void> {
    if (this.busy) return;
    const r = await saveService.importFromPicker();
    if (!r || !this.scene.isActive()) return;
    if (!r.ok) {
      this.importStatus.setText(saveService.describeImportFail(r)).setColor(theme.colors.bad);
      return;
    }
    if (r.row) this.showSlot?.(r.row);
    this.importStatus.setText(`${r.row?.name ?? ''} 세이브를 불러왔습니다 — 이어서 시작합니다.`).setColor(theme.colors.good);
    await this.continueGame();
  }

  private async continueGame(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    await this.cloudReady; // don't start on a stale local slot while a newer cloud save is arriving
    const save = await saveService.load();
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
