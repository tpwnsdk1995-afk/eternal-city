import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { PARTS } from '@data/tuning';
import { UNIQUES } from '@data/tuning';
import { balance } from '@data/balance';
import type { ItemStack } from '@data/schema/item';
import { armorDefense, armorLabel, combineChancePct, combineCost, effectiveWeapon, repairCost, enhanceChancePct, enhanceCost, enhanceLevel, hasPart, partCost, partsAllowed, plusUpCost, plusUpLevel, uniqueCost, weaponLabel } from '@core/tuning/tuning';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';

const T = balance.tuning;
const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

/**
 * 기술상 — 강화 / 부품 개조 / 유니크 개조 / 플러스업. Left: your weapons and armour; right: what
 * can be done to the selected piece, with success odds and prices.
 */
export class TuningWindow extends Window {
  private gearList: ListView;
  private selected: string | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'tuning', x, y, 820, 560, '기술상 — 강화 / 개조');
    this.gearList = new ListView(scene, 12, 44, 360, 42, 10);
    this.content.add(this.gearList);
    this.refresh();
  }

  refresh(): void {
    this.content.remove(this.gearList);
    this.clearBody();
    this.content.add(this.gearList);
    this.label(12, 4, `₩ ${gameState.character.won.toLocaleString('ko-KR')}`, theme.colors.brass, 15, { fontStyle: 'bold' });
    this.label(12, 26, '내 장비 (클릭하여 선택)', theme.colors.muted, 12);

    const eq = gameState.equipment;
    const gear = gameState.inventory.items.filter((s) => {
      const k = registry.item(s.itemId).kind;
      return k === 'weapon' || k === 'armor';
    });
    if (this.selected && !gear.some((s) => s.uid === this.selected)) this.selected = null;
    if (!this.selected) this.selected = eq.weaponUid ?? gear[0]?.uid ?? null;

    const rows: ListRow[] = gear.map((s) => {
      const def = registry.item(s.itemId);
      const equipped = eq.weaponUid === s.uid || Object.values(eq.armor).includes(s.uid);
      const sel = s.uid === this.selected;
      return {
        id: s.uid,
        icon: def.iconTex,
        text: def.kind === 'weapon' ? weaponLabel(def, s) : def.kind === 'armor' ? armorLabel(def, s) : def.name,
        sub: def.kind === 'weapon' ? `${def.class} · ${(s.parts ?? []).map((p) => PARTS[p].name).join('·') || '부품 없음'}` : def.kind === 'armor' ? `${def.slot} · 방어 ${Math.round(armorDefense(def, s))}` : '',
        right: equipped ? '장착중' : '',
        rightColor: theme.colors.good,
        color: sel ? '#ffffff' : undefined,
        onClick: () => {
          this.selected = s.uid;
          this.refresh();
        },
      };
    });
    this.gearList.setRows(rows);

    const stack = gear.find((s) => s.uid === this.selected);
    if (!stack) {
      this.label(392, 44, '강화/개조할 무기나 방어구가 없습니다.', theme.colors.muted, 13);
      return;
    }
    const def = registry.item(stack.itemId);
    if (def.kind === 'weapon') this.weaponPanel(stack, def);
    else if (def.kind === 'armor') this.armorPanel(stack, def);
  }

  private weaponPanel(s: ItemStack, def: Extract<ReturnType<typeof registry.item>, { kind: 'weapon' }>): void {
    const X = 392;
    const eff = effectiveWeapon(def, s);
    this.content.add(this.scene.add.rectangle(X - 8, 40, this.w - X - 4, this.h - 92, 0xffffff, 0.03).setOrigin(0, 0));
    this.content.add(this.scene.add.image(X + 4, 48, def.iconTex).setOrigin(0, 0).setDisplaySize(48, 48));
    this.label(X + 60, 46, weaponLabel(def, s), '#ffffff', 16, { fontStyle: 'bold' });
    this.label(X + 60, 70, `${def.class} · ${def.caliber} · 공격 ${Math.round(eff.def.baseDamage)} · ${eff.def.rpm}rpm · 사거리 ${eff.def.range} · 명중 ${Math.round(eff.def.baseAccuracy * 100)}%`, theme.colors.muted, 11);

    let y = 110;
    if (s.damaged) {
      this.label(X, y, '파손됨 — 공격력 −20%. 수리하면 원래대로 돌아옵니다.', theme.colors.bad, 12);
      const rb = this.button(0, y - 2, `수리 ${won(repairCost(def, s))}`, () => actions.repair(s.uid), theme.colors.good);
      rb.setX(this.w - 16 - rb.width);
      y += 28;
    }
    // 강화
    this.label(X, y, '강화', theme.colors.brass, 14, { fontStyle: 'bold' });
    const lv = enhanceLevel(s);
    const bonus = Number(gameState.flags.enhanceBonus ?? 0);
    const chance = enhanceChancePct(s, bonus);
    this.label(X + 60, y + 1, chance === null ? `+${lv} (최대)` : `+${lv} → +${lv + 1}  ·  성공 ${chance}%${bonus ? ` (특수 강화권 +${bonus}%)` : ''}`, bonus ? theme.colors.good : theme.colors.text, 13);
    this.label(X, y + 22, `실패 시 −1 (파손 없음) · 공격력 +${T.enhanceDmgPerLevel * 100}%/강 · 비용은 무기 가격과 강화 단계에 비례`, '#6b7280', 11);
    if (chance !== null) this.button(this.w - 16 - 150, y - 2, `강화 ${won(enhanceCost(def, s))}`, () => actions.enhance(s.uid), '#9be7ff').setX(this.w - 16 - this.lastW());
    else this.label(this.w - 16, y, '최대 강화', theme.colors.good, 12).setOrigin(1, 0);
    y += 52;
    this.content.add(this.scene.add.rectangle(X, y, this.w - X - 12, 1, 0xc9a227, 0.25).setOrigin(0, 0));
    y += 10;

    // 부품 개조
    this.label(X, y, '부품 개조', theme.colors.brass, 14, { fontStyle: 'bold' });
    y += 24;
    const allowed = partsAllowed(def);
    if (allowed.length === 0) this.label(X, y, '이 분류의 무기에는 부품을 장착할 수 없습니다.', theme.colors.muted, 12);
    for (const id of allowed) {
      const p = PARTS[id];
      const has = hasPart(s, id);
      this.label(X, y, `${p.name}`, has ? theme.colors.good : theme.colors.text, 13, { fontStyle: 'bold' });
      this.label(X + 90, y + 1, p.desc, theme.colors.muted, 12);
      if (has) this.label(this.w - 16, y, '장착됨', theme.colors.good, 12).setOrigin(1, 0);
      else {
        const b = this.button(0, y - 2, `장착 ${won(partCost(def, s, id))}`, () => actions.installPart(s.uid, id), '#9be7ff');
        b.setX(this.w - 16 - b.width);
      }
      y += 26;
    }
    y += 6;
    this.content.add(this.scene.add.rectangle(X, y, this.w - X - 12, 1, 0xc9a227, 0.25).setOrigin(0, 0));
    y += 10;

    // 유니크 개조
    this.label(X, y, '유니크 개조', theme.colors.brass, 14, { fontStyle: 'bold' });
    y += 24;
    if (s.unique) {
      const u = UNIQUES[s.unique];
      this.label(X, y, `[${u.name}] ${u.desc}`, theme.colors.good, 13);
    } else {
      const ok = lv >= T.uniqueMinEnhance;
      this.label(X, y, `+${T.uniqueMinEnhance} 이상 무기에 접미 부여 · 성공 ${T.uniqueSuccessPct}% · 실패 시 비용만 소모`, ok ? theme.colors.text : theme.colors.muted, 12);
      const us = Object.values(UNIQUES);
      this.label(X, y + 18, us.slice(0, 2).map((u) => `[${u.name}] ${u.desc}`).join('   '), '#6b7280', 11);
      this.label(X, y + 34, us.slice(2).map((u) => `[${u.name}] ${u.desc}`).join('   '), '#6b7280', 11);
      const b = this.button(0, y - 2, `개조 시도 ${won(uniqueCost(def, s))}`, () => actions.uniqueTune(s.uid), ok ? '#e0a0ff' : '#6b7280');
      b.setX(this.w - 16 - b.width);
    }
  }

  private armorPanel(s: ItemStack, def: Extract<ReturnType<typeof registry.item>, { kind: 'armor' }>): void {
    const X = 392;
    this.content.add(this.scene.add.rectangle(X - 8, 40, this.w - X - 4, this.h - 92, 0xffffff, 0.03).setOrigin(0, 0));
    this.content.add(this.scene.add.image(X + 4, 48, def.iconTex).setOrigin(0, 0).setDisplaySize(48, 48));
    this.label(X + 60, 46, armorLabel(def, s), '#ffffff', 16, { fontStyle: 'bold' });
    this.label(X + 60, 70, `${def.slot} · 방어 ${Math.round(armorDefense(def, s))}${def.cl ? ' · CL ×1.5' : ''}${s.prefix ? ` · ${s.prefix} ×${T.prefixDefenseMult[s.prefix]}` : ''}`, theme.colors.muted, 11);
    let y = 110;
    if (s.damaged) {
      this.label(X, y, '파손됨 — 방어 −25%. 수리하면 원래대로 돌아옵니다.', theme.colors.bad, 12);
      const rb = this.button(0, y - 2, `수리 ${won(repairCost(def, s))}`, () => actions.repair(s.uid), theme.colors.good);
      rb.setX(this.w - 16 - rb.width);
      y += 28;
    }
    this.label(X, y, '플러스업', theme.colors.brass, 14, { fontStyle: 'bold' });
    const lv = plusUpLevel(s);
    this.label(X + 90, y + 1, `+${lv} → +${Math.min(T.maxPlusUp, lv + 1)}   방어 +${T.plusUpDefensePerLevel * 100}%/단계   항상 성공 (최대 +${T.maxPlusUp})`, theme.colors.text, 12);
    if (lv < T.maxPlusUp) {
      const b = this.button(0, y - 2, `플러스업 ${won(plusUpCost(def, s))}`, () => actions.plusUp(s.uid), '#9be7ff');
      b.setX(this.w - 16 - b.width);
    } else this.label(this.w - 16, y, '최대', theme.colors.good, 12).setOrigin(1, 0);
    // 방어구 조합
    let cy = y + 50;
    this.content.add(this.scene.add.rectangle(X, cy, this.w - X - 12, 1, 0xc9a227, 0.25).setOrigin(0, 0));
    cy += 10;
    this.label(X, cy, '방어구 조합', theme.colors.brass, 14, { fontStyle: 'bold' });
    const chance = combineChancePct(s);
    this.label(X + 110, cy + 1, chance === null ? '전설 접두 (최대)' : `${s.prefix ?? '접두 없음'} → ${s.prefix === '고대' ? '전설' : '고대'}  ·  성공 ${chance}%  ·  비용 ${won(combineCost(def, s))}`, theme.colors.text, 12);
    cy += 20;
    this.label(X, cy, '같은 방어구 하나를 재료로 소모합니다(성공/실패 무관). 둘 중 높은 플러스업이 남습니다.', '#6b7280', 11);
    cy += 22;
    if (chance !== null) {
      const eq = gameState.equipment;
      const mats = gameState.inventory.items.filter((m) => m.uid !== s.uid && m.itemId === s.itemId && !Object.values(eq.armor).includes(m.uid));
      if (mats.length === 0) this.label(X, cy, `재료 없음 — 같은 ${def.name}이(가) 하나 더 필요합니다.`, theme.colors.muted, 12);
      for (const m of mats.slice(0, 4)) {
        this.label(X, cy + 2, `재료: ${armorLabel(def, m)}`, theme.colors.text, 12);
        const b = this.button(0, cy - 2, `조합 ${won(combineCost(def, s))}`, () => actions.combineArmor(s.uid, m.uid), '#e0a0ff');
        b.setX(this.w - 16 - b.width);
        cy += 26;
      }
    }
    this.label(X, this.h - 84, '고대/전설 접두는 필드 드랍 또는 조합으로 얻습니다. CL 방어구는 방어 ×1.5.', '#6b7280', 11);
  }

  /** width of the most recently created button (buttons are appended last to `content`) */
  private lastW(): number {
    const objs = this.content.list;
    const last = objs[objs.length - 1] as Phaser.GameObjects.Text;
    return last.width;
  }
}
