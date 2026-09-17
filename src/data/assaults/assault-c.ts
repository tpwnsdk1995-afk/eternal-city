import type { AssaultDef } from '../schema/assault';

/**
 * 어설트 C "하수도 심층 — 변종 오구린" — 보스 사냥형: 제한 시간 돌입 → 처리실 정리 → 변종 오구린 처치
 * (도약 공격 + 강화 좀비 증원) → 제한 시간 탈출.
 */
export const assaultC: AssaultDef = {
  id: 'assault-c',
  name: '하수도 심층 — 변종 오구린',
  tier: 'C',
  levelRange: [30, 100],
  mapId: 'sewer-depths',
  entrySpawn: 'entry',
  phases: [
    { kind: 'moveTo', label: '중앙 처리실로 돌입 (120초)', toZone: 'chamber', timeLimitSec: 120 },
    {
      kind: 'clear',
      label: '처리실의 강화 좀비 소탕',
      waves: [
        {
          delaySec: 1,
          spawns: [
            { monsterId: 'zombie_hardened', count: 3, spawnPoint: 'chamber_n', intervalMs: 600 },
            { monsterId: 'zombie_hardened', count: 3, spawnPoint: 'chamber_s', intervalMs: 600 },
          ],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 3,
          spawns: [
            { monsterId: 'zombie_hardened', count: 2, spawnPoint: 'chamber_w', intervalMs: 700 },
            { monsterId: 'zombie_banshee', count: 2, spawnPoint: 'chamber_n', intervalMs: 900 },
          ],
          advanceWhen: 'allDead',
        },
      ],
    },
    {
      kind: 'boss',
      label: '변종 오구린 처치',
      monsterId: 'ogurin_mutant',
      spawnPoint: 'boss',
      adds: [
        {
          delaySec: 12,
          spawns: [{ monsterId: 'zombie_hardened', count: 3, spawnPoint: 'chamber_s', intervalMs: 700 }],
          advanceWhen: 'allDead',
        },
        {
          delaySec: 14,
          spawns: [{ monsterId: 'zombie_banshee', count: 2, spawnPoint: 'chamber_n', intervalMs: 800 }],
          advanceWhen: 'allDead',
        },
      ],
    },
    { kind: 'moveTo', label: '동쪽 비상 사다리로 탈출 (90초)', toZone: 'exit', timeLimitSec: 90 },
  ],
  rewards: { won: 1_500_000, xp: 210_000, items: [{ itemId: 'ammo_762_ap', chance: 1, qty: 300 }, { itemId: 'armor_coat_kevlar', chance: 0.4, qty: 5 }, { itemId: 'ammo_rocket', chance: 0.5, qty: 15 }] },
  failPenalty: { won: 2_500 },
};
