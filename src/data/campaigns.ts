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
  {
    id: '2004',
    name: '2004 · 강변의 겨울',
    year: 2004,
    desc: '한강 북단과 북쪽 외곽을 되찾고, 땅속의 데스웜을 잡아 2005년으로 향하는 길을 연다.',
    finalFlag: 'campaign:2004:complete',
    chapters: [
      { id: 'ch1', title: '1장 · 강변도로', desc: '테크노마트~올림픽대교의 좀비 군인을 밀어낸다.', requires: { kills: [{ monsterId: 'zombie_soldier', count: 20 }] }, rewards: { won: 12_000, xp: 1_500, items: [{ itemId: 'ammo_556_ap', qty: 60 }] } },
      { id: 'ch2', title: '2장 · 엘리트 병력', desc: '위토 엘리트 병사 10명을 처치한다.', requires: { kills: [{ monsterId: 'wito_elite_trooper', count: 10 }] }, rewards: { won: 18_000, xp: 2_200, items: [{ itemId: 'armor_hat_tactical', qty: 1 }] } },
      { id: 'ch3', title: '3장 · 땅속의 것', desc: '의정부 외곽의 몽골리안 데스웜을 처치한다.', requires: { kills: [{ monsterId: 'mongolian_deathworm', count: 1 }] }, rewards: { won: 40_000, xp: 4_000, items: [{ itemId: 'armor_coat_kevlar_cl', qty: 1 }] } },
      { id: 'ch4', title: '4장 · 심층 정복', desc: '하수도 심층 어설트를 성공하고 Lv.40에 도달한다.', requires: { assaultClears: [{ assaultId: 'assault-c', count: 1 }], level: 40 }, rewards: { won: 50_000, xp: 5_000, items: [{ itemId: 'premium_coupon', qty: 1 }] } },
    ],
  },
  {
    id: '2005',
    name: '2005 · 침묵의 폐허',
    year: 2005,
    desc: '함락된 서울에서 GUEST를 몰아내고 패러사이트의 뿌리를 끊는다.',
    finalFlag: 'campaign:2005:complete',
    chapters: [
      { id: 'ch1', title: '1장 · 척후 사냥', desc: 'GUEST 척후 15명을 처치한다.', requires: { kills: [{ monsterId: 'guest_scout', count: 15 }] }, rewards: { won: 25_000, xp: 3_000, items: [{ itemId: 'ammo_50_ap', qty: 40 }] } },
      { id: 'ch2', title: '2장 · 전사와 마주하다', desc: 'GUEST 전사 10명을 처치한다.', requires: { kills: [{ monsterId: 'guest_warrior', count: 10 }] }, rewards: { won: 35_000, xp: 4_000, items: [{ itemId: 'ammo_rocket', qty: 6 }] } },
      { id: 'ch3', title: '3장 · 근절', desc: '패러사이트 근절 어설트를 성공한다.', requires: { assaultClears: [{ assaultId: 'assault-d', count: 1 }] }, rewards: { won: 100_000, xp: 12_000, items: [{ itemId: 'armor_top_tactical_cl', qty: 1 }, { itemId: 'armor_coat_kevlar_cl', qty: 1 }] } },
    ],
  },
  {
    id: '2006',
    name: '2006 · 유리의 숲',
    year: 2006,
    desc: '강남의 빌딩 숲을 되찾고 테헤란로의 회장 좀비를 끌어내린다.',
    finalFlag: 'campaign:2006:complete',
    chapters: [
      { id: 'ch1', title: '1장 · 출근길', desc: '테헤란 사무직 좀비 30명을 처치한다.', requires: { kills: [{ monsterId: 'zombie_office', count: 30 }] }, rewards: { won: 60_000, xp: 8_000, items: [{ itemId: 'ammo_762_ap', qty: 60 }] } },
      { id: 'ch2', title: '2장 · 중화기 진지', desc: '위토 중화기병 15명과 GUEST 사냥꾼 15명을 처치한다.', requires: { kills: [{ monsterId: 'wito_heavy_gunner', count: 15 }, { monsterId: 'guest_hunter', count: 15 }] }, rewards: { won: 90_000, xp: 12_000, items: [{ itemId: 'hp_pack', qty: 3 }] } },
      { id: 'ch3', title: '3장 · 회장실', desc: '네임드 회장 좀비를 처치한다.', requires: { kills: [{ monsterId: 'zombie_ceo', count: 1 }], level: 60 }, rewards: { won: 200_000, xp: 25_000, items: [{ itemId: 'armor_top_tactical_cl', qty: 1 }] } },
      { id: 'ch4', title: '4장 · 환기구 폐쇄', desc: '코엑스 지하 어설트를 성공해 포자 확산을 끊는다.', requires: { assaultClears: [{ assaultId: 'assault-e', count: 1 }] }, rewards: { won: 300_000, xp: 40_000, items: [{ itemId: 'premium_coupon', qty: 1 }] } },
    ],
  },
  {
    id: '2008',
    name: '2008 · 마지막 의사당',
    year: 2008,
    desc: '여의도를 요새화한 위토군의 사령관을 무너뜨린다.',
    finalFlag: 'campaign:2008:complete',
    chapters: [
      { id: 'ch1', title: '1장 · 공원 소탕', desc: '진압경찰 좀비 30명과 패러사이트 새끼 30마리를 처치한다.', requires: { kills: [{ monsterId: 'zombie_riot_police', count: 30 }, { monsterId: 'parasite_spawn', count: 30 }] }, rewards: { won: 120_000, xp: 16_000, items: [{ itemId: 'ammo_50_ap', qty: 60 }] } },
      { id: 'ch2', title: '2장 · 드론 격추', desc: '위토 정찰 드론 20기를 격추한다.', requires: { kills: [{ monsterId: 'wito_drone', count: 20 }] }, rewards: { won: 160_000, xp: 20_000, items: [{ itemId: 'ammo_rocket', qty: 10 }] } },
      { id: 'ch3', title: '3장 · 사령관', desc: '네임드 위토 사령관을 처치한다.', requires: { kills: [{ monsterId: 'wito_commander', count: 1 }], level: 75 }, rewards: { won: 400_000, xp: 50_000, items: [{ itemId: 'armor_coat_kevlar_cl', qty: 1 }, { itemId: 'premium_coupon', qty: 1 }] } },
    ],
  },
  {
    id: '2017',
    name: '2017 · 현재',
    year: 2017,
    desc: '모든 시간선의 끝. 남산 정상의 the Wise One을 쓰러뜨리고 서울을 되찾는다.',
    finalFlag: 'campaign:2017:complete',
    chapters: [
      { id: 'ch1', title: '1장 · 광화문', desc: 'GUEST 정예 25명과 고대 좀비 25명을 처치한다.', requires: { kills: [{ monsterId: 'guest_elite', count: 25 }, { monsterId: 'zombie_ancient', count: 25 }] }, rewards: { won: 250_000, xp: 40_000, items: [{ itemId: 'ammo_50_ap', qty: 100 }] } },
      { id: 'ch2', title: '2장 · 남산 등반', desc: '패러사이트 호러 10마리를 처치한다.', requires: { kills: [{ monsterId: 'parasite_horror', count: 10 }] }, rewards: { won: 350_000, xp: 60_000, items: [{ itemId: 'premium_coupon', qty: 1 }] } },
      { id: 'ch3', title: '3장 · 광화문 사수', desc: '광화문 부스 방어 어설트를 성공한다.', requires: { assaultClears: [{ assaultId: 'assault-f', count: 1 }] }, rewards: { won: 800_000, xp: 120_000, items: [{ itemId: 'premium_coupon', qty: 1 }] } },
      { id: 'ch4', title: '4장 · the Wise One', desc: '남산 정상의 the Wise One을 처치한다.', requires: { kills: [{ monsterId: 'the_wise_one', count: 1 }], level: 90 }, rewards: { won: 2_000_000, xp: 300_000, items: [{ itemId: 'armor_top_tactical_cl', qty: 1 }, { itemId: 'armor_coat_kevlar_cl', qty: 1 }, { itemId: 'premium_coupon', qty: 3 }] } },
    ],
  },
];
