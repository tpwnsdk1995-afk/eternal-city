import type Phaser from 'phaser';
import { registry } from '@data/registry';
import type { NpcDef } from '@data/schema/npc';
import { balance } from '@data/balance';
import { gameState, type AssaultResult } from '../state/GameState';
import { actions } from '../state/actions';
import { ResultWindow } from './ResultWindow';
import { MenuWindow } from './MenuWindow';
import { QuestWindow } from './QuestWindow';
import { questService } from '../state/questService';
import type { Window } from './Window';
import { InventoryWindow } from './InventoryWindow';
import { StatusWindow } from './StatusWindow';
import { SkillWindow } from './SkillWindow';
import { ShopWindow } from './ShopWindow';
import { DialogBox } from './DialogBox';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/gameConfig';

export type WindowKey = 'inventory' | 'status' | 'skills' | 'shop' | 'dialog' | 'result' | 'menu' | 'quest';

const HUD_H = 108;

/** Owns every in-game window: creation, toggling, hotkeys, NPC dialogs and pointer blocking. */
export class WindowManager {
  private windows = new Map<WindowKey, Window>();
  private order: WindowKey[] = []; // open windows, last = top

  constructor(scene: Phaser.Scene) {
    const inv = new InventoryWindow(scene, GAME_WIDTH - 400 - 12, 40);
    const status = new StatusWindow(scene, 12, 40);
    const skills = new SkillWindow(scene, (GAME_WIDTH - 560) / 2, 80);
    const shop = new ShopWindow(scene, (GAME_WIDTH - 800) / 2, 50);
    const dialog = new DialogBox(scene, (GAME_WIDTH - 760) / 2, GAME_HEIGHT - HUD_H - 160, 760);
    const result = new ResultWindow(scene, (GAME_WIDTH - 460) / 2, 140);
    const menu = new MenuWindow(scene, (GAME_WIDTH - 440) / 2, 120);
    const quest = new QuestWindow(scene, GAME_WIDTH - 460 - 12, 40);
    for (const w of [inv, status, skills, shop, dialog, result, menu, quest]) {
      this.windows.set(w.key as WindowKey, w);
      w.setVisible(false);
      w.on('close', () => this.close(w.key as WindowKey));
    }
    gameState.uiHit = (sx, sy) => this.hits(sx, sy);
  }

  destroy(): void {
    gameState.uiHit = null;
    for (const w of this.windows.values()) w.destroy();
    this.windows.clear();
  }

  isOpen(key: WindowKey): boolean {
    return this.order.includes(key);
  }

  openKeys(): WindowKey[] {
    return [...this.order];
  }

  open(key: WindowKey): void {
    const w = this.windows.get(key)!;
    w.refresh();
    w.setVisible(true);
    this.order = [...this.order.filter((k) => k !== key), key];
    this.order.forEach((k, i) => this.windows.get(k)!.setDepth(100 + i));
    if (key === 'skills' && !(w as SkillWindow).elia) (w as SkillWindow).setElia(false);
  }

  close(key: WindowKey): void {
    const w = this.windows.get(key)!;
    w.setVisible(false);
    this.order = this.order.filter((k) => k !== key);
    if (key === 'skills') (w as SkillWindow).setElia(false);
  }

  toggle(key: WindowKey): void {
    if (this.isOpen(key)) this.close(key);
    else this.open(key);
  }

  /** Closes the top-most window; false if none was open. */
  closeTop(): boolean {
    const top = this.order[this.order.length - 1];
    if (!top) return false;
    this.close(top);
    return true;
  }

  closeAll(except: WindowKey[] = []): void {
    for (const k of [...this.order]) if (!except.includes(k)) this.close(k);
  }

  showResult(r: AssaultResult): void {
    (this.windows.get('result') as ResultWindow).show(r);
    this.open('result');
  }

  refreshOpen(): void {
    for (const k of this.order) this.windows.get(k)!.refresh();
  }

