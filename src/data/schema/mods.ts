/** Percent-style modifiers aggregated from skills and equipment. 0.1 = +10%. */
export interface StatMods {
  dmgPct: number;
  accPct: number;
  critPct: number;
  moveSpeedPct: number;
  maxHpPct: number;
  maxStaminaPct: number;
  maxApPct: number;
  defensePct: number;
  attackSpeedPct: number;
}

export const ZERO_MODS: StatMods = {
  dmgPct: 0,
  accPct: 0,
  critPct: 0,
  moveSpeedPct: 0,
  maxHpPct: 0,
  maxStaminaPct: 0,
  maxApPct: 0,
  defensePct: 0,
  attackSpeedPct: 0,
};

export function addMods(a: StatMods, b: Partial<StatMods>): StatMods {
  const out = { ...a };
  for (const k of Object.keys(b) as (keyof StatMods)[]) {
    out[k] += b[k] ?? 0;
  }
  return out;
}
