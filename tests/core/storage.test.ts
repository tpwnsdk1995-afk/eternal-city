import { describe, expect, it } from 'vitest';
import { registry } from '@data/registry';
import { addItem, createInventory } from '@core/inventory/inventory';
import { moveStack, storageFree } from '@core/inventory/storage';
import { filterStacks, nextSortMode, sortStacks } from '@core/inventory/sortFilter';

describe('구청 보관함 (moveStack)', () => {
  it('moves a weapon across with its tune fields and a fresh uid', () => {
    let inv = addItem(createInventory(), registry.item('mp5'), 1, { grade: 3 });
    inv = { ...inv, items: inv.items.map((s) => ({ ...s, enhance: 4, parts: ['barrel' as never] })) };
    const r = moveStack(inv, createInventory(), inv.items[0].uid, registry.item, 40);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.from.items).toEqual([]);
    expect(r.to.items).toHaveLength(1);
    expect(r.to.items[0]).toMatchObject({ itemId: 'mp5', grade: 3, enhance: 4, uid: 'i1' });
    expect(r.to.nextUid).toBe(2);
  });

  it('merges consumables into an existing stack instead of taking a slot', () => {
    const inv = addItem(createInventory(), registry.item('bandage'), 3);
    const storage = addItem(createInventory(), registry.item('bandage'), 2);
    const r = moveStack(inv, storage, inv.items[0].uid, registry.item, 1); // capacity already used by the existing stack
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.to.items).toHaveLength(1);
    expect(r.to.items[0].qty).toBe(5);
    expect(r.from.items).toEqual([]);
  });

  it('refuses when the receiving side is full, and reports unknown uids', () => {
    const inv = addItem(createInventory(), registry.item('glock17'));
    let storage = createInventory();
    for (let i = 0; i < 2; i++) storage = addItem(storage, registry.item('glock17'));
    expect(moveStack(inv, storage, inv.items[0].uid, registry.item, 2)).toEqual({ ok: false, reason: 'full' });
    expect(moveStack(inv, storage, 'nope', registry.item, 40)).toEqual({ ok: false, reason: 'notFound' });
    expect(storageFree(storage, 40)).toBe(38);
  });

  it('is symmetric: withdrawing puts the stack back', () => {
    const inv = addItem(createInventory(), registry.item('ammo_9mm_normal'), 100);
    const out = moveStack(inv, createInventory(), inv.items[0].uid, registry.item, 40);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const back = moveStack(out.to, out.from, out.moved.uid, registry.item);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.to.items).toHaveLength(1);
    expect(back.to.items[0].qty).toBe(100);
    expect(back.from.items).toEqual([]);
  });
});

describe('inventory sort / filter', () => {
  const inv = (() => {
    let i = createInventory();
    i = addItem(i, registry.item('bandage'), 2);
    i = addItem(i, registry.item('m60'), 1, { grade: 1 }); // 10.5kg, 120,000
    i = addItem(i, registry.item('glock17'), 1, { grade: 1 }); // 0.9kg, 8,000
    i = addItem(i, registry.item('ammo_9mm_normal'), 100);
    return i;
  })();

  it('filters by kind and passes everything through for "all"', () => {
    expect(filterStacks(inv.items, registry.item, 'all')).toHaveLength(4);
    expect(filterStacks(inv.items, registry.item, 'weapon').map((s) => s.itemId)).toEqual(['m60', 'glock17']);
    expect(filterStacks(inv.items, registry.item, 'armor')).toEqual([]);
  });

  it('sorts by category, name, weight and price without mutating the inventory', () => {
    const before = inv.items.map((s) => s.uid);
    expect(sortStacks(inv.items, registry.item, 'kind').map((s) => s.itemId)).toEqual(['m60', 'glock17', 'ammo_9mm_normal', 'bandage']);
    expect(sortStacks(inv.items, registry.item, 'weight')[0].itemId).toBe('m60');
    expect(sortStacks(inv.items, registry.item, 'price')[0].itemId).toBe('m60');
    const names = sortStacks(inv.items, registry.item, 'name').map((s) => registry.item(s.itemId).name);
    expect([...names].sort((a, b) => a.localeCompare(b, 'ko-KR'))).toEqual(names);
    expect(inv.items.map((s) => s.uid)).toEqual(before);
  });

  it('cycles sort modes', () => {
    expect(nextSortMode('kind')).toBe('name');
    expect(nextSortMode('price')).toBe('kind');
  });
});
