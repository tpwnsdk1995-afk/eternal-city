import type Phaser from 'phaser';
import { registry } from '@data/registry';
import type { ItemStack } from '@data/schema/item';
import { stackWeightKg, totalWeightKg } from '@core/inventory/weight';
import { gradeMult } from '@core/weapons/weaponMath';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';

const KIND_ORDER = { weapon: 0, armor: 1, ammo: 2, consumable: 3 } as const;

export class InventoryWindow extends Window {
  private rows: ListView;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'inventory', x, y, 400, 500, '인벤토리 (I)');
    this.rows = new ListView(scene, 12, 30, this.w - 24, 42, 9);
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

    const eq = gameState.equipment;
    const w = gameState.weapon();
    const rows: ListRow[] = [...inv.items]
      .sort((a, b) => KIND_ORDER[registry.item(a.itemId).kind] - KIND_ORDER[registry.item(b.itemId).kind] || a.uid.localeCompare(b.uid))
      .map((s) => this.row(s, eq.weaponUid === s.uid || Object.values(eq.armor).includes(s.uid), w));
    this.rows.setRows(rows);

    this.label(12, this.h - 62, '클릭 — 무기/방어구: 장착·해제 · 소모품: 사용 · 탄약: 탄종 선택', theme.colors.muted, 11);
  }

  private row(s: ItemStack, equipped: boolean, w: ReturnType<typeof gameState.weapon>): ListRow {
    const def = registry.item(s.itemId);
    const kg = stackWeightKg(s.itemId, s.qty, registry.item).toFixed(1);
    switch (def.kind) {
      case 'weapon': {
        const g = s.grade ?? def.gradeMin;
        return {
          id: s.uid,
          icon: def.iconTex,
          text: `${def.name}  [${g}등급]`,
          sub: `${def.class} · ${def.caliber} · 공격 ${Math.round(def.baseDamage * gradeMult(g))} · ${def.rpm}rpm · ${kg}kg`,
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
          text: def.name,
          sub: `${def.slot} · 방어 ${def.defense}${def.cl ? ' (CL)' : ''} · ${kg}kg`,
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
      case 'consumable': {
        const e = def.effect;
        const eff = [e.hp ? `생명 +${e.hp}` : '', e.stamina ? `지구력 +${e.stamina}` : '', e.ap ? `행동력 +${e.ap}` : ''].filter(Boolean).join(' ');
        return { id: s.uid, icon: def.iconTex, text: def.name, sub: `${eff} · ${kg}kg`, right: `×${s.qty}`, rightColor: theme.colors.muted, onClick: () => actions.use(s.uid) };
      }
    }
  }
}
