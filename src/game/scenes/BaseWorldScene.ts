import Phaser from 'phaser';
import type { MapDef } from '@data/schema/map';
import { registry } from '@data/registry';
import { TILE } from '@data/textureKeys';
import { buildMap, pointInRect, tileCenter, type BuiltMap } from '@core/map/mapBuild';
import { dist } from '@core/math/vec';
import { buildTilemap, type BuiltTilemap } from '../systems/TilemapBuilder';
import { InputMapper, type InputIntent } from '../systems/input/InputMapper';
import { balance } from '@data/balance';
import { Player } from '../entities/Player';
import { Npc, NPC_INTERACT_RADIUS } from '../entities/Npc';
import { Enemy } from '../entities/Enemy';
import type { CombatBridge } from '../systems/CombatBridge';
import { depthForY } from '../systems/facing';
import { buildMinimapTexture } from '../systems/Minimap';
import { gameState } from '../state/GameState';
import { saveService } from '../state/SaveService';
import { questService } from '../state/questService';
import { theme } from '../ui/theme';

/** World camera zoom: 32px tiles render at 48px, so characters read like the original's ~50px sprites. */
export const WORLD_ZOOM = 1.5;

export interface WorldSceneData {
  mapId?: string;
  spawn?: string;
  /** Assault scene only */
  assaultId?: string;
}

export function sceneKeyForMap(def: MapDef): string {
  if (def.safeZone) return 'SafeZone';
  if (def.id === 'junggok-blockade') return 'Assault';
  return 'Field';
}

/**
 * Shared plumbing for every map scene: tilemap from data, player + camera, input mapping,
 * portals, NPC proximity, and the HUD overlay scene.
 */
export abstract class BaseWorldScene extends Phaser.Scene {
  protected mapId!: string;
  protected spawnName = 'default';
  protected def!: MapDef;
  protected built!: BuiltMap;
  protected tilemap!: BuiltTilemap;
  protected player!: Player;
  protected mapper!: InputMapper;
  protected npcs: Npc[] = [];
  protected lastIntent!: InputIntent;
  enemies!: Phaser.Physics.Arcade.Group;
  pickups!: Phaser.Physics.Arcade.Group;
  protected combat: CombatBridge | null = null;
  private lightMask: Phaser.GameObjects.Graphics | null = null;
  private vendings: { x: number; y: number }[] = [];
  private portalArmed = false;
  private transitioning = false;

  init(data: WorldSceneData): void {
    this.mapId = data.mapId ?? gameState.currentMapId;
    this.spawnName = data.spawn ?? 'default';
    this.npcs = [];
    this.portalArmed = false;
    this.transitioning = false;
    this.lightMask = null;
  }

