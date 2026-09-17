import type Phaser from 'phaser';
import { registry } from '@data/registry';
import type { ItemStack } from '@data/schema/item';
import { isMeleeClass } from '@data/schema/enums';
import { stackWeightKg, totalWeightKg } from '@core/inventory/weight';
import { armorDefense, armorLabel, effectiveWeapon, enhanceLevel, weaponLabel } from '@core/tuning/tuning';
import { sellPrice } from '@core/economy/shop';
import { PARTS, UNIQUES } from '@data/tuning';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';
import { filterStacks, sortStacks, type InventoryFilter, type SortMode } from '@core/inventory/sortFilter';

const won = (n: number): string => `₩${n.toLocaleString('ko-KR')}`;

export class InventoryWindow extends Window {
  private rows: ListView;
  /** view state only — the inventory itself is never reordered */
  filter: InventoryFilter = 'all';
  sortMode: SortMode = 'kind';
  /** first tap selects and shows the detail panel; a second tap (or the panel button) acts */
  selected: string | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'inventory', x, y, 400, 640, '인벤토리 (I)');
    this.rows = new ListView(scene, 12, 52, this.w - 24, 42, 7);
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

    if (this.selected && !inv.items.some((s) => s.uid === this.selected)) this.selected = null;
    const eq = gameState.equipment;
    const w = gameState.weapon();
    const rows: ListRow[] = sortStacks(filterStacks(inv.items, registry.item, this.filter), registry.item, this.sortMode).map((s) =>
      this.row(s, eq.weaponUid === s.uid || Object.values(eq.armor).includes(s.uid), w),
    );
    this.rows.setRows(rows);

    const sel = inv.items.find((s) => s.uid === this.selected);
    if (sel) this.detail(sel, eq.weaponUid === sel.uid || Object.values(eq.armor).includes(sel.uid), w);
    else this.label(12, 380, '아이템을 한 번 누르면 능력치·필요 레벨 같은 상세 정보가 여기에 나옵니다.', theme.colors.muted, 12, { wordWrap: { width: this.w - 24 } });
  }

  private tap(uid: string): void {
    if (this.selected === uid) this.act(uid);
    else {
      this.selected = uid;
      this.refresh();
    }
  }

  private act(uid: string): void {
    const s = gameState.inventory.items.find((i) => i.uid === uid);
    if (!s) return;
    const kind = registry.item(s.itemId).kind;
    if (kind === 'weapon' || kind === 'armor') actions.equipToggle(uid);
    else if (kind === 'ammo') actions.selectAmmo(uid);
    else if (kind === 'consumable') actions.use(uid);
  }

  /** Detail panel under the list: every number the shop and the tuning bench use, plus what the player's own stats make of it. */
  private detail(s: ItemStack, equipped: boolean, w: ReturnType<typeof gameState.weapon>): void {
    const def = registry.item(s.itemId);
    const d = gameState.derived();
    const level = gameState.character.level;
    const kg = stackWeightKg(s.itemId, s.qty, registry.item).toFixed(1);
    const lines: string[] = [];
    let action: string | null = null;
    let title = def.name;
    let ok = true;
    switch (def.kind) {
      case 'weapon': {
        const eff = effectiveWeapon(def, s);
        const atk = Math.round(eff.def.baseDamage);
        const mult = isMeleeClass(def.class) ? d.meleeMult : d.rangedMult;
        const enh = enhanceLevel(s);
        title = weaponLabel(def, s);
        lines.push(`${def.class} · ${def.caliber}${s.unique ? ` · ${UNIQUES[s.unique].name}` : ''}${s.damaged ? ' · 파손 (수리 필요)' : ''}`);
        lines.push(`공격력 ${atk}  →  내 스탯 적용 ${Math.round(atk * (1 + eff.dmgPct) * mult)}${enh ? `  (강화 +${enh}: 공격 +${Math.round(enh * 15)}%)` : ''}`);
        lines.push(`연사 ${eff.def.rpm}rpm · 사거리 ${eff.def.range} · 명중 ${Math.round(eff.def.baseAccuracy * 100)}%${def.pellets ? ` · 산탄 ${def.pellets}발` : ''}`);
        ok = level >= def.reqLevel && (!def.reqTechGrade || d.techGrade >= def.reqTechGrade);
        lines.push(`필요 레벨 ${def.reqLevel}${def.reqTechGrade ? ` · 기술등급 ${def.reqTechGrade}` : ''}${ok ? '' : `  ✗ 부족 (현재 Lv.${level} · 기술등급 ${d.techGrade})`}`);
        lines.push(`무게 ${kg}kg · 상점 판매가 ${won(sellPrice(s, registry.item))}${s.parts?.length ? ` · 부품 ${s.parts.map((id) => PARTS[id].name).join('·')}` : ''}`);
        action = equipped ? '장착 해제' : '장착';
        break;
      }
      case 'armor': {
        title = armorLabel(def, s);
        lines.push(`${def.slot} 방어구${def.cl ? ' · CL (감염체 방어)' : ''}`);
        lines.push(`방어력 ${Math.round(armorDefense(def, s))}  (기본 ${def.defense}${s.plusUp ? ` · 강화 +${s.plusUp}` : ''})`);
        ok = level >= def.reqLevel;
        lines.push(`필요 레벨 ${def.reqLevel}${ok ? '' : `  ✗ 부족 (현재 Lv.${level})`}`);
        lines.push(`무게 ${kg}kg · 상점 판매가 ${won(sellPrice(s, registry.item))}`);
        action = equipped ? '장착 해제' : '장착';
        break;
      }
      case 'ammo': {
        const selected = !!w && w.def.caliber === def.caliber && gameState.fire.ammoKind === def.ammoKind;
        lines.push(`${def.caliber} ${def.ammoKind} 탄약 · ${s.qty}발 보유`);
        lines.push(`무게 ${kg}kg · 상점 판매가 ${won(sellPrice(s, registry.item))}`);
        if (w && w.def.caliber !== def.caliber) lines.push(`✗ 지금 든 무기(${w.def.caliber})와 탄종이 다릅니다`);
        action = selected ? '사용 중' : '이 탄약 사용';
        break;
      }
      case 'consumable': {
        const e = def.effect;
        lines.push(
          [e.hp ? `생명 +${e.hp}` : '', e.stamina ? `지구력 +${e.stamina}` : '', e.ap ? `행동력 +${e.ap}` : '', e.buff ? `효과 ${e.buff}` : '', e.enhanceBonusPct ? `강화 성공률 +${e.enhanceBonusPct}%` : '']
            .filter(Boolean)
            .join(' · ') || '효과 없음',
        );
        lines.push(`${s.qty}개 보유 · 무게 ${kg}kg · 상점 판매가 ${won(sellPrice(s, registry.item))}`);
        action = '사용';
        break;
      }
      case 'misc':
        lines.push(def.desc);
        lines.push(`${s.qty}개 보유 · 무게 ${kg}kg${def.quest ? ' · 퀘스트 아이템 (판매 불가)' : ` · 상점 판매가 ${won(sellPrice(s, registry.item))}`}`);
        break;
    }
    let y = 380;
    this.label(12, y, title, '#ffffff', 14, { fontStyle: 'bold', wordWrap: { width: this.w - 24 } });
    y += 24;
    for (const line of lines) {
      const bad = line.includes('✗');
      this.label(12, y, line, bad ? theme.colors.bad : theme.colors.text, 13, { wordWrap: { width: this.w - 24 } });
      y += 20;
    }
    if (action) {
      const b = this.button(12, y + 6, action, () => this.act(s.uid), ok ? theme.colors.brass : theme.colors.bad, 14);
      this.label(b.x + b.width + 12, y + 10, '(같은 줄을 다시 눌러도 됩니다)', theme.colors.muted, 12);
    }
  }

  private row(s: ItemStack, equipped: boolean, w: ReturnType<typeof gameState.weapon>): ListRow {
    const def = registry.item(s.itemId);
    const kg = stackWeightKg(s.itemId, s.qty, registry.item).toFixed(1);
    const color = this.selected === s.uid ? '#ffd166' : equipped ? '#ffffff' : undefined;
    const onClick = (): void => this.tap(s.uid);
    switch (def.kind) {
      case 'weapon': {
        const eff = effectiveWeapon(def, s).def;
        return {
          id: s.uid,
          icon: def.iconTex,
          text: weaponLabel(def, s),
          sub: `${def.class} · 공격 ${Math.round(eff.baseDamage)} · Lv.${def.reqLevel} · ${kg}kg`,
          right: equipped ? '장착중' : '',
          rightColor: theme.colors.good,
          color,
          onClick,
        };
      }
      case 'armor':
        return {
          id: s.uid,
          icon: def.iconTex,
          text: armorLabel(def, s),
          sub: `${def.slot} · 방어 ${Math.round(armorDefense(def, s))}${def.cl ? ' (CL)' : ''} · Lv.${def.reqLevel} · ${kg}kg`,
          right: equipped ? '장착중' : '',
          rightColor: theme.colors.good,
          color,
          onClick,
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
          color,
          onClick,
        };
      }
      case 'misc':
        return { id: s.uid, icon: def.iconTex, text: def.name, sub: `${def.quest ? '퀘스트 아이템 · ' : ''}${def.desc}`, right: `×${s.qty}`, rightColor: theme.colors.muted, color: color ?? (def.quest ? '#ffd166' : undefined), onClick };
      case 'consumable': {
        const e = def.effect;
        const eff = [e.hp ? `생명 +${e.hp}` : '', e.stamina ? `지구력 +${e.stamina}` : '', e.ap ? `행동력 +${e.ap}` : ''].filter(Boolean).join(' ');
        return { id: s.uid, icon: def.iconTex, text: def.name, sub: `${eff} · ${kg}kg`, right: `×${s.qty}`, rightColor: theme.colors.muted, color, onClick };
      }
    }
  }
}
