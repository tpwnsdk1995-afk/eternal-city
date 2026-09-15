import { CURRENT_SAVE_VERSION, migrateSave, type SaveGame } from './saveSchema';

/** Portable save file: a small envelope around the snapshot plus a checksum against truncation. */
export interface SaveFile {
  app: 'eternal-city';
  kind: 'save';
  exportedAt: number;
  /** save-schema version the payload was written with */
  version: number;
  checksum: string;
  save: SaveGame;
}

export type DecodeFail = 'parse' | 'format' | 'checksum' | 'version';
export type DecodeResult = { ok: true; save: SaveGame; exportedAt: number | null } | { ok: false; reason: DecodeFail };

/** FNV-1a 32-bit over the UTF-16 code units — enough to catch a cut-off paste or a wrong file. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function encodeSaveFile(save: SaveGame, now = Date.now()): string {
  const payload = JSON.stringify(save);
  const file: SaveFile = { app: 'eternal-city', kind: 'save', exportedAt: now, version: save.version, checksum: checksum(payload), save };
  return JSON.stringify(file);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * Accepts an exported envelope or a bare snapshot (any past schema version — it is migrated).
 * A checksum mismatch is reported rather than silently loading a damaged file.
 */
export function decodeSaveFile(text: string): DecodeResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, reason: 'parse' };
  }
  if (!isObj(raw)) return { ok: false, reason: 'format' };

  let candidate: unknown = raw;
  let exportedAt: number | null = null;
  if (raw.app === 'eternal-city' && raw.kind === 'save') {
    if (!isObj(raw.save)) return { ok: false, reason: 'format' };
    if (typeof raw.checksum === 'string' && checksum(JSON.stringify(raw.save)) !== raw.checksum) return { ok: false, reason: 'checksum' };
    if (typeof raw.version === 'number' && raw.version > CURRENT_SAVE_VERSION) return { ok: false, reason: 'version' };
    candidate = raw.save;
    exportedAt = typeof raw.exportedAt === 'number' ? raw.exportedAt : null;
  } else if (typeof raw.version === 'number' && raw.version > CURRENT_SAVE_VERSION) {
    return { ok: false, reason: 'version' };
  }
  const save = migrateSave(candidate);
  if (!save) return { ok: false, reason: 'format' };
  return { ok: true, save, exportedAt };
}

export function describeDecodeFail(reason: DecodeFail): string {
  return {
    parse: '파일을 읽을 수 없습니다 (JSON이 아닙니다).',
    format: '이터널시티 저장 파일이 아니거나 내용이 손상되었습니다.',
    checksum: '파일이 잘려 있거나 변조되었습니다 (체크섬 불일치).',
    version: '더 새로운 버전의 게임에서 만든 저장 파일입니다. 게임을 업데이트해 주세요.',
  }[reason];
}

/** `eternal-city_주인공_Lv12_20260915-2210.json` */
export function saveFileName(save: SaveGame, now = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const name = save.character.name.replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 16) || 'hunter';
  return `eternal-city_${name}_Lv${save.character.level}_${stamp}.json`;
}
