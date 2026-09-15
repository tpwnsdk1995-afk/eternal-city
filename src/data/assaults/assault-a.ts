import type { AssaultDef } from '../schema/assault';

export const assaultA: AssaultDef = {
  id: 'assault-a',
  name: '중곡동 봉쇄선 돌파',
  tier: 'A',
  levelRange: [15, 100],
  mapId: 'junggok-blockade',
  entrySpawn: 'entry',
  phases: [
    {
      kind: 'clear',
      label: '위토 정찰대 격퇴',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'wito_recon', count: 2, spawnPoint: 'recon_n', intervalMs: 800 },
            { monsterId: 'wito_recon', count: 2, spawnPoint: 'recon_s', intervalMs: 800 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'wito_recon', count: 3, spawnPoint: 'recon_n', intervalMs: 700 },
            { monsterId: 'zombie_stripe', count: 2, spawnPoint: 'recon_s', intervalMs: 700 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    {
      kind: 'destroy',
      label: '바리케이드 파괴',
      objectiveIds: ['barricade_1', 'barricade_2', 'barricade_3'],
      waves: [
        {
          delaySec: 4,
          spawns: [{ monsterId: 'wito_recon', count: 2, spawnPoint: 'recon_n', intervalMs: 1500 }],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'advance', label: '봉쇄선 통과 — 2구역으로 전진', toZone: 'stage2' },
    {
      kind: 'clear',
      label: '위토 공수부대 격퇴',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'wito_airborne', count: 2, spawnPoint: 'airborne_1', intervalMs: 900 },
            { monsterId: 'wito_airborne', count: 2, spawnPoint: 'airborne_2', intervalMs: 900 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'wito_airborne', count: 3, spawnPoint: 'airborne_3', intervalMs: 800 },
            { monsterId: 'zombie_banshee', count: 1, spawnPoint: 'airborne_1', intervalMs: 0 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'advance', label: '두목의 소굴로 전진', toZone: 'bossArena' },
    {
      kind: 'boss',
      label: '좀비두목 처치',
      monsterId: 'zombie_lord',
      spawnPoint: 'bossSpawn',
      adds: [
        {
          delaySec: 10,
          spawns: [{ monsterId: 'zombie_stripe', count: 3, spawnPoint: 'boss_adds', intervalMs: 600 }],
          advanceWhen: 'allDead',
        },
      ],
    },
  ],
  rewards: { won: 5_000, xp: 600, items: [{ itemId: 'ammo_9mm_incendiary', chance: 1, qty: 60 }] },
  failPenalty: { won: 500 },
};
