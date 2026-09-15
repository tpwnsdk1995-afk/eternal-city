import { TypedEmitter } from '@core/events';
import { createCharacter, type CharacterCore, type Vitals } from '@core/stats/character';
import { derivedStats, type DerivedStats } from '@core/stats/derived';
import { addItem, createInventory, type Inventory } from '@core/inventory/inventory';
import { emptyEquipment, equippedWeapon, equipStack, totalDefense, type Equipment } from '@core/inventory/equipment';
import { emptySkillState, type SkillState } from '@core/skills/skillState';
import { aggregateMods } from '@core/skills/modifiers';
import { initialFireState, type FireState } from '@core/weapons/fireController';
import { emptyStatus, type StatusState } from '@core/combat/statusEffects';
import type { ConsciousnessState } from '@core/combat/consciousness';
import { balance } from '@data/balance';
import { registry } from '@data/registry';
import type { ControlScheme } from '@data/schema/enums';
import type { StatMods } from '@data/schema/mods';
import { STARTER_KIT } from '@data/starterKit';
import type { MinimapInfo, WorldSnapshot } from '../systems/Minimap';

export interface Settings {
  controlScheme: ControlScheme;
  showFps: boolean;
  showMinimap: boolean;
}

export interface AssaultHud {
  name: string;
  phaseLabel: string;
  progress: string;
  elapsedSec: number;
  boss: { name: string; hp: number; max: number } | null;
}

export interface AssaultResult {
  name: string;
  success: boolean;
  reason?: 'death' | 'timeout';
  won: number; // negative on failure penalty
  xp: number;
  items: { name: string; qty: number }[];
  kills: number;
  timeSec: number;
}

export interface GameEvents extends Record<string, unknown> {
  vitals: Vitals;
  character: CharacterCore;
  inventory: Inventory;
  equipment: Equipment;
  skills: SkillState;
  fire: FireState;
  message: { text: string; tone?: 'info' | 'good' | 'bad' | 'system' };
  mapChanged: { mapId: string; name: string; minimap: MinimapInfo | null };
  settings: Settings;
  hotkey: string;
  npcInteract: { npcId: string };
  startAssault: { assaultId: string };
  assault: AssaultHud | null;
  assaultResult: AssaultResult;
  menu: undefined;
  goTitle: undefined;
}

/**
 * Runtime game state — a single mutable object the Phaser layer reads and core logic updates
 * through the setters below. Every setter emits so the HUD/windows can re-render.
 */
class GameState {
  readonly events = new TypedEmitter<GameEvents>();

  character: CharacterCore = createCharacter('주인공', balance.stats.creationPoints);
  vitals: Vitals = { hp: 1, stamina: 1, ap: 1 };
  inventory: Inventory = createInventory();
  equipment: Equipment = emptyEquipment();
  skills: SkillState = emptySkillState();
  fire: FireState = initialFireState();
  status: StatusState = emptyStatus();
  consciousness: ConsciousnessState = { lastTriggeredAt: -Infinity };
  currentMapId: string = balance.death.respawnMap;
  settings: Settings = { controlScheme: 'classic', showFps: false, showMinimap: true };
  /** Set by the active world scene so the HUD can draw live minimap markers. */
  worldProvider: (() => WorldSnapshot) | null = null;
  /** Latest minimap texture info (the UI scene may start a frame after `mapChanged`). */
  minimap: MinimapInfo | null = null;
  flags: Record<string, boolean | number> = {};
  playtimeMs = 0;
  /** Set by the UI layer: true when a window covers this screen point (world input ignores it). */
  uiHit: ((sx: number, sy: number) => boolean) | null = null;

  newGame(name: string): void {
    this.character = { ...createCharacter(name, balance.stats.creationPoints), won: STARTER_KIT.won };
    this.inventory = createInventory();
    for (const it of STARTER_KIT.items) this.inventory = addItem(this.inventory, registry.item(it.itemId), it.qty, { grade: 'grade' in it ? it.grade : undefined });
    this.equipment = emptyEquipment();
    const weaponStack = this.inventory.items.find((s) => s.itemId === STARTER_KIT.equipWeaponItemId);
    if (weaponStack) {
      const r = equipStack(this.equipment, this.inventory, registry.item, weaponStack.uid, { level: 1, techGrade: 1 });
      if (r.ok) this.equipment = r.equipment;
    }
    this.skills = emptySkillState();
    this.fire = initialFireState();
    this.status = emptyStatus();
    this.consciousness = { lastTriggeredAt: -Infinity };
    this.currentMapId = balance.death.respawnMap;
    this.flags = {};
    const d = this.derived();
    this.vitals = { hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp };
    this.emitAll();
  }

  /** Active modifiers, with weapon mastery gated on the equipped class. */
  mods(): StatMods {
    const weapon = equippedWeapon(this.equipment, this.inventory, registry.item);
    return aggregateMods(this.skills, registry.skill, weapon?.def.class ?? null);
  }

  derived(): DerivedStats {
    return derivedStats(this.character.base, this.character.level, this.mods());
  }

  defense(): number {
    return totalDefense(this.equipment, this.inventory, registry.item) * (1 + this.mods().defensePct);
  }

  weapon() {
    return equippedWeapon(this.equipment, this.inventory, registry.item);
  }

  setVitals(v: Partial<Vitals>): void {
    const d = this.derived();
    this.vitals = {
      hp: Math.max(0, Math.min(d.maxHp, v.hp ?? this.vitals.hp)),
      stamina: Math.max(0, Math.min(d.maxStamina, v.stamina ?? this.vitals.stamina)),
      ap: Math.max(0, Math.min(d.maxAp, v.ap ?? this.vitals.ap)),
    };
    this.events.emit('vitals', this.vitals);
  }

  setCharacter(c: CharacterCore): void {
    this.character = c;
    this.events.emit('character', c);
  }

  setInventory(inv: Inventory): void {
    this.inventory = inv;
    this.events.emit('inventory', inv);
  }

  setEquipment(eq: Equipment): void {
    this.equipment = eq;
    this.events.emit('equipment', eq);
  }

  setSkills(s: SkillState): void {
    this.skills = s;
    this.events.emit('skills', s);
  }

  setFire(f: FireState): void {
    this.fire = f;
    this.events.emit('fire', f);
  }

  setSettings(s: Partial<Settings>): void {
    this.settings = { ...this.settings, ...s };
    this.events.emit('settings', this.settings);
  }

  /** Recent messages, kept so a HUD created after the emit can still show them. */
  readonly log: GameEvents['message'][] = [];

  message(text: string, tone: GameEvents['message']['tone'] = 'info'): void {
    const m = { text, tone };
    this.log.push(m);
    if (this.log.length > 20) this.log.shift();
    this.events.emit('message', m);
  }

  emitAll(): void {
    this.events.emit('character', this.character);
    this.events.emit('vitals', this.vitals);
    this.events.emit('inventory', this.inventory);
    this.events.emit('equipment', this.equipment);
    this.events.emit('skills', this.skills);
    this.events.emit('fire', this.fire);
    this.events.emit('settings', this.settings);
  }
}

export const gameState = new GameState();
