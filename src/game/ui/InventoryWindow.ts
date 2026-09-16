import type Phaser from 'phaser';
import { registry } from '@data/registry';
import type { ItemStack } from '@data/schema/item';
import { stackWeightKg, totalWeightKg } from '@core/inventory/weight';
import { gradeMult } from '@core/weapons/weaponMath';
import { armorDefense, armorLabel, effectiveWeapon, weaponLabel } from '@core/tuning/tuning';
import { PARTS } from '@data/tuning';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';
import { filterStacks, sortStacks, type InventoryFilter, type SortMode } from '@core/inventory/sortFilter';

export class InventoryWindow extends Window {
  private rows: ListView;
  /** view state only — the inventory itself is never reordered */
  filter: InventoryFilter = 'all';
  sortMode: SortMode = 'kind';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'inventory', x, y, 400, 500, '인벤토리 (I)');
    this.rows = new ListView(scene, 12, 52, this.w - 24, 42, 8);
    this.content.add(this.rows);
    this.refresh();
  }

  refresh(): void {
    this.content.remove(this.rows);
    this.clearBody();
    this.content.add(this.rows);

    const inv = gameState.inventory;
    const d = gameState.derived();
    const kg = totalWeightKg(inv, registry.item);
    const over = kg > d.maxWeightKg;
    this.label(12, 4, `무게 ${kg.toFixed(1)} / ${d.maxWeightKg.toFixed(1)} kg${over ? '  ⚠ 과적' : ''}`, over ? theme.colors.bad : theme.colors.muted, 12);
    this.label(this.w - 12, 4, `₩ ${gameState.character.won.toLocaleString('ko-KR')}`, theme.colors.brass, 12).setOrigin(1, 0);

    this.filterSortBar(24, inv.items, this, () => this.refresh());

    const eq = gameState.equipment;
    const w = gameState.weapon();
    const rows: ListRow[] = sortStacks(filterStacks(inv.items, registry.item, this.filter), registry.item, this.sortMode).map((s) =>
      this.row(s, eq.weaponUid === s.uid || Object.values(eq.armor).includes(s.uid), w),
    );
    this.rows.setRows(rows);

    this.label(12, this.h - 62, '클릭 — 무기/방어구: 장착·해제 · 소모품: 사용 · 탄약: 탄종 선택', theme.colors.muted, 11);
  }

  private row(s: ItemStack, equipped: boolean, w: ReturnType<typeof gameState.weapon>): ListRow {
    const def = registry.item(s.itemId);
    const kg = stackWeightKg(s.itemId, s.qty, registry.item).toFixed(1);
    switch (def.kind) {
      case 'weapon': {
        const g = s.grade ?? def.gradeMin;
        const eff = effectiveWeapon(def, s).def;
        const parts = (s.parts ?? []).map((id) => PARTS[id].name).join('·');
        return {
          id: s.uid,
          icon: def.iconTex,
          text: weaponLabel(def, s),
          sub: `${def.class} · ${def.caliber} · 공격 ${Math.round(eff.baseDamage * gradeMult(g))} · ${eff.rpm}rpm · ${kg}kg${parts ? ` · ${parts}` : ''}`,
          right: equipped ? '장착중' : '',
          rightColor: theme.colors.good,
          color: equipped ? '#ffffff' : undefined,
          onClick: () => actions.equipToggle(s.uid),
        };
      }
      case 'armor':
        return {
          id: s.uid,
          icon: def.iconTex,
          text: armorLabel(def, s),
          sub: `${def.slot} · 방어 ${Math.round(armorDefense(def, s))}${def.cl ? ' (CL)' : ''} · ${kg}kg`,
          right: equipped ? '장착중' : '',
          rightColor: theme.colors.good,
          color: equipped ? '#ffffff' : undefined,
          onClick: () => actions.equipToggle(s.uid),
        };
      case 'ammo': {
        const selected = !!w && w.def.caliber === def.caliber && gameState.fire.ammoKind === def.ammoKind;
        return {
          id: s.uid,
          icon: def.iconTex,
          text: `${def.name}`,
          sub: `${def.caliber} ${def.ammoKind} · ${s.qty}발 · ${kg}kg`,
          right: selected ? '사용중' : `${s.qty}발`,
          rightColor: selected ? theme.colors.good : theme.colors.muted,
          onClick: () => actions.selectAmmo(s.uid),
        };
      }
      case 'misc':
        return { id: s.uid, icon: def.iconTex, text: def.name, sub: `${def.quest ? '퀘스트 아이템 · ' : ''}${def.desc}`, right: `×${s.qty}`, rightColor: theme.colors.muted, color: def.quest ? '#ffd166' : undefined };
      case 'consumable': {
        const e = def.effect;
        const eff = [e.hp ? `생명 +${e.hp}` : '', e.stamina ? `지구력 +${e.stamina}` : '', e.ap ? `행동력 +${e.ap}` : ''].filter(Boolean).join(' ');
        return { id: s.uid, icon: def.iconTex, text: def.name, sub: `${eff} · ${kg}kg`, right: `×${s.qty}`, rightColor: theme.colors.muted, onClick: () => actions.use(s.uid) };
      }
    }
  }
}
