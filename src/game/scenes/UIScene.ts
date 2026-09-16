import Phaser from 'phaser';
import { weaponLabel } from '@core/tuning/tuning';
import { activeBuffs, formatRemaining } from '@core/combat/buffs';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { TEX } from '@data/textureKeys';
import { registry } from '@data/registry';
import { totalRounds } from '@core/inventory/inventory';
import { xpToNext } from '@core/stats/levelCurve';
import { progressText } from '@core/quest/questState';
import { gameState, type AssaultHud, type GameEvents } from '../state/GameState';
import { Gauge } from '../ui/Gauge';
import { setUiScale, theme } from '../ui/theme';
import { WindowManager } from '../ui/WindowManager';
import { TouchControls } from '../ui/TouchControls';
import { touchControlsEnabled } from '../systems/input/touchState';
import { MINIMAP_MAX_H, MINIMAP_MAX_W, type MinimapInfo } from '../systems/Minimap';

export const HUD_H = 108;
/** Height of the visible charcoal strip; the rest of HUD_H is transparent world. */
export const HUD_BAR_H = 78;
const LOG_MAX = 5;
const QUICK_SLOTS = 9;

/**
 * Always-on HUD overlay in the original's layout: portrait + gauges on the left, weapon panel
 * and quickslots in the middle, money / map / XP on the right, minimap top-right, log top-left.
 */
export class UIScene extends Phaser.Scene {
  private hp!: Gauge;
  private stamina!: Gauge;
  private ap!: Gauge;
  private xp!: Gauge;
  private nameText!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Image;
  private weaponText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private subFireText!: Phaser.GameObjects.Text;
  private wonText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private mapText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;
  private quickIcons: Phaser.GameObjects.Image[] = [];
  private quickCounts: Phaser.GameObjects.Text[] = [];
  private logLines: Phaser.GameObjects.Text[] = [];
  private unsubs: (() => void)[] = [];
  windows!: WindowManager;
  touch!: TouchControls;
  private banner!: Phaser.GameObjects.Container;
  private bannerName!: Phaser.GameObjects.Text;
  private bannerPhase!: Phaser.GameObjects.Text;
  private bannerProgress!: Phaser.GameObjects.Text;
  private bannerTime!: Phaser.GameObjects.Text;
  private bossBar!: Gauge;
  private minimapPanel!: Phaser.GameObjects.Container;
  private minimapImage: Phaser.GameObjects.Image | null = null;
  private minimapDots!: Phaser.GameObjects.Graphics;
  private minimapInfo: MinimapInfo | null = null;
  private minimapAt = 0;
  private questTracker!: Phaser.GameObjects.Text;
  private permitText!: Phaser.GameObjects.Text;
  private buffText!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image;

  constructor() {
    super('UI');
  }

