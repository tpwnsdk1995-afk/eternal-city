import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';
import type { Hotkey } from '../systems/input/InputMapper';
import { resetTouchState, touchState } from '../systems/input/touchState';
import { theme } from './theme';

const HUD_H = 108;
const STICK_R = 72; // base radius
const KNOB_R = 30;
const STICK_MAX = 58; // knob travel
const RUN_AT = 0.85; // fraction of travel that switches to running
const FIRE_R = 58;
const AIM_MIN = 14; // drag distance before the fire button becomes an aim stick
const BTN_R = 30;

interface RoundButton {
  x: number;
  y: number;
  r: number;
  label: string;
  gfx: Phaser.GameObjects.Arc;
  text: Phaser.GameObjects.Text;
  onDown?: () => void;
  onUp?: () => void;
}

/**
 * On-screen controls for phones/tablets, drawn in the UI scene above the HUD:
 *   · left  — fixed virtual stick (push past 85% to run)
 *   · right — fire button; hold to shoot, drag to aim (twin-stick), no drag → auto-aim
 *   · right cluster — 점프 · 웅크림 · 대화(E) · 서브연사
 *   · top strip — 인벤 · 상태 · 스킬 · 퀘스트 · 지도 · 메뉴 · 전체화면
 * Writes into the shared `touchState`; `InputMapper` folds it into the frame's InputIntent.
 */
export class TouchControls extends Phaser.GameObjects.Container {
  private stickBase: Phaser.GameObjects.Arc;
  private stickKnob: Phaser.GameObjects.Arc;
  private stickCenter: { x: number; y: number };
  private stickPointer: number | null = null;
  private fireBtn: RoundButton;
  private firePointer: number | null = null;
  private fireStart = { x: 0, y: 0 };
  private aimLine: Phaser.GameObjects.Graphics;
  private buttons: RoundButton[] = [];
  private tabs: { x: number; y: number; w: number; h: number }[] = [];
  private held = new Map<number, RoundButton>();
  private rotateHint: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    const bottom = GAME_HEIGHT - HUD_H;

