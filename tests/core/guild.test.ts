import { describe, expect, it } from 'vitest';
import { donate, emptyGuild, foundGuild, guildLevel, guildPerks, nextLevelNeed, renameGuild, roster } from '@core/guild/guild';
import { GUILD_FOUND_COST, GUILD_LEVELS, GUILD_ROSTER } from '@data/guild';

describe('길드', () => {
  it('founding costs ₩ and needs a sane name; no perks before founding', () => {
    const g0 = emptyGuild();
    expect(guildPerks(g0)).toEqual({ xpPct: 0, wonPct: 0, weightKg: 0, maxHpPct: 0 });
    expect(foundGuild(g0, 'x', 1_000_000)).toEqual({ ok: false, reason: 'name' });
    expect(foundGuild(g0, '중곡동 헌터즈', GUILD_FOUND_COST - 1)).toEqual({ ok: false, reason: 'won' });
    const r = foundGuild(g0, ' 중곡동 헌터즈 ', 100_000, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.guild).toEqual({ name: '중곡동 헌터즈', contributed: 0, foundedAt: 5 });
      expect(r.won).toBe(100_000 - GUILD_FOUND_COST);
      expect(foundGuild(r.guild, '둘째', 1e9)).toEqual({ ok: false, reason: 'exists' });
      expect(guildLevel(r.guild.contributed)).toBe(1);
      expect(guildPerks(r.guild).xpPct).toBeCloseTo(0.02);
      expect(roster(r.guild).length).toBe(2);
    }
  });

  it('donations accumulate and level the guild along the table; perks scale per level', () => {
    let g = (foundGuild(emptyGuild(), '길드', 1e9) as { ok: true; guild: ReturnType<typeof emptyGuild> }).guild;
    expect(donate(g, 0, 1e9)).toEqual({ ok: false, reason: 'amount' });
    expect(donate(g, 10, 5)).toEqual({ ok: false, reason: 'won' });
    const r1 = donate(g, GUILD_LEVELS[1].contribution, 1e9);
    expect(r1.ok && r1.leveledTo).toBe(2);
    if (r1.ok) g = r1.guild;
    expect(nextLevelNeed(g.contributed)).toEqual({ level: 3, need: GUILD_LEVELS[2].contribution - GUILD_LEVELS[1].contribution });
    const r2 = donate(g, 1_000, 1e9);
    expect(r2.ok && r2.leveledTo).toBeUndefined();
    const top = donate(g, GUILD_LEVELS[4].contribution, 1e9);
    expect(top.ok && guildLevel(top.guild.contributed)).toBe(5);
    if (top.ok) {
      expect(nextLevelNeed(top.guild.contributed)).toBeNull();
      expect(guildPerks(top.guild)).toEqual({ xpPct: 0.1, wonPct: 0.1, weightKg: 10, maxHpPct: 0.05 });
      expect(roster(top.guild).length).toBe(GUILD_ROSTER.length);
    }
    expect(renameGuild(emptyGuild(), '새이름')).toEqual({ ok: false, reason: 'noGuild' });
    const rn = renameGuild(g, '새이름');
    expect(rn.ok && rn.guild.name).toBe('새이름');
  });
});
