import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, fitCamera } from '../../config/gameConfig';
import { balance } from '@data/balance';
import { TEX } from '@data/textureKeys';
import { RACE_NAME, RACES, STAT_KEYS, type Race, type StatKey, type Stats } from '@data/schema/enums';
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
  private training = false;
  private slot = 1;

  init(data?: { slot?: number }): void {
    this.slot = data?.slot ?? 1;
  }
  private trainingBtn!: Phaser.GameObjects.Text;
  private alloc: Stats = emptyStats(0);
  private left = balance.stats.creationPoints;
  private valueTexts = new Map<StatKey, Phaser.GameObjects.Text>();
  private leftText!: Phaser.GameObjects.Text;
  private previewText!: Phaser.GameObjects.Text;
  private nameInput: HTMLInputElement | null = null;
  private started = false;
  private race: Race = 'human';
  private raceButtons = new Map<Race, Phaser.GameObjects.Text>();
  private raceDesc!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterCreate');
  }

  create(): void {
    fitCamera(this.cameras.main);
    this.alloc = emptyStats(0);
    this.left = balance.stats.creationPoints;
    this.valueTexts.clear();
    this.started = false;
    this.race = 'human';
    this.raceButtons.clear();
    this.cameras.main.setBackgroundColor('#05070a');
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.title_bg).setAlpha(0.55);
    bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height));

    const cx = GAME_WIDTH / 2;
    // phone canvas is 540 high: tighter rows so the stat list and the start button never overlap
    const cy = (desktop: number, phone: number): number => (GAME_HEIGHT < 700 ? phone : desktop);
    this.add.nineslice(cx, cy(40, 14), TEX.ui_panel, 0, 640, GAME_HEIGHT - cy(80, 28), 8, 8, 8, 8).setOrigin(0.5, 0).setAlpha(0.94);
    this.add.text(cx, cy(70, 40), '캐릭터 생성', theme.textStyle(cy(36, 26), '#e5e7eb', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(cx, cy(112, 70), '2002년 중곡동, 광진구청 지하주차장에서 시작합니다.', theme.textStyle(14, theme.colors.muted)).setOrigin(0.5);

    this.add.text(cx - 260, cy(160, 98), '이름', theme.textStyle(16, theme.colors.brass));
    const dom = this.add.dom(cx + 40, cy(172, 110)).createFromHTML(
      `<input id="ec-name" maxlength="10" value="${DEFAULT_NAME}" autocomplete="off" style="width:260px;padding:8px 12px;font:16px 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#12161c;color:#e5e7eb;border:1px solid #c9a227;border-radius:3px;outline:none;">`,
    );
    this.nameInput = dom.getChildByID('ec-name') as HTMLInputElement | null;
    this.nameInput?.focus();

    // 종족: 인간 / 감염체 (R 키로 전환)
    this.add.text(cx - 260, cy(210, 142), '종족  (R)', theme.textStyle(16, theme.colors.brass));
    let bx = cx - 150;
    for (const r of RACES) {
      const b = this.add.text(bx, cy(208, 140), RACE_NAME[r], theme.textStyle(15, '#ffffff', { backgroundColor: '#1a1e24', padding: { left: 12, right: 12, top: 3, bottom: 3 } })).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => this.setRace(r));
      this.raceButtons.set(r, b);
      bx += b.width + 10;
    }
    this.raceDesc = this.add.text(cx - 260, cy(240, 170), '', theme.textStyle(11, theme.colors.muted, { wordWrap: { width: 520 } }));
    this.input.keyboard?.on('keydown-R', (ev: KeyboardEvent) => {
      if (!this.typingName(ev)) this.setRace(this.race === 'human' ? 'infected' : 'human');
    });

    this.add.text(cx - 260, cy(275, 198), `생성 포인트 배분`, theme.textStyle(16, theme.colors.brass));
    this.leftText = this.add.text(cx + 260, cy(277, 200), '', theme.textStyle(14, theme.colors.good)).setOrigin(1, 0);

    let y = cy(306, 226);
    for (const k of STAT_KEYS) {
      this.add.text(cx - 260, y, k, theme.textStyle(16, '#ffffff', { fontStyle: 'bold' }));
      this.add.text(cx - 190, y + 3, STAT_DESC[k], theme.textStyle(11, theme.colors.muted));
      const minus = this.smallButton(cx + 120, y - 2, '−', () => this.adjust(k, -1));
      const val = this.add.text(cx + 175, y, '0', theme.textStyle(16, theme.colors.brass)).setOrigin(0.5, 0);
      const plus = this.smallButton(cx + 210, y - 2, '+', () => this.adjust(k, 1));
      this.valueTexts.set(k, val);
      void minus;
      void plus;
      y += cy(32, 27);
    }
    this.previewText = this.add.text(cx, y + 10, '', theme.textStyle(12, theme.colors.muted, { align: 'center' })).setOrigin(0.5, 0);

    // 알파 훈련장 (tutorial) toggle — T key or click
    this.trainingBtn = this.add.text(cx, GAME_HEIGHT - cy(128, 96), '', theme.textStyle(13, theme.colors.muted, { backgroundColor: '#1a1e24', padding: { left: 10, right: 10, top: 3, bottom: 3 } })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.trainingBtn.on('pointerdown', () => this.setTraining(!this.training));
    this.input.keyboard?.on('keydown-T', (ev: KeyboardEvent) => {
      if (!this.typingName(ev)) this.setTraining(!this.training);
    });
    this.setTraining(false);

    const start = this.add.text(cx, GAME_HEIGHT - cy(90, 60), '▶ 시작  (Enter)', theme.textStyle(cy(24, 20), theme.colors.brass)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    start.on('pointerover', () => start.setColor('#ffffff'));
    start.on('pointerout', () => start.setColor(theme.colors.brass));
    start.on('pointerdown', () => this.start());
    this.input.keyboard?.on('keydown-ENTER', () => this.start());
    const back = this.add.text(cx, GAME_HEIGHT - cy(50, 26), '← 타이틀로', theme.textStyle(14, '#6b7280')).setOrigin(0.5).setInteractive({ useHandCursor: true });
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

  private setRace(r: Race): void {
    this.race = r;
    this.refresh();
  }

  private adjust(k: StatKey, d: number): void {
    if (d > 0 && this.left <= 0) return;
    if (d < 0 && this.alloc[k] <= 0) return;
    this.alloc = { ...this.alloc, [k]: this.alloc[k] + d };
    this.left -= d;
    this.refresh();
  }

  private refresh(): void {
    for (const [r, b] of this.raceButtons) b.setStyle({ backgroundColor: r === this.race ? '#3a4048' : '#1a1e24', color: r === this.race ? (r === 'infected' ? '#a8f060' : '#ffd166') : '#9aa0a6' });
    this.raceDesc.setText(
      this.race === 'human'
        ? '인간 — 총기 8분류와 탄약을 다루는 헌터. 상점·기술상·강화 전부 이용. Glock 17로 시작.'
        : '감염체 — 총기를 쓰지 못하고 발톱·촉수·산성 토사·골검 같은 변이무기로 싸운다. 최대 생명력 +15%, 이동속도 +10%, 피해를 입지 않으면 체력이 자연 재생.',
    );
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
    // Point the service at this slot *before* the new kit is set up: newGame() emits equipment/skills
    // events, and a still-attached autosave would otherwise write this character into the previous slot.
    saveService.hasCharacter = false;
    saveService.currentSlot = this.slot;
    gameState.newGame(name, this.race);
    gameState.setCharacter({ ...gameState.character, base: { ...this.alloc }, unspentPoints: this.left });
    const d = gameState.derived();
    gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
    saveService.hasCharacter = true;
    saveService.attach();
    void saveService.save();
    if (this.training) this.scene.start('Field', { mapId: 'alpha-training', spawn: 'default' } satisfies WorldSceneData);
    else this.scene.start('SafeZone', { mapId: balance.death.respawnMap, spawn: balance.death.respawnPoint } satisfies WorldSceneData);
  }

  /**
   * Letters typed into the name box must not fire the R/T shortcuts. Phaser delivers key events on
   * its next step, so the check uses the event's own target (fixed at dispatch) rather than the
   * current activeElement, which may already have moved on.
   */
  private typingName(ev?: KeyboardEvent): boolean {
    if (!this.nameInput) return false;
    if (ev && ev.target) return ev.target === this.nameInput;
    return typeof document !== 'undefined' && document.activeElement === this.nameInput;
  }

  private setTraining(on: boolean): void {
    this.training = on;
    this.trainingBtn.setText(on ? '☑ 알파 훈련장(튜토리얼)부터 시작  (T)' : '☐ 알파 훈련장(튜토리얼)부터 시작  (T)').setColor(on ? theme.colors.good : theme.colors.muted);
  }
}
