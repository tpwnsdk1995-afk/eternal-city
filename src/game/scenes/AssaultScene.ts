import { balance } from '@data/balance';
import { registry } from '@data/registry';
import type { AssaultDef } from '@data/schema/assault';
import { openGate, pointInRect, tileCenter } from '@core/map/mapBuild';
import { applyXp } from '@core/world/xp';
import { addItem } from '@core/inventory/inventory';
import { gameRng } from '@core/rng';
import {
  assaultProgressText,
  currentPhase,
  onAssaultEnemyDied,
  onAssaultPlayerDied,
  onObjectiveDestroyed,
  startAssault,
  tickAssault,
  type AssaultEvent,
  type AssaultRuntime,
} from '@core/assault/assaultMachine';
import { BaseWorldScene, type WorldSceneData } from './BaseWorldScene';
import type { InputIntent } from '../systems/input/InputMapper';
import { CombatBridge } from '../systems/CombatBridge';
import { refreshTiles } from '../systems/TilemapBuilder';
import { Objective } from '../entities/Objective';
import type { Enemy } from '../entities/Enemy';
import { gameState, type AssaultResult } from '../state/GameState';

const BANNER_INTERVAL_MS = 150;
const SUCCESS_LINGER_MS = 6000;

/**
 * 어설트 instance: a linear mission map driven by the pure assault machine. Spawns waves, tracks
 * objectives/gates, applies rewards, and returns the player to the safe zone.
 */
export class AssaultScene extends BaseWorldScene {
  private assaultId = 'assault-a';
  private adef!: AssaultDef;
  private rt!: AssaultRuntime;
  private objectives: Objective[] = [];
  private destroyedObjectives = new Set<string>();
  private finished = false;
  private bannerAt = 0;

  constructor() {
    super('Assault');
  }

  init(data: WorldSceneData): void {
    super.init(data);
    this.assaultId = data.assaultId ?? 'assault-a';
    this.objectives = [];
    this.destroyedObjectives = new Set();
    this.finished = false;
    this.bannerAt = 0;
  }

  protected onCreateWorld(): void {
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.adef = registry.assault(this.assaultId);
    this.objectives = (this.def.objectives ?? []).map((o) => new Objective(this, this.built, o));
    this.combat = new CombatBridge({
      scene: this,
      player: this.player,
      enemies: this.enemies,
      pickups: this.pickups,
      built: this.built,
      onPlayerDeath: () => this.onDeath(),
      onEnemyKilled: (e: Enemy) => this.onKilled(e),
      objectives: () => this.objectives.filter((o) => o.alive),
      onObjectiveDestroyed: (id: string) => this.onObjectiveDestroyed(id),
    });
    const s = startAssault(this.adef, this.time.now);
    this.rt = s.rt;
    gameState.message(`어설트 시작 — ${this.adef.name}`, 'system');
    this.handle(s.events);
  }

  protected onUpdateWorld(intent: InputIntent, delta: number): void {
    const now = this.time.now;
    this.combat!.update(intent, now, delta);
    if (!this.finished) {
      const step = tickAssault(this.rt, {
        now,
        playerInZone: (z) => {
          const r = this.def.zones?.[z];
          return !!r && pointInRect(this.def, this.player.x, this.player.y, r);
        },
      });
      this.rt = step.rt;
      this.handle(step.events);
    }
    if (now - this.bannerAt > BANNER_INTERVAL_MS) {
      this.bannerAt = now;
      this.emitBanner();
    }
  }

  /** Runtime snapshot for debug/e2e. */
  assaultSnapshot(): { status: string; phaseIndex: number; phaseKind: string | null; label: string | null; alive: number; objectivesLeft: string[]; kills: number } {
    const p = currentPhase(this.rt);
    return { status: this.rt.status, phaseIndex: this.rt.phaseIndex, phaseKind: p?.kind ?? null, label: p?.label ?? null, alive: this.rt.aliveWave, objectivesLeft: [...this.rt.objectivesLeft], kills: this.rt.kills };
  }

  /** Debug: destroy every remaining objective. */
  destroyAllObjectives(): void {
    for (const o of this.objectives.filter((x) => x.alive)) {
      o.damage(o.hp);
      this.onObjectiveDestroyed(o.def.id);
    }
  }

