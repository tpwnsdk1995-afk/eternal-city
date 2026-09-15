import { registry } from '@data/registry';
import type { StatKey } from '@data/schema/enums';
import { allocateStat } from '@core/stats/allocation';
import { statCap } from '@core/stats/levelCurve';
import { getStack, removeQty, totalRounds } from '@core/inventory/inventory';
import { equipStack, pruneEquipment, unequipArmor, unequipWeapon } from '@core/inventory/equipment';
import { totalWeightKg } from '@core/inventory/weight';
import { isAmmoCompatible, selectAmmoKind } from '@core/weapons/fireController';
import { learnOrRankUp, toggleActive } from '@core/skills/skillState';
import { buy, sell } from '@core/economy/shop';
import { gameState } from './GameState';

export interface ActionResult {
  ok: boolean;
  message?: string;
}

const fail = (message: string): ActionResult => {
  gameState.message(message, 'bad');
  return { ok: false, message };
};
const done = (message?: string, tone: 'info' | 'good' | 'system' = 'info'): ActionResult => {
  if (message) gameState.message(message, tone);
  return { ok: true, message };
};

/**
 * Player-initiated state changes shared by the UI windows and the debug hook, so every path goes
 * through the same validated core logic.
 */
export const actions = {
  /** Equip a weapon/armor stack, or unequip it if it is already worn. */
  equipToggle(uid: string): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (gameState.equipment.weaponUid === uid) {
      gameState.setEquipment(unequipWeapon(gameState.equipment));
      return done(`${def.name} 장착 해제`);
    }
    if (def.kind === 'armor' && gameState.equipment.armor[def.slot] === uid) {
      gameState.setEquipment(unequipArmor(gameState.equipment, def.slot));
      return done(`${def.name} 장착 해제`);
    }
    const d = gameState.derived();
    const r = equipStack(gameState.equipment, gameState.inventory, registry.item, uid, { level: gameState.character.level, techGrade: d.techGrade });
    if (!r.ok) {
      const why = { notFound: '아이템을 찾을 수 없습니다.', notEquippable: '장착할 수 없는 아이템입니다.', levelTooLow: '레벨이 부족합니다.', techGradeTooLow: '기술등급이 부족합니다.' }[r.reason];
      return fail(why);
    }
    gameState.setEquipment(r.equipment);
    gameState.setVitals({}); // max HP etc. may change with armour mods
    return done(`${def.name} 장착`);
  },

  /** Consume one unit of a consumable stack. */
  use(uid: string): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (def.kind !== 'consumable') return fail('사용할 수 없는 아이템입니다.');
    const v = gameState.vitals;
    gameState.setVitals({ hp: v.hp + (def.effect.hp ?? 0), stamina: v.stamina + (def.effect.stamina ?? 0), ap: v.ap + (def.effect.ap ?? 0) });
    gameState.setInventory(removeQty(gameState.inventory, uid, 1));
    return done(`${def.name} 사용`, 'good');
  },

  /** Select the ammo kind of this box for the equipped weapon. */
  selectAmmo(uid: string): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (def.kind !== 'ammo') return fail('탄약이 아닙니다.');
    const w = gameState.weapon();
    if (!w) return fail('무기를 먼저 장착하세요.');
    if (w.def.caliber !== def.caliber) return fail(`${w.def.name}은(는) ${w.def.caliber} 탄을 사용합니다.`);
    if (!isAmmoCompatible(w.def, def.ammoKind)) return fail(`${w.def.name}에는 ${def.ammoKind}을 사용할 수 없습니다.`);
    gameState.setFire(selectAmmoKind(gameState.fire, def.ammoKind));
    return done(`${def.ammoKind} 선택`);
  },

  allocate(stat: StatKey, n = 1): ActionResult {
    const r = allocateStat(gameState.character, stat, n);
    if (!r.ok) {
      const why = { noPoints: '배분할 스탯 포인트가 없습니다.', capReached: `${stat}은(는) 상한(${statCap(gameState.character.rebirth)})에 도달했습니다.`, invalid: '잘못된 요청입니다.' }[r.reason];
      return fail(why);
    }
    gameState.setCharacter(r.character);
    gameState.setVitals({});
    return { ok: true };
  },

  buy(itemId: string, grade?: number): ActionResult {
    const def = registry.item(itemId);
    const r = buy(gameState.inventory, gameState.character.won, def, registry.item, grade);
    if (!r.ok) return fail(r.reason === 'noMoney' ? '₩이 부족합니다.' : '판매하지 않는 등급입니다.');
    if (totalWeightKg(r.inv, registry.item) > gameState.derived().maxWeightKg) return fail('무게 한도를 초과합니다.');
    gameState.setInventory(r.inv);
    gameState.setCharacter({ ...gameState.character, won: r.won });
    return done(`${def.name}${def.kind === 'weapon' ? ` [${grade ?? def.gradeMin}등급]` : ''} 구매 (₩${r.cost.toLocaleString('ko-KR')})`, 'good');
  },

  sell(uid: string): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    const r = sell(gameState.inventory, gameState.character.won, uid, registry.item);
    if (!r.ok) return fail('아이템을 찾을 수 없습니다.');
    gameState.setInventory(r.inv);
    gameState.setEquipment(pruneEquipment(gameState.equipment, r.inv));
    gameState.setCharacter({ ...gameState.character, won: r.won });
    // sold the last box of the selected ammo kind → fall back to 일반탄
    const w = gameState.weapon();
    if (def.kind === 'ammo' && w && gameState.fire.ammoKind === def.ammoKind && totalRounds(r.inv, registry.item, w.def.caliber, def.ammoKind) === 0) {
      gameState.setFire(selectAmmoKind(gameState.fire, '일반탄'));
    }
    return done(`${def.name} 판매 (+₩${r.gained.toLocaleString('ko-KR')})`, 'good');
  },

  learnSkill(id: string): ActionResult {
    const def = registry.skill(id);
    const r = learnOrRankUp(gameState.skills, def, { techGrade: gameState.derived().techGrade, won: gameState.character.won });
    if (!r.ok) {
      const why = { techGradeTooLow: `기술등급 ${def.reqTechGrade} 이상이 필요합니다.`, maxRank: '이미 최대 랭크입니다.', noMoney: '₩이 부족합니다.' }[r.reason];
      return fail(why);
    }
    gameState.setSkills(r.state);
    gameState.setCharacter({ ...gameState.character, won: gameState.character.won - r.cost });
    gameState.setVitals({});
    return done(`${def.name} 습득 (₩${r.cost.toLocaleString('ko-KR')})`, 'good');
  },

  toggleSkill(id: string): ActionResult {
    const def = registry.skill(id);
    const r = toggleActive(gameState.skills, def, registry.skill, gameState.derived().techGrade);
    if (!r.ok) return fail(r.reason === 'notLearned' ? '먼저 습득해야 합니다.' : '활성 스킬의 기술등급 합이 내 기술등급을 넘습니다.');
    gameState.setSkills(r.state);
    gameState.setVitals({});
    return done(`${def.name} ${r.nowActive ? '활성화' : '비활성화'}`);
  },
};

export type Actions = typeof actions;
