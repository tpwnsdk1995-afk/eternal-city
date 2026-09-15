import { beforeEach, describe, expect, it } from 'vitest';
import { gameState } from '../../src/game/state/GameState';
import { saveService, takeSnapshot } from '../../src/game/state/SaveService';
import { cloudSave, type CloudDb } from '../../src/game/state/CloudSave';
import { db } from '../../src/game/state/db';
import { reconcile } from '@core/save/cloudSync';

/** In-memory stand-in for the play page's `db` capability. */
function fakeStore(): CloudDb & { docs: Map<string, Record<string, unknown>>; writes: number } {
  const docs = new Map<string, Record<string, unknown>>();
  const store = {
    docs,
    writes: 0,
    doc(path: string) {
      return {
        get: async () => {
          const d = docs.get(path);
          return { exists: !!d, data: () => d };
        },
        set: async (data: Record<string, unknown>) => {
          store.writes++;
          docs.set(path, JSON.parse(JSON.stringify(data)));
        },
      };
    },
  };
  return store;
}

describe('cloud save (account-bound copy)', () => {
  beforeEach(async () => {
    await db.saves.clear();
    gameState.newGame('클라우드');
    saveService.hasCharacter = true;
  });

  it('reconcile picks the newer side and seeds an empty cloud', () => {
    expect(reconcile(null, null)).toEqual({ action: 'none' });
    expect(reconcile({ savedAt: 10 }, null)).toEqual({ action: 'pushLocal' });
    expect(reconcile(null, { savedAt: 10 })).toEqual({ action: 'useCloud' });
    expect(reconcile({ savedAt: 10 }, { savedAt: 10 })).toEqual({ action: 'useLocal' });
    expect(reconcile({ savedAt: 10 }, { savedAt: 1000 })).toEqual({ action: 'useLocal' }); // within tolerance
    expect(reconcile({ savedAt: 10 }, { savedAt: 5000 })).toEqual({ action: 'useCloud' });
    expect(reconcile({ savedAt: 5000 }, { savedAt: 10 })).toEqual({ action: 'useLocal' });
  });

  it('every local save is pushed to the cloud document', async () => {
    const store = fakeStore();
    cloudSave.useStore(store);
    await saveService.save();
    await cloudSave.push(takeSnapshot()); // wait for the coalesced writer to drain
    expect(store.docs.get('saves/slot1')?.version).toBe(6);
    expect((store.docs.get('saves/slot1')?.character as { name: string }).name).toBe('클라우드');
    expect(cloudSave.state).toBe('synced');
  });

  it('a newer cloud save overwrites an older local slot on the title screen', async () => {
    const store = fakeStore();
    cloudSave.useStore(store);
    await saveService.save(); // local + cloud, savedAt = now
    const newer = { ...takeSnapshot(), savedAt: Date.now() + 60_000, character: { ...gameState.character, name: '폰에서온캐릭', level: 23 } };
    store.docs.set('saves/slot1', newer as unknown as Record<string, unknown>);
    const { decision, row } = await cloudSave.reconcileSlot();
    expect(decision.action).toBe('useCloud');
    expect(row?.name).toBe('폰에서온캐릭');
    expect(row?.level).toBe(23);
    expect(cloudSave.state).toBe('pulled');
    const loaded = await saveService.load();
    expect(loaded?.character.name).toBe('폰에서온캐릭');
  });

  it('an older cloud save is left alone; an empty cloud gets the local slot', async () => {
    const store = fakeStore();
    cloudSave.useStore(store);
    await saveService.save();
    await cloudSave.push(takeSnapshot());
    const older = { ...takeSnapshot(), savedAt: 1, character: { ...gameState.character, name: '옛날' } };
    store.docs.set('saves/slot1', older as unknown as Record<string, unknown>);
    const r1 = await cloudSave.reconcileSlot();
    expect(r1.decision.action).toBe('useLocal');
    expect(r1.row?.name).toBe('클라우드');

    store.docs.clear();
    const r2 = await cloudSave.reconcileSlot();
    expect(r2.decision.action).toBe('pushLocal');
    expect((store.docs.get('saves/slot1')?.character as { name: string }).name).toBe('클라우드');
    expect(cloudSave.state).toBe('pushed');
  });

  it('without a host store the game stays browser-local and reports offline', async () => {
    cloudSave.useStore(null);
    await saveService.save();
    const r = await cloudSave.reconcileSlot();
    expect(r.decision.action).toBe('useLocal');
    expect(r.row?.name).toBe('클라우드');
    expect(cloudSave.state).toBe('offline');
    expect(await cloudSave.pull()).toBeNull();
  });
});
