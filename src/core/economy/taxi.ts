import type { MapDef } from '@data/schema/map';

/** 운송조합원 택시: register once per map (fee), then ride between registered stops for a fare. */
export const TAXI_REGISTER_FEE = 2_000;
export const TAXI_BASE_FARE = 500;
export const TAXI_PER_HOP = 400;
/** hops assumed for stops not connected by portals (e.g. 평창동) */
export const TAXI_REMOTE_HOPS = 6;

export const taxiFlag = (mapId: string): string => `taxi:${mapId}`;
export const isRegistered = (flags: Record<string, boolean | number>, mapId: string): boolean => !!flags[taxiFlag(mapId)];

/** Maps that have a taxi stand: a spawn point named `taxi`. */
export const hasTaxiStop = (def: MapDef): boolean => !!def.spawnPoints.taxi;

/** Shortest portal-hop distance between two maps; TAXI_REMOTE_HOPS when unreachable. */
export function portalHops(maps: readonly MapDef[], from: string, to: string): number {
  if (from === to) return 0;
  const byId = new Map(maps.map((m) => [m.id, m]));
  const seen = new Set([from]);
  let frontier = [from];
  for (let hops = 1; frontier.length; hops++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const p of byId.get(id)?.portals ?? []) {
        if (p.toMap === to) return hops;
        if (!seen.has(p.toMap)) {
          seen.add(p.toMap);
          next.push(p.toMap);
        }
      }
    }
    frontier = next;
  }
  return TAXI_REMOTE_HOPS;
}

export const fareFor = (hops: number): number => TAXI_BASE_FARE + TAXI_PER_HOP * Math.max(1, hops);

export type RegisterResult = { ok: true; won: number } | { ok: false; reason: 'already' | 'noMoney' | 'noStop' };

export function register(def: MapDef, flags: Record<string, boolean | number>, won: number): RegisterResult {
  if (!hasTaxiStop(def)) return { ok: false, reason: 'noStop' };
  if (isRegistered(flags, def.id)) return { ok: false, reason: 'already' };
  if (won < TAXI_REGISTER_FEE) return { ok: false, reason: 'noMoney' };
  return { ok: true, won: won - TAXI_REGISTER_FEE };
}

export type RideResult = { ok: true; won: number; cost: number } | { ok: false; reason: 'sameMap' | 'notRegistered' | 'hereNotRegistered' | 'noMoney' | 'noStop' | 'level' };

export function ride(maps: readonly MapDef[], flags: Record<string, boolean | number>, won: number, from: string, to: MapDef, level: number): RideResult {
  if (from === to.id) return { ok: false, reason: 'sameMap' };
  if (!hasTaxiStop(to)) return { ok: false, reason: 'noStop' };
  if (!isRegistered(flags, from)) return { ok: false, reason: 'hereNotRegistered' };
  if (!isRegistered(flags, to.id)) return { ok: false, reason: 'notRegistered' };
  if (to.levelRange && level < to.levelRange[0] - 3) return { ok: false, reason: 'level' };
  const cost = fareFor(portalHops(maps, from, to.id));
  if (won < cost) return { ok: false, reason: 'noMoney' };
  return { ok: true, won: won - cost, cost };
}
