import { migrateSave, type SaveGame } from '@core/save/saveSchema';
import { describeCloud, reconcile, type CloudDecision } from '@core/save/cloudSync';
import { db, type SaveRow } from './db';
import { registry } from '@data/registry';

/** Minimal slice of the play page's `db` capability we rely on (see artifact runtime contract). */
export interface CloudDoc {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(data: Record<string, unknown>): Promise<void>;
}
export interface CloudDb {
  doc(path: string): CloudDoc;
}
interface ClaudeHost {
  use(name: string): Promise<unknown>;
}

export type CloudState = 'checking' | 'synced' | 'pulled' | 'pushed' | 'offline' | 'error';
const DOC_PATH = 'saves/slot1';
const USE_TIMEOUT_MS = 12_000;

/**
 * Account-bound cloud save. When the game runs inside the claude.ai play page, `window.claude.use('db')`
 * resolves a document store tied to the signed-in account, so a laptop and a phone share one save
 * with no manual step. Anywhere else (dev server, e2e, a copied file) it resolves null and the game
 * keeps saving to the browser only.
 */
class CloudSave {
  private dbPromise: Promise<CloudDb | null> | null = null;
  state: CloudState = 'checking';
  lastSyncAt = 0;
  private pushing: Promise<void> | null = null;
  private pendingPush: SaveGame | null = null;
  private pushedSavedAt = 0;

  /** Test hook: inject a store instead of asking the host page. */
  useStore(store: CloudDb | null): void {
    this.dbPromise = Promise.resolve(store);
  }

  private host(): ClaudeHost | null {
    if (typeof window === 'undefined') return null;
    const c = (window as unknown as { claude?: { use?: unknown } }).claude;
    return c && typeof c.use === 'function' ? (c as ClaudeHost) : null;
  }

  connect(): Promise<CloudDb | null> {
    if (this.dbPromise) return this.dbPromise;
    const host = this.host();
    if (!host) {
      this.state = 'offline';
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }
    this.dbPromise = Promise.race([
      host.use('db').then((ns) => (ns && typeof (ns as CloudDb).doc === 'function' ? (ns as CloudDb) : null)),
      new Promise<null>((r) => setTimeout(() => r(null), USE_TIMEOUT_MS)),
    ]).catch(() => null);
    return this.dbPromise;
  }

  async available(): Promise<boolean> {
    return (await this.connect()) !== null;
  }

  /** Read the cloud document; null when absent, unreadable, or not a valid save. */
  async pull(): Promise<SaveGame | null> {
    const store = await this.connect();
    if (!store) return null;
    try {
      const snap = await store.doc(DOC_PATH).get();
      if (!snap.exists) return null;
      return migrateSave(snap.data());
    } catch {
      this.state = 'error';
      return null;
    }
  }

  /** Write the save to the cloud, coalescing bursts: at most one in-flight write, latest wins. */
  push(save: SaveGame): Promise<void> {
    this.pendingPush = save;
    if (this.pushing) return this.pushing;
    this.pushing = (async () => {
      try {
        const store = await this.connect();
        if (!store) return;
        while (this.pendingPush) {
          const next = this.pendingPush;
          this.pendingPush = null;
          if (next.savedAt === this.pushedSavedAt) continue;
          await store.doc(DOC_PATH).set(next as unknown as Record<string, unknown>);
          this.pushedSavedAt = next.savedAt;
          this.lastSyncAt = next.savedAt;
          if (this.state !== 'pulled') this.state = 'synced';
        }
      } catch {
        this.state = 'error';
      } finally {
        this.pushing = null;
      }
    })();
    return this.pushing;
  }

  /**
   * Title-screen reconciliation: pull the cloud save, compare with the local slot, and make the
   * local slot hold the newest one. Returns the decision and the row now in the slot.
   */
  async reconcileSlot(slot = 1): Promise<{ decision: CloudDecision; row: SaveRow | null }> {
    const store = await this.connect();
    const localRow = (await db.saves.get(slot)) ?? null;
    const local = localRow && migrateSave(localRow.data) ? localRow : null;
    if (!store) {
      this.state = 'offline';
      return { decision: { action: 'useLocal' }, row: local };
    }
    const cloud = await this.pull();
    const decision = reconcile(local ? { savedAt: local.data.savedAt } : null, cloud ? { savedAt: cloud.savedAt } : null);
    switch (decision.action) {
      case 'useCloud': {
        const data = cloud!;
        const mapId = registry.hasMap(data.location.mapId) ? data.location.mapId : registry.hasMap('gwangjin-gucheong-parking') ? 'gwangjin-gucheong-parking' : data.location.mapId;
        const row: SaveRow = { slot, name: data.character.name, level: data.character.level, mapName: registry.map(mapId).name, updatedAt: data.savedAt, data };
        await db.saves.put(row);
        this.pushedSavedAt = data.savedAt;
        this.lastSyncAt = data.savedAt;
        this.state = 'pulled';
        return { decision, row };
      }
      case 'pushLocal':
        await this.push(local!.data);
        this.state = 'pushed';
        return { decision, row: local };
      case 'useLocal':
        this.pushedSavedAt = cloud?.savedAt ?? 0;
        this.lastSyncAt = local?.data.savedAt ?? 0;
        this.state = 'synced';
        return { decision, row: local };
      default:
        this.state = 'synced';
        return { decision, row: null };
    }
  }

  describe(): string {
    return describeCloud(this.state, this.lastSyncAt || undefined);
  }
}

export const cloudSave = new CloudSave();
