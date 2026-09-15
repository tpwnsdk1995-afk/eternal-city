/**
 * 패러렐 시스템 — the years a hunter can travel to. Each year has a safe-zone hub; travel lands there.
 * 2002 is always open; later years need the 패러렐 시스템 허가증 and a milestone.
 */
export interface YearDef {
  year: 2002 | 2003 | 2004;
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
];
