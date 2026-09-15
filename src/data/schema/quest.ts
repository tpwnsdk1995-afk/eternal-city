import type { Faction } from './enums';

export type QuestStep =
  | { kind: 'kill'; count: number; monsterId?: string; faction?: Faction; label: string }
  | { kind: 'collect'; itemId: string; count: number; label: string }
  | { kind: 'talk'; npcId: string; label: string }
  | { kind: 'reach'; mapId: string; label: string };

export interface QuestDef {
  id: string;
  name: string;
  /** NPC who gives and receives the quest */
  giver: string;
  prereq?: { level?: number; flags?: string[]; quests?: string[] };
  /** Shown when offered / while active / when turned in */
  text: { offer: string; progress: string; complete: string };
  /** Steps are pursued in parallel; all must be done before turning in to the giver. */
  steps: QuestStep[];
  rewards: { won: number; xp: number; items?: { itemId: string; qty: number }[]; itemChances?: { itemId: string; qty: number; chance: number }[]; flags?: string[] };
  /** quest items removed on completion */
  consumes?: { itemId: string; qty: number }[];
  /** 메인스트림: repeatable once per (UTC) day; completion is tracked by the `daily:<id>` flag, not the completed list */
  daily?: boolean;
  /** CL 메인스트림: harder targets, CL-grade reward roll */
  cl?: boolean;
}
