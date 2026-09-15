import type { NpcDef } from './schema/npc';
import { TEX } from './textureKeys';

export const NPCS: NpcDef[] = [
  {
    id: 'npc_elia',
    name: 'EL.IA 기술정보원',
    role: 'skills',
    tex: TEX.npc_elia,
    lines: ['기술등급이 허락하는 범위 안에서 스킬을 활성화해 드립니다.', '지능이 오르면 더 많은 기술을 동시에 다룰 수 있습니다.'],
  },
  {
    id: 'npc_shop',
    name: '무기상 박상사',
    role: 'shop',
    tex: TEX.npc_shop,
    lines: ['총알은 넉넉히 챙겨 가. 하수도 쪽은 요즘 심상치 않아.'],
    stock: [
      'glock17',
      'm1911',
      'mp5',
      'uzi',
      'ammo_9mm_normal',
      'ammo_9mm_incendiary',
      'ammo_45_normal',
      'ammo_45_incendiary',
      'armor_top_basic',
      'armor_bottom_basic',
      'bandage',
      'energy_drink',
    ],
  },
  {
    id: 'npc_kimhun',
    name: '김훈 소대장',
    role: 'quest',
    tex: TEX.npc_kimhun,
    lines: ['중곡동 경찰서 김훈이다. 살아남았다면 일손이 되어 주겠나.', '패러렐 시스템은 허가증 없이는 못 쓴다. 규정이야.'],
    quests: ['q_junggok_cleanup', 'q_wito_documents'],
  },
  {
    id: 'npc_taxi',
    name: '운송조합원',
    role: 'taxi',
    tex: TEX.npc_taxi,
    lines: ['등록비 내면 조합 차량을 태워 드립니다. 등록한 정류장끼리만 갑니다.', '기름값이 금값이라 요금은 거리대로 받습니다.'],
  },
  {
    id: 'npc_vending',
    name: '자판기',
    role: 'shop',
    tex: TEX.deco_vending,
    lines: ['……동전 넣는 소리가 난다.'],
    stock: ['bandage', 'energy_drink', 'painkiller'],
  },
  {
    id: 'npc_assault',
    name: '어설트 접수원',
    role: 'assault',
    tex: TEX.npc_assault,
    lines: ['중곡동 봉쇄선 돌파 작전에 지원하시겠습니까? 바리케이드를 부수고 전진해 두목을 처리하는 임무입니다.'],
    assaults: ['assault-a'],
  },
];