    // --- left stick ---------------------------------------------------------------------------
    this.stickCenter = { x: 150, y: bottom - 150 };
    this.stickBase = scene.add.circle(this.stickCenter.x, this.stickCenter.y, STICK_R, 0x0b0e14, 0.45).setStrokeStyle(2, 0xc9a227, 0.7);
    this.stickKnob = scene.add.circle(this.stickCenter.x, this.stickCenter.y, KNOB_R, 0xc9a227, 0.55).setStrokeStyle(2, 0xffffff, 0.5);
    const stickLabel = scene.add.text(this.stickCenter.x, this.stickCenter.y + STICK_R + 10, '이동 · 끝까지 밀면 달리기', theme.textStyle(11, theme.colors.muted, { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5, 0);
    this.add([this.stickBase, this.stickKnob, stickLabel]);

    // --- fire button + aim line ---------------------------------------------------------------
    this.aimLine = scene.add.graphics();
    this.add(this.aimLine);
    this.fireBtn = this.round(GAME_WIDTH - 130, bottom - 150, FIRE_R, '공격', 0xa32626);
    const fireLabel = scene.add.text(this.fireBtn.x, this.fireBtn.y + FIRE_R + 10, '누르면 사격 · 끌면 조준', theme.textStyle(11, theme.colors.muted, { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5, 0);
    this.add(fireLabel);

    // --- action cluster ------------------------------------------------------------------------
    const ax = GAME_WIDTH - 130;
    const ay = bottom - 150;
    this.action(ax - 120, ay + 40, '점프', () => (touchState.pending.jump = true));
    this.action(ax - 130, ay - 50, '웅크림', () => (touchState.pending.crouch = true));
    this.action(ax - 60, ay - 130, '대화', () => (touchState.pending.interact = true));
    this.action(ax + 40, ay - 130, '서브\n연사', () => (touchState.pending.subFire = true));

    // --- top strip: windows --------------------------------------------------------------------
    const tabs: [string, Hotkey | 'fullscreen'][] = [['인벤', 'inventory'], ['상태', 'status'], ['스킬', 'skills'], ['퀘스트', 'quest'], ['지도', 'minimap'], ['귀환', 'home'], ['메뉴', 'menu'], ['⛶', 'fullscreen']];
    let tx = GAME_HEIGHT < 720 ? 240 : GAME_WIDTH / 2 - (tabs.length * 68) / 2; // phone: right of the top-left minimap
    for (const [label, hk] of tabs) {
      this.tab(tx, 8, 64, 30, label, () => {
        if (hk === 'fullscreen') {
          if (scene.scale.isFullscreen) scene.scale.stopFullscreen();
          else if (scene.scale.fullscreen.available) scene.scale.startFullscreen();
        } else touchState.pending.hotkey = hk;
      });
      tx += 68;
    }

    // portrait phones: ask for landscape (the FIT scaler letterboxes heavily otherwise)
    this.rotateHint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, '📱 가로로 돌려 주세요', theme.textStyle(28, '#ffffff', { stroke: '#000', strokeThickness: 5 })).setOrigin(0.5).setVisible(false);
    this.add(this.rotateHint);
    this.updateOrientation();
    scene.scale.on(Phaser.Scale.Events.ORIENTATION_CHANGE, this.updateOrientation, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.updateOrientation, this);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.input.on(Phaser.Input.Events.GAME_OUT, this.releaseAll, this);

    this.setDepth(60);
    scene.add.existing(this);
  }

  destroy(fromScene?: boolean): void {
    const inp = this.scene?.input;
    inp?.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    inp?.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    inp?.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    inp?.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    inp?.off(Phaser.Input.Events.GAME_OUT, this.releaseAll, this);
    this.scene?.scale.off(Phaser.Scale.Events.ORIENTATION_CHANGE, this.updateOrientation, this);
    this.scene?.scale.off(Phaser.Scale.Events.RESIZE, this.updateOrientation, this);
    resetTouchState();
    touchState.enabled = false;
    super.destroy(fromScene);
  }

  setEnabled(on: boolean): void {
    this.setVisible(on);
    touchState.enabled = on;
    if (!on) this.releaseAll();
  }

  /** Screen-space hit test so the world ignores presses that land on a control. */
  hits(sx: number, sy: number): boolean {
    if (!this.visible) return false;
    if (Math.hypot(sx - this.stickCenter.x, sy - this.stickCenter.y) <= STICK_R + 16) return true;
    for (const b of [this.fireBtn, ...this.buttons]) if (Math.hypot(sx - b.x, sy - b.y) <= b.r + 6) return true;
    for (const t of this.tabs) if (sx >= t.x && sx < t.x + t.w && sy >= t.y && sy < t.y + t.h) return true;
    return false;
  }

  /** Debug/e2e snapshot. */
  snapshot(): { enabled: boolean; stick: { x: number; y: number }; fire: { x: number; y: number }; buttons: Record<string, { x: number; y: number }> } {
    const buttons: Record<string, { x: number; y: number }> = {};
    for (const b of this.buttons) buttons[b.label.replace('\n', '')] = { x: b.x, y: b.y };
    return { enabled: this.visible, stick: { ...this.stickCenter }, fire: { x: this.fireBtn.x, y: this.fireBtn.y }, buttons };
  }

  // --- pointer handling --------------------------------------------------------------------------

  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.visible) return;
    const { x, y } = p;
    if (this.stickPointer === null && Math.hypot(x - this.stickCenter.x, y - this.stickCenter.y) <= STICK_R + 16) {
      this.stickPointer = p.id;
      this.moveStick(x, y);
      return;
    }
    if (this.firePointer === null && Math.hypot(x - this.fireBtn.x, y - this.fireBtn.y) <= FIRE_R + 6) {
      this.firePointer = p.id;
      this.fireStart = { x, y };
      touchState.fireHeld = true;
      touchState.aimDir = null;
      this.fireBtn.gfx.setFillStyle(0xff4d4d, 0.8);
      return;
    }
    for (const b of this.buttons) {
      if (Math.hypot(x - b.x, y - b.y) <= b.r + 6) {
        this.held.set(p.id, b);
        b.gfx.setFillStyle(0xc9a227, 0.8);
        b.onDown?.();
        return;
      }
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.visible) return;
    if (p.id === this.stickPointer) this.moveStick(p.x, p.y);
    else if (p.id === this.firePointer) {
      const dx = p.x - this.fireStart.x;
      const dy = p.y - this.fireStart.y;
      const d = Math.hypot(dx, dy);
      touchState.aimDir = d >= AIM_MIN ? { x: dx / d, y: dy / d } : null;
      this.drawAim();
    }
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id === this.stickPointer) {
      this.stickPointer = null;
      this.centreStick();
    }
    if (p.id === this.firePointer) {
      this.firePointer = null;
      touchState.fireHeld = false;
      touchState.aimDir = null;
      this.fireBtn.gfx.setFillStyle(0xa32626, 0.55);
      this.aimLine.clear();
    }
    const b = this.held.get(p.id);
    if (b) {
      this.held.delete(p.id);
      b.gfx.setFillStyle(0x0b0e14, 0.5);
      b.onUp?.();
    }
  }

  private releaseAll(): void {
    this.stickPointer = null;
    this.firePointer = null;
    for (const b of this.held.values()) b.gfx.setFillStyle(0x0b0e14, 0.5);
    this.held.clear();
    this.centreStick();
    this.fireBtn.gfx.setFillStyle(0xa32626, 0.55);
    this.aimLine.clear();
    resetTouchState();
  }

  private moveStick(px: number, py: number): void {
    let dx = px - this.stickCenter.x;
    let dy = py - this.stickCenter.y;
    const d = Math.hypot(dx, dy);
    if (d > STICK_MAX) {
      dx = (dx / d) * STICK_MAX;
      dy = (dy / d) * STICK_MAX;
    }
    this.stickKnob.setPosition(this.stickCenter.x + dx, this.stickCenter.y + dy);
    const t = Math.min(1, d / STICK_MAX);
    if (d < 6) {
      touchState.moveDir = null;
      touchState.runHeld = false;
    } else {
      touchState.moveDir = { x: (px - this.stickCenter.x) / d, y: (py - this.stickCenter.y) / d };
      touchState.runHeld = t >= RUN_AT;
    }
    this.stickKnob.setFillStyle(touchState.runHeld ? 0xffd166 : 0xc9a227, 0.55 + t * 0.3);
  }

  private centreStick(): void {
    this.stickKnob.setPosition(this.stickCenter.x, this.stickCenter.y);
    this.stickKnob.setFillStyle(0xc9a227, 0.55);
    touchState.moveDir = null;
    touchState.runHeld = false;
  }

  private drawAim(): void {
    const g = this.aimLine;
    g.clear();
    const a = touchState.aimDir;
    if (!a) return;
    g.lineStyle(3, 0xff4d4d, 0.8);
    g.lineBetween(this.fireBtn.x, this.fireBtn.y, this.fireBtn.x + a.x * (FIRE_R + 30), this.fireBtn.y + a.y * (FIRE_R + 30));
  }

  private updateOrientation(): void {
    const portrait = String(this.scene.scale.orientation) === String(Phaser.Scale.PORTRAIT) || (typeof window !== 'undefined' && window.innerHeight > window.innerWidth * 1.1);
    this.rotateHint.setVisible(portrait);
  }

  // --- builders ----------------------------------------------------------------------------------

  private round(x: number, y: number, r: number, label: string, color: number): RoundButton {
    const gfx = this.scene.add.circle(x, y, r, color, 0.55).setStrokeStyle(2, 0xffffff, 0.45);
    const text = this.scene.add.text(x, y, label, theme.textStyle(r > 40 ? 18 : 12, '#ffffff', { fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: 3 })).setOrigin(0.5);
    this.add([gfx, text]);
    return { x, y, r, label, gfx, text };
  }

  private action(x: number, y: number, label: string, onDown: () => void): void {
    const b = this.round(x, y, BTN_R, label, 0x0b0e14);
    b.gfx.setFillStyle(0x0b0e14, 0.5).setStrokeStyle(2, 0xc9a227, 0.6);
    b.onDown = onDown;
    this.buttons.push(b);
  }

  private tab(x: number, y: number, w: number, h: number, label: string, onTap: () => void): void {
    const bg = this.scene.add.rectangle(x, y, w, h, 0x0b0e14, 0.6).setOrigin(0, 0).setStrokeStyle(1, 0xc9a227, 0.5).setInteractive({ useHandCursor: true });
    const t = this.scene.add.text(x + w / 2, y + h / 2, label, theme.textStyle(13, theme.colors.brass, { fontStyle: 'bold' })).setOrigin(0.5);
    bg.on('pointerdown', () => bg.setFillStyle(0x2a3038, 0.9));
    // fire on release: on phones touchstart/pointerdown is not a user activation, so requestFullscreen would be refused
    bg.on('pointerup', () => {
      bg.setFillStyle(0x0b0e14, 0.6);
      onTap();
    });
    bg.on('pointerout', () => bg.setFillStyle(0x0b0e14, 0.6));
    this.add([bg, t]);
    this.tabs.push({ x, y, w, h });
  }
}
