import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { gameState } from '../state/GameState';
import { saveService } from '../state/SaveService';
import type { SaveRow } from '../state/db';
import { theme } from '../ui/theme';
import type { WorldSceneData } from './BaseWorldScene';

export class TitleScene extends Phaser.Scene {
  private busy = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.busy = false;
    this.cameras.main.setBackgroundColor('#05070a');
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '이터널시티', theme.textStyle(64, '#e5e7eb', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '2002년 서울 · 중곡동', theme.textStyle(20, theme.colors.muted)).setOrigin(0.5);

    this.menuItem(GAME_HEIGHT / 2 + 30, '▶ 새 게임 시작  (Enter)', () => this.newGame());
    const cont = this.menuItem(GAME_HEIGHT / 2 + 75, '계속하기  (C)', () => void this.continueGame()).setVisible(false);
    const info = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 105, '', theme.textStyle(13, '#6b7280')).setOrigin(0.5);

    void saveService.loadSettings();
    void saveService.peek().then((row: SaveRow | null) => {
      if (!row || !this.scene.isActive()) return;
      cont.setVisible(true);
      info.setText(`${row.name}  Lv.${row.level} · ${row.mapName} · ${new Date(row.updatedAt).toLocaleString('ko-KR')}`);
      this.input.keyboard?.once('keydown-C', () => void this.continueGame());
    });
    this.input.keyboard?.once('keydown-ENTER', () => this.newGame());

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '팬 재현 개발 빌드 · 원작식(좌클릭 이동/우클릭 공격) 또는 현대식(WASD) — Esc 메뉴에서 전환', theme.textStyle(13, '#6b7280'))
      .setOrigin(0.5);
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
    this.scene.start(save.location.mapId === 'gwangjin-gucheong-parking' ? 'SafeZone' : 'Field', { mapId: save.location.mapId, spawn: save.location.spawn } satisfies WorldSceneData);
  }
}
