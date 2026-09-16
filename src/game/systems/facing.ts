/** 8 facing directions in screen space (y down): 0=E 1=SE 2=S 3=SW 4=W 5=NW 6=N 7=NE. */
export type Dir = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DIR_S: Dir = 2;
/** walk cycle frames per direction: 0 idle, 1 left step, 2 passing, 3 right step */
export const WALK_FRAMES = 4;
/** columns per direction row in a figure sheet: the 4 walk frames + aim + death */
export const FRAMES_PER_DIR = 6;
/** smooth 4-beat walk: step, pass (bob), step, idle-as-pass */
export const WALK_SEQUENCE = [1, 2, 3, 0] as const;

export function dirFromAngle(rad: number): Dir {
  const a = ((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return (Math.round(a / (Math.PI / 4)) % 8) as Dir;
}

/** Frame index inside a figure spritesheet laid out as 8 rows (dirs) × 6 columns. */
export function figureFrame(dir: Dir, walkFrame: number): number {
  return dir * FRAMES_PER_DIR + (walkFrame % WALK_FRAMES);
}

/** Weapon-raised pose for a direction (used while firing). */
export const aimFrame = (dir: Dir): number => dir * FRAMES_PER_DIR + 4;

/** Lying-dead pose for a direction. */
export const deathFrame = (dir: Dir): number => dir * FRAMES_PER_DIR + 5;

/** Walk frame for an elapsed walk time, cycling through WALK_SEQUENCE every `beatMs`. */
export const walkFrameAt = (walkMs: number, beatMs: number): number => WALK_SEQUENCE[Math.floor(walkMs / beatMs) % WALK_SEQUENCE.length];

/** y-sorted depth for world sprites so nearer (lower) things draw on top; stays inside [10, 11). */
export const depthForY = (y: number): number => 10 + Math.min(0.999, Math.max(0, y) * 1e-5);
