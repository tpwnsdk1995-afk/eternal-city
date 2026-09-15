import type { WeaponClass } from '@data/schema/enums';

/** Every one-shot the game can trigger. The synth recipe for each lives in the Phaser-side AudioManager. */
export const SFX_NAMES = [
  'shot',
  'swing',
  'launch',
  'explode',
  'hit_flesh',
  'hit_crit',
  'hit_wall',
  'enemy_die',
  'enemy_shot',
  'enemy_leap',
  'player_hurt',
  'player_die',
  'consciousness',
  'level_up',
  'pickup_won',
  'pickup_item',
  'ui_open',
  'ui_close',
  'ui_click',
  'quest_done',
  'assault_success',
  'assault_fail',
  'jump',
  'no_ammo',
  'heal',
  'enhance_ok',
  'enhance_fail',
  'travel',
] as const;
export type SfxName = (typeof SFX_NAMES)[number];

export type AmbientKind = 'none' | 'rain' | 'safe' | 'field' | 'dark';

/** Per-class gunshot recipe: a filtered noise crack plus a low thump. Times in ms, gain 0..1. */
export interface GunProfile {
  kind: 'gun' | 'swing' | 'launch' | 'claws';
  noiseMs: number;
  lowpassHz: number;
  thumpHz: number;
  thumpMs: number;
  gain: number;
}

export const GUN_PROFILES: Record<WeaponClass, GunProfile> = {
  권총: { kind: 'gun', noiseMs: 90, lowpassHz: 3600, thumpHz: 170, thumpMs: 70, gain: 0.5 },
  기관단총: { kind: 'gun', noiseMs: 70, lowpassHz: 3200, thumpHz: 150, thumpMs: 55, gain: 0.42 },
  돌격소총: { kind: 'gun', noiseMs: 110, lowpassHz: 2800, thumpHz: 125, thumpMs: 90, gain: 0.58 },
  산탄총: { kind: 'gun', noiseMs: 230, lowpassHz: 1500, thumpHz: 80, thumpMs: 170, gain: 0.85 },
  저격소총: { kind: 'gun', noiseMs: 260, lowpassHz: 4200, thumpHz: 95, thumpMs: 210, gain: 0.85 },
  기관총: { kind: 'gun', noiseMs: 100, lowpassHz: 2200, thumpHz: 110, thumpMs: 90, gain: 0.52 },
  근접무기: { kind: 'swing', noiseMs: 160, lowpassHz: 900, thumpHz: 0, thumpMs: 0, gain: 0.32 },
  투척중화기: { kind: 'launch', noiseMs: 220, lowpassHz: 1200, thumpHz: 300, thumpMs: 220, gain: 0.55 },
  변이무기: { kind: 'claws', noiseMs: 130, lowpassHz: 1800, thumpHz: 220, thumpMs: 110, gain: 0.4 },
};

/** Sub-fire (Ctrl) is a lighter, quicker report. */
export function subFireProfile(p: GunProfile): GunProfile {
  return { ...p, gain: p.gain * 0.7, noiseMs: Math.round(p.noiseMs * 0.8) };
}

/** Distance → gain for sounds that happen away from the player (enemy deaths, shots). */
export function spatialGain(distPx: number, full = 140, silent = 760): number {
  if (distPx <= full) return 1;
  if (distPx >= silent) return 0.12;
  return 1 - ((distPx - full) / (silent - full)) * 0.88;
}

/** Minimum gap between two plays of the same sound, so a shotgun's pellets or a burst don't stack into a click wall. */
export const SFX_MIN_GAP_MS: Partial<Record<SfxName, number>> = {
  hit_flesh: 35,
  hit_crit: 35,
  hit_wall: 40,
  enemy_die: 60,
  enemy_shot: 40,
  no_ammo: 350,
  ui_open: 60,
  ui_close: 60,
  pickup_won: 50,
  pickup_item: 50,
};

/** Map → ambient bed. */
export function ambientForMap(opts: { safe: boolean; dark?: boolean }): AmbientKind {
  if (opts.safe) return 'safe';
  return opts.dark ? 'dark' : 'field';
}
