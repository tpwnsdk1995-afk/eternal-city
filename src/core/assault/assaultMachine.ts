import type { AssaultDef, AssaultFailReason, AssaultPhase, Wave } from '@data/schema/assault';
import type { MapDef } from '@data/schema/map';

export type SpawnTag = 'wave' | 'boss' | 'adds';

export interface PendingSpawn {
  monsterId: string;
  spawnPoint: string;
  at: number;
  tag: SpawnTag;
}

export interface AssaultRuntime {
  def: AssaultDef;
  status: 'running' | 'success' | 'failed';
  startedAt: number;
  phaseIndex: number;
  phaseStartedAt: number;
  /** wave progress inside the current phase */
  waveIndex: number;
  waveArmedAt: number; // when the current wave's delay started counting
  waveSpawnedAt: number | null; // when its spawns were scheduled (null = not yet)
  pending: PendingSpawn[];
  aliveWave: number; // living wave/adds monsters of the current phase
  objectivesLeft: string[];
  bossSpawned: boolean;
  bossAlive: boolean;
  kills: number;
  failReason: AssaultFailReason | null;
}

export type AssaultEvent =
  | { kind: 'phase'; index: number; phase: AssaultPhase }
  | { kind: 'spawn'; monsterId: string; spawnPoint: string; tag: SpawnTag }
  | { kind: 'openGate'; gateId: string }
  | { kind: 'success' }
  | { kind: 'failed'; reason: AssaultFailReason };

export interface AssaultInput {
  now: number;
  playerInZone: (zone: string) => boolean;
}

export interface Step {
  rt: AssaultRuntime;
  events: AssaultEvent[];
}

const phaseWaves = (p: AssaultPhase): Wave[] => {
  switch (p.kind) {
    case 'clear':
    case 'defend':
      return p.waves;
    case 'destroy':
      return p.waves ?? [];
    case 'boss':
      return p.adds ?? [];
    default:
      return [];
  }
};

export function currentPhase(rt: AssaultRuntime): AssaultPhase | null {
  return rt.def.phases[rt.phaseIndex] ?? null;
}

export function startAssault(def: AssaultDef, now: number): Step {
  const rt: AssaultRuntime = {
    def,
    status: 'running',
    startedAt: now,
    phaseIndex: -1,
    phaseStartedAt: now,
    waveIndex: 0,
    waveArmedAt: now,
    waveSpawnedAt: null,
    pending: [],
    aliveWave: 0,
    objectivesLeft: [],
    bossSpawned: false,
    bossAlive: false,
    kills: 0,
    failReason: null,
  };
  return enterPhase(rt, 0, now);
}

function enterPhase(prev: AssaultRuntime, index: number, now: number): Step {
  if (index >= prev.def.phases.length) {
    return { rt: { ...prev, status: 'success', phaseIndex: index }, events: [{ kind: 'success' }] };
  }
  const phase = prev.def.phases[index];
  const rt: AssaultRuntime = {
    ...prev,
    phaseIndex: index,
    phaseStartedAt: now,
    waveIndex: 0,
    waveArmedAt: now,
    waveSpawnedAt: null,
    pending: [],
    aliveWave: 0,
    objectivesLeft: phase.kind === 'destroy' ? [...phase.objectiveIds] : [],
    bossSpawned: false,
    bossAlive: false,
  };
  const events: AssaultEvent[] = [{ kind: 'phase', index, phase }];
  if (phase.kind === 'boss') {
    rt.bossSpawned = true;
    rt.bossAlive = true;
    events.push({ kind: 'spawn', monsterId: phase.monsterId, spawnPoint: phase.spawnPoint, tag: 'boss' });
  }
  return { rt, events };
}

