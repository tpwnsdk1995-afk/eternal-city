import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { balance } from '@data/balance';
import { TEX } from '@data/textureKeys';
import { STAT_KEYS, type StatKey, type Stats } from '@data/schema/enums';
import { emptyStats } from '@core/stats/character';
import { derivedStats } from '@core/stats/derived';
import { gameState } from '../state/GameState';
import { saveService } from '../state/SaveService';
import { theme } from '../ui/theme';
import type { WorldSceneData } from './BaseWorldScene';

const DEFAULT_NAME = '헌터';
const STAT_DESC: Record<StatKey, string> = {
  생명력: '의식회복 확률',
  체력: '최대 생명력 · 근접 공격력',
  지구력: '달리기/점프 게이지 · 무게',
  기술: '원거리 공격력 · 명중 · 치명타',
  지능: '기술등급 · 행동력',
  속도: '이동속도 · 공격속도',
};

/** 캐릭터 생성: 이름 + 생성 포인트 5 배분. */
export class CharacterCreateScene extends Phaser.Scene {
  private alloc: Stats = emptyStats(0);
  private left = balance.stats.creationPoints;
  private valueTexts = new Map<StatKey, Phaser.GameObjects.Text>();
  private leftText!: Phaser.GameObjects.Text;
  private previewText!: Phaser.GameObjects.Text;
  private nameInput: HTMLInputElement | null = null;
  private started = false;

  constructor() {
    super('CharacterCreate');
  }

  create(): void {
    this.alloc = emptyStats(0);
    this.left = balance.stats.creationPoints;
    this.valueTexts.clear();
    this.started = false;
    this.cameras.main.setBackgroundColor('#05070a');
    this.add.image(0, 0, TEX.title_bg).setOrigin(0, 0).setAlpha(0.55);

    const cx = GAME_WIDTH / 2;
    this.add.nineslice(cx, 40, TEX.ui_panel, 0, 640, GAME_HEIGHT - 80, 8, 8, 8, 8).setOrigin(0.5, 0).setAlpha(0.94);
    this.add.text(cx, 70, '캐릭터 생성', theme.textStyle(36, '#e5e7eb', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(cx, 112, '2002년 중곡동, 광진구청 지하주차장에서 시작합니다.', theme.textStyle(14, theme.colors.muted)).setOrigin(0.5);

    this.add.text(cx - 260, 160, '이름', theme.textStyle(16, theme.colors.brass));
    const dom = this.add.dom(cx + 40, 172).createFromHTML(
      `<input id="ec-name" maxlength="10" value="${DEFAULT_NAME}" autocomplete="off" style="width:260px;padding:8px 12px;font:16px 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#12161c;color:#e5e7eb;border:1px solid #c9a227;border-radius:3px;outline:none;">`,
    );
    this.nameInput = dom.getChildByID('ec-name') as HTMLInputElement | null;
    this.nameInput?.focus();

    this.add.text(cx - 260, 215, `생성 포인트 배분`, theme.textStyle(16, theme.colors.brass));
    this.leftText = this.add.text(cx + 260, 217, '', theme.textStyle(14, theme.colors.good)).setOrigin(1, 0);

    let y = 250;
    for (const k of STAT_KEYS) {
      this.add.text(cx - 260, y, k, theme.textStyle(16, '#ffffff', { fontStyle: 'bold' }));
      this.add.text(cx - 190, y + 3, STAT_DESC[k], theme.textStyle(11, theme.colors.muted));
      const minus = this.smallButton(cx + 120, y - 2, '−', () => this.adjust(k, -1));
      const val = this.add.text(cx + 175, y, '0', theme.textStyle(16, theme.colors.brass)).setOrigin(0.5, 0);
      const plus = this.smallButton(cx + 210, y - 2, '+', () => this.adjust(k, 1));
      this.valueTexts.set(k, val);
      void minus;
      void plus;
      y += 36;
    }
    this.previewText = this.add.text(cx, y + 10, '', theme.textStyle(12, theme.colors.muted, { align: 'center' })).setOrigin(0.5, 0);

    const start = this.add.text(cx, GAME_HEIGHT - 90, '▶ 시작  (Enter)', theme.textStyle(24, theme.colors.brass)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    start.on('pointerover', () => start.setColor('#ffffff'));
    start.on('pointerout', () => start.setColor(theme.colors.brass));
    start.on('pointerdown', () => this.start());
    this.input.keyboard?.on('keydown-ENTER', () => this.start());
    const back = this.add.text(cx, GAME_HEIGHT - 50, '← 타이틀로', theme.textStyle(14, '#6b7280')).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Title'));

    this.refresh();
  }

  private smallButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, label, theme.textStyle(18, '#ffffff', { backgroundColor: '#1a1e24', padding: { left: 10, right: 10, top: 0, bottom: 2 } })).setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setStyle({ backgroundColor: '#2a3038' }));
    t.on('pointerout', () => t.setStyle({ backgroundColor: '#1a1e24' }));
    t.on('pointerdown', onClick);
    return t;
  }

  private adjust(k: StatKey, d: number): void {
    if (d > 0 && this.left <= 0) return;
    if (d < 0 && this.alloc[k] <= 0) return;
    this.alloc = { ...this.alloc, [k]: this.alloc[k] + d };
    this.left -= d;
    this.refresh();
  }

  private refresh(): void {
    for (const k of STAT_KEYS) this.valueTexts.get(k)!.setText(`${this.alloc[k]}`);
    this.leftText.setText(`남은 포인트 ${this.left}`);
    const d = derivedStats(this.alloc, 1);
    this.previewText.setText(
      `생명 ${d.maxHp} · 지구력 ${d.maxStamina} · 행동력 ${d.maxAp} · 이동 ${d.moveSpeed.toFixed(0)}px/s · 기술등급 ${d.techGrade} · 무게 ${d.maxWeightKg.toFixed(1)}kg\n남은 포인트는 게임 안에서 상태창(C)으로 배분할 수 있습니다.`,
    );
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    const name = (this.nameInput?.value ?? '').trim().slice(0, 10) || DEFAULT_NAME;
    gameState.newGame(name);
    gameState.setCharacter({ ...gameState.character, base: { ...this.alloc }, unspentPoints: this.left });
    const d = gameState.derived();
    gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
    saveService.hasCharacter = true;
    saveService.attach();
    void saveService.save();
    this.scene.start('SafeZone', { mapId: balance.death.respawnMap, spawn: balance.death.respawnPoint } satisfies WorldSceneData);
  }
}