  private handle(events: AssaultEvent[]): void {
    for (const e of events) {
      switch (e.kind) {
        case 'phase':
          gameState.message(`▶ ${e.phase.label}`, 'system');
          this.combat!.floating.spawn(this.player.x, this.player.y - 30, e.phase.label, '#ffd166', 16, true);
          break;
        case 'spawn': {
          const sp = this.def.spawnPoints[e.spawnPoint];
          const c = tileCenter(this.def, sp.x, sp.y);
          const jitter = e.tag === 'boss' ? 0 : 20;
          const en = this.spawnEnemyAt(e.monsterId, c.x + gameRng.range(-jitter, jitter), c.y + gameRng.range(-jitter, jitter));
          if (en) en.tag = e.tag;
          break;
        }
        case 'openGate': {
          const gate = this.def.gates?.find((g) => g.id === e.gateId);
          if (!gate) break;
          const cells = openGate(this.built, gate);
          refreshTiles(this.tilemap, this.built, cells);
          this.cameras.main.shake(200, 0.004);
          gameState.message('봉쇄선 게이트가 열렸습니다! 동쪽으로 전진하세요.', 'good');
          break;
        }
        case 'success':
          this.finish(true);
          break;
        case 'failed':
          this.finish(false, e.reason);
          break;
      }
    }
  }

  private onKilled(e: Enemy): void {
    if (e.tag === 'wave' || e.tag === 'boss' || e.tag === 'adds') this.rt = onAssaultEnemyDied(this.rt, e.tag);
  }

  private onObjectiveDestroyed(id: string): void {
    if (this.destroyedObjectives.has(id)) return;
    const r = onObjectiveDestroyed(this.rt, id, this.def, this.destroyedObjectives);
    this.destroyedObjectives.add(id);
    this.rt = r.rt;
    gameState.message('바리케이드 파괴!', 'good');
    this.handle(r.events);
  }

  private onDeath(): void {
    const r = onAssaultPlayerDied(this.rt);
    this.rt = r.rt;
    this.handle(r.events);
    this.playerDied();
  }

  private finish(success: boolean, reason?: 'death' | 'timeout'): void {
    if (this.finished) return;
    this.finished = true;
    const timeSec = Math.round((this.time.now - this.rt.startedAt) / 1000);
    const result: AssaultResult = { name: this.adef.name, success, reason, won: 0, xp: 0, items: [], kills: this.rt.kills, timeSec };

    if (success) {
      const R = this.adef.rewards;
      result.won = R.won;
      result.xp = R.xp;
      let inv = gameState.inventory;
      for (const it of R.items) {
        if (!gameRng.chance(it.chance)) continue;
        const def = registry.item(it.itemId);
        inv = addItem(inv, def, it.qty);
        result.items.push({ name: def.name, qty: it.qty });
      }
      gameState.setInventory(inv);
      const xr = applyXp({ ...gameState.character, won: gameState.character.won + R.won }, R.xp);
      gameState.setCharacter(xr.character);
      if (xr.levelUps.length) {
        const d = gameState.derived();
        gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
        gameState.message(`레벨 업! Lv.${xr.character.level}`, 'good');
      }
      gameState.message(`어설트 성공! ₩${R.won.toLocaleString('ko-KR')} · ${R.xp} XP 획득`, 'good');
      this.time.delayedCall(SUCCESS_LINGER_MS, () => this.goToMap(balance.death.respawnMap, balance.death.respawnPoint));
    } else {
      const penalty = Math.min(gameState.character.won, this.adef.failPenalty.won);
      result.won = -penalty;
      gameState.setCharacter({ ...gameState.character, won: gameState.character.won - penalty });
      gameState.message(`어설트 실패 (${reason === 'timeout' ? '시간 초과' : '사망'}) — ₩${penalty.toLocaleString('ko-KR')} 차감`, 'bad');
      if (reason === 'timeout') this.time.delayedCall(3000, () => this.goToMap(balance.death.respawnMap, balance.death.respawnPoint));
    }
    gameState.events.emit('assaultResult', result);
    gameState.events.emit('assault', null);
  }

  private emitBanner(): void {
    if (this.finished) return;
    const p = currentPhase(this.rt);
    const boss = (this.enemies.getChildren() as Enemy[]).find((e) => e.alive && e.def.boss);
    gameState.events.emit('assault', {
      name: this.adef.name,
      phaseLabel: p ? `${this.rt.phaseIndex + 1}/${this.adef.phases.length}  ${p.label}` : '',
      progress: assaultProgressText(this.rt),
      elapsedSec: Math.floor((this.time.now - this.rt.startedAt) / 1000),
      boss: boss ? { name: boss.def.name, hp: boss.hp, max: boss.maxHp } : null,
    });
  }
}
