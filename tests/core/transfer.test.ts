import { beforeEach, describe, expect, it } from 'vitest';
import { gameState } from '../../src/game/state/GameState';
import { takeSnapshot } from '../../src/game/state/SaveService';
import { checksum, decodeSaveFile, describeDecodeFail, encodeSaveFile, saveFileName } from '@core/save/transfer';
import { CURRENT_SAVE_VERSION } from '@core/save/saveSchema';

describe('save transfer (내보내기/불러오기)', () => {
  beforeEach(() => gameState.newGame('이동테스트'));

  it('round-trips a snapshot through the envelope', () => {
    const snap = takeSnapshot();
    const text = encodeSaveFile(snap, 1_000);
    const env = JSON.parse(text);
    expect(env.app).toBe('eternal-city');
    expect(env.version).toBe(CURRENT_SAVE_VERSION);
    expect(env.exportedAt).toBe(1_000);
    const r = decodeSaveFile(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.save.character.name).toBe('이동테스트');
      expect(r.save.inventory.items.length).toBe(snap.inventory.items.length);
      expect(r.exportedAt).toBe(1_000);
    }
  });

  it('accepts a bare (old-version) snapshot and migrates it', () => {
    const { quests: _q, ...rest } = takeSnapshot();
    const r = decodeSaveFile(JSON.stringify({ ...rest, version: 1 }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.save.version).toBe(CURRENT_SAVE_VERSION);
      expect(r.save.quests).toEqual({ active: [], completed: [] });
      expect(r.exportedAt).toBeNull();
    }
  });

  it('reports parse / format / checksum / version failures distinctly', () => {
    expect(decodeSaveFile('not json')).toEqual({ ok: false, reason: 'parse' });
    expect(decodeSaveFile('[1,2]')).toEqual({ ok: false, reason: 'format' });
    expect(decodeSaveFile(JSON.stringify({ app: 'eternal-city', kind: 'save', save: 3 }))).toEqual({ ok: false, reason: 'format' });
    const text = encodeSaveFile(takeSnapshot());
    const tampered = text.replace('"won":', '"won":1');
    expect(decodeSaveFile(tampered)).toEqual({ ok: false, reason: 'checksum' });
    const future = JSON.parse(text);
    future.version = CURRENT_SAVE_VERSION + 1;
    expect(decodeSaveFile(JSON.stringify(future))).toEqual({ ok: false, reason: 'version' });
    expect(decodeSaveFile(JSON.stringify({ version: CURRENT_SAVE_VERSION + 5 }))).toEqual({ ok: false, reason: 'version' });
    for (const r of ['parse', 'format', 'checksum', 'version'] as const) expect(describeDecodeFail(r).length).toBeGreaterThan(5);
  });

  it('checksum is stable and sensitive; file names are safe', () => {
    expect(checksum('abc')).toBe(checksum('abc'));
    expect(checksum('abc')).not.toBe(checksum('abd'));
    expect(checksum('')).toMatch(/^[0-9a-f]{8}$/);
    const snap = takeSnapshot();
    snap.character = { ...snap.character, name: '주인공/../x', level: 12 };
    expect(saveFileName(snap, new Date(2026, 8, 15, 22, 5))).toBe('eternal-city_주인공x_Lv12_20260915-2205.json');
  });
});
