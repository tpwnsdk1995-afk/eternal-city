import type { NpcDef } from './schema/npc';
import { TEX } from './textureKeys';
import { WEAPONS } from './weapons';
import { AMMO } from './ammo';
import { ARMORS, CONSUMABLES } from './armors';

// cosmetics (costume hats, wigs) are cash-shop goods in the original
const COSMETIC = (id: string) => id.startsWith('armor_wig_') || /armor_hat_(straw|cowboy|sunglasses|goggles|pumpkin|santa)/.test(id);
const CASH_FROM = CONSUMABLES.findIndex((c) => c.id === 'hp_pack'); // foods/meds first, then cash-shop goods
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

export const NPCS: NpcDef[] = [
  {
    id: 'npc_elia',
    name: 'EL.IA 기술정보원',
    role: 'skills',
    tex: TEX.npc_elia,
    face: TEX.face_elia,
    lines: ['기술등급이 허락하는 범위 안에서 스킬을 활성화해 드립니다.', '지능이 오르면 더 많은 기술을 동시에 다룰 수 있습니다.'],
  },
  {
    id: 'npc_shop',
    name: '무기상 박상사',
    role: 'shop',
    tex: TEX.npc_shop,
    face: TEX.face_shop,
    lines: ['총알은 넉넉히 챙겨 가. 하수도 쪽은 요즘 심상치 않아.'],
    stock: [
      ...ids(WEAPONS.filter((w) => !w.illegal)),
      ...ids(AMMO),
      ...ids(ARMORS.filter((a) => !COSMETIC(a.id))),
    ],
  },
  {
    id: 'npc_tech',
    name: '기술상 정 기사',
    role: 'tech',
    tex: TEX.npc_tech,
    face: TEX.face_tech,
    lines: ['강화는 운이고 개조는 실력이지. 돈만 있으면 둘 다 해 주마.', '7강 넘긴 총은 유니크 개조를 노려 볼 만해. 실패해도 총은 안 부러져.'],
  },
  {
    id: 'npc_blackmarket',
    name: '암거래상',
    role: 'shop',
    tex: TEX.npc_blackmarket,
    face: TEX.face_blackmarket,
    lines: ['……경찰서 쪽엔 말하지 마. 개조품은 손맛이 다르지.', '철갑탄이랑 Slug도 있어. 값은 좀 나가.'],
    stock: [...ids(WEAPONS.filter((w) => w.illegal)), 'ammo_9mm_ap', 'ammo_45_ap', 'ammo_12ga_slug', 'ammo_556_ap', 'ammo_762_ap'],
  },
  {
    id: 'npc_storage',
    name: '구청 보관소 한수진',
    role: 'storage',
    tex: TEX.npc_storage,
    face: TEX.face_storage,
    lines: ['구청 지하 보관소입니다. 맡긴 물건은 무게로 안 잡히니 무거운 총은 여기 두고 다니세요.', '칸은 40개까지. 소모품은 한 칸에 겹쳐 둘 수 있어요.', '장착 중인 건 벗어서 가져오셔야 받아요.'],
  },
  {
    id: 'npc_mainstream',
    name: '광진구청 과장 오민석',
    role: 'quest',
    tex: TEX.npc_mainstream,
    face: TEX.face_mainstream,
    lines: ['구청 생존자 지원과입니다. 매일 순찰 임무를 발주하고 있습니다.', '메인스트림은 하루 한 번입니다. 일반과 CL 등급이 있어요.', '길드 사무실도 여기서 봅니다. 생존자들을 모아 등록하면 구청이 지원해 드려요.'],
    quests: ['ms_2002_normal', 'ms_2002_cl', 'ms_2005_normal', 'ms_2005_cl', 'ms_2006_normal', 'ms_2008_normal', 'ms_2017_normal', 'ms_2017_cl'],
  },
  {
    id: 'npc_parallel',
    name: '패러렐 시스템 관리관',
    role: 'parallel',
    tex: TEX.npc_parallel,
    face: TEX.face_parallel,
    lines: ['패러렐 시스템은 허가증을 가진 헌터만 통과시킵니다. 어느 해로 가시겠습니까?', '시간대를 건너면 그 해의 안전지역에 도착합니다. 돌아올 때도 저를 찾으세요.'],
  },
  {
    id: 'npc_cybershop',
    name: '사이버샵 단말기',
    role: 'shop',
    tex: TEX.npc_cyber,
    lines: ['사이버샵에 접속했습니다. 회복 팩, 강화 약물, 프리미엄 쿠폰을 ₩로 구매할 수 있습니다.', '프리미엄 쿠폰은 30일 동안 경험치와 ₩ 획득, 무게 한도를 늘려 줍니다.'],
    stock: [...ids(CONSUMABLES.slice(CASH_FROM)), ...ids(ARMORS.filter((a) => COSMETIC(a.id)))],
  },
  {
    id: 'npc_kimhun',
    name: '김훈 소대장',
    role: 'quest',
    tex: TEX.npc_kimhun,
    face: TEX.face_kimhun,
    lines: ['중곡동 경찰서 김훈이다. 살아남았다면 일손이 되어 주겠나.', '패러렐 시스템은 허가증 없이는 못 쓴다. 규정이야.'],
    quests: ['q_junggok_cleanup', 'q_wito_documents'],
  },
  {
    id: 'npc_trainer',
    name: '훈련 교관 한지민',
    role: 'quest',
    tex: TEX.npc_assault,
    face: TEX.face_trainer,
    lines: [
      '알파 훈련장이다. 원작식은 좌클릭 이동·우클릭 공격, 현대식은 WASD·좌클릭. Esc 메뉴에서 바꿀 수 있어.',
      'Space로 웅크리면 명중이 오르고, 다시 Space로 점프해 근접 공격을 피한다.',
      'I 인벤토리, C 상태창(스탯 배분), K 스킬, Q 퀘스트. 울타리 안 좀비견으로 연습해 봐.',
    ],
    quests: ['q_tutorial'],
  },
  {
    id: 'npc_taxi',
    name: '운송조합원',
    role: 'taxi',
    tex: TEX.npc_taxi,
    face: TEX.face_taxi,
    lines: ['등록비 내면 조합 차량을 태워 드립니다. 등록한 정류장끼리만 갑니다.', '기름값이 금값이라 요금은 거리대로 받습니다.'],
  },
  {
    id: 'npc_vending',
    name: '자판기',
    role: 'shop',
    tex: TEX.deco_vending,
    lines: ['……동전 넣는 소리가 난다.'],
    stock: ids(CONSUMABLES.slice(0, CASH_FROM)),
  },
  {
    id: 'npc_assault',
    name: '어설트 접수원',
    role: 'assault',
    tex: TEX.npc_assault,
    face: TEX.face_assault,
    lines: ['어설트 작전 접수처입니다. 레벨에 맞는 임무를 고르세요 — 기물 파괴 전진, 거점 방어, 보스 사냥이 있습니다.'],
    assaults: ['assault-a', 'assault-b', 'assault-c', 'assault-d', 'assault-e', 'assault-f', 'assault-a-adv', 'assault-b-adv', 'assault-c-adv', 'assault-d-adv', 'assault-e-adv', 'assault-f-adv'],
  },
];
