import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { NPCS } from '@data/npcs';
import type { NpcDef } from '@data/schema/npc';
import { buyPrice, buyQty, sellPrice } from '@core/economy/shop';
import { weaponUsableBy } from '@core/inventory/equipment';
import { formatRemaining } from '@core/combat/buffs';
import { weaponLabel } from '@core/tuning/tuning';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';

const won = (n: number): string => `₩${n.toLocaleString('ko-KR')}`;

export class ShopWindow extends Window {
  private buyList: ListView;
  private sellList: ListView;
  private npc: NpcDef | null = null;
  /** uids ticked in the sell list — sold together by the 선택 판매 button */
  private picked = new Set<string>();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'shop', x, y, 800, 540, '무기상');
    const colW = (this.w - 36) / 2;
    this.buyList = new ListView(scene, 12, 44, colW, 42, 10);
    this.sellList = new ListView(scene, 24 + colW, 44, colW, 42, 10);
    this.content.add([this.buyList, this.sellList]);
    this.refresh();
  }

  setNpc(npc: NpcDef): void {
    this.npc = npc;
    this.pending = null;
    this.picked.clear();
    this.setTitle(`${npc.name} — 거래`);
    this.refresh();
  }

  refresh(): void {
    this.content.remove([this.buyList, this.sellList]);
    this.clearBody();
    this.content.add([this.buyList, this.sellList]);
    const colW = (this.w - 36) / 2;
    this.label(12, 4, `₩ ${gameState.character.won.toLocaleString('ko-KR')}`, theme.colors.brass, 15, { fontStyle: 'bold' });

    this.buyList.setVisible(!this.pending);
    this.sellList.setVisible(!this.pending);
    if (this.drawConfirm()) return;

    this.label(12, 26, '구매 (탭 → 확인)', theme.colors.muted, 12);
    this.label(24 + colW, 26, '판매 (탭=체크, 정가의 40%)', theme.colors.muted, 12);

    const level = gameState.character.level;
    const buyRows: ListRow[] = [];
    const npc = this.npc ?? NPCS.find((n) => n.role === 'shop') ?? null;
    for (const id of npc?.stock ?? []) {
      const def = registry.item(id);
      if (def.kind === 'weapon' && !weaponUsableBy(def, gameState.character.race)) continue; // 총기는 인간, 변이무기는 감염체
      const price = buyPrice(def);
      const sub =
        def.kind === 'weapon'
          ? `${def.class} · ${def.caliber} · 공격 ${def.baseDamage} · ${def.rpm}rpm · Lv.${def.reqLevel}`
          : def.kind === 'ammo'
            ? `${def.caliber} ${def.ammoKind} · ${buyQty(def)}발 박스`
            : def.kind === 'armor'
              ? `${def.slot} · 방어 ${def.defense} · Lv.${def.reqLevel}`
              : def.kind === 'consumable'
                ? `소모품 · ${[def.effect.hp ? `생명 +${def.effect.hp}` : '', def.effect.stamina ? `지구력 +${def.effect.stamina}` : '', def.effect.ap ? `행동력 +${def.effect.ap}` : '', def.effect.buff ? `${registry.buff(def.effect.buff).desc} (${formatRemaining(registry.buff(def.effect.buff).durationMs)})` : '', def.effect.enhanceBonusPct ? `다음 강화 성공률 +${def.effect.enhanceBonusPct}%` : ''].filter(Boolean).join(' · ')}`
                : def.desc;
      buyRows.push({
        id,
        icon: def.iconTex,
        text: def.name,
        sub,
        right: won(price),
        rightColor: gameState.character.won >= price ? theme.colors.brass : theme.colors.bad,
        disabled: (def.kind === 'armor' || def.kind === 'weapon') && level < def.reqLevel,
        onClick: () => this.confirm(`${def.name}\n${won(price)}에 구매할까요?`, () => actions.buy(id)),
      });
    }
    this.buyList.setRows(buyRows);

    const eq = gameState.equipment;
    const items = gameState.inventory.items;
    for (const u of this.picked) if (!items.some((s) => s.uid === u)) this.picked.delete(u);
    // uid → how many actions.sell() calls empty that stack (consumable/misc sell one unit per call)
    const sells: [string, number][] = [];
    let total = 0;
    const sellRows: ListRow[] = items.map((s) => {
      const def = registry.item(s.itemId);
      const equipped = eq.weaponUid === s.uid || Object.values(eq.armor).includes(s.uid);
      const times = def.kind === 'consumable' || def.kind === 'misc' ? s.qty : 1;
      const gained = sellPrice(s, registry.item) * times;
      const on = this.picked.has(s.uid);
      if (on) { sells.push([s.uid, times]); total += gained; }
      const toggle = () => { if (on) this.picked.delete(s.uid); else this.picked.add(s.uid); this.refresh(); };
      const box = on ? '☑ ' : '☐ ';
      const color = on ? theme.colors.brass : undefined;
      if (def.kind === 'misc') {
        const no = def.quest || def.price <= 0;
        return { id: s.uid, icon: def.iconTex, text: (no ? '' : box) + def.name, sub: def.quest ? '퀘스트 아이템 — 판매 불가' : def.desc, right: no ? '—' : `+${won(gained)}`, rightColor: theme.colors.muted, color, disabled: no, onClick: toggle };
      }
      return {
        id: s.uid,
        icon: def.iconTex,
        text: `${box}${def.kind === 'weapon' ? weaponLabel(def, s) : def.name}${equipped ? '  (장착중)' : ''}`,
        sub: def.kind === 'ammo' ? `${s.qty}발` : def.kind === 'consumable' ? `×${s.qty} (전부 판매)` : def.kind,
        right: `+${won(gained)}`,
        rightColor: theme.colors.good,
        color,
        onClick: toggle,
      };
    });
    this.sellList.setRows(sellRows);

    const n = sells.length;
    const btn = this.button(0, 22, n ? `선택 ${n}개 판매 +${won(total)}` : '선택 판매 (줄을 탭해 체크)', () => {
      if (!n) return;
      this.confirm(`선택 ${n}개\n+${won(total)}에 판매할까요?`, () => {
        for (const [uid, times] of sells) for (let i = 0; i < times; i++) actions.sell(uid);
        this.picked.clear();
      });
    }, n ? theme.colors.brass : theme.colors.muted, 12);
    btn.setX(this.w - 12 - btn.width);
  }
}
