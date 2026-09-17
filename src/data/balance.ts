/** Tunable game constants. Formulas in `core/` read from here so balance passes don't touch logic. */
export const balance = {
  stats: {
    creationPoints: 5,
    pointsPerLevel: 5,
    bonusPointsAtLevels: [31, 41, 51, 61, 71, 81, 91] as readonly number[],
    bonusPoints: 5,
    baseCap: 350,
    capPerRebirth: 15,
    maxRebirth: 10,
    absoluteCap: 600,
    startingLevelForCapUnlock: 100,
    /** 환생 gate and the extra starting points each rebirth grants */
    rebirthLevel: 50,
    rebirthBonusPoints: 10,
  },
  derived: {
    hpBase: 100,
    hpPerVit: 8,
    hpPerLevel: 4,
    staminaBase: 100,
    staminaPerEnd: 6,
    apBase: 50,
    apPerInt: 4,
    intPerTechGrade: 10,
    moveSpeedBase: 150,
    moveSpeedPerSpd: 0.6,
    runMult: 1.6,
    crouchMult: 0.5,
    overweightMult: 0.6,
    attackSpeedPerSpd: 0.0015,
    consciousnessPerVitality: 0.0025,
    consciousnessMax: 0.5,
    consciousnessInvulnMs: 2000,
    consciousnessCooldownMs: 30_000,
    meleePerVit: 0.02,
    rangedPerTech: 0.02,
    critBase: 0.03,
    critPerTech: 0.0006,
    critMax: 0.5,
    critMultBase: 1.5,
    critMultPerTech: 0.001,
    accPerTech: 0.0015,
    accDistancePenalty: 0.15,
    accMovingPenalty: 0.03,
    accCrouchBonus: 0.05,
    accMin: 0.05,
    accMax: 0.98,
    spreadReductionPerTech: 0.002,
    spreadMinMult: 0.3,
    /** widest half-angle a single-bullet weapon can reach after stance multipliers (pellet guns exempt) */
    spreadCapDeg: 7,
  },
  stamina: {
    runDrainPerSec: 12,
    jumpCost: 15,
    regenPerSec: 8,
    regenDelayMs: 800,
  },
  ap: {
    regenPerSec: 2,
  },
  xp: {
    levelExponent: 1.8,
    levelBase: 100,
    killLevelGapGrace: 5,
    killLevelGapPenaltyPerLevel: 0.1,
    killMinMult: 0.1,
    killMult: 5, // kills give 5x the monster's listed xp (early game felt too slow)
  },
  combat: {
    varianceMin: 0.9,
    varianceMax: 1.1,
    burnThresholdPct: 0.1,
    burnDurationMs: 13_000,
    burnPctPerSec: 0.01,
    burnVulnMult: 1.5,
    slugKnockbackPx: 96,
    slugKnockbackMs: 150,
    slugWallBonus: 0.5,
    minDamage: 1,
    defaultSubFire: { rpm: 120, dmgMult: 0.5 },
  },
  weight: {
    base: 140,
    perVit: 1,
    perEnd: 1,
  },
  /** 광진구청 보관함: stacks it can hold (weight is never counted while stored) */
  storage: { slots: 100 },
  death: {
    wonLossPct: 0.05,
    xpLossPct: 0,
    dropItems: false,
    respawnHpPct: 0.5,
    respawnMap: 'gwangjin-gucheong-parking',
    respawnPoint: 'default',
    /** chance one equipped item breaks on death (파방클 buff prevents it) */
    breakChance: 0.35,
    /** damaged weapon: −damage; damaged armour: −defense (fractions) */
    brokenWeaponPenalty: 0.2,
    brokenArmorPenalty: 0.25,
    /** repair price as a fraction of the item's base price */
    repairCostMult: 0.15,
  },
  assault: {
    /** Testing gate for the reception desk; null = real levelRange (e2e starts missions through the debug hook). */
    entryLevelOverride: 0 as number | null, // 2026-09-17: every assault open at any level
    /** 고급 어설트 scaling */
    advanced: { levelOffset: 10, rewardMult: 2, hpMult: 1.7, defenseBonus: 8, dmgMult: 1.4, xpMult: 1.6, wonMult: 1.5 },
    /** every assault (2026-09-17): tougher monsters to match the x50 clear rewards in src/data/assaults */
    hard: { hpMult: 2, dmgMult: 1.5 },
    /** 점수 비례 보상: kills + clear + time bonus → grade band → reward multiplier */
    scoring: {
      killPts: { A: 60, B: 80, C: 100 } as Record<'A' | 'B' | 'C', number>,
      clearPts: 1500,
      timePts: 2000,
      parBaseSec: 240,
      parPerPhaseSec: 90,
      advancedMult: 1.5,
      grades: [
        { grade: 'S', min: 4000, rewardMult: 1.3 },
        { grade: 'A', min: 3000, rewardMult: 1.15 },
        { grade: 'B', min: 2000, rewardMult: 1 },
        { grade: 'C', min: 0, rewardMult: 0.85 },
      ] as { grade: 'S' | 'A' | 'B' | 'C'; min: number; rewardMult: number }[],
    },
  },
  infected: {
    /** 감염체 racial bonuses: tougher and quicker, regenerates instead of using medkits well */
    mods: { maxHpPct: 0.15, moveSpeedPct: 0.1 },
    regenPctPerSec: 0.012,
    /** regen pauses this long after taking damage */
    regenDelayMs: 3000,
  },
  loot: {
    /** multipliers over each monster's own ₩ range and drop chances (2026-09-17: drops felt too stingy on phones) */
    wonMult: 10,
    dropChanceMult: 4,
    /** chance an armor drop rolls a 접두 (checked in order: 전설 first) */
    prefixChance: { 전설: 0.03, 고대: 0.1 } as Record<'고대' | '전설', number>,
  },
  tuning: {
    /** chance (%) that +n → +n+1 succeeds, n = 0..19 (2026-09-17: cap raised +9 → +20) */
    enhanceSuccessPct: [100, 100, 100, 100, 100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25] as readonly number[],
    maxEnhance: 20,
    enhanceDmgPerLevel: 0.15,
    /** cost = weapon price × base × (1 + level × perLevel) */
    enhanceCostBase: 0.12,
    enhanceCostPerLevel: 0.45,
    /** failure drops one level (never breaks); below this level a failure costs nothing but ₩ */
    enhanceSafeBelow: 1,
    maxPlusUp: 5,
    plusUpDefensePerLevel: 0.1,
    plusUpCostBase: 0.25,
    plusUpCostPerLevel: 0.5,
    uniqueMinEnhance: 7,
    uniqueSuccessPct: 30,
    uniqueCostMult: 1.2,
    /** 방어구 조합: chance the prefix steps up (없음→고대 / 고대→전설); the material is consumed either way */
    combineToAncientPct: 60,
    combineToLegendPct: 35,
    combineCostMult: 0.5,
    prefixDefenseMult: { 고대: 1.2, 전설: 1.4 } as Record<'고대' | '전설', number>,
  },
  ai: {
    stuckMs: 400,
    separationRadius: 22,
  },
} as const;
