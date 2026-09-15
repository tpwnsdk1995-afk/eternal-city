import type { AssaultDef } from '../schema/assault';

/**
 * 어설트 E "코엑스 지하 — 환기구 폐쇄" (2006, Lv.60+). 기물 파괴 전진형: GUEST 사냥꾼 소탕 → 패러사이트
 * 포자가 퍼지는 환기구 3개 파괴 → 격벽 개방 → 위토 중화기병 진지 → 회장실의 회장 좀비.
 */
export const assaultE: AssaultDef = {
  id: 'assault-e',
  name: '코엑스 지하 — 환기구 폐쇄',
  tier: 'C',
  levelRange: [60, 100],
  mapId: 'coex-underground',
  entrySpawn: 'entry',
  phases: [
    {
      kind: 'clear',
      label: 'GUEST 사냥꾼 소탕',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'guest_hunter', count: 3, spawnPoint: 'recon_n', intervalMs: 700 },
            { monsterId: 'zombie_office', count: 3, spawnPoint: 'recon_s', intervalMs: 700 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'guest_hunter', count: 4, spawnPoint: 'recon_n', intervalMs: 600 },
            { monsterId: 'parasite_spawn', count: 3, spawnPoint: 'recon_s', intervalMs: 500 },
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
          delaySec: 5,
          spawns: [{ monsterId: 'parasite_spawn', count: 4, spawnPoint: 'recon_n', intervalMs: 1200 }],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'advance', label: '격벽 통과 — 2구역으로 전진', toZone: 'stage2' },
    {
      kind: 'clear',
      label: '위토 중화기 진지 돌파',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'wito_heavy_gunner', count: 2, spawnPoint: 'airborne_1', intervalMs: 900 },
            { monsterId: 'wito_heavy_gunner', count: 2, spawnPoint: 'airborne_2', intervalMs: 900 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'wito_heavy_gunner', count: 3, spawnPoint: 'airborne_3', intervalMs: 800 },
            { monsterId: 'guest_hunter', count: 2, spawnPoint: 'airborne_1', intervalMs: 600 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'advance', label: '회장실로 전진', toZone: 'bossArena' },
    {
      kind: 'boss',
      label: '회장 좀비 처치',
      monsterId: 'zombie_ceo',
      spawnPoint: 'bossSpawn',
      adds: [
        {
          delaySec: 12,
          spawns: [{ monsterId: 'guest_hunter', count: 3, spawnPoint: 'boss_adds', intervalMs: 600 }],
          advanceWhen: 'allDead',
        },
      ],
    },
  ],
  rewards: {
    won: 150_000,
    xp: 20_000,
    items: [
      { itemId: 'ammo_50_ap', chance: 1, qty: 60 },
      { itemId: 'armor_top_tactical_cl', chance: 0.3, qty: 1 },
      { itemId: 'premium_coupon', chance: 0.2, qty: 1 },
    ],
  },
  failPenalty: { won: 15_000 },
};
