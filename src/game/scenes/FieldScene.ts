import { BaseWorldScene } from './BaseWorldScene';
import type { InputIntent } from '../systems/input/InputMapper';
import { gameState } from '../state/GameState';

/** 중곡동 거리: hunting field. Enemy spawning and combat systems attach here (M1-8). */
export class FieldScene extends BaseWorldScene {
  constructor() {
    super('Field');
  }

  protected onCreateWorld(): void {
    this.cameras.main.fadeIn(200, 0, 0, 0);
    gameState.message(`${this.def.name}에 진입했습니다. 좀비를 조심하세요.`, 'system');
  }

  protected onUpdateWorld(_intent: InputIntent, _delta: number): void {
    // spawn/combat systems arrive in M1-8
  }
}
