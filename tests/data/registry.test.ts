import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ASSAULTS, ITEMS, MAPS, registry, validateAll } from '../../src/data/registry';
import { MONSTERS } from '../../src/data/monsters';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

describe('content registry', () => {
  it('validates all cross-references', () => {
    expect(() => validateAll()).not.toThrow();
  });

  it('has the M1 content set', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(12);
    expect(MONSTERS.length).toBeGreaterThanOrEqual(7);
    expect(MAPS.map((m) => m.id)).toEqual(expect.arrayContaining(['gwangjin-gucheong-parking', 'junggok-dong', 'junggok-blockade']));
    expect(ASSAULTS.map((a) => a.id)).toContain('assault-a');
  });

  it('typed getters reject the wrong kind', () => {
    expect(() => registry.weapon('ammo_9mm_normal')).toThrow();
    expect(registry.weapon('glock17').class).toBe('권총');
  });

  it('src/core and src/data never import phaser', () => {
    const offenders = [...walk('src/core'), ...walk('src/data')].filter((f) => /from ['"]phaser['"]/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
