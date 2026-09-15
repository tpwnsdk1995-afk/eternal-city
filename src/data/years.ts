/**
 * 패러렐 시스템 — the years a hunter can travel to. Each year has a safe-zone hub; travel lands there.
 * 2002 is always open; later years need the 패러렐 시스템 허가증 and a milestone.
 */
export interface YearDef {
  year: 2002 | 2003 | 2004 | 2005;
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
];
