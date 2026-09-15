/** 길드 — single-player reading of the original's guild office at 광진구청: you found one, the "members" are named NPC hunters, and contributions level it up for account-wide perks. */
export interface GuildLevelDef {
  level: number;
  /** cumulative ₩ contributed to reach this level */
  contribution: number;
  title: string;
}

export const GUILD_FOUND_COST = 50_000;

export const GUILD_LEVELS: readonly GuildLevelDef[] = [
  { level: 1, contribution: 0, title: '신생 길드' },
  { level: 2, contribution: 150_000, title: '동네 길드' },
  { level: 3, contribution: 500_000, title: '구청 공인 길드' },
  { level: 4, contribution: 1_500_000, title: '서울 연합 길드' },
  { level: 5, contribution: 4_000_000, title: '패러렐 특무 길드' },
];

/** Perks per guild level (stack linearly). */
export const GUILD_PERK_PER_LEVEL = {
  xpPct: 0.02,
  wonPct: 0.02,
  weightKg: 2,
  maxHpPct: 0.01,
} as const;

export const GUILD_NAME_PRESETS = ['중곡동 헌터즈', '광진 자경단', '아차산 순찰대', '봉쇄선 돌파조', '패러렐 원정대', '한강 방위대'] as const;

/** Flavor roster: named survivors who "join" as the guild grows (2 per level). */
export const GUILD_ROSTER: readonly { name: string; job: string; joinsAtLevel: number }[] = [
  { name: '박지훈', job: '전 경찰 · 권총', joinsAtLevel: 1 },
  { name: '서연우', job: '간호사 · 위생반', joinsAtLevel: 1 },
  { name: '최강민', job: '택배기사 · 운송', joinsAtLevel: 2 },
  { name: '한소라', job: '대학생 · 정찰', joinsAtLevel: 2 },
  { name: '오태식', job: '예비군 · 돌격소총', joinsAtLevel: 3 },
  { name: '김다은', job: '수의사 · 감염체 연구', joinsAtLevel: 3 },
  { name: '류승현', job: '전 W.I.T.O 탈영병 · 기관총', joinsAtLevel: 4 },
  { name: '정하늘', job: '해커 · 패러렐 기록', joinsAtLevel: 4 },
  { name: '이서준', job: '소방관 · 방어구 정비', joinsAtLevel: 5 },
  { name: '문채원', job: '감염체 헌터 · 변이무기', joinsAtLevel: 5 },
];

export const GUILD_DONATIONS = [10_000, 100_000, 1_000_000] as const;
