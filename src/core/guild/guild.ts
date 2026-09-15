import { GUILD_FOUND_COST, GUILD_LEVELS, GUILD_PERK_PER_LEVEL, GUILD_ROSTER } from '@data/guild';

export interface GuildState {
  /** null until founded */
  name: string | null;
  /** cumulative ₩ contributed (level derives from it) */
  contributed: number;
  foundedAt: number;
}

export interface GuildPerks {
  xpPct: number;
  wonPct: number;
  weightKg: number;
  maxHpPct: number;
}

export const emptyGuild = (): GuildState => ({ name: null, contributed: 0, foundedAt: 0 });

export function guildLevel(contributed: number): number {
  let lv = 1;
  for (const d of GUILD_LEVELS) if (contributed >= d.contribution) lv = d.level;
  return lv;
}

export const guildTitle = (level: number): string => GUILD_LEVELS.find((d) => d.level === level)?.title ?? GUILD_LEVELS[0].title;

/** ₩ still needed for the next level, or null at the cap. */
export function nextLevelNeed(contributed: number): { level: number; need: number } | null {
  const next = GUILD_LEVELS.find((d) => d.contribution > contributed);
  return next ? { level: next.level, need: next.contribution - contributed } : null;
}

export function guildPerks(g: GuildState): GuildPerks {
  if (!g.name) return { xpPct: 0, wonPct: 0, weightKg: 0, maxHpPct: 0 };
  const lv = guildLevel(g.contributed);
  return {
    xpPct: GUILD_PERK_PER_LEVEL.xpPct * lv,
    wonPct: GUILD_PERK_PER_LEVEL.wonPct * lv,
    weightKg: GUILD_PERK_PER_LEVEL.weightKg * lv,
    maxHpPct: GUILD_PERK_PER_LEVEL.maxHpPct * lv,
  };
}

export type GuildFail = 'exists' | 'noGuild' | 'won' | 'name' | 'amount';
export type GuildResult = { ok: true; guild: GuildState; won: number } | { ok: false; reason: GuildFail };

/** Found a guild: costs ₩, name must be 2~16 chars. */
export function foundGuild(g: GuildState, name: string, won: number, now = Date.now()): GuildResult {
  if (g.name) return { ok: false, reason: 'exists' };
  const n = name.trim();
  if (n.length < 2 || n.length > 16) return { ok: false, reason: 'name' };
  if (won < GUILD_FOUND_COST) return { ok: false, reason: 'won' };
  return { ok: true, guild: { name: n, contributed: 0, foundedAt: now }, won: won - GUILD_FOUND_COST };
}

export function renameGuild(g: GuildState, name: string): GuildResult {
  if (!g.name) return { ok: false, reason: 'noGuild' };
  const n = name.trim();
  if (n.length < 2 || n.length > 16) return { ok: false, reason: 'name' };
  return { ok: true, guild: { ...g, name: n }, won: 0 };
}

/** Contribute ₩; the guild level is a pure function of the running total. */
export function donate(g: GuildState, amount: number, won: number): GuildResult & { leveledTo?: number } {
  if (!g.name) return { ok: false, reason: 'noGuild' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'amount' };
  if (won < amount) return { ok: false, reason: 'won' };
  const before = guildLevel(g.contributed);
  const next = { ...g, contributed: g.contributed + Math.round(amount) };
  const after = guildLevel(next.contributed);
  return { ok: true, guild: next, won: won - Math.round(amount), ...(after > before ? { leveledTo: after } : {}) };
}

/** Roster visible at the guild's current level. */
export function roster(g: GuildState): typeof GUILD_ROSTER {
  if (!g.name) return [];
  const lv = guildLevel(g.contributed);
  return GUILD_ROSTER.filter((m) => m.joinsAtLevel <= lv);
}
