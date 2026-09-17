import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { balance } from '@data/balance';
import type { ItemStack } from '@data/schema/item';
import { stackWeightKg, totalWeightKg } from '@core/inventory/weight';
import { filterStacks, sortStacks, type InventoryFilter, type SortMode } from '@core/inventory/sortFilter';
import { armorLabel, weaponLabel } from '@core/tuning/tuning';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';

const LIST_W = 372;
const ROWS = 9;

/** 구청 보관함: inventory on the left, stored stacks on the right; a click moves the stack across. */
export class StorageWindow extends Window {
  private left: ListView;
  private right: ListView;
  filter: InventoryFilter = 'all';
  sortMode: SortMode = 'kind';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'storage', x, y, 780, 520, '구청 보관함');
    this.left = new ListView(scene, 12, 52, LIST_W, 42, ROWS);
    this.right = new ListView(scene, 12 + LIST_W + 12, 52, LIST_W, 42, ROWS);
    this.content.add([this.left, this.right]);
    this.refresh();
  }

  refresh(): void {
    this.content.remove([this.left, this.right]);
    this.clearBody();
    this.content.add([this.left, this.right]);

    const inv = gameState.inventory;
    const kg = totalWeightKg(inv, registry.item);
    this.label(12, 4, `내 인벤토리 — 무게 ${kg.toFixed(1)} kg`, theme.colors.muted, 12);
    const used = gameState.storage.items.length;
    const cap = balance.storage.slots;
    this.label(12 + LIST_W + 12, 4, `보관함 ${used} / ${cap}칸 — 보관 중인 물건은 무게에 잡히지 않습니다`, used >= cap ? theme.colors.bad : theme.colors.brass, 12);
    this.filterSortBar(24, [...inv.items, ...gameState.storage.items], this, () => this.refresh());

    const eq = gameState.equipment;
    const equipped = new Set([eq.weaponUid, ...Object.values(eq.armor)].filter(Boolean) as string[]);
    const view = (items: ItemStack[]) => sortStacks(filterStacks(items, registry.item, this.filter), registry.item, this.sortMode);
    this.left.setRows(view(inv.items).map((s) => this.row(s, equipped.has(s.uid) ? 'equipped' : 'deposit')));
    this.right.setRows(view(gameState.storage.items).map((s) => this.row(s, 'withdraw')));

    this.label(12, this.h - 76, '클릭 → 맡기기 (장착 중·퀘스트 아이템 제외) · 클릭 → 꺼내기 (무게 한도 안에서)', theme.colors.muted, 11);
    this.label(12, this.h - 60, `보관소 직원: "무거운 기관총이나 남는 탄약 박스는 여기 두고 다니세요. 세이브에 함께 저장됩니다."`, theme.colors.muted, 11);
  }

  private row(s: ItemStack, mode: 'deposit' | 'withdraw' | 'equipped'): ListRow {
    const def = registry.item(s.itemId);
    const kg = stackWeightKg(s.itemId, s.qty, registry.item).toFixed(1);
    const text = def.kind === 'weapon' ? weaponLabel(def, s) : def.kind === 'armor' ? armorLabel(def, s) : def.name;
    const qty = def.kind === 'ammo' ? `${s.qty}발` : s.qty > 1 ? `×${s.qty}` : '';
    const sub = `${def.kind === 'weapon' ? def.class : def.kind === 'armor' ? def.slot : def.kind === 'ammo' ? `${def.caliber} ${def.ammoKind}` : def.kind === 'consumable' ? '소모품' : '기타'}${qty ? ` · ${qty}` : ''} · ${kg}kg`;
    const quest = def.kind === 'misc' && !!def.quest;
    if (mode === 'equipped' || quest) {
      return { id: s.uid, icon: def.iconTex, text, sub, right: mode === 'equipped' ? '장착중' : '퀘스트', rightColor: theme.colors.muted, disabled: true };
    }
    return {
      id: s.uid,
      icon: def.iconTex,
      text,
      sub,
      right: mode === 'deposit' ? '맡기기 ▶' : '◀ 꺼내기',
      rightColor: mode === 'deposit' ? theme.colors.brass : theme.colors.good,
      onClick: () => {
        if (mode === 'deposit') actions.deposit(s.uid);
        else actions.withdraw(s.uid);
        this.refresh();
      },
    };
  }
}
