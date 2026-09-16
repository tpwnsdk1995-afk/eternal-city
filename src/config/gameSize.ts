// phones (coarse pointer): a smaller logical canvas whose aspect matches the screen, so every UI element
// renders 4/3 larger and the side bars disappear; desktop keeps the original 1280x720
const phone = matchMedia('(pointer: coarse)').matches;
const aspect = Math.max(window.innerWidth, window.innerHeight) / Math.max(1, Math.min(window.innerWidth, window.innerHeight));
export const GAME_HEIGHT = phone ? 540 : 720;
export const GAME_WIDTH = phone ? Math.min(1400, Math.max(960, Math.round((GAME_HEIGHT * aspect) / 2) * 2)) : 1280;
