import type { AssaultDef } from '../schema/assault';

/**
 * 어설트 F "광화문 부스 방어" (2017, Lv.85+). 거점 방어형: 광장 진입로의 GUEST 정예를 걷어내고 부스로 달려가
 * 패러사이트·드론·정예의 파상 공세를 막아 낸 뒤, 마지막에 강하하는 위토 사령관을 처치한다.
 */
export const assaultF: AssaultDef = {
  id: 'assault-f',
  name: '광화문 부스 방어',
  tier: 'C',
  levelRange: [85, 100],
  mapId: 'gwanghwamun-defense',
  entrySpawn: 'entry',
  phases: [
    {
      kind: 'clear',
      label: '진입로의 GUEST 정예 격퇴',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'guest_elite', count: 2, spawnPoint: 'recon_w', intervalMs: 800 },
            { monsterId: 'zombie_ancient', count: 2, spawnPoint: 'recon_alley_s', intervalMs: 900 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'guest_elite', count: 3, spawnPoint: 'alley_s1', intervalMs: 700 },
            { monsterId: 'parasite_spawn', count: 4, spawnPoint: 'stairs_e', intervalMs: 500 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'moveTo', label: '광화문 부스로 이동 (90초)', toZone: 'booth', timeLimitSec: 90 },
    {
      kind: 'defend',
      label: '광화문 부스 방어 — 파상 공세 저지',
      boothId: 'booth_gwanghwamun',
      waves: [
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'parasite_spawn', count: 5, spawnPoint: 'alley_s1', intervalMs: 600 },
            { monsterId: 'zombie_ancient', count: 2, spawnPoint: 'stairs_e', intervalMs: 900 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 4,
          spawns: [
            { monsterId: 'wito_drone', count: 3, spawnPoint: 'alley_s2', intervalMs: 800 },
            { monsterId: 'guest_elite', count: 2, spawnPoint: 'lane_e', intervalMs: 800 },
            { monsterId: 'parasite_horror', count: 1, spawnPoint: 'stairs_e', intervalMs: 0 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 4,
          spawns: [
            { monsterId: 'guest_elite', count: 3, spawnPoint: 'alley_s1', intervalMs: 700 },
            { monsterId: 'wito_drone', count: 3, spawnPoint: 'lane_e', intervalMs: 700 },
            { monsterId: 'parasite_horror', count: 2, spawnPoint: 'alley_s2', intervalMs: 1200 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    {
      kind: 'boss',
      label: '위토 사령관 강하 — 처치',
      monsterId: 'wito_commander',
      spawnPoint: 'boss',
      adds: [
        {
          delaySec: 15,
          spawns: [{ monsterId: 'guest_elite', count: 3, spawnPoint: 'alley_s2', intervalMs: 700 }],
          advanceWhen: 'allDead',
        },
      ],
    },
  ],
  rewards: {
    won: 400_000,
    xp: 60_000,
    items: [
      { itemId: 'ammo_rocket', chance: 1, qty: 10 },
      { itemId: 'armor_coat_kevlar_cl', chance: 0.4, qty: 1 },
      { itemId: 'premium_coupon', chance: 0.3, qty: 1 },
    ],
  },
  failPenalty: { won: 40_000 },
};
