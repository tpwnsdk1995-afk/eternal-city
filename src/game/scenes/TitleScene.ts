import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { balance } from '@data/balance';
import { gameState } from '../state/GameState';
import { theme } from '../ui/theme';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#05070a');
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, '이터널시티', theme.textStyle(64, '#e5e7eb', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, '2002년 서울 · 중곡동', theme.textStyle(20, theme.colors.muted)).setOrigin(0.5);

    const start = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '▶ 새 게임 시작', theme.textStyle(24, theme.colors.brass))
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    start.on('pointerover', () => start.setColor('#ffffff'));
    start.on('pointerout', () => start.setColor(theme.colors.brass));
    start.on('pointerdown', () => this.startNewGame());
    this.input.keyboard?.once('keydown-ENTER', () => this.startNewGame());

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '팬 재현 개발 빌드 · 조작: 좌클릭 이동 / 우클릭 공격 (Esc 메뉴에서 WASD 전환)', theme.textStyle(13, '#6b7280'))
      .setOrigin(0.5);
  }

  private startNewGame(): void {
    gameState.newGame('주인공');
    this.scene.start('SafeZone', { mapId: balance.death.respawnMap, spawn: 'default' });
  }
}
