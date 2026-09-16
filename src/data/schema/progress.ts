import type { Faction } from './enums';

// ---------------------------------------------------------------- 업적

export type AchievementCond =
  | { kind: 'kills'; count: number }
  | { kind: 'killMonster'; monsterId: string; count: number }
  | { kind: 'killFaction'; faction: Faction; count: number }
  | { kind: 'bossKills'; count: number }
  | { kind: 'level'; level: number }
  | { kind: 'assaultClears'; count: number; assaultId?: string }
  | { kind: 'assaultGrade'; grade: string; count: number }
  | { kind: 'questsCompleted'; count: number }
  | { kind: 'enhance'; level: number }
  | { kind: 'wonEarned'; amount: number }
  | { kind: 'deaths'; count: number }
  | { kind: 'flag'; flag: string }
  | { kind: 'rebirth'; count: number };

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  cond: AchievementCond;
  reward: { won?: number; xp?: number; title?: string };
  /** shown as ??? until unlocked */
  hidden?: boolean;
}

// ---------------------------------------------------------------- 캠페인

export interface ChapterRequires {
  quests?: string[];
  flags?: string[];
  assaultClears?: { assaultId: string; count: number }[];
  kills?: { monsterId: string; count: number }[];
  level?: number;
  achievements?: string[];
}

export interface CampaignChapter {
  id: string;
  title: string;
  desc: string;
  requires: ChapterRequires;
  rewards: { won: number; xp: number; items?: { itemId: string; qty: number }[]; flags?: string[] };
}

export interface CampaignDef {
  id: string;
  name: string;
  year: number;
  desc: string;
  chapters: CampaignChapter[];
  /** set once every chapter has been claimed */
  finalFlag: string;
}
