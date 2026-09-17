import type { AssaultDef } from '@data/schema/assault';
import type { MonsterDef } from '@data/schema/monster';
import { balance } from '@data/balance';

const A = balance.assault.advanced;

/** 고급 어설트: same map and phases, higher entry level, doubled stakes. */
export function advancedOf(def: AssaultDef): AssaultDef {
  return {
    ...def,
    id: `${def.id}-adv`,
    name: `${def.name} (고급)`,
    advanced: true,
    levelRange: [def.levelRange[0] + A.levelOffset, def.levelRange[1]],
    rewards: {
      won: Math.round(def.rewards.won * A.rewardMult),
      xp: Math.round(def.rewards.xp * A.rewardMult),
      items: def.rewards.items.map((it) => ({ ...it, chance: Math.min(1, it.chance * 1.5) })),
    },
    failPenalty: { won: Math.round(def.failPenalty.won * A.rewardMult) },
  };
}

/** Monsters inside a 고급 어설트 hit harder and last longer. */
export function advancedMonster(def: MonsterDef): MonsterDef {
  return {
    ...def,
    name: `${def.name} (고급)`,
    level: def.level + A.levelOffset,
    hp: Math.round(def.hp * A.hpMult),
    defense: def.defense + A.defenseBonus,
    attack: { ...def.attack, dmg: Math.round(def.attack.dmg * A.dmgMult) },
    ranged: def.ranged ? { ...def.ranged, dmg: Math.round(def.ranged.dmg * A.dmgMult) } : undefined,
    xp: Math.round(def.xp * A.xpMult),
    wonMin: Math.round(def.wonMin * A.wonMult),
    wonMax: Math.round(def.wonMax * A.wonMult),
  };
}

/** Every assault: monsters last longer and hit harder (clear rewards were raised x50 to match). */
export function hardMonster(def: MonsterDef, power = 1): MonsterDef {
  const H = balance.assault.hard;
  return {
    ...def,
    hp: Math.round(def.hp * H.hpMult * power),
    attack: { ...def.attack, dmg: Math.round(def.attack.dmg * H.dmgMult * power) },
    ranged: def.ranged ? { ...def.ranged, dmg: Math.round(def.ranged.dmg * H.dmgMult * power) } : undefined,
  };
}

/** Short description of how a mission plays, from its phase kinds. */
export function assaultStyle(def: AssaultDef): string {
  const kinds = new Set(def.phases.map((p) => p.kind));
  if (kinds.has('defend')) return '거점 방어';
  if (kinds.has('destroy')) return '기물 파괴 전진';
  if (kinds.has('boss')) return '보스 사냥';
  return '소탕';
}
