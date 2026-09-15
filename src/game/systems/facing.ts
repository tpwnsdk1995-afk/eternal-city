/** 8 facing directions in screen space (y down): 0=E 1=SE 2=S 3=SW 4=W 5=NW 6=N 7=NE. */
export type Dir = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DIR_S: Dir = 2;
export const WALK_FRAMES = 4;

export function dirFromAngle(rad: number): Dir {
  const a = ((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return (Math.round(a / (Math.PI / 4)) % 8) as Dir;
}

/** Frame index inside a figure spritesheet laid out as 8 rows (dirs) × 4 columns (walk cycle). */
export function figureFrame(dir: Dir, walkFrame: number): number {
  return dir * WALK_FRAMES + (walkFrame % WALK_FRAMES);
}

/** y-sorted depth for world sprites so nearer (lower) things draw on top; stays inside [10, 11). */
export const depthForY = (y: number): number => 10 + Math.min(0.999, Math.max(0, y) * 1e-5);
