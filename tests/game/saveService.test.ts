import { beforeEach, describe, expect, it } from 'vitest';
import { gameState } from '../../src/game/state/GameState';
import { applySnapshot, saveLocation, saveService, takeSnapshot } from '../../src/game/state/SaveService';
import { actions } from '../../src/game/state/actions';
import { migrateSave } from '@core/save/saveSchema';
import { db } from '../../src/game/state/db';

describe('save/load', () => {
  beforeEach(async () => {
    await db.saves.clear();
    gameState.newGame('세이브테스트');
    saveService.hasCharacter = true;
  });

  it('round-trips character, inventory, equipment, skills and location', async () => {
    actions.allocate('기술', 3);
    gameState.setCharacter({ ...gameState.character, won: 99_000, level: 10 }); // MP5 needs Lv.5
    actions.buy('mp5', 2);
    const mp5 = gameState.inventory.items.find((s) => s.itemId === 'mp5')!;
    actions.equipToggle(mp5.uid);
    actions.learnSkill('skill_pistol_mastery');
    gameState.currentMapId = 'junggok-dong';
    gameState.setVitals({ hp: 50 });

    const row = await saveService.save();
    expect(row.name).toBe('세이브테스트');
    expect(row.mapName).toBe('중곡동 거리');

    gameState.newGame('다른캐릭');
    expect(gameState.weapon()?.def.id).toBe('glock17');

    const loaded = await saveService.load();
    expect(loaded).not.toBeNull();
    expect(gameState.character.name).toBe('세이브테스트');
    expect(gameState.character.base['기술']).toBe(3);
    expect(gameState.weapon()?.def.id).toBe('mp5');
    expect(gameState.weapon()?.grade).toBe(2);
    expect(gameState.skills.learned).toEqual([{ id: 'skill_pistol_mastery', rank: 1 }]);
    expect(gameState.currentMapId).toBe('junggok-dong');
    expect(gameState.vitals.hp).toBe(50);
  });

  it('never saves a location inside an assault map', () => {
    expect(saveLocation('junggok-blockade')).toEqual({ mapId: 'gwangjin-gucheong-parking', spawn: 'default' });
    expect(saveLocation('junggok-dong')).toEqual({ mapId: 'junggok-dong', spawn: 'default' });
  });

  it('rejects corrupt or unknown-version rows', async () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave({ version: 99 })).toBeNull();
    expect(migrateSave({ version: 1, character: {} })).toBeNull();
    expect(migrateSave(takeSnapshot())).not.toBeNull();
    await db.saves.put({ slot: 1, name: 'x', level: 1, mapName: 'x', updatedAt: 0, data: { version: 1 } as never });
    expect(await saveService.peek()).toBeNull();
    expect(await saveService.load()).toBeNull();
  });

  it('applySnapshot clamps vitals to the restored maxima and clears transient status', () => {
    const snap = takeSnapshot();
    snap.vitals = { hp: 9999, stamina: 9999, ap: 9999 };
    applySnapshot(snap);
    const d = gameState.derived();
    expect(gameState.vitals).toEqual({ hp: d.maxHp, stamina: d.maxStamina, ap: d.maxAp });
    expect(gameState.status.burningUntil).toBe(0);
  });
});
