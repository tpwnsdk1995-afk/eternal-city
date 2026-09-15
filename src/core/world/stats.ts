import type { MonsterDef } from '@data/schema/monster';
import type { Faction } from '@data/schema/enums';

/** Lifetime counters that campaigns and achievements read. Saved with the character. */
export interface PlayerStats {
  kills: number;
  bossKills: number;
  killsByMonster: Record<string, number>;
  killsByFaction: Partial<Record<Faction, number>>;
  /** successful clears per assault id (고급 clears also count toward the base mission) */
  assaultClears: Record<string, number>;
  assaultFails: number;
  questsCompleted: number;
  deaths: number;
  /** ₩ picked up or rewarded (spending is not subtracted) */
  wonEarned: number;
  maxEnhance: number;
}

export const emptyStats = (): PlayerStats => ({
  kills: 0,
  bossKills: 0,
  killsByMonster: {},
  killsByFaction: {},
  assaultClears: {},
  assaultFails: 0,
  questsCompleted: 0,
  deaths: 0,
  wonEarned: 0,
  maxEnhance: 0,
});

export function recordKill(s: PlayerStats, m: MonsterDef): PlayerStats {
  return {
    ...s,
    kills: s.kills + 1,
    bossKills: s.bossKills + (m.boss ? 1 : 0),
    killsByMonster: { ...s.killsByMonster, [m.id]: (s.killsByMonster[m.id] ?? 0) + 1 },
    killsByFaction: { ...s.killsByFaction, [m.faction]: (s.killsByFaction[m.faction] ?? 0) + 1 },
  };
}

/** strips the 고급 suffix so "clear 봉쇄선 once" is satisfied by either version */
export const baseAssaultId = (id: string): string => id.replace(/-adv$/, '');

export function recordAssault(s: PlayerStats, assaultId: string, success: boolean): PlayerStats {
  if (!success) return { ...s, assaultFails: s.assaultFails + 1 };
  const clears = { ...s.assaultClears, [assaultId]: (s.assaultClears[assaultId] ?? 0) + 1 };
  const base = baseAssaultId(assaultId);
  if (base !== assaultId) clears[base] = (clears[base] ?? 0) + 1;
  return { ...s, assaultClears: clears };
}

export const recordQuest = (s: PlayerStats): PlayerStats => ({ ...s, questsCompleted: s.questsCompleted + 1 });
export const recordDeath = (s: PlayerStats): PlayerStats => ({ ...s, deaths: s.deaths + 1 });
export const recordWon = (s: PlayerStats, amount: number): PlayerStats => (amount > 0 ? { ...s, wonEarned: s.wonEarned + amount } : s);
export const recordEnhance = (s: PlayerStats, level: number): PlayerStats => (level > s.maxEnhance ? { ...s, maxEnhance: level } : s);

export const assaultClears = (s: PlayerStats, id: string): number => s.assaultClears[id] ?? 0;
export const totalAssaultClears = (s: PlayerStats): number => Object.entries(s.assaultClears).filter(([id]) => !id.endsWith('-adv')).reduce((n, [, c]) => n + c, 0);
