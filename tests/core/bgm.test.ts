import { describe, expect, it } from 'vitest';
import { BGM, bgmForScene, midiHz, stepSeconds } from '@core/audio/bgm';

describe('procedural BGM tables', () => {
  it('every mood has 4 bars of chords, bass and 16-step drums with only k/s/h/.', () => {
    for (const [kind, def] of Object.entries(BGM)) {
      expect(def.chords.length, kind).toBe(4);
      expect(def.bass.length, kind).toBe(4);
      expect(def.drums.length, kind).toBe(4);
      for (const bar of def.drums) {
        expect(bar.length, kind).toBe(16);
        expect(/^[ksh.]+$/.test(bar), kind).toBe(true);
      }
      for (const c of def.chords) expect(c.length).toBeGreaterThanOrEqual(3);
      expect(def.bpm).toBeGreaterThan(40);
      expect(def.bpm).toBeLessThan(200);
      if (def.arp.length) expect(def.arp.every((i) => i >= 0 && i < 3)).toBe(true);
    }
    expect(BGM.boss.bpm).toBeGreaterThan(BGM.field.bpm);
    expect(BGM.title.drumGain).toBe(0);
  });

  it('pitch and timing helpers', () => {
    expect(midiHz(69)).toBe(440);
    expect(midiHz(57)).toBeCloseTo(220, 5);
    expect(stepSeconds(120)).toBeCloseTo(0.125, 6);
  });

  it('scene → mood', () => {
    expect(bgmForScene('Title')).toBe('title');
    expect(bgmForScene('SafeZone')).toBe('safe');
    expect(bgmForScene('Field')).toBe('field');
    expect(bgmForScene('Assault')).toBe('assault');
    expect(bgmForScene('Assault', true)).toBe('boss');
    expect(bgmForScene('UI')).toBe('none');
  });
});
