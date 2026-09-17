import type Phaser from 'phaser';
import { registry } from '@data/registry';
import { balance } from '@data/balance';
import type { NpcDef } from '@data/schema/npc';
import type { AssaultDef } from '@data/schema/assault';
import { assaultStyle } from '@core/assault/advanced';
import { GRADE_COLOR, parSec, type AssaultGrade } from '@core/assault/score';
import { assaultBest, assaultClears } from '@core/world/stats';
import { gameState } from '../state/GameState';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';

const TIER_COLOR: Record<AssaultDef['tier'], string> = { A: '#7bd88f', B: '#ffd166', C: '#ff9b9b' };

/** 어설트 접수 — the reception desk's mission board. Pick a mission your level allows and deploy. */
export class AssaultWindow extends Window {
  private missions: ListView;
  private npc: NpcDef | null = null;
  private selected: string | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'assault', x, y, 760, 520, '어설트 접수');
    this.missions = new ListView(scene, 12, 30, 400, 46, 9);
    this.content.add(this.missions);
    this.refresh();
  }

  setNpc(npc: NpcDef): void {
    this.npc = npc;
    this.selected = null;
    this.refresh();
  }

  refresh(): void {
    this.content.remove(this.missions);
    this.clearBody();
    this.content.add(this.missions);
    const level = gameState.character.level;
    this.label(12, 4, `Lv.${level} · 지원 가능한 작전을 고르세요. 실패하면 위약금이 차감됩니다.`, theme.colors.muted, 12);

    const ids = this.npc?.assaults ?? registry.npc('npc_assault').assaults ?? [];
    const defs = ids.map((id) => registry.assault(id));
    if (!this.selected) this.selected = defs.find((d) => this.minLevel(d) <= level)?.id ?? defs[0]?.id ?? null;

    const rows: ListRow[] = defs.map((d) => {
      const min = this.minLevel(d);
      const ok = level >= min;
      const best = assaultBest(gameState.stats, d.id);
      return {
        id: d.id,
        text: `[${d.tier}] ${d.name}`,
        sub: `${assaultStyle(d)} · ₩${d.rewards.won.toLocaleString('ko-KR')} · ${d.rewards.xp} XP${best ? ` · 최고 ${best.grade} ${best.score.toLocaleString('ko-KR')}점` : ''}`,
        right: !ok ? `Lv.${min} 필요` : best ? `${best.grade}  ×${assaultClears(gameState.stats, d.id)}` : '지원 가능',
        rightColor: !ok ? theme.colors.bad : best ? GRADE_COLOR[best.grade as AssaultGrade] ?? theme.colors.good : theme.colors.good,
        color: d.id === this.selected ? '#ffffff' : d.advanced ? '#e0a0ff' : ok ? theme.colors.text : theme.colors.muted,
        onClick: () => {
          this.selected = d.id;
          this.refresh();
        },
      };
    });
    this.missions.setRows(rows);

    const d = defs.find((x) => x.id === this.selected);
    if (!d) return;
    const X = 428;
    this.content.add(this.scene.add.rectangle(X - 8, 26, this.w - X - 4, this.h - 76, 0xffffff, 0.03).setOrigin(0, 0));
    this.label(X, 32, `[${d.tier}]`, TIER_COLOR[d.tier], 22, { fontStyle: 'bold' });
    this.label(X + 44, 36, d.name, '#ffffff', 16, { fontStyle: 'bold' });
    if (d.advanced) this.label(X + 44, 58, '고급 어설트 — 적 체력 ×1.7 · 피해 ×1.4 · 보상 ×2', '#e0a0ff', 11);
    this.label(X, 84, `유형 ${assaultStyle(d)} · 권장 Lv.${d.levelRange[0]}~${d.levelRange[1]} · ${registry.map(d.mapId).name}`, theme.colors.muted, 11);

    let y = 110;
    this.label(X, y, '단계', theme.colors.brass, 12, { fontStyle: 'bold' });
    y += 20;
    d.phases.forEach((p, i) => {
      this.label(X, y, `${i + 1}. ${p.label}`, theme.colors.text, 12);
      y += 18;
    });
    y += 8;
    this.label(X, y, '보상', theme.colors.brass, 12, { fontStyle: 'bold' });
    y += 20;
    this.label(X, y, `₩${d.rewards.won.toLocaleString('ko-KR')} · ${d.rewards.xp} XP`, theme.colors.text, 12);
    y += 18;
    for (const it of d.rewards.items) {
      this.label(X, y, `${registry.item(it.itemId).name} ×${it.qty}${it.chance < 1 ? ` (${Math.round(it.chance * 100)}%)` : ''}`, theme.colors.text, 12);
      y += 18;
    }
    this.label(X, y + 4, `실패 위약금 ₩${d.failPenalty.won.toLocaleString('ko-KR')} · 사망 시 구청 지하 부활`, theme.colors.muted, 11);
    y += 30;

    // 기록판: score-proportional reward + my best run
    this.label(X, y, '기록판', theme.colors.brass, 12, { fontStyle: 'bold' });
    y += 20;
    const par = parSec(d);
    this.label(X, y, `점수 비례 보상 · 기준 ${Math.round(par / 60)}분 · 보상 S×1.3 A×1.15 B×1.0 C×0.85`, theme.colors.muted, 11);
    y += 18;
    const best = assaultBest(gameState.stats, d.id);
    const clears = assaultClears(gameState.stats, d.id);
    if (best) {
      const m = Math.floor(best.timeSec / 60);
      const s = best.timeSec % 60;
      this.label(X, y - 2, best.grade, GRADE_COLOR[best.grade as AssaultGrade] ?? theme.colors.text, 22, { fontStyle: 'bold' });
      this.label(X + 30, y, `${best.score.toLocaleString('ko-KR')}점 · ${m}분 ${s}초 · 처치 ${best.kills} · 클리어 ${clears}회`, theme.colors.text, 12);
      this.label(X + 30, y + 16, new Date(best.at).toLocaleDateString('ko-KR'), theme.colors.muted, 10);
    } else {
      this.label(X, y, clears ? `클리어 ${clears}회 · 점수 기록 없음 (기록판 도입 전)` : '아직 기록이 없습니다. 첫 클리어가 기록판에 오릅니다.', theme.colors.muted, 11);
    }

    const b = this.button(0, this.h - 84, `${d.name} 지원`, () => this.deploy(d), '#ff9b9b', 14);
    b.setX(this.w - 16 - b.width);
  }

  private minLevel(d: AssaultDef): number {
    return balance.assault.entryLevelOverride ?? d.levelRange[0];
  }

  private deploy(d: AssaultDef): void {
    const min = this.minLevel(d);
    if (gameState.character.level < min) return gameState.message(`레벨 ${min} 이상만 지원할 수 있습니다.`, 'bad');
    this.emit('close');
    gameState.events.emit('startAssault', { assaultId: d.id });
  }
}
