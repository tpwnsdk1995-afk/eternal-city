import { describe, expect, it } from 'vitest';
import { WEAPON_CLASSES } from '@data/schema/enums';
import { GUN_PROFILES, SFX_MIN_GAP_MS, SFX_NAMES, ambientForMap, spatialGain, subFireProfile } from '@core/audio/sfx';

describe('sfx tables', () => {
  it('every weapon class has a gunshot recipe with sane ranges', () => {
    for (const c of WEAPON_CLASSES) {
      const p = GUN_PROFILES[c];
      expect(p, c).toBeDefined();
      expect(p.noiseMs).toBeGreaterThan(20);
      expect(p.noiseMs).toBeLessThan(600);
      expect(p.gain).toBeGreaterThan(0);
      expect(p.gain).toBeLessThanOrEqual(1);
    }
    expect(GUN_PROFILES['근접무기'].kind).toBe('swing');
    expect(GUN_PROFILES['투척중화기'].kind).toBe('launch');
    expect(GUN_PROFILES['변이무기'].kind).toBe('claws');
    const sub = subFireProfile(GUN_PROFILES['권총']);
    expect(sub.gain).toBeLessThan(GUN_PROFILES['권총'].gain);
  });

  it('spatial gain falls off with distance and floors above silence', () => {
    expect(spatialGain(0)).toBe(1);
    expect(spatialGain(140)).toBe(1);
    expect(spatialGain(450)).toBeGreaterThan(0.4);
    expect(spatialGain(450)).toBeLessThan(0.7);
    expect(spatialGain(2000)).toBe(0.12);
  });

  it('gap table only names real sounds; ambient picks by map flags', () => {
    for (const k of Object.keys(SFX_MIN_GAP_MS)) expect(SFX_NAMES).toContain(k);
    expect(ambientForMap({ safe: true, dark: true })).toBe('safe');
    expect(ambientForMap({ safe: false, dark: true })).toBe('dark');
    expect(ambientForMap({ safe: false })).toBe('field');
  });
});