/** Advances timers: schedules/emits wave spawns and checks the phase's completion condition. */
export function tickAssault(prev: AssaultRuntime, input: AssaultInput): Step {
  if (prev.status !== 'running') return { rt: prev, events: [] };
  const { now } = input;
  const phase = currentPhase(prev);
  if (!phase) return { rt: prev, events: [] };
  let rt = { ...prev, pending: [...prev.pending] };
  const events: AssaultEvent[] = [];

  // --- waves -------------------------------------------------------------------------------
  const waves = phaseWaves(phase);
  const wave = waves[rt.waveIndex];
  if (wave) {
    if (rt.waveSpawnedAt === null && now >= rt.waveArmedAt + wave.delaySec * 1000) {
      const tag: SpawnTag = phase.kind === 'boss' ? 'adds' : 'wave';
      for (const s of wave.spawns) for (let i = 0; i < s.count; i++) rt.pending.push({ monsterId: s.monsterId, spawnPoint: s.spawnPoint, at: now + i * s.intervalMs, tag });
      rt.waveSpawnedAt = now;
    }
    if (rt.pending.length) {
      const ready = rt.pending.filter((p) => p.at <= now);
      rt.pending = rt.pending.filter((p) => p.at > now);
      for (const p of ready) {
        rt.aliveWave += 1;
        events.push({ kind: 'spawn', monsterId: p.monsterId, spawnPoint: p.spawnPoint, tag: p.tag });
      }
    }
    if (rt.waveSpawnedAt !== null && rt.pending.length === 0) {
      const w = wave.advanceWhen;
      const done = w === 'allDead' ? rt.aliveWave === 0 : 'aliveAtMost' in w ? rt.aliveWave <= w.aliveAtMost : now >= rt.waveSpawnedAt + w.afterSec * 1000;
      if (done) rt = { ...rt, waveIndex: rt.waveIndex + 1, waveArmedAt: now, waveSpawnedAt: null };
    }
  }
  const wavesDone = rt.waveIndex >= waves.length;

  // --- phase completion --------------------------------------------------------------------
  let complete = false;
  switch (phase.kind) {
    case 'clear':
    case 'defend':
      complete = wavesDone;
      break;
    case 'destroy':
      complete = rt.objectivesLeft.length === 0;
      break;
    case 'advance':
      complete = input.playerInZone(phase.toZone);
      break;
    case 'moveTo':
      if (input.playerInZone(phase.toZone)) complete = true;
      else if (now >= rt.phaseStartedAt + phase.timeLimitSec * 1000) {
        rt = { ...rt, status: 'failed', failReason: 'timeout' };
        return { rt, events: [...events, { kind: 'failed', reason: 'timeout' }] };
      }
      break;
    case 'boss':
      complete = !rt.bossAlive;
      break;
  }
  if (complete) {
    const next = enterPhase(rt, rt.phaseIndex + 1, now);
    return { rt: next.rt, events: [...events, ...next.events] };
  }
  return { rt, events };
}

/** A monster spawned by this assault died. */
export function onAssaultEnemyDied(rt: AssaultRuntime, tag: SpawnTag): AssaultRuntime {
  const next = { ...rt, kills: rt.kills + 1 };
  if (tag === 'boss') next.bossAlive = false;
  else next.aliveWave = Math.max(0, rt.aliveWave - 1);
  return next;
}

/** An objective (기물) was destroyed. Opens any gate whose requirements are now all met. */
export function onObjectiveDestroyed(rt: AssaultRuntime, objectiveId: string, map: MapDef, destroyedSoFar: ReadonlySet<string>): Step {
  const events: AssaultEvent[] = [];
  const objectivesLeft = rt.objectivesLeft.filter((id) => id !== objectiveId);
  for (const g of map.gates ?? []) {
    const wasOpen = g.opensWhen.every((id) => destroyedSoFar.has(id));
    const nowOpen = g.opensWhen.every((id) => id === objectiveId || destroyedSoFar.has(id));
    if (!wasOpen && nowOpen) events.push({ kind: 'openGate', gateId: g.id });
  }
  return { rt: { ...rt, objectivesLeft }, events };
}

export function onAssaultPlayerDied(rt: AssaultRuntime): Step {
  if (rt.status !== 'running') return { rt, events: [] };
  return { rt: { ...rt, status: 'failed', failReason: 'death' }, events: [{ kind: 'failed', reason: 'death' }] };
}

/** The defended booth fell: the mission fails on the spot. */
export function onBoothDestroyed(rt: AssaultRuntime): Step {
  if (rt.status !== 'running') return { rt, events: [] };
  return { rt: { ...rt, status: 'failed', failReason: 'booth' }, events: [{ kind: 'failed', reason: 'booth' }] };
}

/** The booth a defend phase protects, or null outside defend phases. */
export function defendedBoothId(rt: AssaultRuntime): string | null {
  const p = currentPhase(rt);
  return p?.kind === 'defend' ? p.boothId : null;
}

/** Summary line for the HUD banner. */
export function assaultProgressText(rt: AssaultRuntime): string {
  const phase = currentPhase(rt);
  if (!phase) return '';
  switch (phase.kind) {
    case 'clear': {
      const waves = phaseWaves(phase);
      return `웨이브 ${Math.min(rt.waveIndex + 1, waves.length)} / ${waves.length} · 남은 적 ${rt.aliveWave}`;
    }
    case 'defend': {
      const waves = phaseWaves(phase);
      return `부스를 지켜라 · 웨이브 ${Math.min(rt.waveIndex + 1, waves.length)} / ${waves.length} · 남은 적 ${rt.aliveWave}`;
    }
    case 'destroy':
      return `남은 기물 ${rt.objectivesLeft.length} / ${phase.objectiveIds.length}`;
    case 'advance':
    case 'moveTo':
      return '지정 구역으로 이동하세요';
    case 'boss':
      return rt.bossAlive ? '보스 생존' : '보스 처치';
  }
}
