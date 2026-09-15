/**
 * 패러렐 시스템 — the years a hunter can travel to. Each year has a safe-zone hub; travel lands there.
 * 2002 is always open; later years need the 패러렐 시스템 허가증 and a milestone.
 */
export interface YearDef {
  year: 2002 | 2003 | 2004 | 2005 | 2006 | 2008 | 2017;
  name: string;
  desc: string;
  hubMapId: string;
  unlock: {
    /** 패러렐 시스템 허가증 (flag parallelPermit) */
    permit?: boolean;
    /** either of these opens the year once the permit is held */
    level?: number;
    orFlag?: string;
  };
}

export const YEARS: YearDef[] = [
  { year: 2002, name: '2002년 · 중곡동', desc: '봉쇄된 중곡동과 광진구청 지하. 모든 것이 시작된 곳.', hubMapId: 'gwangjin-gucheong-parking', unlock: {} },
  {
    year: 2003,
    name: '2003년 · 종로',
    desc: '한 해 뒤의 서울 도심. 종로거리는 좀비화된 경찰·소방 인력과 W.I.T.O 워킹 터렛이 장악했다.',
    hubMapId: 'jongno-shelter',
    unlock: { permit: true },
  },
  {
    year: 2004,
    name: '2004년 · 테크노마트~의정부',
    desc: '한강 북단 강변도로와 북쪽 외곽. 좀비 군인, 라바 군집, 그리고 땅속의 레이드 보스 몽골리안 데스웜.',
    hubMapId: 'technomart-shelter',
    unlock: { permit: true, level: 25, orFlag: 'campaign:2002:complete' },
  },
  {
    year: 2005,
    name: '2005년 · 폐허의 서울',
    desc: '함락 이후. 의정부·종로는 폐허가 되었고 일산 지하수로까지 GUEST와 패러사이트가 뿌리내렸다.',
    hubMapId: 'uijeongbu-ruins-shelter',
    unlock: { permit: true, level: 40, orFlag: 'campaign:2004:complete' },
  },
  {
    year: 2006,
    name: '2006년 · 강남',
    desc: '유리 빌딩이 그대로 선 강남. 사무직 좀비와 위토 중화기병, 빌딩 사이를 뛰어다니는 GUEST 사냥꾼.',
    hubMapId: 'gangnam-shelter',
    unlock: { permit: true, level: 50, orFlag: 'campaign:2005:complete' },
  },
  {
    year: 2008,
    name: '2008년 · 여의도',
    desc: '국회를 마지막 거점으로 삼은 위토군. 진압경찰 좀비, 정찰 드론, 강을 타고 올라온 패러사이트 새끼.',
    hubMapId: 'yeouido-shelter',
    unlock: { permit: true, level: 65, orFlag: 'campaign:2006:complete' },
  },
  {
    year: 2017,
    name: '2017년 · 현재의 서울',
    desc: '모든 시간선이 모이는 현재. 광화문의 GUEST 정예와 남산 정상의 the Wise One.',
    hubMapId: 'seoul-station-shelter',
    unlock: { permit: true, level: 80, orFlag: 'campaign:2008:complete' },
  },
];