  create(): void {
    // Phaser reuses the scene instance: '타이틀로' stops the UI and the next game relaunches it, so
    // per-run collections must start empty or refreshers touch destroyed objects from the last run.
    this.quickIcons = [];
    this.quickCounts = [];
    this.logLines = [];
    this.unsubs = [];
    this.minimapImage = null;
    this.minimapInfo = null;

    // The original's HUD is a low charcoal strip hugging the bottom edge (portrait-sized button, three
    // thin stacked bars, a row of black key slots) with the world visible above it. HUD_H stays the
    // layout reserve for windows/touch controls; the visible bar is HUD_BAR_H tall.
    const y0 = GAME_HEIGHT - HUD_BAR_H;
    this.add.nineslice(0, y0, TEX.ui_panel, 0, GAME_WIDTH, HUD_BAR_H, 8, 8, 8, 8).setOrigin(0, 0);

    // --- left: portrait + thin bars (red/blue/green like the original) -----------------------
    this.add.nineslice(8, y0 + 8, TEX.ui_slot, 0, 62, 62, 3, 3, 3, 3).setOrigin(0, 0);
    this.portrait = this.add.image(11, y0 + 11, TEX.portrait_player).setOrigin(0, 0).setDisplaySize(56, 56);
    const bx = 80;
    const bw = 170;
    this.hp = new Gauge(this, bx, y0 + 12, bw, 8, theme.colors.hp, '', false);
    this.ap = new Gauge(this, bx, y0 + 24, bw, 8, theme.colors.ap, '', false);
    this.stamina = new Gauge(this, bx, y0 + 36, bw, 8, theme.colors.stamina, '', false);
    this.add.text(bx + bw + 6, y0 + 10, '생명\n행동\n지구', theme.textStyle(9, theme.colors.muted, { lineSpacing: 1 }));
    this.nameText = this.add.text(bx, y0 + 50, '', theme.textStyle(12, '#f3f4f6', { fontStyle: 'bold' }));
    this.levelText = this.add.text(bx + 70, y0 + 51, '', theme.textStyle(11, theme.colors.muted));

    // --- centre-left: weapon block — icon well + name (yellow) / ammo (green) like the original's text
    const cx = 300;
    this.add.nineslice(cx, y0 + 8, TEX.ui_slot, 0, 62, 62, 3, 3, 3, 3).setOrigin(0, 0);
    this.weaponIcon = this.add.image(cx + 31, y0 + 39, TEX.icon_pistol).setDisplaySize(44, 44);
    this.weaponText = this.add.text(cx + 70, y0 + 11, '', theme.textStyle(14, '#ffd23f', { fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }));
    this.ammoText = this.add.text(cx + 70, y0 + 32, '', theme.textStyle(12, '#8fe36a', { stroke: '#000', strokeThickness: 2 }));
    this.subFireText = this.add.text(cx + 70, y0 + 50, '', theme.textStyle(10, '#9be7ff'));

    // --- centre: quickslots 1~9 as a row of black key wells (the original's F-key row) ---------
    const qx = 590;
    const qy = y0 + 8;
    const QS = 46;
    for (let i = 0; i < QUICK_SLOTS; i++) {
      const x = qx + i * (QS + 3);
      this.add.nineslice(x, qy, TEX.ui_slot, 0, QS, 62, 3, 3, 3, 3).setOrigin(0, 0);
      this.add.text(x + 4, qy + 2, `${i + 1}`, theme.textStyle(9, '#8b8f97'));
      const icon = this.add.image(x + QS / 2, qy + 33, TEX.icon_consumable).setDisplaySize(26, 26).setVisible(false);
      const count = this.add.text(x + QS - 4, qy + 60, '', theme.textStyle(11, '#ffd23f', { stroke: '#000', strokeThickness: 2, fontStyle: 'bold' })).setOrigin(1, 1);
      this.quickIcons.push(icon);
      this.quickCounts.push(count);
      // tap/click a quickslot = its number key
      const slot = i + 1;
      this.add.zone(x, qy, QS, 62).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => gameState.events.emit('hotkey', `quick${slot}`));
    }

    // --- right: money / map / xp -------------------------------------------------------------
    this.wonText = this.add.text(GAME_WIDTH - 14, y0 + 9, '', theme.textStyle(16, '#ffd23f', { fontStyle: 'bold', stroke: '#000', strokeThickness: 2 })).setOrigin(1, 0);
    this.mapText = this.add.text(GAME_WIDTH - 14, y0 + 31, '', theme.textStyle(11, theme.colors.muted)).setOrigin(1, 0);
    this.xp = new Gauge(this, GAME_WIDTH - 14 - 200, y0 + 50, 200, 7, theme.colors.xp, '', false);
    this.add.text(GAME_WIDTH - 14 - 200 - 4, y0 + 48, 'EXP', theme.textStyle(9, theme.colors.muted)).setOrigin(1, 0);
    this.fpsText = this.add.text(8, 6, '', theme.textStyle(11, theme.colors.muted, { stroke: '#000', strokeThickness: 2 })).setVisible(gameState.settings.showFps);