  create(): void {
    this.def = registry.map(this.mapId);
    this.built = buildMap(this.def);
    this.tilemap = buildTilemap(this, this.built);

    // portal glow tiles (visual only — walkability comes from the built map)
    for (const p of this.def.portals) {
      for (let y = p.rect.y; y < p.rect.y + p.rect.h; y++)
        for (let x = p.rect.x; x < p.rect.x + p.rect.w; x++) if (!this.built.collision.isBlockedTile(x, y)) this.tilemap.layer.putTileAt(TILE.portalGlow, x, y);
      const c = tileCenter(this.def, p.rect.x, p.rect.y);
      this.add
        .text(c.x + ((p.rect.w - 1) * this.def.tileSize) / 2, c.y - 24, p.label, theme.textStyle(12, '#9be7ff', { stroke: '#000', strokeThickness: 3 }))
        .setOrigin(0.5)
        .setDepth(8);
    }

    // street furniture: base at the bottom of its tile, y-sorted with characters
    this.vendings = [];
    for (const d of this.def.decor ?? []) {
      const ts = this.def.tileSize;
      const bx = d.at.x * ts + ts / 2;
      const by = (d.at.y + 1) * ts - 2;
      this.add.image(bx, by, d.tex).setOrigin(0.5, 1).setDepth(depthForY(by));
      if (d.interact === 'vending') this.vendings.push({ x: bx, y: by - 20 });
    }

    const w = this.def.width * this.def.tileSize;
    const h = this.def.height * this.def.tileSize;
    this.physics.world.setBounds(0, 0, w, h);

    const sp = this.def.spawnPoints[this.spawnName] ?? this.def.spawnPoints.default;
    const spawn = tileCenter(this.def, sp.x, sp.y);
    this.player = new Player(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player, this.tilemap.layer);

    this.enemies = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.physics.add.collider(this.enemies, this.tilemap.layer);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.player, this.enemies);

    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.setZoom(WORLD_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    if (this.def.dark) {
      // darkness with a soft light radius punched out around the player
      const dark = this.add.rectangle(0, 0, w, h, 0x02040a, 0.72).setOrigin(0, 0).setDepth(30);
      this.lightMask = this.make.graphics({ x: 0, y: 0 }, false);
      const mask = this.lightMask.createGeometryMask();
      mask.invertAlpha = true;
      dark.setMask(mask);
    }
    this.cameras.main.setBackgroundColor('#05070a');

    this.mapper = new InputMapper(this, gameState.settings.controlScheme);
    const offSettings = gameState.events.on('settings', (s) => this.mapper.setScheme(s.controlScheme));
    const offTitle = gameState.events.on('goTitle', () => this.backToTitle());
    const offTravel = gameState.events.on('travel', ({ mapId, spawn }) => this.goToMap(mapId, spawn));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offSettings();
      offTitle();
      offTravel();
    });

    for (const n of this.def.npcs ?? []) {
      const c = tileCenter(this.def, n.at.x, n.at.y);
      this.npcs.push(new Npc(this, c.x, c.y, registry.npc(n.id)));
    }

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.bringToTop('UI');

    gameState.currentMapId = this.mapId;
    gameState.worldProvider = () => ({
      player: { x: this.player.x, y: this.player.y },
      enemies: (this.enemies.getChildren() as Enemy[]).filter((e) => e.alive).map((e) => ({ x: e.x, y: e.y, boss: !!e.def.boss })),
      npcs: this.npcs.map((n) => ({ x: n.x, y: n.y })),
      pickups: (this.pickups.getChildren() as Phaser.GameObjects.Sprite[]).filter((p) => p.active).map((p) => ({ x: p.x, y: p.y })),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (gameState.worldProvider && this.scene.isActive() === false) gameState.worldProvider = null;
    });
    gameState.minimap = buildMinimapTexture(this, this.built);
    gameState.events.emit('mapChanged', { mapId: this.mapId, name: this.def.name, minimap: gameState.minimap });

    questService.onReach(this.mapId);
    this.onCreateWorld();
  }

  update(_time: number, delta: number): void {
    if (this.transitioning) return;
    const intent = this.mapper.update();
    this.lastIntent = intent;

    if (this.lightMask) {
      this.lightMask.clear();
      this.lightMask.fillStyle(0xffffff, 1);
      this.lightMask.fillCircle(this.player.x, this.player.y - 6, 190);
      for (const d of this.def.decor ?? []) {
        if (d.tex !== 'deco_lamp') continue;
        this.lightMask.fillCircle(d.at.x * this.def.tileSize + 16 + 16, (d.at.y + 1) * this.def.tileSize - 60, 110);
      }
    }

    if (intent.hotkey) gameState.events.emit('hotkey', intent.hotkey);

    // classic: clicking an NPC / vending machine interacts instead of walking
    let consumedClick = false;
    if (intent.clickedWorld) {
      const npc = this.npcs.find((n) => dist({ x: n.x, y: n.y }, intent.clickedWorld!) < 20);
      if (npc && dist(this.player.pos, { x: npc.x, y: npc.y }) <= NPC_INTERACT_RADIUS) {
        gameState.events.emit('npcInteract', { npcId: npc.def.id });
        consumedClick = true;
      } else {
        const v = this.vendings.find((p) => dist(p, intent.clickedWorld!) < 24);
        if (v && dist(this.player.pos, v) <= NPC_INTERACT_RADIUS + 16) {
          gameState.events.emit('npcInteract', { npcId: 'npc_vending' });
          consumedClick = true;
        }
      }
    }
    this.player.applyIntent(consumedClick ? { ...intent, clickedWorld: null } : intent, delta, this.mapper.scheme);

    // NPC proximity + E interaction
    let nearest: Npc | null = null;
    for (const n of this.npcs) {
      const near = dist(this.player.pos, { x: n.x, y: n.y }) <= NPC_INTERACT_RADIUS;
      n.setNear(near);
      if (near) nearest = n;
    }
    if (intent.interactPressed) {
      if (nearest) gameState.events.emit('npcInteract', { npcId: nearest.def.id });
      else if (this.vendings.some((v) => dist(this.player.pos, v) <= NPC_INTERACT_RADIUS + 16)) gameState.events.emit('npcInteract', { npcId: 'npc_vending' });
    }

    // portals: must step out of every portal once after arriving before they re-arm
    const inPortal = this.def.portals.find((p) => pointInRect(this.def, this.player.x, this.player.y, p.rect));
    if (!inPortal) this.portalArmed = true;
    else if (this.portalArmed) this.goToMap(inPortal.toMap, inPortal.toSpawn);

    this.onUpdateWorld(intent, delta);
  }

  /** Player world position (debug/e2e). */
  playerPos(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y };
  }

  /** World → screen (debug/e2e), accounting for camera scroll and zoom. */
  toScreen(x: number, y: number): { x: number; y: number } {
    const cam = this.cameras.main;
    return { x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom };
  }

  /** Scripted/debug spawn. Returns null on maps without combat. */
  spawnEnemyAt(monsterId: string, x: number, y: number): Enemy | null {
    if (!this.combat) return null;
    const e = new Enemy(this, x, y, registry.monster(monsterId), this.time.now);
    this.enemies.add(e);
    return e;
  }

  enemiesSnapshot(): { uid: string; id: string; hp: number; x: number; y: number; mode: string }[] {
    return (this.enemies.getChildren() as Enemy[]).filter((e) => e.alive).map((e) => ({ uid: e.uid, id: e.def.id, hp: e.hp, x: e.x, y: e.y, mode: e.brain.mode }));
  }

  /** Launcher rounds in flight (debug/e2e). */
  projectilesSnapshot(): { x: number; y: number; travelled: number; maxDist: number }[] {
    return this.combat?.projectilesSnapshot() ?? [];
  }

  /** Death → fade → respawn in the safe zone at half HP. */
  playerDied(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.time.delayedCall(1200, () => {
      const d = gameState.derived();
      gameState.setVitals({ hp: Math.max(1, Math.round(d.maxHp * balance.death.respawnHpPct)), stamina: d.maxStamina, ap: d.maxAp });
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('SafeZone', { mapId: balance.death.respawnMap, spawn: balance.death.respawnPoint } satisfies WorldSceneData);
      });
    });
  }

  goToMap(mapId: string, spawn: string): void {
    const target = registry.map(mapId);
    this.transitionTo(sceneKeyForMap(target), { mapId, spawn });
  }

  /** Enter an assault instance on its dedicated map. */
  startAssault(assaultId: string): void {
    const a = registry.assault(assaultId);
    this.transitionTo('Assault', { mapId: a.mapId, spawn: a.entrySpawn, assaultId });
  }

  /** Debug: move the player instantly. */
  teleport(x: number, y: number): void {
    this.player.stopMoving();
    this.player.setPosition(x, y);
  }

  /** Debug: kill every living enemy (with normal kill credit). */
  killAllEnemies(): void {
    if (!this.combat) return;
    for (const e of this.combat.aliveEnemies()) this.combat.killEnemy(e, this.time.now);
  }

  /** Save, then leave the world for the title screen. */
  private backToTitle(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.stopMoving();
    void saveService.save().finally(() => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.stop('UI');
        this.scene.start('Title');
      });
    });
  }

  private transitionTo(sceneKey: string, data: WorldSceneData): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.stopMoving();
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(sceneKey, data));
  }

  protected abstract onCreateWorld(): void;
  protected abstract onUpdateWorld(intent: InputIntent, delta: number): void;
}
