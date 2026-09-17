import type { AssaultDef } from '../schema/assault';

/**
 * 어설트 B "중곡역 부스 방어" — 원작의 거점 방어형: 정찰대 웨이브 → 3시 부스로 이동 → 부스를 지키며
 * 공수부대 파상 공세 → 엘리트 가드 처치.
 */
export const assaultB: AssaultDef = {
  id: 'assault-b',
  name: '중곡역 부스 방어',
  tier: 'B',
  levelRange: [20, 100],
  mapId: 'junggok-station-defense',
  entrySpawn: 'entry',
  phases: [
    {
      kind: 'clear',
      label: '진입로의 정찰대 격퇴',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'wito_recon', count: 3, spawnPoint: 'recon_w', intervalMs: 700 },
            { monsterId: 'wito_soldier', count: 2, spawnPoint: 'recon_alley_s', intervalMs: 900 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'wito_recon', count: 3, spawnPoint: 'alley_s1', intervalMs: 600 },
            { monsterId: 'wito_soldier', count: 3, spawnPoint: 'stairs_e', intervalMs: 800 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'moveTo', label: '3시 부스로 이동 (90초)', toZone: 'booth', timeLimitSec: 90 },
    {
      kind: 'defend',
      label: '3시 부스 방어 — 공수부대 저지',
      boothId: 'booth_3',
      waves: [
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'wito_airborne', count: 3, spawnPoint: 'alley_s1', intervalMs: 900 },
            { monsterId: 'wito_soldier', count: 2, spawnPoint: 'stairs_e', intervalMs: 900 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 4,
          spawns: [
            { monsterId: 'wito_airborne', count: 3, spawnPoint: 'alley_s2', intervalMs: 800 },
            { monsterId: 'wito_airborne', count: 2, spawnPoint: 'lane_e', intervalMs: 800 },
            { monsterId: 'zombie_banshee', count: 1, spawnPoint: 'stairs_e', intervalMs: 0 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 4,
          spawns: [
            { monsterId: 'wito_airborne', count: 4, spawnPoint: 'stairs_e', intervalMs: 700 },
            { monsterId: 'wito_airborne', count: 3, spawnPoint: 'lane_e', intervalMs: 700 },
            { monsterId: 'wito_soldier', count: 3, spawnPoint: 'alley_s1', intervalMs: 700 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    {
      kind: 'boss',
      label: '위토 엘리트 가드 처치',
      monsterId: 'wito_elite_guard',
      spawnPoint: 'boss',
      adds: [
        {
          delaySec: 8,
          spawns: [{ monsterId: 'wito_airborne', count: 3, spawnPoint: 'lane_e', intervalMs: 600 }],
          advanceWhen: 'allDead',
        },
      ],
    },
  ],
  rewards: { won: 700_000, xp: 90_000, items: [{ itemId: 'ammo_556_ap', chance: 1, qty: 300 }, { itemId: 'armor_hat_helmet', chance: 0.5, qty: 5 }] },
  failPenalty: { won: 1_200 },
};
