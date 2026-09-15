import Phaser from 'phaser';
import { BaseWorldScene } from './BaseWorldScene';
import type { InputIntent } from '../systems/input/InputMapper';
import { gameState } from '../state/GameState';

const REGEN_HP_PER_SEC = 4;

/** 광진구청 지하주차장: no enemies, slow HP regen, NPCs, respawn point, assault departure. */
export class SafeZoneScene extends BaseWorldScene {
  constructor() {
    super('SafeZone');
  }

  protected onCreateWorld(): void {
    this.cameras.main.fadeIn(200, 0, 0, 0);
    gameState.message(`${this.def.name} — 안전지역입니다.`, 'system');
    const off = gameState.events.on('startAssault', ({ assaultId }) => this.startAssault(assaultId));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }

  protected onUpdateWorld(_intent: InputIntent, delta: number): void {
    const d = gameState.derived();
    if (gameState.vitals.hp < d.maxHp) gameState.setVitals({ hp: gameState.vitals.hp + REGEN_HP_PER_SEC * (delta / 1000) });
  }
}
