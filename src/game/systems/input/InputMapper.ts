import Phaser from 'phaser';
import type { Vec2 } from '@core/math/vec';
import type { ControlScheme } from '@data/schema/enums';
import { gameState } from '../../state/GameState';
import { takePending, touchState } from './touchState';

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
    let aimWorld: Vec2 = { x: pointer.worldX, y: pointer.worldY };
    const touch = touchState.enabled ? touchState : null;
    const tp = touch ? takePending() : null;

    const click = this.pendingClick;
    this.pendingClick = null;

    const space = this.pendingSpace;
    this.pendingSpace = false;
    const interactPressed = this.pendingInteract || !!tp?.interact;
    this.pendingInteract = false;

    let crouchPressed = !!tp?.crouch;
    let jumpPressed = !!tp?.jump;
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
    // virtual stick drives movement under either scheme
    if (touch?.moveDir) moveDir = touch.moveDir;

    const overUi = gameState.uiHit?.(pointer.x, pointer.y) ?? false;
    let fireHeld = !overUi && (this.scheme === 'classic' ? pointer.rightButtonDown() : pointer.leftButtonDown());

    if (touch) {
      // Touch aiming: fire-stick drag → that direction; plain press → nearest enemy; otherwise
      // face the way we walk (aimWorld on the body makes Player fall back to movement facing).
      const me = gameState.worldProvider?.().player;
      if (me) {
        if (touch.fireHeld && touch.aimDir) aimWorld = { x: me.x + touch.aimDir.x * 240, y: me.y + touch.aimDir.y * 240 };
        else if (touch.fireHeld) aimWorld = nearestEnemy(me) ?? (moveDir ? { x: me.x + moveDir.x * 240, y: me.y + moveDir.y * 240 } : { x: me.x + Math.cos(this.lastAim) * 240, y: me.y + Math.sin(this.lastAim) * 240 });
        else if (!fireHeld) aimWorld = { x: me.x, y: me.y };
        if (aimWorld.x !== me.x || aimWorld.y !== me.y) this.lastAim = Math.atan2(aimWorld.y - me.y, aimWorld.x - me.x);
      }
      if (touch.fireHeld) fireHeld = true;
    }

    const hotkey = this.pendingHotkey ?? tp?.hotkey ?? null;
    this.pendingHotkey = null;

    return {
      clickedWorld: this.scheme === 'classic' && click ? { x: click.x, y: click.y } : null,
      clickedWithShift: !!click?.shift,
      moveDir,
      runHeld: k.SHIFT.isDown || !!touch?.runHeld,
      runToggled: this.scheme === 'classic' && this.capsLatch,
      crouchPressed,
      jumpPressed,
      aimWorld,
      fireHeld,
      subFirePressed: jd(k.CTRL) || !!tp?.subFire,
      interactPressed,
      hotkey,
    };
  }

  private lastAim = 0;

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

/** Closest living enemy within auto-aim range (touch fire without a drag), or null. */
function nearestEnemy(me: Vec2): Vec2 | null {
  const snap = gameState.worldProvider?.();
  if (!snap) return null;
  let best: Vec2 | null = null;
  let bestD = 520;
  for (const e of snap.enemies) {
    const d = Math.hypot(e.x - me.x, e.y - me.y);
    if (d < bestD) {
      bestD = d;
      best = { x: e.x, y: e.y };
    }
  }
  return best;
}

export function touchHints(): string[] {
  return ['왼쪽 스틱 이동 · 끝까지 밀면 달리기', '공격 버튼: 누르면 가까운 적 자동 조준 · 끌면 그 방향 조준', '점프 · 웅크림 · 대화 · 서브연사 버튼', '위쪽 탭: 인벤 · 상태 · 스킬 · 퀘스트 · 지도 · 메뉴 · 전체화면', '퀵슬롯은 HUD를 직접 탭'];
}

export function schemeHints(scheme: ControlScheme): string[] {
  return scheme === 'classic'
    ? ['좌클릭 이동 (NPC 클릭 = 대화)', 'Shift+클릭 달리기 · CapsLock 상시 달리기', '우클릭 공격 (마우스 방향)', 'Space 웅크리기 → 다시 Space 점프', 'Ctrl 서브연사 토글 · 1~9 퀵슬롯', 'I 인벤토리 · C 상태 · K 스킬 · Q 퀘스트 · Tab 지도 · Esc 메뉴']
    : ['WASD 이동 · Shift 달리기', '좌클릭 공격 (마우스 방향)', 'C 웅크리기 · Space 점프', 'E 상호작용 (NPC)', 'Ctrl 서브연사 토글 · 1~9 퀵슬롯', 'I 인벤토리 · V 상태 · K 스킬 · Q 퀘스트 · Tab 지도 · Esc 메뉴'];
}
