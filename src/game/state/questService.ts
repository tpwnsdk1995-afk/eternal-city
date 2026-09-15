import { registry } from '@data/registry';
import type { MonsterDef } from '@data/schema/monster';
import type { QuestDef } from '@data/schema/quest';
import { accept, canAccept, complete, isActive, isCompleted, isReadyToComplete, onKill, onReach, onTalk, syncCollect } from '@core/quest/questState';
import { addItem, countItem, removeItemQty } from '@core/inventory/inventory';
import { applyXp } from '@core/world/xp';
import { gameState } from './GameState';
import type { ActionResult } from './actions';

function announce(changed: { questId: string; stepIndex: number }[]): void {
  for (const c of changed) {
    const def = registry.quest(c.questId);
    if (isReadyToComplete(gameState.quests, def)) gameState.message(`[퀘스트] ${def.name} — 목표 달성! ${registry.npc(def.giver).name}에게 보고하세요.`, 'good');
  }
}

/** Quest progression hooks called by the world/combat layer, plus accept/complete used by dialogs. */
export const questService = {
  offerable(npcId: string): { def: QuestDef; status: 'offer' | 'active' | 'ready' }[] {
    const npc = registry.npc(npcId);
    const out: { def: QuestDef; status: 'offer' | 'active' | 'ready' }[] = [];
    for (const id of npc.quests ?? []) {
      const def = registry.quest(id);
      if (isCompleted(gameState.quests, id)) continue;
      if (isActive(gameState.quests, id)) out.push({ def, status: isReadyToComplete(gameState.quests, def) ? 'ready' : 'active' });
      else if (canAccept(gameState.quests, def, { level: gameState.character.level, flags: gameState.flags }).ok) out.push({ def, status: 'offer' });
    }
    return out;
  },

  accept(questId: string): ActionResult {
    const def = registry.quest(questId);
    const r = canAccept(gameState.quests, def, { level: gameState.character.level, flags: gameState.flags });
    if (!r.ok) {
      const why = { active: '이미 진행 중인 퀘스트입니다.', completed: '이미 완료한 퀘스트입니다.', level: `레벨 ${def.prereq?.level} 이상이 필요합니다.`, flags: '조건을 만족하지 않습니다.', quests: '선행 퀘스트를 먼저 완료해야 합니다.' }[r.reason];
      gameState.message(why, 'bad');
      return { ok: false, message: why };
    }
    let next = accept(gameState.quests, def);
    // steps that may already be satisfied (held items, current map)
    for (const st of def.steps) {
      if (st.kind === 'collect') next = syncCollect(next, registry.quest, st.itemId, countItem(gameState.inventory, st.itemId)).state;
      if (st.kind === 'reach' && st.mapId === gameState.currentMapId) next = onReach(next, registry.quest, st.mapId).state;
    }
    gameState.setQuests(next);
    gameState.message(`[퀘스트 수락] ${def.name}`, 'system');
    return { ok: true };
  },

  complete(questId: string): ActionResult {
    const def = registry.quest(questId);
    if (!isReadyToComplete(gameState.quests, def)) {
      gameState.message('아직 목표를 달성하지 않았습니다.', 'bad');
      return { ok: false, message: 'notReady' };
    }
    let inv = gameState.inventory;
    for (const c of def.consumes ?? []) inv = removeItemQty(inv, c.itemId, c.qty);
    for (const it of def.rewards.items ?? []) inv = addItem(inv, registry.item(it.itemId), it.qty);
    gameState.setInventory(inv);
    const xr = applyXp({ ...gameState.character, won: gameState.character.won + def.rewards.won }, def.rewards.xp);
    gameState.setCharacter(xr.character);
    if (xr.levelUps.length) {
      const d = gameState.derived();
      gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
      gameState.message(`레벨 업! Lv.${xr.character.level}`, 'good');
    }
    for (const f of def.rewards.flags ?? []) gameState.setFlag(f, true);
    gameState.setQuests(complete(gameState.quests, def));
    const rewardText = [`₩${def.rewards.won.toLocaleString('ko-KR')}`, `${def.rewards.xp} XP`, ...(def.rewards.items ?? []).map((i) => `${registry.item(i.itemId).name} ×${i.qty}`)].join(' · ');
    gameState.message(`[퀘스트 완료] ${def.name} — ${rewardText}`, 'good');
    if (def.rewards.flags?.includes('parallelPermit')) gameState.message('패러렐 시스템 허가증을 획득했습니다!', 'good');
    return { ok: true };
  },

  onKill(monster: MonsterDef): void {
    if (!gameState.quests.active.length) return;
    const r = onKill(gameState.quests, registry.quest, monster);
    if (r.changed.length) {
      gameState.setQuests(r.state);
      announce(r.changed);
    }
  },

  /** Call after any inventory change touching quest-relevant items. */
  syncCollect(itemId: string): void {
    if (!gameState.quests.active.length) return;
    const r = syncCollect(gameState.quests, registry.quest, itemId, countItem(gameState.inventory, itemId));
    if (r.changed.length) {
      gameState.setQuests(r.state);
      announce(r.changed);
    }
  },

  onTalk(npcId: string): void {
    if (!gameState.quests.active.length) return;
    const r = onTalk(gameState.quests, registry.quest, npcId);
    if (r.changed.length) {
      gameState.setQuests(r.state);
      announce(r.changed);
    }
  },

  onReach(mapId: string): void {
    if (!gameState.quests.active.length) return;
    const r = onReach(gameState.quests, registry.quest, mapId);
    if (r.changed.length) {
      gameState.setQuests(r.state);
      announce(r.changed);
    }
  },
};
