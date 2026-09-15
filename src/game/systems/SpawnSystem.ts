import type Phaser from 'phaser';
import type { MapDef } from '@data/schema/map';
import type { MonsterDef } from '@data/schema/monster';
import { registry } from '@data/registry';
import { gameRng } from '@core/rng';
import { tileCenter, type BuiltMap } from '@core/map/mapBuild';
import { initialZoneRuntime, pickSpawnTile, zoneOnDeath, zoneTick, type ZoneRuntime } from '@core/world/spawnRules';
import { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

const PLAYER_AVOID_TILES = 8;

/** Keeps each spawn zone populated per its rules and recycles slots when monsters die. */
export class SpawnSystem {
  private zones: ZoneRuntime[];

  constructor(
    private scene: Phaser.Scene,
    private def: MapDef,
    private built: BuiltMap,
    private enemies: Phaser.Physics.Arcade.Group,
    private player: Player,
    now: number,
  ) {
    this.zones = (def.spawnZones ?? []).map(() => initialZoneRuntime(now));
  }

  update(now: number): void {
    const zones = this.def.spawnZones ?? [];
    const ts = this.def.tileSize;
    const avoid = { x: Math.floor(this.player.x / ts), y: Math.floor(this.player.y / ts), radiusTiles: PLAYER_AVOID_TILES };
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      const r = zoneTick(z, this.zones[i], now, gameRng);
      if (!r.monsterId) continue;
      const tile = pickSpawnTile(z.rect, (x, y) => this.built.collision.isBlockedTile(x, y), avoid, gameRng);
      if (!tile) {
        this.zones[i] = { ...this.zones[i], nextSpawnAt: now + 500 };
        continue;
      }
      this.zones[i] = r.rt;
      const c = tileCenter(this.def, tile.x, tile.y);
      this.spawn(registry.monster(r.monsterId), c.x, c.y, now, i);
    }
  }

  spawn(def: MonsterDef, x: number, y: number, now: number, zoneIndex = -1): Enemy {
    const e = new Enemy(this.scene, x, y, def, now, zoneIndex);
    this.enemies.add(e);
    return e;
  }

  onDeath(e: Enemy, now: number): void {
    const z = this.def.spawnZones?.[e.zoneIndex];
    if (!z) return;
    this.zones[e.zoneIndex] = zoneOnDeath(z, this.zones[e.zoneIndex], now, gameRng);
  }
}
