import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';

const game = new Phaser.Game(gameConfig);

if (import.meta.env.DEV) {
  import('./debug/exposeDebug').then((m) => m.exposeDebug(game));
}
