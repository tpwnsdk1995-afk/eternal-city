import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { TEX } from '@data/textureKeys';
import { registry } from '@data/registry';
import { totalRounds } from '@core/inventory/inventory';
import { xpToNext } from '@core/stats/levelCurve';
import { gameState, type GameEvents } from '../state/GameState';
import { Gauge } from '../ui/Gauge';
import { theme } from '../ui/theme';
import { WindowManager } from '../ui/WindowManager';

const BAR_H = 92;
const LOG_MAX = 5;

/** Always-on HUD overlay. Runs alongside world scenes and re-renders from GameState events. */
export class UIScene extends Phaser.Scene {
  private hp!: Gauge;
  private stamina!: Gauge;
  private ap!: Gauge;
  private xp!: Gauge;
  private weaponText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private wonText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private mapText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;
  private logLines: Phaser.GameObjects.Text[] = [];
  private unsubs: (() => void)[] = [];
  windows!: WindowManager;

  constructor() {
    super('UI');
  }

  create(): void {
    const top = GAME_HEIGHT - BAR_H;
    this.add.nineslice(0, top, TEX.ui_panel, 0, GAME_WIDTH, BAR_H, 6, 6, 6, 6).setOrigin(0, 0);

    this.hp = new Gauge(this, 16, top + 12, 260, 18, theme.colors.hp, '생명');
    this.stamina = new Gauge(this, 16, top + 36, 260, 14, theme.colors.stamina, '지구력');
    this.ap = new Gauge(this, 16, top + 56, 260, 14, theme.colors.ap, '행동력');

    this.weaponText = this.add.text(300, top + 12, '', theme.textStyle(15, theme.colors.text));
    this.ammoText = this.add.text(300, top + 36, '', theme.textStyle(13, theme.colors.muted));
    this.levelText = this.add.text(300, top + 58, '', theme.textStyle(13, theme.colors.muted));
    this.xp = new Gauge(this, 300, top + 76, 260, 8, theme.colors.xp, '');

    this.wonText = this.add.text(GAME_WIDTH - 16, top + 12, '', theme.textStyle(16, theme.colors.brass)).setOrigin(1, 0);
    this.mapText = this.add.text(GAME_WIDTH - 16, top + 40, '', theme.textStyle(13, theme.colors.muted)).setOrigin(1, 0);
    this.fpsText = this.add.text(GAME_WIDTH - 8, 6, '', theme.textStyle(11, theme.colors.muted)).setOrigin(1, 0).setVisible(gameState.settings.showFps);

    for (let i = 0; i < LOG_MAX; i++) {
      this.logLines.push(this.add.text(16, 12 + i * 20, '', theme.textStyle(13, theme.colors.text, { stroke: '#000', strokeThickness: 3 })));
    }

    this.windows = new WindowManager(this);

    const on = <K extends keyof GameEvents>(k: K, fn: (p: GameEvents[K]) => void) => this.unsubs.push(gameState.events.on(k, fn));
    const refreshWindows = () => this.windows.refreshOpen();
    on('vitals', () => this.refreshVitals());
    on('character', () => {
      this.refreshCharacter();
      refreshWindows();
    });
    on('inventory', () => {
      this.refreshWeapon();
      refreshWindows();
    });
    on('equipment', () => {
      this.refreshWeapon();
      refreshWindows();
    });
    on('fire', () => {
      this.refreshWeapon();
      refreshWindows();
    });
    on('skills', () => {
      this.refreshVitals();
      this.refreshWeapon();
      refreshWindows();
    });
    on('mapChanged', (m) => {
      this.mapText.setText(`2002 · ${m.name}`);
      this.windows.closeAll();
    });
    on('message', (m) => this.pushLog(m.text, m.tone));
    on('settings', (s) => this.fpsText.setVisible(s.showFps));
    on('hotkey', (k) => this.windows.handleHotkey(k));
    on('npcInteract', ({ npcId }) => this.windows.talkTo(npcId));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubs.forEach((u) => u());
      this.windows.destroy();
    });

    this.refreshVitals();
    this.refreshCharacter();
    this.refreshWeapon();
    this.mapText.setText(`2002 · ${registry.map(gameState.currentMapId).name}`);
    for (const m of gameState.log.slice(-LOG_MAX)) this.pushLog(m.text, m.tone);
  }

  update(): void {
    if (this.fpsText.visible) this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} fps`);
  }

  private refreshVitals(): void {
    const d = gameState.derived();
    this.hp.set(gameState.vitals.hp, d.maxHp);
    this.stamina.set(gameState.vitals.stamina, d.maxStamina);
    this.ap.set(gameState.vitals.ap, d.maxAp);
  }

  private refreshCharacter(): void {
    const c = gameState.character;
    this.levelText.setText(`Lv.${c.level}  ${c.name}${c.unspentPoints ? `  · 미배분 ${c.unspentPoints}pt` : ''}`);
    this.xp.set(c.xp, xpToNext(c.level));
    this.wonText.setText(`₩ ${c.won.toLocaleString('ko-KR')}`);
    this.refreshVitals();
  }

  private refreshWeapon(): void {
    const w = gameState.weapon();
    if (!w) {
      this.weaponText.setText('무기 없음');
      this.ammoText.setText('');
      return;
    }
    const sub = gameState.fire.subFire ? ' · 서브연사' : '';
    this.weaponText.setText(`${w.def.name}  [${w.grade}등급]${sub}`);
    if (w.def.class === '근접무기') this.ammoText.setText('근접');
    else {
      const rounds = totalRounds(gameState.inventory, registry.item, w.def.caliber, gameState.fire.ammoKind);
      this.ammoText.setText(`${gameState.fire.ammoKind} ${w.def.caliber} · ${rounds}발`);
      this.ammoText.setColor(rounds === 0 ? theme.colors.bad : theme.colors.muted);
    }
  }

  private pushLog(text: string, tone: GameEvents['message']['tone'] = 'info'): void {
    const color = tone === 'good' ? theme.colors.good : tone === 'bad' ? theme.colors.bad : tone === 'system' ? theme.colors.system : theme.colors.text;
    for (let i = 0; i < LOG_MAX - 1; i++) {
      this.logLines[i].setText(this.logLines[i + 1].text).setColor(this.logLines[i + 1].style.color as string).setAlpha(this.logLines[i + 1].alpha);
    }
    const last = this.logLines[LOG_MAX - 1];
    last.setText(text).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(last);
    this.tweens.add({ targets: last, alpha: 0.35, delay: 6000, duration: 1500 });
  }
}
