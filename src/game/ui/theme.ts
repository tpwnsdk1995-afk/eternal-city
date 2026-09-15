export const FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

/** Global UI text scale (Esc 메뉴 → 글자 크기). Read at text creation, so windows pick it up on refresh. */
let uiScale = 1;
export const setUiScale = (s: number): void => {
  uiScale = s;
};
export const getUiScale = (): number => uiScale;

export const theme = {
  font: FONT,
  colors: {
    text: '#e5e7eb',
    muted: '#9aa0a6',
    brass: '#c9a227',
    panel: 0x0e1116,
    panelAlpha: 0.94,
    hp: 0xc23b3b,
    stamina: 0x3fa35b,
    ap: 0x3b7bc2,
    xp: 0xc9a227,
    good: '#7bd88f',
    bad: '#ff6b6b',
    system: '#ffd166',
  },
  textStyle: (size: number, color = '#e5e7eb', extra: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): Phaser.Types.GameObjects.Text.TextStyle => ({
    fontFamily: FONT,
    fontSize: `${Math.round(size * uiScale)}px`,
    color,
    ...extra,
  }),
};
