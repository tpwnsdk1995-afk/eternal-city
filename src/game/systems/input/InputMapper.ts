import Phaser from 'phaser';
import type { Vec2 } from '@core/math/vec';
import type { ControlScheme } from '@data/schema/enums';

export type Hotkey = 'inventory' | 'status' | 'skills' | 'minimap' | 'menu' | `quick${number}`;

export interface InputIntent {
  /** classic: world position of the latest LMB press (null when none this frame) */
  clickedWorld: Vec2 | null;
  clickedWithShift: boolean;
  /** modern: normalized WASD vector */
  moveDir: Vec2 | null;
  runHeld: boolean;
  runToggled: boolean; // CapsLock latch (classic)
  crouchPressed: boolean; // toggle request
  jumpPressed: boolean;
  aimWorld: Vec2;
  fireHeld: boolean;
  subFirePressed: boolean;
  interactPressed: boolean;
  hotkey: Hotkey | null;
}

const KC = Phaser.Input.Keyboard.KeyCodes;

/**
 * Translates raw keyboard/mouse into an `InputIntent` under the active control scheme so that
 * scenes and entities never read the input plugin directly.
 *
 * classic (원작): LMB move · Shift+LMB run · CapsLock run latch · RMB fire · Space crouch/jump · Ctrl sub-fire
 * modern: WASD move · Shift run · LMB fire · C crouch · Space jump · E interact · Ctrl sub-fire
 */
export class InputMapper {
  scheme: ControlScheme;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private capsLatch = false;
  private pendingClick: { x: number; y: number; shift: boolean } | null = null;
  private crouched = false;

  constructor(
    private scene: Phaser.Scene,
    scheme: ControlScheme,
  ) {
    this.scheme = scheme;
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys({
      W: KC.W, A: KC.A, S: KC.S, D: KC.D,
      SHIFT: KC.SHIFT, CTRL: KC.CTRL, SPACE: KC.SPACE,
      C: KC.C, V: KC.V, E: KC.E, I: KC.I, K: KC.K, TAB: KC.TAB, ESC: KC.ESC,
      ONE: KC.ONE, TWO: KC.TWO, THREE: KC.THREE, FOUR: KC.FOUR, FIVE: KC.FIVE,
      SIX: KC.SIX, SEVEN: KC.SEVEN, EIGHT: KC.EIGHT, NINE: KC.NINE,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    scene.input.mouse?.disableContextMenu();
    kb.on('keydown', (ev: KeyboardEvent) => {
      if (typeof ev.getModifierState === 'function') this.capsLatch = ev.getModifierState('CapsLock');
    });
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) this.pendingClick = { x: p.worldX, y: p.worldY, shift: p.event.shiftKey };
    });
    // Tab would move browser focus; keep it in-game.
    kb.addCapture([KC.TAB, KC.SPACE]);
  }

  setScheme(scheme: ControlScheme): void {
    this.scheme = scheme;
    this.pendingClick = null;
  }

  /** True while the character is in the crouched stance (classic Space toggles it). */
  get isCrouched(): boolean {
    return this.crouched;
  }

  setCrouched(v: boolean): void {
    this.crouched = v;
  }

  update(): InputIntent {
    const k = this.keys;
    const jd = Phaser.Input.Keyboard.JustDown;
    const pointer = this.scene.input.activePointer;
    const aimWorld = { x: pointer.worldX, y: pointer.worldY };

    const click = this.pendingClick;
    this.pendingClick = null;

    let crouchPressed = false;
    let jumpPressed = false;
    if (this.scheme === 'classic') {
      if (jd(k.SPACE)) {
        if (this.crouched) jumpPressed = true;
        else crouchPressed = true;
      }
    } else {
      if (jd(k.C)) crouchPressed = true;
      if (jd(k.SPACE)) jumpPressed = true;
    }

    let moveDir: Vec2 | null = null;
    if (this.scheme === 'modern') {
      const x = (k.D.isDown ? 1 : 0) - (k.A.isDown ? 1 : 0);
      const y = (k.S.isDown ? 1 : 0) - (k.W.isDown ? 1 : 0);
      if (x || y) {
        const l = Math.hypot(x, y);
        moveDir = { x: x / l, y: y / l };
      }
    }

    const fireHeld = this.scheme === 'classic' ? pointer.rightButtonDown() : pointer.leftButtonDown();

    let hotkey: Hotkey | null = null;
    if (jd(k.I)) hotkey = 'inventory';
    else if (jd(k.K)) hotkey = 'skills';
    else if (jd(k.TAB)) hotkey = 'minimap';
    else if (jd(k.ESC)) hotkey = 'menu';
    else if (this.scheme === 'classic' ? jd(k.C) : jd(k.V)) hotkey = 'status';
    else {
      const digits = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
      for (let i = 0; i < digits.length; i++) if (jd(k[digits[i]])) hotkey = `quick${i + 1}`;
    }

    return {
      clickedWorld: this.scheme === 'classic' && click ? { x: click.x, y: click.y } : null,
      clickedWithShift: !!click?.shift,
      moveDir,
      runHeld: k.SHIFT.isDown,
      runToggled: this.scheme === 'classic' && this.capsLatch,
      crouchPressed,
      jumpPressed,
      aimWorld,
      fireHeld,
      subFirePressed: jd(k.CTRL),
      interactPressed: jd(k.E),
      hotkey,
    };
  }

  hints(): string[] {
    return this.scheme === 'classic'
      ? ['좌클릭 이동', 'Shift+클릭 달리기', 'CapsLock 상시 달리기', '우클릭 공격', 'Space 웅크리기/점프', 'Ctrl 서브연사', 'I 인벤토리 · C 상태 · K 스킬']
      : ['WASD 이동', 'Shift 달리기', '좌클릭 공격', 'C 웅크리기', 'Space 점프', 'E 상호작용', 'Ctrl 서브연사', 'I 인벤토리 · V 상태 · K 스킬'];
  }
}