  hits(sx: number, sy: number): boolean {
    for (const k of this.order) if (this.windows.get(k)!.contains(sx, sy)) return true;
    return false;
  }

  handleHotkey(key: string): void {
    switch (key) {
      case 'inventory':
        return this.toggle('inventory');
      case 'status':
        return this.toggle('status');
      case 'skills':
        return this.toggle('skills');
      case 'quest':
        return this.toggle('quest');
      case 'minimap':
        return gameState.setSettings({ showMinimap: !gameState.settings.showMinimap });
      case 'menu':
        if (!this.closeTop()) this.open('menu');
        return;
    }
    const quick = /^quick([1-9])$/.exec(key);
    if (quick) {
      const stacks = gameState.inventory.items.filter((s) => registry.item(s.itemId).kind === 'consumable');
      const s = stacks[Number(quick[1]) - 1];
      if (s) actions.use(s.uid);
    }
  }

  /** Opens the NPC's dialog with role-specific options. */
  talkTo(npcId: string): void {
    const npc = registry.npc(npcId);
    questService.onTalk(npcId);
    const dialog = this.windows.get('dialog') as DialogBox;
    let line = npc.lines[Math.floor(Math.random() * npc.lines.length)] ?? '...';
    const closeOpt = { label: '닫기', onPick: () => this.close('dialog'), color: '#9aa0a6' };
    const questOpts = questService.offerable(npcId).map((o) => {
      if (o.status === 'ready') line = o.def.text.complete;
      else if (o.status === 'active') line = o.def.text.progress;
      else if (o.status === 'offer' && questService.offerable(npcId).every((x) => x.status === 'offer')) line = o.def.text.offer;
      return {
        label: o.status === 'ready' ? `완료 보고: ${o.def.name}` : o.status === 'active' ? `진행 중: ${o.def.name}` : `수락: ${o.def.name}`,
        color: o.status === 'ready' ? '#7bd88f' : o.status === 'active' ? '#9aa0a6' : '#ffd166',
        onPick: () => {
          if (o.status === 'ready') actions.completeQuest(o.def.id);
          else if (o.status === 'offer') actions.acceptQuest(o.def.id);
          else this.open('quest');
          this.close('dialog');
          if (o.status !== 'active') this.talkTo(npcId);
        },
      };
    });
    const opts = (() => {
      switch (npc.role) {
        case 'quest':
          return [...questOpts, closeOpt];
        case 'shop':
          return [
            {
              label: '거래하기',
              onPick: () => {
                (this.windows.get('shop') as ShopWindow).setNpc(npc);
                this.close('dialog');
                this.open('shop');
              },
            },
            closeOpt,
          ];
        case 'skills':
          return [
            {
              label: '스킬 습득 / 활성화',
              onPick: () => {
                this.close('dialog');
                this.open('skills');
                (this.windows.get('skills') as SkillWindow).setElia(true);
              },
            },
            closeOpt,
          ];
        case 'assault':
          return [
            ...(npc.assaults ?? []).map((id) => this.assaultOption(id)),
            closeOpt,
          ];
        default:
          return [...questOpts, closeOpt];
      }
    })();
    if (npc.role === 'quest' && questOpts.length === 0 && questService.offerable(npcId).length === 0) line = npc.lines[1] ?? line;
    dialog.show(npc, line, opts);
    this.open('dialog');
  }

  private assaultOption(assaultId: string) {
    const a = registry.assault(assaultId);
    const minLevel = balance.assault.entryLevelOverride ?? a.levelRange[0];
    const eligible = gameState.character.level >= minLevel;
    return {
      label: `${a.name} 지원 (Lv.${minLevel}+)`,
      color: eligible ? '#ff9b9b' : '#6b7280',
      onPick: () => {
        if (!eligible) return gameState.message(`레벨 ${minLevel} 이상만 지원할 수 있습니다.`, 'bad');
        this.closeAll();
        gameState.events.emit('startAssault', { assaultId });
      },
    };
  }
}

export type { NpcDef };
