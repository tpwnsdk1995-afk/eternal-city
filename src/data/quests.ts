import type { QuestDef } from './schema/quest';

export const QUESTS: QuestDef[] = [
  {
    id: 'q_junggok_cleanup',
    name: '중곡동 정리',
    giver: 'npc_kimhun',
    text: {
      offer: '경찰서 앞이 좀비로 들끓어서 순찰을 못 나가고 있네. 거리의 좀비를 열 마리만 정리해 주겠나?',
      progress: '아직 거리가 정리되지 않았군. 조심하게.',
      complete: '수고했네. 이 정도면 대원들도 숨을 돌리겠어. 다음 일도 부탁할 게 있네.',
    },
    steps: [{ kind: 'kill', faction: 'zombie', count: 10, label: '중곡동 좀비 처치' }],
    rewards: { won: 3_000, xp: 120, items: [{ itemId: 'ammo_9mm_normal', qty: 100 }] },
  },
  {
    id: 'q_wito_documents',
    name: '위토군 배치문서 회수',
    giver: 'npc_kimhun',
    prereq: { quests: ['q_junggok_cleanup'], level: 3 },
    text: {
      offer: 'W.I.T.O 놈들이 용곡중학교 운동장에 진을 쳤네. 병사들이 들고 다니는 배치문서를 회수해 오면, 패러렐 시스템 허가증을 발급해 주겠네.',
      progress: '배치문서는 아직인가? 용곡중학교는 중곡동 북쪽이야.',
      complete: '이게 그 문서군… 약속대로 허가증이다. 이제 다른 시간대의 서울로 갈 수 있어.',
    },
    steps: [
      { kind: 'reach', mapId: 'yonggok-middle-school', label: '용곡중학교 도착' },
      { kind: 'collect', itemId: 'wito_dispatch_doc', count: 1, label: '위토군 배치문서 회수' },
    ],
    rewards: { won: 8_000, xp: 350, flags: ['parallelPermit'], items: [{ itemId: 'ammo_9mm_incendiary', qty: 60 }] },
    consumes: [{ itemId: 'wito_dispatch_doc', qty: 1 }],
  },
];
