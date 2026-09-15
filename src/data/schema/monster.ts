import type { Faction, Skin } from './enums';
import type { TexKey } from '../textureKeys';

export type EnemyAi = 'melee' | 'banshee' | 'rangedKite' | 'assaulter' | 'burrower';

export interface MonsterDef {
  id: string;
  name: string;
  faction: Faction;
  skin: Skin;
  level: number;
  hp: number;
  defense: number;
  moveSpeed: number; // px/s
  ai: EnemyAi;
  attack: { dmg: number; reach: number; windupMs: number; cooldownMs: number };
  ranged?: { dmg: number; range: number; burst: number; burstIntervalMs: number; cooldownMs: number; accuracy: number; preferredRange: number };
  jump?: { minRange: number; maxRange: number; airMs: number; aoeRadius: number; dmgMult: number; cooldownMs: number };
  /** burrower (레이드 데스웜): fights on the surface, dives, tunnels toward the hunter, erupts with an AoE and (every N-th eruption) a larva brood */
  burrow?: { surfaceMs: number; burrowMs: number; speedMult: number; aoeRadius: number; dmgMult: number; summon?: { monsterId: string; count: number; everyN: number } };
  aggroRange: number;
  leashRange: number;
  fleeBelowHp?: number; // ratio
  xp: number;
  drops: { itemId: string; chance: number; qtyMin: number; qtyMax: number }[];
  wonMin: number;
  wonMax: number;
  tex: TexKey;
  scale?: number;
  bodyRadius: number;
  boss?: boolean;
}
