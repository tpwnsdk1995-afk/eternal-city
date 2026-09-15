import { balance } from '@data/balance';
import type { Stats } from '@data/schema/enums';
import { ZERO_MODS, type StatMods } from '@data/schema/mods';
import { techGrade } from './levelCurve';

export interface DerivedStats {
  maxHp: number;
  maxStamina: number;
  maxAp: number;
  techGrade: number;
  moveSpeed: number; // px/s walking
  attackSpeedMult: number;
  consciousnessChance: number;
  meleeMult: number;
  rangedMult: number;
  critChance: number;
  critMult: number;
  maxWeightKg: number;
}

const D = balance.derived;
const W = balance.weight;

export function derivedStats(base: Stats, level: number, mods: StatMods = ZERO_MODS): DerivedStats {
  const vit = base['체력'];
  const end = base['지구력'];
  const tech = base['기술'];
  const int = base['지능'];
  const spd = base['속도'];
  const life = base['생명력'];

  return {
    maxHp: Math.round((D.hpBase + vit * D.hpPerVit + level * D.hpPerLevel) * (1 + mods.maxHpPct)),
    maxStamina: Math.round((D.staminaBase + end * D.staminaPerEnd) * (1 + mods.maxStaminaPct)),
    maxAp: Math.round((D.apBase + int * D.apPerInt) * (1 + mods.maxApPct)),
    techGrade: techGrade(int),
    moveSpeed: (D.moveSpeedBase + spd * D.moveSpeedPerSpd) * (1 + mods.moveSpeedPct),
    attackSpeedMult: (1 + spd * D.attackSpeedPerSpd) * (1 + mods.attackSpeedPct),
    consciousnessChance: Math.min(D.consciousnessMax, life * D.consciousnessPerVitality),
    meleeMult: 1 + vit * D.meleePerVit,
    rangedMult: 1 + tech * D.rangedPerTech,
    critChance: Math.min(D.critMax, D.critBase + tech * D.critPerTech + mods.critPct),
    critMult: D.critMultBase + tech * D.critMultPerTech,
    maxWeightKg: W.base + vit * W.perVit + end * W.perEnd,
  };
}
