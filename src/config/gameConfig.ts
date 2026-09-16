import Phaser from 'phaser';
import { BootScene } from '../game/scenes/BootScene';
import { TextureGenScene } from '../game/scenes/TextureGenScene';
import { TitleScene } from '../game/scenes/TitleScene';
import { CharacterCreateScene } from '../game/scenes/CharacterCreateScene';
import { SafeZoneScene } from '../game/scenes/SafeZoneScene';
import { FieldScene } from '../game/scenes/FieldScene';
import { AssaultScene } from '../game/scenes/AssaultScene';
import { UIScene } from '../game/scenes/UIScene';
import { GAME_HEIGHT, GAME_WIDTH } from './gameSize';

export { GAME_WIDTH, GAME_HEIGHT } from './gameSize';

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
  // the page's flex container centres the canvas; Phaser's own centring would add its margins on top
  // and push the canvas to the bottom of tall (portrait phone) viewports
  // fullscreen the #game div itself (not Phaser's own wrapper), so the same flex centring applies in fullscreen
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER, fullscreenTarget: 'game' },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: params.has('debug') } },
  fps: { target: 60 },
  dom: { createContainer: true },
  // stick + fire + one action button at once on phones
  input: { activePointers: 3 },
  scene: [BootScene, TextureGenScene, TitleScene, CharacterCreateScene, SafeZoneScene, FieldScene, AssaultScene, UIScene],
};
