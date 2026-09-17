import type { MapDef } from '../schema/map';
import { junggokBlockade } from './junggok-blockade';
import { junggokStationDefense } from './junggok-station-defense';

/**
 * Instance maps for the late-year assaults. They reuse the two proven assault footprints (the
 * blockade corridor and the plaza-with-booth) re-dressed for 2006 코엑스 지하 and 2017 광화문.
 */

/** 어설트 E — 코엑스 지하 환기구 폐쇄: corridor → 3 vents → gate → 2구역 → 보스 아레나 (dark). */
export const coexUnderground: MapDef = {
  ...junggokBlockade,
  id: 'coex-underground',
  name: '코엑스 지하 통로 (봉쇄)',
  year: 2006,
  dark: true,
  levelRange: [60, 100],
  objectives: (junggokBlockade.objectives ?? []).map((o, i) => ({ ...o, id: `vent_${i + 1}`, hp: 900, label: `환기구 ${i + 1}` })),
  gates: (junggokBlockade.gates ?? []).map((g) => ({ ...g, opensWhen: ['vent_1', 'vent_2', 'vent_3'] })),
  spawnPoints: { ...junggokBlockade.spawnPoints, raidEntry: { x: 76, y: 20 } }, // 레이드: 격벽 너머 보스방에서 바로 시작
};

/** 어설트 F — 광화문 부스 방어: plaza with the 조합 부스 in the middle, lanes on three sides. */
export const gwanghwamunDefense: MapDef = {
  ...junggokStationDefense,
  id: 'gwanghwamun-defense',
  name: '광화문 광장 (봉쇄)',
  year: 2017,
  levelRange: [85, 100],
  objectives: (junggokStationDefense.objectives ?? []).map((o) => ({ ...o, id: 'booth_gwanghwamun', hp: 6_000, label: '광화문 부스' })),
};
