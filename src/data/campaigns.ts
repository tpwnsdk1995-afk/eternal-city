import type { CampaignDef } from './schema/progress';

/** 2002 캠페인 — the year's story spine, stitched from quests, assaults and named kills. */
export const CAMPAIGNS: CampaignDef[] = [
  {
    id: '2002',
    name: '2002 · 중곡동의 봄',
    year: 2002,
    desc: '봉쇄된 중곡동에서 살아남아 W.I.T.O의 계획을 막고, 서울의 다른 시간대로 나아갈 자격을 얻는다.',
    finalFlag: 'campaign:2002:complete',
    chapters: [
      {
        id: 'ch1',
        title: '1장 · 생존자',
        desc: '경찰서 앞을 정리하고 김훈 소대장의 신임을 얻는다.',
        requires: { quests: ['q_junggok_cleanup'] },
        rewards: { won: 2_000, xp: 100, items: [{ itemId: 'bandage', qty: 3 }] },
      },
      {
        id: 'ch2',
        title: '2장 · 허가증',
        desc: '용곡중학교의 위토군 배치문서를 회수해 패러렐 시스템 허가증을 발급받는다.',
        requires: { quests: ['q_wito_documents'], flags: ['parallelPermit'] },
        rewards: { won: 5_000, xp: 300, items: [{ itemId: 'ammo_9mm_ap', qty: 50 }] },
      },
      {
        id: 'ch3',
        title: '3장 · 봉쇄선',
        desc: '중곡동 봉쇄선을 돌파하고 좀비두목을 처치한다.',
        requires: { assaultClears: [{ assaultId: 'assault-a', count: 1 }] },
        rewards: { won: 8_000, xp: 600, items: [{ itemId: 'armor_shoes_boots', qty: 1 }] },
      },
      {
        id: 'ch4',
        title: '4장 · 하수도의 주인',
        desc: '아차산 하수도 깊숙한 곳의 네임드 오구린을 처치한다.',
        requires: { kills: [{ monsterId: 'ogurin', count: 1 }] },
        rewards: { won: 10_000, xp: 800, items: [{ itemId: 'armor_coat_leather', qty: 1 }] },
      },
      {
        id: 'ch5',
        title: '5장 · 거점 사수',
        desc: '중곡역 3시 부스를 공수부대에서 지켜 낸다.',
        requires: { assaultClears: [{ assaultId: 'assault-b', count: 1 }], level: 20 },
        rewards: { won: 15_000, xp: 1_500, items: [{ itemId: 'ammo_556_ap', qty: 60 }] },
      },
      {
        id: 'ch6',
        title: '6장 · 심층의 변종',
        desc: '하수도 심층의 변종 오구린을 처치하고 2002년의 서울을 매듭짓는다.',
        requires: { assaultClears: [{ assaultId: 'assault-c', count: 1 }], level: 30 },
        rewards: { won: 30_000, xp: 3_000, items: [{ itemId: 'armor_top_tactical_cl', qty: 1 }] },
      },
    ],
  },
];
