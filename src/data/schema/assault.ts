import type { MapId } from './map';

export type AssaultTier = 'A' | 'B' | 'C';

export interface WaveSpawn {
  monsterId: string;
  count: number;
  spawnPoint: string;
  intervalMs: number;
}

export type AdvanceWhen = 'allDead' | { aliveAtMost: number } | { afterSec: number };

export interface Wave {
  delaySec: number;
  spawns: WaveSpawn[];
  advanceWhen: AdvanceWhen;
}

export type AssaultPhase =
  | { kind: 'clear'; label: string; waves: Wave[] }
  | { kind: 'destroy'; label: string; objectiveIds: string[]; waves?: Wave[] }
  | { kind: 'advance'; label: string; toZone: string }
  | { kind: 'boss'; label: string; monsterId: string; spawnPoint: string; adds?: Wave[] }
  | { kind: 'moveTo'; label: string; toZone: string; timeLimitSec: number }
  | { kind: 'defend'; label: string; boothId: string; waves: Wave[] };

export type AssaultFailReason = 'death' | 'timeout' | 'booth' | 'retreat';

export interface AssaultDef {
  id: string;
  name: string;
  tier: AssaultTier;
  advanced?: boolean; // 고급 어설트
  levelRange: [number, number];
  mapId: MapId;
  entrySpawn: string;
  phases: AssaultPhase[];
  rewards: { won: number; xp: number; items: { itemId: string; chance: number; qty: number }[] };
  failPenalty: { won: number };
}
