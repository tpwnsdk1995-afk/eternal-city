import { balance } from '@data/balance';
import type { AmmoKind, Skin } from '@data/schema/enums';
import type { StatMods } from '@data/schema/mods';
import type { Rng } from '../rng';
import { hitChance } from './accuracy';
import { MELEE_SKIN_MULT, skinMult } from './ammoSkinTable';

const C = balance.combat;

export interface AttackerCtx {
  baseDamage: number; // weapon base at grade 1
  grade: number;
  subFire: boolean;
  subFireDmgMult: number; // usually 0.5
  pellets: number; // 1 for non-shotguns
  isMelee: boolean;
  ammoKind: AmmoKind | null; // null for melee
  baseAccuracy: number;
  range: number;
  tech: number;
  statMult: number; // meleeMult or rangedMult from derivedStats
  critChance: number;
  critMult: number;
  mods: StatMods; // already filtered for mastery applicability
  moving: boolean;
  crouching: boolean;
}

export interface TargetCtx {
  skin: Skin;
  defense: number;
  maxHp: number;
  burning: boolean;
}

export interface HitResult {
  hit: boolean;
  crit: boolean;
  damage: number;
  appliesBurn: boolean;
  knockback: boolean;
}

export const MISS: HitResult = { hit: false, crit: false, damage: 0, appliesBurn: false, knockback: false };

export function gradeMult(grade: number): number {
  return Math.pow(C.gradeMult, Math.max(1, grade) - 1);
}

/** Resolves one pellet/round against a target. Call once per pellet for shotguns. */
export function computeHit(a: AttackerCtx, t: TargetCtx, dist: number, rng: Rng): HitResult {
  const chance = hitChance({ baseAccuracy: a.baseAccuracy, tech: a.tech, accMods: a.mods.accPct, dist, range: a.range, moving: a.moving, crouching: a.crouching });
  if (!rng.chance(chance)) return MISS;

  const base = a.baseDamage * gradeMult(a.grade) * (a.subFire ? a.subFireDmgMult : 1) * (1 / Math.max(1, a.pellets));
  const skin = a.isMelee || !a.ammoKind ? MELEE_SKIN_MULT[t.skin] : skinMult(a.ammoKind, t.skin);
  const mastery = 1 + a.mods.dmgPct;
  const burn = t.burning && a.ammoKind !== '소이탄' ? C.burnVulnMult : 1;
  const crit = rng.chance(a.critChance);
  const variance = rng.range(C.varianceMin, C.varianceMax);

  const raw = base * a.statMult * skin * mastery * burn * (crit ? a.critMult : 1) * variance;
  const damage = Math.max(C.minDamage, Math.round((raw * 100) / (100 + Math.max(0, t.defense))));

  return {
    hit: true,
    crit,
    damage,
    appliesBurn: a.ammoKind === '소이탄' && damage >= C.burnThresholdPct * t.maxHp,
    knockback: a.ammoKind === 'Slug',
  };
}
