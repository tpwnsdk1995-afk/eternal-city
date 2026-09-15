import { BaseWorldScene } from './BaseWorldScene';
import type { InputIntent } from '../systems/input/InputMapper';
import { SpawnSystem } from '../systems/SpawnSystem';
import { CombatBridge } from '../systems/CombatBridge';
import type { Enemy } from '../entities/Enemy';
import { gameState } from '../state/GameState';

/** 중곡동 거리: open hunting field with zone spawns and full combat. */
export class FieldScene extends BaseWorldScene {
  private spawner!: SpawnSystem;

  constructor() {
    super('Field');
  }

  protected onCreateWorld(): void {
    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.spawner = new SpawnSystem(this, this.def, this.built, this.enemies, this.player, this.time.now);
    this.combat = new CombatBridge({
      scene: this,
      player: this.player,
      enemies: this.enemies,
      pickups: this.pickups,
      built: this.built,
      onPlayerDeath: () => this.playerDied(),
      onEnemyKilled: (e: Enemy) => this.spawner.onDeath(e, this.time.now),
    });
    gameState.message(`${this.def.name}에 진입했습니다. 좀비를 조심하세요.`, 'system');
  }

  protected onUpdateWorld(intent: InputIntent, delta: number): void {
    const now = this.time.now;
    this.spawner.update(now);
    this.combat!.update(intent, now, delta);
  }
}
