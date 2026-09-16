import { MAPS, registry } from '@data/registry';
import * as taxi from '@core/economy/taxi';
import { RACE_NAME, type StatKey } from '@data/schema/enums';
import { allocateStat } from '@core/stats/allocation';
import { statCap } from '@core/stats/levelCurve';
import { getStack, removeQty, removeStack, replaceStack, totalRounds } from '@core/inventory/inventory';
import { moveStack } from '@core/inventory/storage';
import { installPart, plusUp, tryEnhance, tryUnique, weaponLabel, type TuneFail, armorLabel } from '@core/tuning/tuning';
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
import { canTravel, yearDef } from '@core/world/parallel';
import { canRebirth, rebirth } from '@core/stats/rebirth';
import { balance } from '@data/balance';
import { applyBuff, formatRemaining } from '@core/combat/buffs';
import { audio } from '../audio/AudioManager';
import { combineArmor, repair } from '@core/tuning/tuning';
import { donate, foundGuild, renameGuild } from '@core/guild/guild';
import { guildTitle, guildLevel } from '@core/guild/guild';

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
    const r = equipStack(gameState.equipment, gameState.inventory, registry.item, uid, { level: gameState.character.level, techGrade: d.techGrade, race: gameState.character.race });
    if (!r.ok) {
      const why = { notFound: '아이템을 찾을 수 없습니다.', notEquippable: '장착할 수 없는 아이템입니다.', levelTooLow: '레벨이 부족합니다.', techGradeTooLow: '기술등급이 부족합니다.', race: gameState.character.race === 'infected' ? '감염체는 총기를 다룰 수 없습니다. 변이무기만 장착할 수 있습니다.' : '인간은 변이무기를 쓸 수 없습니다.' }[r.reason];
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
    const E = def.effect;
    if (E.enhanceBonusPct) {
      if (gameState.flags.enhanceBonus) return fail('이미 특수 강화권이 적용되어 있습니다. 강화를 먼저 진행하세요.');
      gameState.setFlag('enhanceBonus', E.enhanceBonusPct);
      gameState.setInventory(removeQty(gameState.inventory, uid, 1));
      return done(`${def.name} 사용 — 다음 강화 성공률 +${E.enhanceBonusPct}%`, 'good');
    }
    const v = gameState.vitals;
    gameState.setVitals({ hp: v.hp + (E.hp ?? 0), stamina: v.stamina + (E.stamina ?? 0), ap: v.ap + (E.ap ?? 0) });
    if (E.buff) {
      const b = registry.buff(E.buff);
      gameState.setBuffs(applyBuff(gameState.buffs, b, Date.now()));
      gameState.setVitals({});
      gameState.setInventory(removeQty(gameState.inventory, uid, 1));
      return done(`${b.name} 적용 — ${b.desc} (${formatRemaining(b.durationMs)})`, 'good');
    }
    gameState.setInventory(removeQty(gameState.inventory, uid, 1));
    audio.play('heal');
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
    if (def.race && def.race !== gameState.character.race) return fail(`${RACE_NAME[def.race]} 전용 스킬입니다.`);
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
        year: '조합 차량은 같은 연도 안에서만 다닙니다. 패러렐 시스템을 이용하세요.',
      }[r.reason];
      return fail(why);
    }
    gameState.setCharacter({ ...gameState.character, won: r.won });
    gameState.message(`택시 이동: ${to.name} (₩${r.cost.toLocaleString('ko-KR')})`, 'system');
    audio.play('travel');
    gameState.events.emit('travel', { mapId: to.id, spawn: 'taxi' });
    return { ok: true };
  },

  // --- 구청 보관함 ---------------------------------------------------------------------------

  /** Inventory → 보관함. Equipped gear must be taken off first; stored stacks carry no weight. */
  deposit(uid: string): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    if (gameState.equipment.weaponUid === uid || Object.values(gameState.equipment.armor).includes(uid)) return fail('장착 중인 장비는 먼저 해제하세요.');
    const def = registry.item(stack.itemId);
    if (def.kind === 'misc' && def.quest) return fail('퀘스트 아이템은 보관할 수 없습니다.');
    const r = moveStack(gameState.inventory, gameState.storage, uid, registry.item, balance.storage.slots);
    if (!r.ok) return fail(r.reason === 'full' ? `보관함이 가득 찼습니다 (${balance.storage.slots}칸).` : '아이템을 찾을 수 없습니다.');
    gameState.setInventory(r.from);
    gameState.setStorage(r.to);
    // stored the last box of the selected ammo kind → fall back to 일반탄
    const w = gameState.weapon();
    if (def.kind === 'ammo' && w && gameState.fire.ammoKind === def.ammoKind && totalRounds(r.from, registry.item, w.def.caliber, def.ammoKind) === 0) {
      gameState.setFire(selectAmmoKind(gameState.fire, '일반탄'));
    }
    return done(`${def.name} 보관 (${r.to.items.length}/${balance.storage.slots}칸)`);
  },

  /** 보관함 → inventory, subject to the carry-weight limit. */
  withdraw(uid: string): ActionResult {
    const stack = getStack(gameState.storage, uid);
    if (!stack) return fail('보관함에 그 아이템이 없습니다.');
    const def = registry.item(stack.itemId);
    const r = moveStack(gameState.storage, gameState.inventory, uid, registry.item);
    if (!r.ok) return fail('보관함에 그 아이템이 없습니다.');
    if (totalWeightKg(r.to, registry.item) > gameState.derived().maxWeightKg) return fail('무게 한도를 초과합니다. 다른 물건을 먼저 맡기세요.');
    gameState.setStorage(r.from);
    gameState.setInventory(r.to);
    return done(`${def.name} 꺼냄`);
  },

  // --- 길드 (광진구청 과장) ------------------------------------------------------------------

  foundGuild(name: string): ActionResult {
    const r = foundGuild(gameState.guild, name, gameState.character.won);
    if (!r.ok) return fail({ exists: '이미 길드가 있습니다.', noGuild: '', won: '창설 비용이 부족합니다.', name: '길드 이름은 2~16자여야 합니다.', amount: '' }[r.reason]);
    gameState.setCharacter({ ...gameState.character, won: r.won });
    gameState.setGuild(r.guild);
    audio.play('quest_done');
    return done(`길드 [${r.guild.name}] 창설! 구청이 지원을 시작합니다.`, 'good');
  },

  renameGuild(name: string): ActionResult {
    const r = renameGuild(gameState.guild, name);
    if (!r.ok) return fail(r.reason === 'noGuild' ? '길드가 없습니다.' : '길드 이름은 2~16자여야 합니다.');
    gameState.setGuild(r.guild);
    return done(`길드 이름을 [${r.guild.name}]으로 바꿨습니다.`, 'good');
  },

  donateGuild(amount: number): ActionResult {
    const r = donate(gameState.guild, amount, gameState.character.won);
    if (!r.ok) return fail({ exists: '', noGuild: '길드를 먼저 창설하세요.', won: '₩이 부족합니다.', name: '', amount: '기여 금액이 올바르지 않습니다.' }[r.reason]);
    gameState.setCharacter({ ...gameState.character, won: r.won });
    gameState.setGuild(r.guild);
    if (r.leveledTo) {
      audio.play('level_up');
      return done(`길드 레벨 ${r.leveledTo} 달성 — ${guildTitle(r.leveledTo)}! 경험치·₩·무게·생명 보너스가 올랐습니다.`, 'good');
    }
    return done(`₩${Math.round(amount).toLocaleString('ko-KR')} 기여 (길드 Lv.${guildLevel(r.guild.contributed)})`, 'good');
  },

  // --- 기술상 (tuning) -----------------------------------------------------------------------

  /** 기술상 수리: clears 파손 for ₩. */
  repair(uid: string): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (def.kind !== 'weapon' && def.kind !== 'armor') return fail('수리할 수 없는 아이템입니다.');
    const r = repair(def, stack);
    if (!r.ok) return fail('파손된 장비가 아닙니다.');
    if (gameState.character.won < r.cost) return fail(`수리 비용 ₩${r.cost.toLocaleString('ko-KR')}이 부족합니다.`);
    gameState.setCharacter({ ...gameState.character, won: gameState.character.won - r.cost });
    gameState.setInventory(replaceStack(gameState.inventory, r.stack));
    gameState.setEquipment({ ...gameState.equipment });
    audio.play('enhance_ok');
    return done(`${def.name} 수리 완료`, 'good');
  },


  /** 강화 one level. `rng` is injectable for deterministic e2e. */
  enhance(uid: string, rng: Rng = gameRng): ActionResult {
    const stack = getStack(gameState.inventory, uid);
    if (!stack) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(stack.itemId);
    if (def.kind !== 'weapon') return fail('무기만 강화할 수 있습니다.');
    const bonus = Number(gameState.flags.enhanceBonus ?? 0);
    const r = tryEnhance(def, stack, rng, bonus);
    if (!r.ok) return fail(TUNE_FAIL[r.reason]);
    if (gameState.character.won < r.cost) return fail(`강화 비용 ₩${r.cost.toLocaleString('ko-KR')}이 부족합니다.`);
    if (bonus) gameState.setFlag('enhanceBonus', 0); // the ticket is spent on this attempt
    gameState.setCharacter({ ...gameState.character, won: gameState.character.won - r.cost });
    gameState.setInventory(replaceStack(gameState.inventory, r.stack));
    gameState.setEquipment({ ...gameState.equipment }); // HUD/label refresh
    if (r.success) progressService.recordEnhance(r.stack.enhance ?? 0);
    audio.play(r.success ? 'enhance_ok' : 'enhance_fail');
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

  /** 방어구 조합: `materialUid` is consumed; `rng` injectable for deterministic e2e. */
  combineArmor(uid: string, materialUid: string, rng: Rng = gameRng): ActionResult {
    const a = getStack(gameState.inventory, uid);
    const b = getStack(gameState.inventory, materialUid);
    if (!a || !b) return fail('아이템을 찾을 수 없습니다.');
    const def = registry.item(a.itemId);
    if (def.kind !== 'armor') return fail('방어구만 조합할 수 있습니다.');
    if (Object.values(gameState.equipment.armor).includes(materialUid)) return fail('장착 중인 방어구는 재료로 쓸 수 없습니다.');
    const r = combineArmor(def, a, b, rng);
    if (!r.ok) return fail({ same: '같은 아이템입니다.', mismatch: '같은 종류의 방어구만 조합할 수 있습니다.', maxed: '이미 전설 접두입니다.', notAllowed: '', alreadyInstalled: '', tooLow: '', hasUnique: '', notWeapon: '', notArmor: '' }[r.reason]);
    if (gameState.character.won < r.cost) return fail(`조합 비용 ₩${r.cost.toLocaleString('ko-KR')}이 부족합니다.`);
    gameState.setCharacter({ ...gameState.character, won: gameState.character.won - r.cost });
    gameState.setInventory(replaceStack(removeStack(gameState.inventory, materialUid), r.stack));
    gameState.setEquipment({ ...gameState.equipment });
    audio.play(r.success ? 'enhance_ok' : 'enhance_fail');
    return r.success ? done(`조합 성공! ${armorLabel(def, r.stack)}`, 'good') : fail(`조합 실패… 재료가 소모되었습니다 (${armorLabel(def, r.stack)})`);
  },

  /** 캠페인 챕터 보상 수령 */
  claimCampaign(campaignId: string, chapterId: string): ActionResult {
    return progressService.claimCampaign(campaignId, chapterId);
  },

  /** 환생: level 1 again with a higher stat cap and bonus points; gear, skills and ₩ stay. */
  rebirth(): ActionResult {
    const c = gameState.character;
    const r = canRebirth(c);
    if (!r.ok) return fail(r.reason === 'max' ? `환생은 최대 ${balance.stats.maxRebirth}회까지입니다.` : `환생은 레벨 ${balance.stats.rebirthLevel} 이상에서 할 수 있습니다.`);
    const next = rebirth(c);
    gameState.setCharacter(next);
    const d = gameState.derived();
    gameState.setVitals({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
    gameState.message(`환생 ${next.rebirth}회차 — 레벨 1로 돌아왔습니다. 스탯 상한 ${statCap(next.rebirth)}, 배분 가능 ${next.unspentPoints}pt.`, 'good');
    progressService.check();
    return { ok: true };
  },

  /** 패러렐 시스템: jump to another year's safe-zone hub. */
  travelYear(year: number): ActionResult {
    const here = registry.map(gameState.currentMapId);
    const r = canTravel(year, { flags: gameState.flags, level: gameState.character.level, currentYear: here.year });
    if (!r.ok) {
      const why = { same: '이미 그 연도에 있습니다.', permit: '패러렐 시스템 허가증이 필요합니다. 김훈 소대장을 찾아가세요.', milestone: '아직 그 연도로 갈 조건을 갖추지 못했습니다.', unknown: '알 수 없는 연도입니다.' }[r.reason];
      return fail(why);
    }
    const yd = yearDef(year)!;
    gameState.message(`패러렐 시스템 가동 — ${yd.name}(으)로 이동합니다.`, 'system');
    gameState.events.emit('travel', { mapId: yd.hubMapId, spawn: 'parallel' });
    return { ok: true };
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
