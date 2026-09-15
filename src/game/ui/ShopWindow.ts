import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { NPCS } from '@data/npcs';
import type { NpcDef } from '@data/schema/npc';
import { buyPrice, buyQty, sellPrice } from '@core/economy/shop';
import { gradeMult } from '@core/weapons/weaponMath';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';

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
    for (const id of npc?.stock ?? []) {
      const def = registry.item(id);
      if (def.kind === 'weapon') {
        for (let g = def.gradeMin; g <= def.gradeMax; g++) {
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
      const sub =
        def.kind === 'ammo'
          ? `${def.caliber} ${def.ammoKind} · ${buyQty(def)}발 박스`
          : def.kind === 'armor'
            ? `${def.slot} · 방어 ${def.defense} · Lv.${def.reqLevel}`
            : `소모품 · ${[def.effect.hp ? `생명 +${def.effect.hp}` : '', def.effect.stamina ? `지구력 +${def.effect.stamina}` : ''].filter(Boolean).join(' ')}`;
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
