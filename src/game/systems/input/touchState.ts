import type { Vec2 } from '@core/math/vec';
import type { Hotkey } from './InputMapper';

export type TouchSetting = 'auto' | 'on' | 'off';

/** Edge-triggered button presses collected between frames (consumed by InputMapper.update). */
export interface TouchPending {
  jump: boolean;
  crouch: boolean;
  interact: boolean;
  subFire: boolean;
  hotkey: Hotkey | null;
}

/**
 * Shared state written by the on-screen `TouchControls` (UI scene) and read by `InputMapper`
 * (world scene). Kept as a plain singleton so the two scenes never need a reference to each other.
 */
export interface TouchState {
  /** true while the on-screen controls are shown */
  enabled: boolean;
  /** normalized left-stick vector, null when the stick is centred / untouched */
  moveDir: Vec2 | null;
  /** stick pushed past the run threshold */
  runHeld: boolean;
  /** fire button held */
  fireHeld: boolean;
  /** normalized fire-stick drag direction (twin-stick aim); null → auto-aim at nearest enemy */
  aimDir: Vec2 | null;
  pending: TouchPending;
}

const emptyPending = (): TouchPending => ({ jump: false, crouch: false, interact: false, subFire: false, hotkey: null });

export const touchState: TouchState = {
  enabled: false,
  moveDir: null,
  runHeld: false,
  fireHeld: false,
  aimDir: null,
  pending: emptyPending(),
};

/** Returns the queued presses and clears them. */
export function takePending(): TouchPending {
  const p = touchState.pending;
  touchState.pending = emptyPending();
  return p;
}

export function resetTouchState(): void {
  touchState.moveDir = null;
  touchState.runHeld = false;
  touchState.fireHeld = false;
  touchState.aimDir = null;
  touchState.pending = emptyPending();
}

/** Coarse pointer / touch capable device (or `?touch=1` for desktop testing). */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('touch') === '1') return true;
  const nav = window.navigator as Navigator & { msMaxTouchPoints?: number };
  const points = nav.maxTouchPoints ?? nav.msMaxTouchPoints ?? 0;
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return points > 0 && (coarse || 'ontouchstart' in window);
}

export function touchControlsEnabled(setting: TouchSetting): boolean {
  if (setting === 'on') return true;
  if (setting === 'off') return false;
  return isTouchDevice();
}
