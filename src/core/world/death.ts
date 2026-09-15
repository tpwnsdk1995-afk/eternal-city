import { balance } from '@data/balance';
import type { CharacterCore } from '../stats/character';

const D = balance.death;

/** Applies the configured death penalty. Items are never dropped unless balance says so (M1: never). */
export function applyDeathPenalty(character: CharacterCore): CharacterCore {
  return {
    ...character,
    won: Math.max(0, character.won - Math.floor(character.won * D.wonLossPct)),
    xp: Math.max(0, character.xp - Math.floor(character.xp * D.xpLossPct)),
  };
}
