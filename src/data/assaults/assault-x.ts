import type { AssaultDef } from '../schema/assault';

/**
 * 어설트 X "코엑스 지하 — 최후의 봉쇄" (극한, 2026-09-17 요청). E의 맵·구조를 쓰되 웨이브를 두 배로 늘리고
 * 고급 몬스터 보정(advanced)을 걸었다. 보스 두 마리(패러사이트 뿌리 → 위토 사령관)를 연달아 잡아야 끝난다.
 * 보상은 어떤 어설트보다 크다.
 */
export const assaultX: AssaultDef = {
  id: 'assault-x',
  name: '코엑스 지하 — 최후의 봉쇄 (극한)',
  tier: 'C',
  advanced: true,
  levelRange: [90, 100],
  mapId: 'coex-underground',
  entrySpawn: 'entry',
  phases: [
    {
      kind: 'clear',
      label: 'GUEST 사냥꾼 대부대 소탕',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'guest_hunter', count: 6, spawnPoint: 'recon_n', intervalMs: 500 },
            { monsterId: 'parasite_spawn', count: 6, spawnPoint: 'recon_s', intervalMs: 500 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'guest_hunter', count: 8, spawnPoint: 'recon_n', intervalMs: 400 },
            { monsterId: 'wito_heavy_gunner', count: 3, spawnPoint: 'recon_s', intervalMs: 800 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    {
      kind: 'destroy',
      label: '환기구 3개 파괴 — 포자 차단',
      objectiveIds: ['vent_1', 'vent_2', 'vent_3'],
      waves: [
        {
          delaySec: 3,
          spawns: [{ monsterId: 'parasite_spawn', count: 10, spawnPoint: 'recon_n', intervalMs: 700 }],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'advance', label: '격벽 통과 — 2구역으로 전진', toZone: 'stage2' },
    {
      kind: 'clear',
      label: '위토 중화기 요새 돌파',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'wito_heavy_gunner', count: 4, spawnPoint: 'airborne_1', intervalMs: 700 },
            { monsterId: 'wito_heavy_gunner', count: 4, spawnPoint: 'airborne_2', intervalMs: 700 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'wito_heavy_gunner', count: 5, spawnPoint: 'airborne_3', intervalMs: 600 },
            { monsterId: 'guest_hunter', count: 6, spawnPoint: 'airborne_1', intervalMs: 500 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'advance', label: '회장실로 전진', toZone: 'bossArena' },
    {
      kind: 'boss',
      label: '1차 보스 — 패러사이트 뿌리 처치',
      monsterId: 'parasite_root',
      spawnPoint: 'bossSpawn',
      adds: [
        {
          delaySec: 10,
          spawns: [{ monsterId: 'parasite_spawn', count: 6, spawnPoint: 'boss_adds', intervalMs: 500 }],
          advanceWhen: 'allDead',
        },
      ],
    },
    {
      kind: 'boss',
      label: '최종 보스 — 위토 사령관 처치',
      monsterId: 'wito_commander',
      spawnPoint: 'bossSpawn',
      adds: [
        {
          delaySec: 8,
          spawns: [
            { monsterId: 'wito_heavy_gunner', count: 3, spawnPoint: 'boss_adds', intervalMs: 600 },
            { monsterId: 'guest_hunter', count: 4, spawnPoint: 'boss_adds', intervalMs: 500 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
  ],
  rewards: {
    won: 100_000_000,
    xp: 15_000_000,
    items: [
      { itemId: 'ammo_50_ap', chance: 1, qty: 1000 },
      { itemId: 'armor_top_tactical_cl', chance: 1, qty: 3 },
      { itemId: 'premium_coupon', chance: 1, qty: 10 },
    ],
  },
  failPenalty: { won: 200_000 },
};
