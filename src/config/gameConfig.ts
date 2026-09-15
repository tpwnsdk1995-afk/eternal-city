import Phaser from 'phaser';
import { BootScene } from '../game/scenes/BootScene';
import { TitleScene } from '../game/scenes/TitleScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

const params = new URLSearchParams(window.location.search);
const forceCanvas = params.get('renderer') === 'canvas';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: forceCanvas ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: params.has('debug') } },
  fps: { target: 60 },
  scene: [BootScene, TitleScene],
};
