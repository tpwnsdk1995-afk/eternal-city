import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { exposeDebug } from './debug/exposeDebug';
import { audio } from './game/audio/AudioManager';

const game = new Phaser.Game(gameConfig);
// phones: once fullscreen, pin the screen to landscape (no-op where the browser doesn't allow it)
game.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, () => (screen.orientation as { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => undefined));
// #game centres the canvas with flexbox, which Phaser's DOM-element container (an absolute box the size of the
// canvas in device pixels) knows nothing about: pin it to wherever the canvas actually landed.
const alignDom = (): void => {
  const d = game.domContainer;
  if (!d) return;
  d.style.left = `${game.canvas.offsetLeft}px`;
  d.style.top = `${game.canvas.offsetTop}px`;
};
game.scale.on(Phaser.Scale.Events.RESIZE, alignDom);
window.addEventListener('resize', () => requestAnimationFrame(alignDom));
requestAnimationFrame(alignDom);
audio.init(); // procedural sound; the AudioContext unlocks on the first click/tap/key

// Always exposed: this is a personal single-player build and the e2e specs assert on it.
exposeDebug(game);
