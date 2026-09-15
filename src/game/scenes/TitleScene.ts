import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { TEX } from '@data/textureKeys';
import { gameState } from '../state/GameState';
import { saveService } from '../state/SaveService';
import type { SaveRow } from '../state/db';
import { theme } from '../ui/theme';
import { Rain } from '../ui/Rain';
import { sceneKeyForMap, type WorldSceneData } from './BaseWorldScene';
import { registry } from '@data/registry';
import { balance } from '@data/balance';

export class TitleScene extends Phaser.Scene {
  private busy = false;
  private rain!: Rain;

  constructor() {
    super('Title');
  }

  create(): void {
    this.busy = false;
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
    const panelH = 170;
    const py = GAME_HEIGHT / 2 + 40;
    this.add.nineslice(cx, py, TEX.ui_panel, 0, panelW, panelH, 8, 8, 8, 8).setOrigin(0.5, 0).setAlpha(0.92);
    this.menuItem(py + 44, '▶ 새 게임 시작  (Enter)', () => this.newGame());
    const cont = this.menuItem(py + 94, '계속하기  (C)', () => void this.continueGame()).setVisible(false);
    const info = this.add.text(cx, py + 126, '', theme.textStyle(12, '#8a8f9c')).setOrigin(0.5);

    void saveService.loadSettings();
    void saveService.peek().then((row: SaveRow | null) => {
      if (!row || !this.scene.isActive()) return;
      cont.setVisible(true);
      info.setText(`${row.name}  Lv.${row.level} · ${row.mapName} · ${new Date(row.updatedAt).toLocaleString('ko-KR')}`);
      this.input.keyboard?.once('keydown-C', () => void this.continueGame());
    });
    this.input.keyboard?.once('keydown-ENTER', () => this.newGame());

    this.add
      .text(cx, GAME_HEIGHT - 28, '팬 재현 개발 빌드 · 원작식(좌클릭 이동/우클릭 공격) 또는 현대식(WASD) — Esc 메뉴에서 전환', theme.textStyle(12, '#6b7280'))
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

  private async continueGame(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
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
