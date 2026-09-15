import Phaser from 'phaser';
import { weaponLabel } from '@core/tuning/tuning';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import { TEX } from '@data/textureKeys';
import { registry } from '@data/registry';
import { totalRounds } from '@core/inventory/inventory';
import { xpToNext } from '@core/stats/levelCurve';
import { progressText } from '@core/quest/questState';
import { gameState, type AssaultHud, type GameEvents } from '../state/GameState';
import { Gauge } from '../ui/Gauge';
import { theme } from '../ui/theme';
import { WindowManager } from '../ui/WindowManager';
import { MINIMAP_MAX_H, MINIMAP_MAX_W, type MinimapInfo } from '../systems/Minimap';

export const HUD_H = 108;
const LOG_MAX = 5;
const QUICK_SLOTS = 9;
const SLOT = 40;

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

  constructor() {
    super('UI');
  }

  create(): void {
    const top = GAME_HEIGHT - HUD_H;
    this.add.nineslice(0, top, TEX.ui_panel, 0, GAME_WIDTH, HUD_H, 8, 8, 8, 8).setOrigin(0, 0);

    // --- left: portrait + gauges ---------------------------------------------------------------
    this.add.nineslice(12, top + 12, TEX.ui_slot, 0, 72, 72, 3, 3, 3, 3).setOrigin(0, 0);
    this.add.image(16, top + 16, TEX.portrait_player).setOrigin(0, 0).setDisplaySize(64, 64);
    this.nameText = this.add.text(48, top + 88, '', theme.textStyle(12, theme.colors.brass, { fontStyle: 'bold' })).setOrigin(0.5, 0);
    this.hp = new Gauge(this, 94, top + 14, 232, 18, theme.colors.hp, '생명');
    this.stamina = new Gauge(this, 94, top + 38, 232, 14, theme.colors.stamina, '지구력');
    this.ap = new Gauge(this, 94, top + 58, 232, 14, theme.colors.ap, '행동력');
    this.levelText = this.add.text(94, top + 78, '', theme.textStyle(12, theme.colors.muted));

    // --- centre: weapon panel + quickslots ---------------------------------------------------
    const cx = 350;
    this.add.nineslice(cx, top + 12, TEX.ui_slot, 0, 52, 52, 3, 3, 3, 3).setOrigin(0, 0);
    this.weaponIcon = this.add.image(cx + 26, top + 38, TEX.icon_pistol).setDisplaySize(40, 40);
    this.weaponText = this.add.text(cx + 62, top + 14, '', theme.textStyle(15, theme.colors.text, { fontStyle: 'bold' }));
    this.ammoText = this.add.text(cx + 62, top + 36, '', theme.textStyle(13, theme.colors.muted));
    this.subFireText = this.add.text(cx + 62, top + 54, '', theme.textStyle(11, '#9be7ff'));
    const qx = cx;
    const qy = top + 70;
    for (let i = 0; i < QUICK_SLOTS; i++) {
      const x = qx + i * (SLOT + 4);
      this.add.nineslice(x, qy, TEX.ui_slot, 0, SLOT, 32, 3, 3, 3, 3).setOrigin(0, 0);
      this.add.text(x + 3, qy + 1, `${i + 1}`, theme.textStyle(9, theme.colors.muted));
      const icon = this.add.image(x + SLOT / 2, qy + 16, TEX.icon_consumable).setDisplaySize(22, 22).setVisible(false);
      const count = this.add.text(x + SLOT - 3, qy + 30, '', theme.textStyle(10, theme.colors.text, { stroke: '#000', strokeThickness: 2 })).setOrigin(1, 1);
      this.quickIcons.push(icon);
      this.quickCounts.push(count);
    }

    // --- right: money / map / xp -------------------------------------------------------------
    this.wonText = this.add.text(GAME_WIDTH - 16, top + 14, '', theme.textStyle(18, theme.colors.brass, { fontStyle: 'bold' })).setOrigin(1, 0);
    this.mapText = this.add.text(GAME_WIDTH - 16, top + 42, '', theme.textStyle(13, theme.colors.muted)).setOrigin(1, 0);
    this.xp = new Gauge(this, GAME_WIDTH - 16 - 260, top + 66, 260, 12, theme.colors.xp, 'EXP');
    this.fpsText = this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - HUD_H - 16, '', theme.textStyle(11, theme.colors.muted)).setOrigin(1, 0).setVisible(gameState.settings.showFps);

    // --- top-left log --------------------------------------------------------------------------
    for (let i = 0; i < LOG_MAX; i++) {
      this.logLines.push(this.add.text(16, 12 + i * 20, '', theme.textStyle(13, theme.colors.text, { stroke: '#000', strokeThickness: 3 })));
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
    this.permitText = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - HUD_H + 84, '', theme.textStyle(10, '#6b7280')).setOrigin(1, 0);

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
    on('assault', (hud) => this.setBanner(hud));
    on('assaultResult', (r) => this.windows.showResult(r));
    on('message', (m) => this.pushLog(m.text, m.tone));
    on('settings', (s) => {
      this.fpsText.setVisible(s.showFps);
      this.minimapPanel.setVisible(s.showMinimap);
      this.windows.refreshOpen();
    });
    on('quests', () => this.refreshQuests());
    on('flags', () => this.refreshQuests());
    on('hotkey', (k) => this.windows.handleHotkey(k));
    on('npcInteract', ({ npcId }) => this.windows.talkTo(npcId));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubs.forEach((u) => u());
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

  private refreshVitals(): void {
    const d = gameState.derived();
    this.hp.set(gameState.vitals.hp, d.maxHp);
    this.stamina.set(gameState.vitals.stamina, d.maxStamina);
    this.ap.set(gameState.vitals.ap, d.maxAp);
  }

  private refreshCharacter(): void {
    const c = gameState.character;
    this.nameText.setText(c.name);
    this.levelText.setText(`Lv.${c.level}${c.unspentPoints ? `  · 미배분 ${c.unspentPoints}pt (C)` : ''}`);
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
    this.weaponIcon.setVisible(true).setTexture(w.def.iconTex);
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
      this.quickIcons[i].setVisible(true).setTexture(registry.item(s.itemId).iconTex);
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
