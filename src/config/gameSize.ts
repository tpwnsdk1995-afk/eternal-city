// phones (coarse pointer): a smaller logical canvas whose aspect matches the screen, so every UI element
// renders 4/3 larger and the side bars disappear; desktop keeps the original 1280x720
const phone = matchMedia('(pointer: coarse)').matches;
const aspect = Math.max(window.innerWidth, window.innerHeight) / Math.max(1, Math.min(window.innerWidth, window.innerHeight));
export const GAME_HEIGHT = phone ? 540 : 720;
export const GAME_WIDTH = phone ? Math.min(1400, Math.max(960, Math.round((GAME_HEIGHT * aspect) / 2) * 2)) : 1280;
// the canvas is drawn at (about) the screen's physical pixel count, so text stays sharp instead of being
// nearest-neighbour stretched: cameras zoom by RENDER_SCALE, text renders at that resolution, and layout
// code keeps using the logical GAME_WIDTH x GAME_HEIGHT. Pointer x/y arrive in canvas pixels: toLogical().
const shortPx = Math.min(screen.width, screen.height) * (window.devicePixelRatio || 1);
export const RENDER_SCALE = Math.min(3, Math.max(1, Math.round((shortPx / GAME_HEIGHT) * 4) / 4));
export const toLogical = (v: number): number => v / RENDER_SCALE;
/** Zoom a full-screen (non-scrolling) scene camera so logical (0,0)-(GAME_WIDTH,GAME_HEIGHT) fills the canvas. */
export const fitCamera = (cam: { setZoom(z: number): unknown; centerOn(x: number, y: number): unknown }): void => {
  cam.setZoom(RENDER_SCALE);
  cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
};
