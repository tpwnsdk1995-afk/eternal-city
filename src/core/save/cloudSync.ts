/**
 * Cloud-save reconciliation (pure). The play page may have an account-bound document store; the
 * browser always has its local slot. On the title screen we pick whichever is newer, and after
 * every local save we push to the cloud. No merging — a save is one blob, last writer wins.
 */
export interface SaveStamp {
  savedAt: number;
}

export type CloudDecision =
  | { action: 'none' } // nothing anywhere
  | { action: 'useLocal' } // local is newest (or equal) — nothing to pull
  | { action: 'useCloud' } // cloud is newer (or local missing) — overwrite the local slot
  | { action: 'pushLocal' }; // cloud missing, local present — seed the cloud

/** Two stamps within this window count as the same save (clock skew between devices). */
export const SAME_SAVE_TOLERANCE_MS = 1500;

export function reconcile(local: SaveStamp | null, cloud: SaveStamp | null): CloudDecision {
  if (!local && !cloud) return { action: 'none' };
  if (!cloud) return { action: 'pushLocal' };
  if (!local) return { action: 'useCloud' };
  if (cloud.savedAt > local.savedAt + SAME_SAVE_TOLERANCE_MS) return { action: 'useCloud' };
  return { action: 'useLocal' };
}

export function describeCloud(state: 'checking' | 'synced' | 'pulled' | 'pushed' | 'offline' | 'error', when?: number): string {
  switch (state) {
    case 'checking':
      return '☁ 클라우드 저장 확인 중…';
    case 'synced':
      return `☁ 클라우드 저장 동기화됨${when ? ` · ${new Date(when).toLocaleString('ko-KR')}` : ''}`;
    case 'pulled':
      return `☁ 다른 기기의 최신 세이브를 받았습니다${when ? ` · ${new Date(when).toLocaleString('ko-KR')}` : ''}`;
    case 'pushed':
      return '☁ 이 기기의 세이브를 클라우드에 올렸습니다';
    case 'offline':
      return '이 브라우저에만 저장됩니다 (클라우드 저장은 claude.ai 플레이 페이지에서 로그인 시 자동)';
    case 'error':
      return '☁ 클라우드 저장에 연결하지 못했습니다 — 이 브라우저에만 저장됩니다';
  }
}
