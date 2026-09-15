import type Phaser from 'phaser';
import { GUILD_DONATIONS, GUILD_FOUND_COST, GUILD_LEVELS, GUILD_NAME_PRESETS } from '@data/guild';
import { guildLevel, guildPerks, guildTitle, nextLevelNeed, roster } from '@core/guild/guild';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { theme } from './theme';

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

/** 길드 사무실 (광진구청 과장): found → contribute → level perks + a growing roster of named survivors. */
export class GuildWindow extends Window {
  private presetIdx = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'guild', x, y, 620, 480, '길드 사무실 — 광진구청 생존자 지원과');
    this.refresh();
  }

  refresh(): void {
    this.clearBody();
    const g = gameState.guild;
    this.label(this.w - 14, 6, `₩ ${gameState.character.won.toLocaleString('ko-KR')}`, theme.colors.brass, 13).setOrigin(1, 0);

    if (!g.name) {
      this.label(14, 6, '아직 길드가 없습니다.', '#ffffff', 15, { fontStyle: 'bold' });
      this.label(14, 30, `생존자를 모아 길드를 등록하면 구청이 지원합니다. 창설 비용 ${won(GUILD_FOUND_COST)}. 길드 레벨마다 경험치 +2% · ₩ +2% · 무게 +2kg · 최대 생명 +1%.`, theme.colors.muted, 12, { wordWrap: { width: this.w - 28 } });
      const name = GUILD_NAME_PRESETS[this.presetIdx % GUILD_NAME_PRESETS.length];
      this.label(14, 78, '길드 이름', theme.colors.muted, 12);
      this.label(14, 98, `[ ${name} ]`, '#ffffff', 18, { fontStyle: 'bold' });
      this.button(230, 98, '다른 이름 ▶', () => {
        this.presetIdx++;
        this.refresh();
      }, theme.colors.brass, 12);
      this.button(14, 136, `길드 창설 (${won(GUILD_FOUND_COST)})`, () => actions.foundGuild(name), gameState.character.won >= GUILD_FOUND_COST ? theme.colors.good : theme.colors.muted, 14);
      let y = 190;
      this.label(14, y, '길드 레벨표', theme.colors.muted, 12);
      y += 20;
      for (const d of GUILD_LEVELS) {
        this.label(14, y, `Lv.${d.level}  ${d.title}`, theme.colors.text, 12);
        this.label(260, y, d.contribution ? `누적 기여 ${won(d.contribution)}` : '창설 시', '#6b7280', 12);
        y += 18;
      }
      return;
    }

    const lv = guildLevel(g.contributed);
    const perks = guildPerks(g);
    const next = nextLevelNeed(g.contributed);
    this.label(14, 4, `[${g.name}]`, '#ffffff', 18, { fontStyle: 'bold' });
    this.label(14, 28, `Lv.${lv} · ${guildTitle(lv)} · 누적 기여 ${won(g.contributed)}`, theme.colors.brass, 12);
    this.button(this.w - 14 - 96, 26, '이름 바꾸기', () => {
      this.presetIdx++;
      actions.renameGuild(GUILD_NAME_PRESETS[this.presetIdx % GUILD_NAME_PRESETS.length]);
    }, theme.colors.muted, 11);

    // progress bar
    const barY = 52;
    const barW = this.w - 28;
    this.content.add(this.scene.add.rectangle(14, barY, barW, 12, 0x000000, 0.6).setOrigin(0, 0));
    const cur = GUILD_LEVELS.find((d) => d.level === lv)!.contribution;
    const to = next ? cur + next.need : cur;
    const frac = next ? Math.min(1, (g.contributed - cur) / Math.max(1, to - cur)) : 1;
    this.content.add(this.scene.add.rectangle(14, barY, Math.max(2, barW * frac), 12, 0xc9a227, 0.9).setOrigin(0, 0));
    this.label(14, barY + 16, next ? `다음 레벨(Lv.${next.level})까지 ${won(next.need)}` : '최대 레벨', theme.colors.muted, 11);

    // perks
    let y = 96;
    this.label(14, y, '길드 혜택 (항상 적용)', theme.colors.muted, 12);
    y += 20;
    this.label(14, y, `경험치 +${Math.round(perks.xpPct * 100)}%   ₩ 획득 +${Math.round(perks.wonPct * 100)}%   소지 무게 +${perks.weightKg}kg   최대 생명 +${Math.round(perks.maxHpPct * 100)}%`, theme.colors.good, 13);
    y += 30;

    // donate
    this.label(14, y, '기여하기 — 길드 금고에 ₩을 보내면 누적 기여가 오르고 레벨이 올라갑니다.', theme.colors.muted, 12);
    y += 22;
    let bx = 14;
    for (const amt of GUILD_DONATIONS) {
      const ok = gameState.character.won >= amt;
      const b = this.button(bx, y, `${won(amt)} 기여`, () => actions.donateGuild(amt), ok ? '#9be7ff' : theme.colors.muted, 12);
      bx += b.width + 10;
    }
    const tenth = Math.floor(gameState.character.won * 0.1);
    if (tenth >= 1000) this.button(bx, y, `보유 ₩의 10% (${won(tenth)})`, () => actions.donateGuild(tenth), '#9be7ff', 12);
    y += 40;

    // roster
    this.content.add(this.scene.add.rectangle(14, y, this.w - 28, 1, 0xc9a227, 0.25).setOrigin(0, 0));
    y += 10;
    const members = roster(g);
    this.label(14, y, `길드원 ${members.length + 1}명`, theme.colors.muted, 12);
    y += 20;
    this.label(14, y, `★ ${gameState.character.name}`, '#ffffff', 13, { fontStyle: 'bold' });
    this.label(200, y + 1, `길드장 · Lv.${gameState.character.level}`, theme.colors.muted, 12);
    y += 20;
    for (const m of members) {
      this.label(14, y, m.name, theme.colors.text, 13);
      this.label(200, y + 1, m.job, theme.colors.muted, 12);
      y += 20;
    }
    if (lv < GUILD_LEVELS.length) this.label(14, y + 4, `Lv.${lv + 1}에 새 길드원 2명이 합류합니다.`, '#6b7280', 11);
  }
}
