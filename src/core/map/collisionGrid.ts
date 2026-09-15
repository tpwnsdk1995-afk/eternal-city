import type { Vec2 } from '../math/vec';

/** Solid-tile grid for movement collision, line of sight and hitscan. World coords are pixels. */
export class CollisionGrid {
  readonly data: Uint8Array;

  constructor(
    readonly width: number,
    readonly height: number,
    readonly tileSize: number,
  ) {
    this.data = new Uint8Array(width * height);
  }

  inBounds(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
  }

  setBlocked(tx: number, ty: number, blocked = true): void {
    if (this.inBounds(tx, ty)) this.data[ty * this.width + tx] = blocked ? 1 : 0;
  }

  fillRect(x: number, y: number, w: number, h: number, blocked = true): void {
    for (let ty = y; ty < y + h; ty++) for (let tx = x; tx < x + w; tx++) this.setBlocked(tx, ty, blocked);
  }

  isBlockedTile(tx: number, ty: number): boolean {
    if (!this.inBounds(tx, ty)) return true; // outside the map is solid
    return this.data[ty * this.width + tx] === 1;
  }

  isBlockedWorld(x: number, y: number): boolean {
    return this.isBlockedTile(Math.floor(x / this.tileSize), Math.floor(y / this.tileSize));
  }

  /**
   * DDA raycast from `origin` along unit `dir` up to `maxDist` px.
   * Returns the distance to the first solid tile, or `maxDist` if none.
   */
  raycast(origin: Vec2, dir: Vec2, maxDist: number): number {
    const ts = this.tileSize;
    let tx = Math.floor(origin.x / ts);
    let ty = Math.floor(origin.y / ts);
    if (this.isBlockedTile(tx, ty)) return 0;

    const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
    const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;
    const tDeltaX = stepX === 0 ? Infinity : Math.abs(ts / dir.x);
    const tDeltaY = stepY === 0 ? Infinity : Math.abs(ts / dir.y);
    const nextX = stepX > 0 ? (tx + 1) * ts : tx * ts;
    const nextY = stepY > 0 ? (ty + 1) * ts : ty * ts;
    let tMaxX = stepX === 0 ? Infinity : (nextX - origin.x) / dir.x;
    let tMaxY = stepY === 0 ? Infinity : (nextY - origin.y) / dir.y;

    let travelled = 0;
    for (let guard = 0; guard < this.width + this.height + 2; guard++) {
      if (tMaxX < tMaxY) {
        travelled = tMaxX;
        tMaxX += tDeltaX;
        tx += stepX;
      } else {
        travelled = tMaxY;
        tMaxY += tDeltaY;
        ty += stepY;
      }
      if (travelled >= maxDist) return maxDist;
      if (this.isBlockedTile(tx, ty)) return travelled;
    }
    return maxDist;
  }

  /** True if a straight line between two world points is unobstructed. */
  hasLineOfSight(a: Vec2, b: Vec2): boolean {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d === 0) return true;
    return this.raycast(a, { x: dx / d, y: dy / d }, d) >= d;
  }
}
