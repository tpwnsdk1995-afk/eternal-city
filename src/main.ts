import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { exposeDebug } from './debug/exposeDebug';
import { audio } from './game/audio/AudioManager';

const game = new Phaser.Game(gameConfig);
audio.init(); // procedural sound; the AudioContext unlocks on the first click/tap/key

// Always exposed: this is a personal single-player build and the e2e specs assert on it.
exposeDebug(game);
