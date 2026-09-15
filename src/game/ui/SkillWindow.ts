import type Phaser from 'phaser';
import { SKILLS } from '@data/skills';
import { registry } from '@data/registry';
import { activeTechGradeUsed, learnedRank } from '@core/skills/skillState';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { theme } from './theme';

/** Skills list. In `elia` mode (talking to EL.IA) skills can be learned / ranked up. */
export class SkillWindow extends Window {
  elia = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'skills', x, y, 560, 420, '스킬 (K)');
    this.refresh();
  }

  setElia(on: boolean): void {
    this.elia = on;
    this.setTitle(on ? 'EL.IA 기술정보원 — 스킬 습득/활성화' : '스킬 (K)');
    this.refresh();
  }

  refresh(): void {
    this.clearBody();
    const s = gameState.skills;
    const d = gameState.derived();
    const used = activeTechGradeUsed(s, registry.skill);
    this.label(14, 2, `기술등급 ${d.techGrade}  ·  활성 스킬 등급 합 ${used} / ${d.techGrade}  ·  ₩ ${gameState.character.won.toLocaleString('ko-KR')}`, theme.colors.muted, 12);
    this.label(14, 20, '계열(퍼스널 패시브 · 퍼스널 액티브 · 웨폰 마스터리)마다 1개만 활성화됩니다.', '#6b7280', 11);

    let y = 48;
    for (const def of SKILLS) {
      const rank = learnedRank(s, def.id);
      const active = s.active[def.category] === def.id;
      this.content.add(this.scene.add.rectangle(10, y - 4, this.w - 20, 74, 0xffffff, active ? 0.08 : 0.03).setOrigin(0, 0));
      this.content.add(this.scene.add.image(18, y + 4, def.iconTex).setOrigin(0, 0).setDisplaySize(40, 40));
      this.label(68, y, `${def.name}`, rank ? '#ffffff' : theme.colors.muted, 15, { fontStyle: 'bold' });
      this.label(68, y + 22, `${def.category}${def.weaponClass ? ` · ${def.weaponClass} 전용` : ''} · 필요 기술등급 ${def.reqTechGrade}`, theme.colors.muted, 11);
      this.label(68, y + 40, def.desc, theme.colors.text, 12);
      this.label(this.w - 16, y, `Rank ${rank} / ${def.maxRank}`, rank ? theme.colors.brass : '#6b7280', 13).setOrigin(1, 0);

      let bx = this.w - 16;
      if (rank > 0) {
        const b = this.button(0, y + 26, active ? '비활성화' : '활성화', () => actions.toggleSkill(def.id), active ? theme.colors.good : theme.colors.brass);
        bx -= b.width;
        b.setX(bx);
        bx -= 8;
      }
      if (this.elia && rank < def.maxRank) {
        const cost = def.price * (rank + 1);
        const b = this.button(0, y + 26, `${rank ? '랭크업' : '습득'} ₩${cost.toLocaleString('ko-KR')}`, () => actions.learnSkill(def.id), '#9be7ff');
        bx -= b.width;
        b.setX(bx);
      }
      y += 84;
    }
    if (!this.elia) this.label(14, this.h - 66, '습득/랭크업은 광진구청 지하주차장의 EL.IA 기술정보원에게서 할 수 있습니다.', '#6b7280', 11);
  }
}
