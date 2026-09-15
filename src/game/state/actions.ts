import { MAPS, registry } from '@data/registry';
import * as taxi from '@core/economy/taxi';
import type { StatKey } from '@data/schema/enums';
import { allocateStat } from '@core/stats/allocation';
import { statCap } from '@core/stats/levelCurve';
import { getStack, removeQty, replaceStack, totalRounds } from '@core/inventory/inventory';
import { installPart, plusUp, tryEnhance, tryUnique, weaponLabel, type TuneFail } from '@core/tuning/tuning';
import type { PartId } from '@data/schema/tuning';
import { PARTS, UNIQUES } from '@data/tuning';
import { gameRng, type Rng } from '@core/rng';
import { equipStack, pruneEquipment, unequipArmor, unequipWeapon } from '@core/inventory/equipment';
import { totalWeightKg } from '@core/inventory/weight';
import { defaultAmmoKind, isAmmoCompatible, selectAmmoKind } from '@core/weapons/fireController';
import { learnOrRankUp, toggleActive } from '@core/skills/skillState';
import { buy, sell } from '@core/economy/shop';
import { gameState } from './GameState';
import { questService } from './questService';
import { progressService } from './progressService';

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
    if (def.kind === 'weapon') {
      const kind = defaultAmmoKind(def, gameState.inventory, registry.item, gameState.fire.ammoKind);
      if (kind !== gameState.fire.ammoKind) gameState.setFire(selectAmmoKind(gameState.fire, kind));
    }
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
    if (!r.ok) return fail(r.reason === 'unsellable' ? '판매할 수 없는 아이템입니다.' : '아이템을 찾을 수 없습니다.');
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

  /** Register the current map's taxi stand. */
  taxiRegister(): ActionResult {
    const def = registry.map(gameState.currentMapId);
    const r = taxi.register(def, gameState.flags, gameState.character.won);
    if (!r.ok) return fail({ already: '이미 등록된 정류장입니다.', noMoney: `등록비 ₩${taxi.TAXI_REGISTER_FEE.toLocaleString('ko-KR')}이 부족합니다.`, noStop: '이 지역에는 정류장이 없습니다.' }[r.reason]);
    gameState.setCharacter({ ...gameState.character, won: r.won });
    gameState.setFlag(taxi.taxiFlag(def.id), true);
    return done(`${def.name} 정류장 등록 (₩${taxi.TAXI_REGISTER_FEE.toLocaleString('ko-KR')})`, 'good');
  },

  /** Pay the fare and travel to a registered stop. */
  taxiRide(mapId: string): ActionResult {
    const to = registry.map(mapId);
    const r = taxi.ride(MAPS, gameState.flags, gameState.character.won, gameState.currentMapId, to, gameState.character.level);
    if (!r.ok) {
      const why = {
        sameMap: '지금 있는 곳입니다.',
        notRegistered: `${to.name} 정류장에 아직 등록하지 않았습니다. 직접 가서 등록하세요.`,
        hereNotRegistered: '먼저 이곳 정류장에 등록해야 합니다.',
        noMoney: '요금이 부족합니다.',
        noStop: '그곳에는 정류장이 없습니다.',
        level: `${to.name}은(는) 레벨 ${to.levelRange?.[0]} 권장 지역입니다. 조합원이 태워 주지 않습니다.`,
      }[r.reason];
      return fail(why);
    }
    gameState.setCharacter({ ...gameState.character, won: r.won });
    gameState.message(`택시 이동: ${to.name} (₩${r.cost.toLocaleString('ko-KR')})`, 'system');
    gameState.events.emit('travel', { mapId: to.id, spawn: 'taxi' });
    return { ok: true };
  },

  // --- 기술상 (tuning) -----------------------------------------------------------------------

  /** 강화 one level. `rng` is injectable for deterministic e2e. */
  enhance(uid: string, rng: Rng = gameRng): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (def.kind !== 'weapon') return fail('무기만 강화할 수 있습니다.');
    const r = tryEnhance(def, stack, rng);
    if (!r.ok) return fail(TUNE_FAIL[r.reason]);
    if (gameState.character.won < r.cost) return fail(`강화 비용 ₩${r.cost.toLocaleString('ko-KR')}이 부족합니다.`);
    gameState.setCharacter({ ...gameState.character, won: gameState.character.won - r.cost });
    gameState.setInventory(replaceStack(gameState.inventory, r.stack));
    gameState.setEquipment({ ...gameState.equipment }); // HUD/label refresh
    if (r.success) progressService.recordEnhance(r.stack.enhance ?? 0);
    return r.success ? done(`강화 성공! ${weaponLabel(def, r.stack)}`, 'good') : fail(`강화 실패… ${weaponLabel(def, r.stack)} (−₩${r.cost.toLocaleString('ko-KR')})`);
  },

  installPart(uid: string, part: PartId): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (def.kind !== 'weapon') return fail('무기만 개조할 수 있습니다.');
    const r = installPart(def, stack, part);
    if (!r.ok) return fail(TUNE_FAIL[r.reason]);
    if (gameState.character.won < r.cost) return fail(`개조 비용 ₩${r.cost.toLocaleString('ko-KR')}이 부족합니다.`);
    gameState.setCharacter({ ...gameState.character, won: gameState.character.won - r.cost });
    gameState.setInventory(replaceStack(gameState.inventory, r.stack));
    gameState.setEquipment({ ...gameState.equipment });
    return done(`${PARTS[part].name} 장착 — ${PARTS[part].desc}`, 'good');
  },

  uniqueTune(uid: string, rng: Rng = gameRng): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (def.kind !== 'weapon') return fail('무기만 개조할 수 있습니다.');
    const r = tryUnique(def, stack, rng);
    if (!r.ok) return fail(TUNE_FAIL[r.reason]);
    if (gameState.character.won < r.cost) return fail(`유니크 개조 비용 ₩${r.cost.toLocaleString('ko-KR')}이 부족합니다.`);
    gameState.setCharacter({ ...gameState.character, won: gameState.character.won - r.cost });
    gameState.setInventory(replaceStack(gameState.inventory, r.stack));
    gameState.setEquipment({ ...gameState.equipment });
    return r.success && r.unique ? done(`유니크 개조 성공! [${UNIQUES[r.unique].name}] — ${UNIQUES[r.unique].desc}`, 'good') : fail(`유니크 개조 실패… (−₩${r.cost.toLocaleString('ko-KR')})`);
  },

  plusUp(uid: string): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (def.kind !== 'armor') return fail('방어구만 플러스업할 수 있습니다.');
    const r = plusUp(def, stack);
    if (!r.ok) return fail(TUNE_FAIL[r.reason]);
    if (gameState.character.won < r.cost) return fail(`플러스업 비용 ₩${r.cost.toLocaleString('ko-KR')}이 부족합니다.`);
    gameState.setCharacter({ ...gameState.character, won: gameState.character.won - r.cost });
    gameState.setInventory(replaceStack(gameState.inventory, r.stack));
    gameState.setEquipment({ ...gameState.equipment });
    return done(`플러스업 성공! ${def.name} +${r.stack.plusUp}`, 'good');
  },

  /** 캠페인 챕터 보상 수령 */
  claimCampaign(campaignId: string, chapterId: string): ActionResult {
    return progressService.claimCampaign(campaignId, chapterId);
  },

  acceptQuest(id: string): ActionResult {
    return questService.accept(id);
  },

  completeQuest(id: string): ActionResult {
    return questService.complete(id);
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

const TUNE_FAIL: Record<TuneFail, string> = {
  maxed: '이미 최대치입니다.',
  notAllowed: '이 무기에는 장착할 수 없는 부품입니다.',
  alreadyInstalled: '이미 장착된 부품입니다.',
  tooLow: '유니크 개조는 +7 이상부터 가능합니다.',
  hasUnique: '이미 유니크 개조가 된 무기입니다.',
  notWeapon: '무기가 아닙니다.',
  notArmor: '방어구가 아닙니다.',
};

export type Actions = typeof actions;
