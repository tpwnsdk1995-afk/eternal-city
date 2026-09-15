import type { AssaultDef } from '../schema/assault';

/**
 * 어설트 D "의정부 폐허 — 패러사이트 근절" — 원작 고레벨 어설트의 결정판: GUEST 소탕 → 뿌리 기물 4개를
 * 부숴 격막을 열고 → 핵실에서 패러사이트 루트를 제거한다. 뿌리를 부술 때마다 GUEST가 몰려온다.
 */
export const assaultD: AssaultDef = {
  id: 'assault-d',
  name: '의정부 폐허 — 패러사이트 근절',
  tier: 'C',
  levelRange: [45, 100],
  mapId: 'parasite-nest',
  entrySpawn: 'entry',
  phases: [
    {
      kind: 'clear',
      label: '폐허 진입로의 GUEST 척후 소탕',
      waves: [
        {
          delaySec: 2,
          spawns: [
            { monsterId: 'guest_scout', count: 3, spawnPoint: 'approach_n', intervalMs: 700 },
            { monsterId: 'guest_scout', count: 3, spawnPoint: 'approach_s', intervalMs: 700 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'guest_warrior', count: 2, spawnPoint: 'approach_n', intervalMs: 900 },
            { monsterId: 'guest_scout', count: 2, spawnPoint: 'approach_s', intervalMs: 700 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'advance', label: '둥지 전실로 전진', toZone: 'antechamber' },
    {
      kind: 'destroy',
      label: '뿌리 기물 4개 파괴 — 격막 개방',
      objectiveIds: ['root_1', 'root_2', 'root_3', 'root_4'],
      waves: [
        {
          delaySec: 4,
          spawns: [
            { monsterId: 'guest_scout', count: 2, spawnPoint: 'ante_n', intervalMs: 800 },
            { monsterId: 'guest_warrior', count: 1, spawnPoint: 'ante_s', intervalMs: 0 },
          ],
          advanceWhen: { afterSec: 20 },
        },
        {
          delaySec: 6,
          spawns: [
            { monsterId: 'guest_warrior', count: 2, spawnPoint: 'ante_n', intervalMs: 900 },
            { monsterId: 'larva', count: 4, spawnPoint: 'ante_s', intervalMs: 400 },
          ],
          advanceWhen: { afterSec: 25 },
        },
      ],
    },
    { kind: 'advance', label: '핵실로 진입', toZone: 'core' },
    {
      kind: 'boss',
      label: '패러사이트 루트 제거',
      monsterId: 'parasite_root',
      spawnPoint: 'boss',
      adds: [
        {
          delaySec: 10,
          spawns: [{ monsterId: 'guest_scout', count: 3, spawnPoint: 'core_n', intervalMs: 600 }],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 12,
          spawns: [{ monsterId: 'guest_warrior', count: 2, spawnPoint: 'core_s', intervalMs: 800 }],
          advanceWhen: 'allDead',
        },
      ],
    },
  ],
  rewards: { won: 60_000, xp: 9_000, items: [{ itemId: 'armor_top_tactical_cl', chance: 0.5, qty: 1 }, { itemId: 'ammo_50_ap', chance: 1, qty: 40 }, { itemId: 'premium_coupon', chance: 0.2, qty: 1 }] },
  failPenalty: { won: 5_000 },
};
