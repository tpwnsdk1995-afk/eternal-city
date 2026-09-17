import type Phaser from 'phaser';
import { ARMOR_SLOTS, STAT_KEYS, type StatKey } from '@data/schema/enums';
import { TEX } from '@data/textureKeys';
import { armorDefense, armorLabel, weaponLabel } from '@core/tuning/tuning';
import { registry } from '@data/registry';
import { statCap, xpToNext } from '@core/stats/levelCurve';
import { totalWeightKg } from '@core/inventory/weight';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { theme } from './theme';

const STAT_DESC: Record<StatKey, string> = {
  생명력: '의식회복 확률',
  체력: '최대 생명력 · 근접 공격력',
  지구력: '달리기/점프 게이지 · 무게',
  기술: '원거리 공격력 · 명중 · 치명타',
  지능: '기술등급 · 행동력',
  속도: '이동속도 · 공격속도',
};

export class StatusWindow extends Window {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'status', x, y, 380, 660, '상태 (C)');
    this.refresh();
  }

  refresh(): void {
    this.clearBody();
    if (this.drawConfirm()) return;
    const c = gameState.character;
    const d = gameState.derived();
    const v = gameState.vitals;

    this.label(14, 2, `${c.name}${gameState.achievements.title ? `  [${gameState.achievements.title}]` : ''}`, '#ffffff', 16, { fontStyle: 'bold' });
    this.label(this.w - 14, 4, `Lv.${c.level}${c.rebirth ? `  환생 ${c.rebirth}` : ''}`, theme.colors.brass, 14).setOrigin(1, 0);
    this.label(14, 24, `경험치 ${c.xp.toLocaleString('ko-KR')} / ${xpToNext(c.level).toLocaleString('ko-KR')}`, theme.colors.muted, 13);
    this.label(14, 44, `미배분 스탯 포인트: ${c.unspentPoints}`, c.unspentPoints > 0 ? theme.colors.good : theme.colors.muted, 13, { fontStyle: c.unspentPoints ? 'bold' : 'normal' });
    this.label(this.w - 14, 44, `상한 ${statCap(c.rebirth)}`, theme.colors.muted, 12).setOrigin(1, 0);

    let y = 72;
    for (const k of STAT_KEYS) {
      this.label(14, y, k, '#ffffff', 14, { fontStyle: 'bold' });
      this.label(74, y + 2, STAT_DESC[k], theme.colors.muted, 12);
      this.label(268, y, `${c.base[k]}`, theme.colors.brass, 14).setOrigin(1, 0);
      if (c.unspentPoints > 0) {
        const ask = (n: number) => this.confirm(`${k} +${n}\n확정할까요? (되돌릴 수 없습니다)`, () => actions.allocate(k, n));
        this.button(282, y - 1, '+1', () => ask(1), undefined, 14);
        this.button(318, y - 1, '+5', () => ask(Math.min(5, gameState.character.unspentPoints)), undefined, 14);
      }
      y += 30;
    }

    y += 8;
    this.content.add(this.scene.add.rectangle(10, y, this.w - 20, 1, 0x3a3f47).setOrigin(0, 0));
    y += 10;
    const rows: [string, string][] = [
      ['생명력', `${Math.round(v.hp)} / ${d.maxHp}`],
      ['지구력', `${Math.round(v.stamina)} / ${d.maxStamina}`],
      ['행동력', `${Math.round(v.ap)} / ${d.maxAp}`],
      ['기술등급', `${d.techGrade}`],
      ['이동속도', `${d.moveSpeed.toFixed(0)} px/s`],
      ['공격속도', `×${d.attackSpeedMult.toFixed(3)}`],
      ['원거리/근접 배율', `×${d.rangedMult.toFixed(3)} / ×${d.meleeMult.toFixed(3)}`],
      ['치명타', `${(d.critChance * 100).toFixed(1)}% · ×${d.critMult.toFixed(2)}`],
      ['의식회복 확률', `${(d.consciousnessChance * 100).toFixed(1)}%`],
      ['방어력', `${gameState.defense().toFixed(0)}`],
      ['무게', `${totalWeightKg(gameState.inventory, registry.item).toFixed(1)} / ${d.maxWeightKg.toFixed(1)} kg`],
    ];
    for (const [k, val] of rows) {
      this.label(14, y, k, theme.colors.muted, 13);
      this.label(this.w - 14, y, val, theme.colors.text, 13).setOrigin(1, 0);
      y += 20;
    }

    // ---- 장비 (무기 + 방어구 6부위): click a slot to unequip
    y += 6;
    this.content.add(this.scene.add.rectangle(10, y, this.w - 20, 1, 0x3a3f47).setOrigin(0, 0));
    y += 8;
    this.label(14, y, '장비', theme.colors.brass, 12, { fontStyle: 'bold' });
    y += 18;
    const eq = gameState.equipment;
    const slotDefs: { key: string; label: string; uid: string | null }[] = [
      { key: 'weapon', label: '무기', uid: eq.weaponUid },
      ...ARMOR_SLOTS.map((slot) => ({ key: slot, label: slot, uid: eq.armor[slot] ?? null })),
    ];
    const size = 40;
    const gap = 9;
    slotDefs.forEach((sd, i) => {
      const sx = 14 + i * (size + gap);
      const frame = this.scene.add.image(sx, y, TEX.ui_slot).setOrigin(0, 0).setDisplaySize(size, size);
      this.content.add(frame);
      const stack = sd.uid ? gameState.inventory.items.find((s) => s.uid === sd.uid) : undefined;
      const def = stack ? registry.item(stack.itemId) : null;
      if (stack && def && (def.kind === 'weapon' || def.kind === 'armor')) {
        const icon = this.scene.add.image(sx + 4, y + 4, def.iconTex).setOrigin(0, 0).setDisplaySize(size - 8, size - 8).setInteractive({ useHandCursor: true });
        icon.on('pointerdown', () => actions.equipToggle(stack.uid));
        this.content.add(icon);
        if (def.kind === 'armor') this.label(sx + size - 2, y + size - 13, `${Math.round(armorDefense(def, stack))}`, theme.colors.text, 11, { stroke: '#000', strokeThickness: 2 }).setOrigin(1, 0);
        if (stack.prefix) this.label(sx + 2, y + 1, stack.prefix === '전설' ? '★' : '◆', stack.prefix === '전설' ? '#ffd166' : '#c9a7ff', 9);
      } else {
        this.label(sx + size / 2, y + size / 2, '—', '#4b5563', 12).setOrigin(0.5);
      }
      this.label(sx + size / 2, y + size + 2, sd.label, theme.colors.muted, 11).setOrigin(0.5, 0);
    });
    y += size + 16;
    const w = gameState.weapon();
    const worn = ARMOR_SLOTS.map((slot) => {
      const uid = eq.armor[slot];
      const st = uid ? gameState.inventory.items.find((s) => s.uid === uid) : undefined;
      const d = st ? registry.item(st.itemId) : null;
      return st && d?.kind === 'armor' ? armorLabel(d, st) : null;
    }).filter((x): x is string => !!x);
    this.label(14, y, w ? weaponLabel(w.def, w.stack) : '무기 없음', w ? theme.colors.text : theme.colors.muted, 13);
    this.label(14, y + 16, worn.length ? worn.join(' · ') : '착용한 방어구 없음', theme.colors.muted, 12, { wordWrap: { width: this.w - 28 } });
  }
}
