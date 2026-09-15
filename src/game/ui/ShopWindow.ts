import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { NPCS } from '@data/npcs';
import { WEAPONS } from '@data/weapons';
import type { NpcDef } from '@data/schema/npc';
import { buyPrice, buyQty, sellPrice } from '@core/economy/shop';
import { gradeMult } from '@core/weapons/weaponMath';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';

/** Ammo shows up once any weapon of that caliber is within reach (owned or near the shop's display level). */
function ammoRelevant(caliber: string, level: number): boolean {
  if (gameState.inventory.items.some((s) => {
    const d = registry.item(s.itemId);
    return d.kind === 'weapon' && d.caliber === caliber;
  })) return true;
  return WEAPONS.some((w) => w.caliber === caliber && !w.illegal && w.reqLevel <= level + 6);
}

/** Highest weapon grade a shop displays at this level: 3 at Lv.1, +1 every 4 levels, capped at 11. */
export const shopGradeCap = (level: number): number => Math.min(11, 3 + Math.floor(level / 4));

export class ShopWindow extends Window {
  private buyList: ListView;
  private sellList: ListView;
  private npc: NpcDef | null = null;

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
    this.setTitle(`${npc.name} — 거래`);
    this.refresh();
  }

  refresh(): void {
    this.content.remove([this.buyList, this.sellList]);
    this.clearBody();
    this.content.add([this.buyList, this.sellList]);
    const colW = (this.w - 36) / 2;
    this.label(12, 4, `₩ ${gameState.character.won.toLocaleString('ko-KR')}`, theme.colors.brass, 15, { fontStyle: 'bold' });
    this.label(12, 26, '구매 (클릭)', theme.colors.muted, 12);
    this.label(24 + colW, 26, '판매 — 내 인벤토리 (클릭, 정가의 40%)', theme.colors.muted, 12);

    const level = gameState.character.level;
    const buyRows: ListRow[] = [];
    const npc = this.npc ?? NPCS.find((n) => n.role === 'shop') ?? null;
    // shops carry a band of grades that tracks the hunter's level (original: higher-grade stock appears as you progress)
    const gradeCap = shopGradeCap(level);
    for (const id of npc?.stock ?? []) {
      const def = registry.item(id);
      if (def.kind === 'weapon') {
        if (def.reqLevel > level + 6) continue; // far-off weapons are not displayed yet
        const hi = Math.min(def.gradeMax, gradeCap);
        const lo = Math.max(def.gradeMin, hi - 2);
        for (let g = lo; g <= hi; g++) {
          const price = buyPrice(def, g);
          buyRows.push({
            id: `${id}@${g}`,
            icon: def.iconTex,
            text: `${def.name}  [${g}등급]`,
            sub: `${def.class} · ${def.caliber} · 공격 ${Math.round(def.baseDamage * gradeMult(g))} · ${def.rpm}rpm · Lv.${def.reqLevel}`,
            right: `₩${price.toLocaleString('ko-KR')}`,
            rightColor: gameState.character.won >= price ? theme.colors.brass : theme.colors.bad,
            disabled: level < def.reqLevel,
            onClick: () => actions.buy(id, g),
          });
        }
        continue;
      }
      const price = buyPrice(def);
      if (def.kind === 'ammo' && !ammoRelevant(def.caliber, level)) continue;
      const sub =
        def.kind === 'ammo'
          ? `${def.caliber} ${def.ammoKind} · ${buyQty(def)}발 박스`
          : def.kind === 'armor'
            ? `${def.slot} · 방어 ${def.defense} · Lv.${def.reqLevel}`
            : def.kind === 'consumable'
              ? `소모품 · ${[def.effect.hp ? `생명 +${def.effect.hp}` : '', def.effect.stamina ? `지구력 +${def.effect.stamina}` : ''].filter(Boolean).join(' ')}`
              : def.desc;
      buyRows.push({
        id,
        icon: def.iconTex,
        text: def.name,
        sub,
        right: `₩${price.toLocaleString('ko-KR')}`,
        rightColor: gameState.character.won >= price ? theme.colors.brass : theme.colors.bad,
        disabled: def.kind === 'armor' && level < def.reqLevel,
        onClick: () => actions.buy(id),
      });
    }
    this.buyList.setRows(buyRows);

    const eq = gameState.equipment;
    const sellRows: ListRow[] = gameState.inventory.items.map((s) => {
      const def = registry.item(s.itemId);
      const equipped = eq.weaponUid === s.uid || Object.values(eq.armor).includes(s.uid);
      if (def.kind === 'misc') return { id: s.uid, icon: def.iconTex, text: def.name, sub: def.quest ? '퀘스트 아이템 — 판매 불가' : def.desc, right: def.quest || def.price <= 0 ? '—' : `+₩${sellPrice(s, registry.item)}`, rightColor: theme.colors.muted, disabled: def.quest || def.price <= 0, onClick: () => actions.sell(s.uid) };
      return {
        id: s.uid,
        icon: def.iconTex,
        text: `${def.name}${def.kind === 'weapon' ? `  [${s.grade ?? def.gradeMin}등급]` : ''}${equipped ? '  (장착중)' : ''}`,
        sub: def.kind === 'ammo' ? `${s.qty}발` : def.kind === 'consumable' ? `×${s.qty} (1개씩 판매)` : def.kind,
        right: `+₩${sellPrice(s, registry.item).toLocaleString('ko-KR')}`,
        rightColor: theme.colors.good,
        onClick: () => actions.sell(s.uid),
      };
    });
    this.sellList.setRows(sellRows);
  }
}
