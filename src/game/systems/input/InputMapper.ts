import Phaser from 'phaser';
import type { Vec2 } from '@core/math/vec';
import type { ControlScheme } from '@data/schema/enums';
import { gameState } from '../../state/GameState';

export type Hotkey = 'inventory' | 'status' | 'skills' | 'quest' | 'minimap' | 'menu' | `quick${number}`;

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
  private pendingHotkey: Hotkey | null = null;
  private pendingInteract = false;
  private pendingSpace = false;
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
      C: KC.C, E: KC.E,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    scene.input.mouse?.disableContextMenu();
    // Hotkeys are edge-triggered off the DOM event so even a sub-frame tap registers.
    kb.on('keydown', (ev: KeyboardEvent) => {
      if (typeof ev.getModifierState === 'function') this.capsLatch = ev.getModifierState('CapsLock');
      if (ev.repeat) return;
      if (ev.code === 'KeyE') this.pendingInteract = true;
      if (ev.code === 'Space') this.pendingSpace = true;
      const hk = this.hotkeyFor(ev.code);
      if (hk) this.pendingHotkey = hk;
    });
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (gameState.uiHit?.(p.x, p.y)) return; // click landed on a window
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

    const space = this.pendingSpace;
    this.pendingSpace = false;
    const interactPressed = this.pendingInteract;
    this.pendingInteract = false;

    let crouchPressed = false;
    let jumpPressed = false;
    if (this.scheme === 'classic') {
      if (space) {
        if (this.crouched) jumpPressed = true;
        else crouchPressed = true;
      }
    } else {
      if (jd(k.C)) crouchPressed = true;
      if (space) jumpPressed = true;
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

    const overUi = gameState.uiHit?.(pointer.x, pointer.y) ?? false;
    const fireHeld = !overUi && (this.scheme === 'classic' ? pointer.rightButtonDown() : pointer.leftButtonDown());

    const hotkey = this.pendingHotkey;
    this.pendingHotkey = null;

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
      interactPressed,
      hotkey,
    };
  }

  private hotkeyFor(code: string): Hotkey | null {
    switch (code) {
      case 'KeyI':
        return 'inventory';
      case 'KeyK':
        return 'skills';
      case 'KeyQ':
        return 'quest';
      case 'Tab':
        return 'minimap';
      case 'Escape':
        return 'menu';
      case 'KeyC':
        return this.scheme === 'classic' ? 'status' : null;
      case 'KeyV':
        return this.scheme === 'modern' ? 'status' : null;
    }
    const m = /^Digit([1-9])$/.exec(code);
    return m ? (`quick${Number(m[1])}` as Hotkey) : null;
  }

  hints(): string[] {
    return schemeHints(this.scheme);
  }
}

export function schemeHints(scheme: ControlScheme): string[] {
  return scheme === 'classic'
    ? ['좌클릭 이동 (NPC 클릭 = 대화)', 'Shift+클릭 달리기 · CapsLock 상시 달리기', '우클릭 공격 (마우스 방향)', 'Space 웅크리기 → 다시 Space 점프', 'Ctrl 서브연사 토글 · 1~9 퀵슬롯', 'I 인벤토리 · C 상태 · K 스킬 · Q 퀘스트 · Tab 지도 · Esc 메뉴']
    : ['WASD 이동 · Shift 달리기', '좌클릭 공격 (마우스 방향)', 'C 웅크리기 · Space 점프', 'E 상호작용 (NPC)', 'Ctrl 서브연사 토글 · 1~9 퀵슬롯', 'I 인벤토리 · V 상태 · K 스킬 · Q 퀘스트 · Tab 지도 · Esc 메뉴'];
}
