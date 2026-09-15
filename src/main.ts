import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { exposeDebug } from './debug/exposeDebug';

const game = new Phaser.Game(gameConfig);

// Always exposed: this is a personal single-player build and the e2e specs assert on it.
exposeDebug(game);
