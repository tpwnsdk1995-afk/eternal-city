import type { WeaponClass } from '@data/schema/enums';
import { addMods, ZERO_MODS, type StatMods } from '@data/schema/mods';
import { learnedRank, type SkillLookup, type SkillState } from './skillState';

/** Aggregates modifiers from active skills. 웨폰마스터리 only counts when its weapon class is equipped. */
export function aggregateMods(state: SkillState, lookup: SkillLookup, equippedClass: WeaponClass | null): StatMods {
  let mods = ZERO_MODS;
  for (const id of Object.values(state.active)) {
    if (!id) continue;
    const def = lookup(id);
    if (def.category === '웨폰마스터리' && def.weaponClass !== equippedClass) continue;
    const rank = learnedRank(state, id);
    const scaled: Partial<StatMods> = {};
    for (const [k, v] of Object.entries(def.modsPerRank) as [keyof StatMods, number][]) scaled[k] = v * rank;
    mods = addMods(mods, scaled);
  }
  return mods;
}