    // --- message log: bottom-left above the HUD on a translucent band (the original's chat box spot)
    const logH = LOG_MAX * 18 + 10;
    this.add.rectangle(8, y0 - 6 - logH, 540, logH, 0x000000, 0.42).setOrigin(0, 0).setDepth(39);
    for (let i = 0; i < LOG_MAX; i++) {
      this.logLines.push(this.add.text(16, y0 - 6 - logH + 5 + i * 18, '', theme.textStyle(12, theme.colors.text, { stroke: '#000', strokeThickness: 3 })).setDepth(40));
    }

    // --- minimap (top-right) -----------------------------------------------------------------
    this.minimapPanel = this.add.container(GAME_WIDTH - MINIMAP_MAX_W - 24, 12).setDepth(40);
    const mmBg = this.add.nineslice(0, 0, TEX.ui_panel, 0, MINIMAP_MAX_W + 12, MINIMAP_MAX_H + 30, 8, 8, 8, 8).setOrigin(0, 0);
    const mmTitle = this.add.text(6, 5, '지도 (Tab)', theme.textStyle(11, theme.colors.brass));
    this.minimapDots = this.add.graphics();
    this.minimapPanel.add([mmBg, mmTitle, this.minimapDots]);
    this.minimapPanel.setVisible(gameState.settings.showMinimap);

