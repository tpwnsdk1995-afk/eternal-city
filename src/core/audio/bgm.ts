/**
 * Procedural BGM: each scene mood is a tempo, a chord loop (MIDI note numbers) and a drum pattern.
 * The Phaser-side AudioManager turns a bar of this into oscillator notes, so the game ships no music
 * files — same rule as the drawn sprites and the synthesised effects.
 */
export type BgmKind = 'none' | 'title' | 'safe' | 'field' | 'assault' | 'boss';

export interface BgmDef {
  bpm: number;
  /** chords as MIDI note arrays; one chord per bar, looping */
  chords: number[][];
  /** bass root per bar (MIDI) */
  bass: number[];
  /** 16-step drum pattern: k = kick, s = snare, h = hat, . = rest (characters stack: "kh") */
  drums: string[];
  /** pad oscillator */
  padType: OscillatorType;
  padGain: number;
  bassGain: number;
  drumGain: number;
  /** optional 8-step arpeggio degrees over the chord (indexes into the chord), empty = none */
  arp: number[];
  arpGain: number;
}

const m = (root: number, kind: 'min' | 'maj' | 'dim' | 'sus'): number[] =>
  kind === 'min' ? [root, root + 3, root + 7] : kind === 'maj' ? [root, root + 4, root + 7] : kind === 'dim' ? [root, root + 3, root + 6] : [root, root + 5, root + 7];

export const BGM: Record<Exclude<BgmKind, 'none'>, BgmDef> = {
  // rain over the skyline: slow, low, minor
  title: {
    bpm: 62,
    chords: [m(45, 'min'), m(41, 'maj'), m(43, 'maj'), m(45, 'min')],
    bass: [33, 29, 31, 33],
    drums: ['................', '................', '................', '................'],
    padType: 'triangle',
    padGain: 0.06,
    bassGain: 0.05,
    drumGain: 0,
    arp: [0, 2, 1, 2],
    arpGain: 0.025,
  },
  // shelter hum: warm and sparse
  safe: {
    bpm: 72,
    chords: [m(48, 'maj'), m(45, 'min'), m(50, 'min'), m(43, 'maj')],
    bass: [36, 33, 38, 31],
    drums: ['h...h...h...h...', 'h...h...h...h...', 'h...h...h...h...', 'h...h...h...h...'],
    padType: 'sine',
    padGain: 0.055,
    bassGain: 0.04,
    drumGain: 0.02,
    arp: [],
    arpGain: 0,
  },
  // streets: tense pulse, minor with a lowered second
  field: {
    bpm: 96,
    chords: [m(43, 'min'), m(43, 'min'), m(44, 'maj'), m(41, 'min')],
    bass: [31, 31, 32, 29],
    drums: ['k.h.s.h.k.h.s.h.', 'k.h.s.h.k.h.s.hh', 'k.h.s.h.k.h.s.h.', 'k.h.s.h.k.k.s.hh'],
    padType: 'sawtooth',
    padGain: 0.03,
    bassGain: 0.06,
    drumGain: 0.05,
    arp: [0, 0, 2, 0, 1, 0, 2, 2],
    arpGain: 0.02,
  },
  // instance: driving
  assault: {
    bpm: 128,
    chords: [m(40, 'min'), m(40, 'min'), m(46, 'min'), m(43, 'maj')],
    bass: [28, 28, 34, 31],
    drums: ['k.hhs.hhk.hhs.hh', 'k.hhs.hhk.hhs.hh', 'k.hhs.hhk.hhs.hh', 'kkhhs.hhk.hhssss'],
    padType: 'sawtooth',
    padGain: 0.035,
    bassGain: 0.075,
    drumGain: 0.07,
    arp: [0, 2, 1, 2, 0, 2, 1, 2],
    arpGain: 0.028,
  },
  // boss: fast, diminished tension
  boss: {
    bpm: 150,
    chords: [m(38, 'dim'), m(38, 'dim'), m(44, 'min'), m(37, 'dim')],
    bass: [26, 26, 32, 25],
    drums: ['k.hks.hkk.hks.hk', 'k.hks.hkk.hks.hk', 'kkhks.hkk.hks.ss', 'kkhkskhkkkhksshh'],
    padType: 'square',
    padGain: 0.025,
    bassGain: 0.08,
    drumGain: 0.08,
    arp: [0, 1, 2, 1, 0, 1, 2, 2],
    arpGain: 0.03,
  },
};

export const midiHz = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);

/** Steps per bar (16ths) and the duration of one step in seconds. */
export const stepSeconds = (bpm: number): number => 60 / bpm / 4;

/** Scene → mood. Assault scenes switch to 'boss' while a boss bar is showing. */
export function bgmForScene(sceneKey: string, bossUp = false): BgmKind {
  switch (sceneKey) {
    case 'Title':
    case 'CharacterCreate':
      return 'title';
    case 'SafeZone':
      return 'safe';
    case 'Field':
      return 'field';
    case 'Assault':
      return bossUp ? 'boss' : 'assault';
    default:
      return 'none';
  }
}
