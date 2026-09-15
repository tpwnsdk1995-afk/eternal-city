import Phaser from 'phaser';
import { BootScene } from '../game/scenes/BootScene';
import { TextureGenScene } from '../game/scenes/TextureGenScene';
import { TitleScene } from '../game/scenes/TitleScene';
import { SafeZoneScene } from '../game/scenes/SafeZoneScene';
import { FieldScene } from '../game/scenes/FieldScene';
import { UIScene } from '../game/scenes/UIScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

const params = new URLSearchParams(window.location.search);
const forceCanvas = params.get('renderer') === 'canvas';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: forceCanvas ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#05070a',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: params.has('debug') } },
  fps: { target: 60 },
  scene: [BootScene, TextureGenScene, TitleScene, SafeZoneScene, FieldScene, UIScene],
};
