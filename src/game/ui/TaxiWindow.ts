import type Phaser from 'phaser';
import { MAPS, registry } from '@data/registry';
import { fareFor, hasTaxiStop, isRegistered, portalHops, TAXI_REGISTER_FEE } from '@core/economy/taxi';
import { gameState } from '../state/GameState';
import { actions } from '../state/actions';
import { Window } from './Window';
import { ListView, type ListRow } from './ListView';
import { theme } from './theme';

/** 운송조합원 — register the local stand, ride to any other registered stand. */
export class TaxiWindow extends Window {
  private rows: ListView;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, 'taxi', x, y, 520, 460, '운송조합 택시');
    this.rows = new ListView(scene, 12, 70, this.w - 24, 42, 7);
    this.content.add(this.rows);
    this.refresh();
  }

  refresh(): void {
    this.content.remove(this.rows);
    this.clearBody();
    this.content.add(this.rows);
    const here = registry.map(gameState.currentMapId);
    const registeredHere = isRegistered(gameState.flags, here.id);
    this.label(14, 4, `현재 위치: ${here.name}`, '#ffffff', 14, { fontStyle: 'bold' });
    this.label(this.w - 14, 6, `₩ ${gameState.character.won.toLocaleString('ko-KR')}`, theme.colors.brass, 13).setOrigin(1, 0);
    if (registeredHere) this.label(14, 26, '이 정류장은 등록되어 있습니다. 목적지를 선택하세요.', theme.colors.good, 12);
    else {
      this.label(14, 26, `정류장 등록비 ₩${TAXI_REGISTER_FEE.toLocaleString('ko-KR')} — 등록해야 이곳에서 타고 내릴 수 있습니다.`, theme.colors.muted, 12);
      this.button(14, 44, `이곳 정류장 등록 (₩${TAXI_REGISTER_FEE.toLocaleString('ko-KR')})`, () => actions.taxiRegister(), theme.colors.good, 13);
    }

    const rows: ListRow[] = MAPS.filter((m) => hasTaxiStop(m) && m.id !== here.id && m.year === here.year).map((m) => {
      const reg = isRegistered(gameState.flags, m.id);
      const fare = fareFor(portalHops(MAPS, here.id, m.id));
      const lvl = m.levelRange ? ` · Lv.${m.levelRange[0]}~${m.levelRange[1]}` : '';
      return {
        id: m.id,
        text: m.name,
        sub: reg ? `${m.year}년${lvl}` : `미등록 — 직접 방문해 등록해야 갈 수 있습니다${lvl}`,
        right: reg ? `₩${fare.toLocaleString('ko-KR')}` : '미등록',
        rightColor: reg ? (gameState.character.won >= fare ? theme.colors.brass : theme.colors.bad) : '#6b7280',
        disabled: !reg || !registeredHere,
        onClick: () => actions.taxiRide(m.id),
      };
    });
    this.rows.setRows(rows);
  }
}
