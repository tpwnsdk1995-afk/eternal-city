import type { StatMods } from '@data/schema/mods';
import { addMods, ZERO_MODS } from '@data/schema/mods';

/** A timed bonus from the 사이버샵 (스테로이드·앰플·프리미엄 쿠폰…). Durations are wall-clock so they keep ticking offline. */
export interface BuffDef {
  id: string;
  name: string;
  desc: string;
  durationMs: number;
  mods?: Partial<StatMods>;
  /** experience multiplier on kills and rewards (1.5 = +50%) */
  xpMult?: number;
  /** ₩ pickup multiplier */
  wonMult?: number;
  /** extra carry capacity */
  weightKg?: number;
}

export interface ActiveBuff {
  id: string;
  /** epoch ms */
  until: number;
}

export interface BuffState {
  active: ActiveBuff[];
}

export type BuffLookup = (id: string) => BuffDef;

export const emptyBuffs = (): BuffState => ({ active: [] });

/** Applies (or refreshes) a buff; the same buff never stacks, it restarts its timer. */
export function applyBuff(state: BuffState, def: BuffDef, now: number): BuffState {
  const rest = state.active.filter((b) => b.id !== def.id);
  return { active: [...rest, { id: def.id, until: now + def.durationMs }] };
}

export function pruneExpired(state: BuffState, now: number): BuffState {
  const active = state.active.filter((b) => b.until > now);
  return active.length === state.active.length ? state : { active };
}

export const activeBuffs = (state: BuffState, now: number): ActiveBuff[] => state.active.filter((b) => b.until > now);
export const hasBuff = (state: BuffState, id: string, now: number): boolean => activeBuffs(state, now).some((b) => b.id === id);
export const remainingMs = (state: BuffState, id: string, now: number): number => Math.max(0, (state.active.find((b) => b.id === id)?.until ?? 0) - now);

export function aggregateBuffMods(state: BuffState, lookup: BuffLookup, now: number): StatMods {
  let mods = ZERO_MODS;
  for (const b of activeBuffs(state, now)) {
    const def = lookup(b.id);
    if (def.mods) mods = addMods(mods, def.mods);
  }
  return mods;
}

export function xpMultiplier(state: BuffState, lookup: BuffLookup, now: number): number {
  return activeBuffs(state, now).reduce((m, b) => m * (lookup(b.id).xpMult ?? 1), 1);
}

export function wonMultiplier(state: BuffState, lookup: BuffLookup, now: number): number {
  return activeBuffs(state, now).reduce((m, b) => m * (lookup(b.id).wonMult ?? 1), 1);
}

export function extraWeightKg(state: BuffState, lookup: BuffLookup, now: number): number {
  return activeBuffs(state, now).reduce((w, b) => w + (lookup(b.id).weightKg ?? 0), 0);
}

/** "4:32" / "29일 3시간" for the HUD. */
export function formatRemaining(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s >= 86_400) return `${Math.floor(s / 86_400)}일 ${Math.floor((s % 86_400) / 3600)}시간`;
  if (s >= 3600) return `${Math.floor(s / 3600)}시간 ${Math.floor((s % 3600) / 60)}분`;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