    // quest tracker under the minimap
    this.questTracker = this.add.text(GAME_WIDTH - 16, 12 + MINIMAP_MAX_H + 40, '', theme.textStyle(12, '#ffd166', { stroke: '#000', strokeThickness: 3, align: 'right' })).setOrigin(1, 0).setDepth(40);
    this.permitText = this.add.text(GAME_WIDTH - 14, GAME_HEIGHT - 14, '', theme.textStyle(9, '#6b7280')).setOrigin(1, 1);
    // active 사이버샵 buffs, bottom-right above the HUD, refreshed every second
    this.buffText = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - HUD_BAR_H - 8, '', theme.textStyle(11, theme.colors.good, { stroke: '#000', strokeThickness: 3, align: 'right' })).setOrigin(1, 1).setDepth(40);
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickBuffs() });
    this.refreshBuffs();

    // --- assault banner (top centre) ---------------------------------------------------------
    this.banner = this.add.container(GAME_WIDTH / 2, 8).setDepth(50).setVisible(false);
    const bannerBg = this.add.nineslice(0, 0, TEX.ui_panel, 0, 520, 78, 8, 8, 8, 8).setOrigin(0.5, 0);
    this.bannerName = this.add.text(0, 8, '', theme.textStyle(12, theme.colors.muted)).setOrigin(0.5, 0);
    this.bannerPhase = this.add.text(0, 26, '', theme.textStyle(17, '#ffd166', { fontStyle: 'bold' })).setOrigin(0.5, 0);
    this.bannerProgress = this.add.text(0, 52, '', theme.textStyle(12, theme.colors.text)).setOrigin(0.5, 0);
    this.bannerTime = this.add.text(248, 8, '', theme.textStyle(12, theme.colors.muted)).setOrigin(1, 0);
    this.bossBar = new Gauge(this, -200, 82, 400, 14, 0xa32626, '');
    this.bossBar.setVisible(false);
    this.banner.add([bannerBg, this.bannerName, this.bannerPhase, this.bannerProgress, this.bannerTime, this.bossBar]);

    setUiScale(gameState.settings.uiScale);
    this.windows = new WindowManager(this);
    // on-screen touch controls (phones/tablets, or forced from the Esc menu / ?touch=1)
    this.touch = new TouchControls(this);
    this.touch.setEnabled(touchControlsEnabled(gameState.settings.touchControls));
    const windowHit = gameState.uiHit;
    gameState.uiHit = (sx, sy) => !!windowHit?.(sx, sy) || this.touch.hits(sx, sy);

    const on =<K extends keyof GameEvents>(k: K, fn: (p: GameEvents[K]) => void) => this.unsubs.push(gameState.events.on(k, fn));
    const refreshWindows = () => this.windows.refreshOpen();
    on('vitals', () => this.refreshVitals());
    on('character', () => {
      this.refreshCharacter();
      refreshWindows();
    });
    on('inventory', () => {
      this.refreshWeapon();
      this.refreshQuickslots();
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
      this.mapText.setText(`${registry.map(m.mapId).year} · ${m.name}`);
      this.windows.closeAll(['result']);
      this.setBanner(null);
      this.setMinimap(m.minimap);
    });
    on('stats', refreshWindows);
    on('achievements', refreshWindows);
    on('buffs', () => {
      this.refreshBuffs();
      this.refreshVitals();
      refreshWindows();
    });
    on('assault', (hud) => this.setBanner(hud));
    on('assaultResult', (r) => this.windows.showResult(r));
    on('message', (m) => this.pushLog(m.text, m.tone));
    on('settings', (s) => {
      this.fpsText.setVisible(s.showFps);
      this.minimapPanel.setVisible(s.showMinimap);
      this.touch.setEnabled(touchControlsEnabled(s.touchControls));
      setUiScale(s.uiScale);
      this.windows.refreshOpen();
    });
    on('quests', () => this.refreshQuests());
    on('flags', () => this.refreshQuests());
    on('hotkey', (k) => this.windows.handleHotkey(k));
    on('npcInteract', ({ npcId }) => this.windows.talkTo(npcId));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubs.forEach((u) => u());
      this.touch.destroy();
      this.windows.destroy();
    });

    this.refreshVitals();
    this.refreshCharacter();
    this.refreshWeapon();
    this.refreshQuickslots();
    this.refreshQuests();
    this.mapText.setText(`${registry.map(gameState.currentMapId).year} · ${registry.map(gameState.currentMapId).name}`);
    this.setMinimap(gameState.minimap);
    for (const m of gameState.log.slice(-LOG_MAX)) this.pushLog(m.text, m.tone);
  }

  update(time: number): void {
    if (this.fpsText.visible) this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} fps`);
    if (this.minimapPanel.visible && time - this.minimapAt > 120) {
      this.minimapAt = time;
      this.drawMinimapDots();
    }
  }

  // --- minimap -------------------------------------------------------------------------------

  private setMinimap(info: MinimapInfo | null): void {
    this.minimapInfo = info;
    this.minimapImage?.destroy();
    this.minimapImage = null;
    if (!info) return;
    const ox = 6 + (MINIMAP_MAX_W - info.w) / 2;
    const oy = 22 + (MINIMAP_MAX_H - info.h) / 2;
    this.minimapImage = this.add.image(ox, oy, info.tex).setOrigin(0, 0);
    this.minimapPanel.addAt(this.minimapImage, 1);
    this.minimapDots.setPosition(ox, oy);
    this.drawMinimapDots();
  }

  private drawMinimapDots(): void {
    const g = this.minimapDots;
    g.clear();
    const info = this.minimapInfo;
    const snap = gameState.worldProvider?.();
    if (!info || !snap) return;
    const k = info.scale / info.tileSize;
    const dot = (x: number, y: number, r: number, color: number, alpha = 1) => g.fillStyle(color, alpha).fillCircle(x * k, y * k, r);
    for (const p of snap.pickups) dot(p.x, p.y, 1.2, 0xc9a227, 0.9);
    for (const n of snap.npcs) dot(n.x, n.y, 2, 0xffd166);
    for (const e of snap.enemies) dot(e.x, e.y, e.boss ? 3.5 : 1.8, e.boss ? 0xff3b3b : 0xe05555);
    dot(snap.player.x, snap.player.y, 2.6, 0xffffff);
    dot(snap.player.x, snap.player.y, 1.6, 0x3b7bc2);
  }

  // --- banner --------------------------------------------------------------------------------

  private setBanner(hud: AssaultHud | null): void {
    this.banner.setVisible(!!hud);
    if (!hud) return;
    this.bannerName.setText(`어설트 · ${hud.name}`);
    this.bannerPhase.setText(hud.phaseLabel);
    this.bannerProgress.setText(hud.progress);
    const m = Math.floor(hud.elapsedSec / 60);
    const s = hud.elapsedSec % 60;
    this.bannerTime.setText(`${m}:${s.toString().padStart(2, '0')}`);
    this.bossBar.setVisible(!!hud.boss);
    if (hud.boss) this.bossBar.set(hud.boss.hp, hud.boss.max);
  }

  // --- HUD refreshers -----------------------------------------------------------------------

  private tickBuffs(): void {
    for (const name of gameState.pruneBuffs()) gameState.message(`${name} 효과가 끝났습니다.`, 'system');
    this.refreshBuffs();
  }

  private refreshBuffs(): void {
    const now = Date.now();
    const lines = activeBuffs(gameState.buffs, now).map((b) => {
      const def = registry.buff(b.id);
      return `${def.name} ${formatRemaining(b.until - now)}`;
    });
    this.buffText.setText(lines.join('\n'));
  }

  private refreshVitals(): void {
    const d = gameState.derived();
    this.hp.set(gameState.vitals.hp, d.maxHp);
    this.stamina.set(gameState.vitals.stamina, d.maxStamina);
    this.ap.set(gameState.vitals.ap, d.maxAp);
  }

  private refreshCharacter(): void {
    const c = gameState.character;
    this.portrait.setTexture(c.race === 'infected' ? TEX.portrait_infected : TEX.portrait_player);
    this.nameText.setText(c.name);
    this.levelText.setText(`Lv.${c.level}${c.unspentPoints ? ` · 미배분 ${c.unspentPoints}pt (C)` : ''}`);
    this.levelText.setColor(c.unspentPoints ? theme.colors.good : theme.colors.muted);
    this.xp.set(c.xp, xpToNext(c.level));
    this.wonText.setText(`₩ ${c.won.toLocaleString('ko-KR')}`);
    this.refreshVitals();
  }

  private refreshWeapon(): void {
    const w = gameState.weapon();
    if (!w) {
      this.weaponIcon.setVisible(false);
      this.weaponText.setText('무기 없음');
      this.ammoText.setText('');
      this.subFireText.setText('');
      return;
    }
    // re-apply the display size: setTexture keeps the old scale, and real-art icons are 64px while drawn ones are 32px
    this.weaponIcon.setVisible(true).setTexture(w.def.iconTex).setDisplaySize(44, 44);
    this.weaponText.setText(weaponLabel(w.def, w.stack));
    this.subFireText.setText(gameState.fire.subFire ? '서브연사 ON (Ctrl)' : '');
    if (w.def.class === '근접무기') this.ammoText.setText('근접');
    else {
      const rounds = totalRounds(gameState.inventory, registry.item, w.def.caliber, gameState.fire.ammoKind);
      this.ammoText.setText(`${gameState.fire.ammoKind} ${w.def.caliber} · ${rounds}발`);
      this.ammoText.setColor(rounds === 0 ? theme.colors.bad : theme.colors.muted);
    }
  }

  private refreshQuests(): void {
    const lines: string[] = [];
    for (const q of gameState.quests.active) {
      const def = registry.quest(q.id);
      lines.push(`▸ ${def.name}`);
      for (const p of progressText(gameState.quests, def)) lines.push(`   ${p}`);
    }
    this.questTracker.setText(lines.join('\n'));
    const yr = registry.map(gameState.currentMapId).year;
    this.permitText.setText(gameState.flags.parallelPermit ? `${yr} · 패러렐 허가증 보유` : `${yr} · 패러렐 허가증 없음`);
    this.permitText.setColor(gameState.flags.parallelPermit ? theme.colors.good : '#6b7280');
  }

  /** Quickslots mirror the consumables in the inventory (1..9); digits use them. */
  private refreshQuickslots(): void {
    const stacks = gameState.inventory.items.filter((s) => registry.item(s.itemId).kind === 'consumable');
    for (let i = 0; i < QUICK_SLOTS; i++) {
      const s = stacks[i];
      if (!s) {
        this.quickIcons[i].setVisible(false);
        this.quickCounts[i].setText('');
        continue;
      }
      this.quickIcons[i].setVisible(true).setTexture(registry.item(s.itemId).iconTex).setDisplaySize(26, 26);
      this.quickCounts[i].setText(`${s.qty}`);
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
