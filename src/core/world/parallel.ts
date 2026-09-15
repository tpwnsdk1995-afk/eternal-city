import { YEARS, type YearDef } from '@data/years';
import type { MapDef } from '@data/schema/map';

export type TravelBlock = 'same' | 'permit' | 'milestone' | 'unknown';

export interface TravelCtx {
  flags: Record<string, boolean | number>;
  level: number;
  currentYear: MapDef['year'];
}

export const yearDef = (year: number): YearDef | undefined => YEARS.find((y) => y.year === year);

/** Safe-zone hub for a map's year (death respawn, assault return, year travel). */
export function hubForYear(year: MapDef['year']): string {
  return yearDef(year as number)?.hubMapId ?? YEARS[0].hubMapId;
}

export function canTravel(year: number, ctx: TravelCtx): { ok: true } | { ok: false; reason: TravelBlock } {
  const def = yearDef(year);
  if (!def) return { ok: false, reason: 'unknown' };
  if (def.year === ctx.currentYear) return { ok: false, reason: 'same' };
  if (def.unlock.permit && !ctx.flags.parallelPermit) return { ok: false, reason: 'permit' };
  const needsMilestone = def.unlock.level !== undefined || def.unlock.orFlag !== undefined;
  if (needsMilestone) {
    const byLevel = def.unlock.level !== undefined && ctx.level >= def.unlock.level;
    const byFlag = def.unlock.orFlag !== undefined && !!ctx.flags[def.unlock.orFlag];
    if (!byLevel && !byFlag) return { ok: false, reason: 'milestone' };
  }
  return { ok: true };
}

/** Human-readable unlock line for the year list. */
export function unlockText(def: YearDef): string {
  const parts: string[] = [];
  if (def.unlock.permit) parts.push('패러렐 시스템 허가증');
  const alt: string[] = [];
  if (def.unlock.level !== undefined) alt.push(`Lv.${def.unlock.level}`);
  if (def.unlock.orFlag) alt.push(`${def.unlock.orFlag.split(':')[1]} 캠페인 완주`);
  if (alt.length) parts.push(alt.join(' 또는 '));
  return parts.length ? `해금 조건: ${parts.join(' + ')}` : '항상 이용 가능';
}
