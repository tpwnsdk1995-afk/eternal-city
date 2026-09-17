import type { AssaultDef, Wave } from '../schema/assault';

/**
 * 극한 II~IV (2026-09-17 요청: "더 높은 어설트 여러 개"). X 위로 한 단계씩: 몬스터 체력·공격력에 `power`를 더 곱하고,
 * 보스를 더 줄 세운다. 보상은 Ω(종말형) 장비.
 */
const wave = (delaySec: number, ...spawns: [string, number, string][]): Wave => ({
  delaySec,
  spawns: spawns.map(([monsterId, count, spawnPoint]) => ({ monsterId, count, spawnPoint, intervalMs: 500 })),
  advanceWhen: 'allDead',
});

const gear = (chance: number, ...ids: string[]) => ids.map((itemId) => ({ itemId, chance, qty: 1 }));

/** 극한 II: F의 광화문을 네 파도로 막고, 사령관 → 회장 좀비를 연달아. */
export const assaultX2: AssaultDef = {
  id: 'assault-x2',
  name: '광화문 — 종말의 방어선 (극한 II)',
  tier: 'C',
  advanced: true,
  power: 1.5,
  levelRange: [95, 100],
  mapId: 'gwanghwamun-defense',
  entrySpawn: 'entry',
  phases: [
    {
      kind: 'clear',
      label: '진입로의 정예 대부대 격퇴',
      waves: [wave(2, ['guest_elite', 5, 'recon_w'], ['zombie_ancient', 5, 'recon_alley_s']), wave(3, ['guest_hunter', 6, 'alley_s1'], ['parasite_spawn', 8, 'stairs_e'])],
    },
    { kind: 'moveTo', label: '광화문 부스로 이동 (90초)', toZone: 'booth', timeLimitSec: 90 },
    {
      kind: 'defend',
      label: '광화문 부스 사수 — 네 번의 파상 공세',
      boothId: 'booth_gwanghwamun',
      waves: [
        wave(3, ['parasite_spawn', 10, 'alley_s1'], ['zombie_ancient', 4, 'stairs_e']),
        wave(4, ['wito_drone', 6, 'alley_s2'], ['guest_elite', 5, 'lane_e']),
        wave(4, ['parasite_horror', 3, 'stairs_e'], ['wito_heavy_gunner', 4, 'alley_s1']),
        wave(4, ['guest_hunter', 8, 'lane_e'], ['parasite_horror', 3, 'alley_s2'], ['wito_drone', 6, 'alley_s1']),
      ],
    },
    { kind: 'boss', label: '1차 보스 — 위토 사령관', monsterId: 'wito_commander', spawnPoint: 'boss', adds: [wave(10, ['guest_elite', 5, 'alley_s2'])] },
    { kind: 'boss', label: '최종 보스 — 회장 좀비', monsterId: 'zombie_ceo', spawnPoint: 'boss', adds: [wave(8, ['parasite_horror', 3, 'stairs_e'])] },
  ],
  rewards: {
    won: 250_000_000,
    xp: 40_000_000,
    items: [...gear(1, 'armor_bottom_omega', 'armor_shoes_omega', 'armor_hat_omega'), ...gear(0.5, 'omega_judge', 'omega_pdw', 'omega_sg', 'omega_maw'), { itemId: 'premium_coupon', chance: 1, qty: 20 }],
  },
  failPenalty: { won: 500_000 },
};

/** 코엑스 지하 전 구간: X를 더 두텁게 + 보스 셋. */
const coexRun = (label: string, n: number, bosses: AssaultDef['phases']): AssaultDef['phases'] => [
  { kind: 'clear', label, waves: [wave(2, ['guest_hunter', n, 'recon_n'], ['parasite_spawn', n, 'recon_s']), wave(3, ['wito_heavy_gunner', n / 2, 'recon_n'], ['guest_elite', n / 2, 'recon_s'])] },
  { kind: 'destroy', label: '환기구 3개 파괴', objectiveIds: ['vent_1', 'vent_2', 'vent_3'], waves: [wave(3, ['parasite_horror', n / 4, 'recon_n'], ['parasite_spawn', n, 'recon_s'])] },
  { kind: 'advance', label: '격벽 통과 — 2구역으로 전진', toZone: 'stage2' },
  {
    kind: 'clear',
    label: '위토 중화기 요새 돌파',
    waves: [wave(2, ['wito_heavy_gunner', n / 2, 'airborne_1'], ['wito_heavy_gunner', n / 2, 'airborne_2']), wave(3, ['wito_drone', n, 'airborne_3'], ['guest_hunter', n, 'airborne_1'])],
  },
  { kind: 'advance', label: '회장실로 전진', toZone: 'bossArena' },
  ...bosses,
];
const boss = (label: string, monsterId: string, ...adds: [string, number, string][]): AssaultDef['phases'][number] => ({ kind: 'boss', label, monsterId, spawnPoint: 'bossSpawn', adds: [wave(8, ...adds)] });

export const assaultX3: AssaultDef = {
  id: 'assault-x3',
  name: '코엑스 지하 — 삼중 봉인 (극한 III)',
  tier: 'C',
  advanced: true,
  power: 2,
  levelRange: [100, 120],
  mapId: 'coex-underground',
  entrySpawn: 'entry',
  phases: coexRun('GUEST·패러사이트 연합군 소탕', 10, [
    boss('1차 보스 — 회장 좀비', 'zombie_ceo', ['parasite_horror', 2, 'boss_adds']),
    boss('2차 보스 — 패러사이트 뿌리', 'parasite_root', ['parasite_spawn', 8, 'boss_adds']),
    boss('최종 보스 — 위토 사령관', 'wito_commander', ['wito_heavy_gunner', 4, 'boss_adds'], ['guest_hunter', 4, 'boss_adds']),
  ]),
  rewards: {
    won: 500_000_000,
    xp: 80_000_000,
    items: [...gear(1, 'armor_top_omega', 'armor_coat_omega', 'omega_ar'), ...gear(0.5, 'omega_rail', 'omega_minigun', 'omega_blade'), { itemId: 'premium_coupon', chance: 1, qty: 30 }],
  },
  failPenalty: { won: 1_000_000 },
};

export const assaultX4: AssaultDef = {
  id: 'assault-x4',
  name: '코엑스 지하 — 최후의 날 (극한 IV)',
  tier: 'C',
  advanced: true,
  power: 3,
  levelRange: [120, 150],
  mapId: 'coex-underground',
  entrySpawn: 'entry',
  phases: coexRun('종말의 전군 소탕', 16, [
    boss('1차 보스 — 회장 좀비', 'zombie_ceo', ['parasite_horror', 4, 'boss_adds']),
    boss('2차 보스 — 패러사이트 뿌리', 'parasite_root', ['parasite_spawn', 12, 'boss_adds']),
    boss('3차 보스 — 위토 사령관', 'wito_commander', ['wito_heavy_gunner', 6, 'boss_adds']),
    boss('최종 보스 — 위토 사령관 (근위대)', 'wito_commander', ['guest_elite', 8, 'boss_adds'], ['wito_drone', 8, 'boss_adds']),
  ]),
  rewards: {
    won: 1_000_000_000,
    xp: 200_000_000,
    items: [
      ...gear(1, 'armor_top_omega_cl', 'armor_coat_omega_cl', 'omega_mlrs', 'omega_rail', 'omega_blade'),
      ...gear(0.6, 'omega_judge', 'omega_pdw', 'omega_ar', 'omega_sg', 'omega_minigun'),
      { itemId: 'premium_coupon', chance: 1, qty: 50 },
    ],
  },
  failPenalty: { won: 2_000_000 },
};
