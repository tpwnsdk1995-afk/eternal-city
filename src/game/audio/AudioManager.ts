import type { WeaponClass } from '@data/schema/enums';
import { GUN_PROFILES, SFX_MIN_GAP_MS, spatialGain, subFireProfile, type AmbientKind, type GunProfile, type SfxName } from '@core/audio/sfx';
import { BGM, midiHz, stepSeconds, type BgmKind } from '@core/audio/bgm';
import { gameState } from '../state/GameState';
import { SFX_OVERRIDES } from '@data/artOverrides';

const RECENT_CAP = 60;
const NOISE_SECONDS = 2;

interface NoiseOpts {
  ms: number;
  gain: number;
  lowpass?: number;
  highpass?: number;
  bandpass?: number;
  /** sweep the lowpass/bandpass frequency to this value over the burst */
  sweepTo?: number;
  delayMs?: number;
  attackMs?: number;
}

interface ToneOpts {
  ms: number;
  gain: number;
  type?: OscillatorType;
  slideTo?: number;
  delayMs?: number;
  attackMs?: number;
}

/**
 * Procedural sound: every effect is synthesised from noise bursts and oscillators, so the game
 * ships no audio files (same philosophy as the code-drawn sprites). The AudioContext is created
 * on the first user gesture (mobile autoplay rules); until then plays are recorded but silent.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  bgmKind: BgmKind = 'none';
  private bgmTimer: ReturnType<typeof setInterval> | null = null;
  private bgmStep = 0;
  private bgmNextAt = 0;
  private bgmNodes: { stop(): void }[] = [];
  private noiseBuf: AudioBuffer | null = null;
  private samples = new Map<string, AudioBuffer>();
  private ambientNodes: { stop(): void }[] = [];
  private ambientTimer: ReturnType<typeof setInterval> | null = null;
  ambientKind: AmbientKind = 'none';
  private lastAt = new Map<string, number>();
  /** Names of the most recent plays, newest last (debug/e2e — recorded even while silent). */
  readonly recent: string[] = [];
  unlocked = false;
  private inited = false;

  /** Hook gesture listeners + settings. Idempotent. */
  init(): void {
    if (this.inited || typeof window === 'undefined') return;
    this.inited = true;
    const unlock = () => {
      const ctx = this.ensure();
      if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
      if (ctx) {
        this.unlocked = true;
        if (this.ambientKind !== 'none') this.startAmbient(this.ambientKind);
        if (this.bgmKind !== 'none') this.startBgm();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    gameState.events.on('settings', () => this.applySettings());
    // boss bar up → boss mood, down → back to the assault mood
    gameState.events.on('assault', (hud) => {
      if (this.bgmKind === 'assault' && hud?.boss) this.bgm('boss');
      else if (this.bgmKind === 'boss' && hud && !hud.boss) this.bgm('assault');
    });
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend().catch(() => undefined);
      else void this.ctx.resume().catch(() => undefined);
    });
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      return null;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.ambBus = ctx.createGain();
    this.bgmBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.ambBus.connect(this.master);
    this.bgmBus.connect(this.master);
    this.master.connect(ctx.destination);
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    for (const [name, url] of Object.entries(SFX_OVERRIDES)) {
      fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((s) => this.samples.set(name, s)).catch(() => undefined);
    }
    this.applySettings();
    return ctx;
  }

  private applySettings(): void {
    if (!this.ctx || !this.master || !this.sfxBus || !this.ambBus) return;
    const s = gameState.settings;
    this.master.gain.value = Math.max(0, Math.min(1, s.soundVolume));
    this.sfxBus.gain.value = s.sfxOn ? 1 : 0;
    this.ambBus.gain.value = s.ambientOn ? 1 : 0;
    if (this.bgmBus) this.bgmBus.gain.value = s.bgmOn ? Math.max(0, Math.min(1, s.bgmVolume)) : 0;
  }

  private record(name: string): void {
    this.recent.push(name);
    if (this.recent.length > RECENT_CAP) this.recent.shift();
  }

  private gate(name: string): boolean {
    const gap = SFX_MIN_GAP_MS[name as SfxName] ?? 0;
    const now = performance.now();
    const last = this.lastAt.get(name) ?? -Infinity;
    if (now - last < gap) return false;
    this.lastAt.set(name, now);
    return true;
  }

  // --- primitives ----------------------------------------------------------------------------

  private noise(o: NoiseOpts): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuf || !this.sfxBus) return;
    const t0 = ctx.currentTime + (o.delayMs ?? 0) / 1000;
    const dur = o.ms / 1000;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    src.loopStart = Math.random() * (NOISE_SECONDS - 0.5);
    src.loopEnd = NOISE_SECONDS;
    let node: AudioNode = src;
    if (o.bandpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(o.bandpass, t0);
      if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.sweepTo), t0 + dur);
      f.Q.value = 1.2;
      node.connect(f);
      node = f;
    }
    if (o.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.lowpass, t0);
      if (o.sweepTo && !o.bandpass) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.sweepTo), t0 + dur);
      node.connect(f);
      node = f;
    }
    if (o.highpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = o.highpass;
      node.connect(f);
      node = f;
    }
    const g = ctx.createGain();
    const atk = (o.attackMs ?? 2) / 1000;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g);
    g.connect(this.sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
    };
  }

  private tone(freq: number, o: ToneOpts): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus) return;
    const t0 = ctx.currentTime + (o.delayMs ?? 0) / 1000;
    const dur = o.ms / 1000;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t0 + dur);
    const g = ctx.createGain();
    const atk = (o.attackMs ?? 3) / 1000;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  // --- one-shots -----------------------------------------------------------------------------

  /** An original-client sample for `name`, if one was declared and has decoded; false keeps the synth recipe. */
  private sample(name: string, gain: number): boolean {
    const buf = this.samples.get(name);
    if (!buf || !this.ctx || !this.sfxBus) return false;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.value = gain;
    src.connect(g);
    g.connect(this.sfxBus);
    src.start();
    return true;
  }

  /** Play a named effect. `gain` scales it (spatial attenuation, sub-fire). */
  play(name: SfxName, gain = 1): void {
    if (!this.gate(name)) return;
    this.record(name);
    if (!this.ctx || !gameState.settings.sfxOn) return;
    const v = Math.max(0, Math.min(1.5, gain));
    if (this.sample(name, v)) return;
    switch (name) {
      case 'shot':
        this.gunFromProfile(GUN_PROFILES['권총'], v);
        break;
      case 'swing':
        this.noise({ ms: 160, gain: 0.3 * v, bandpass: 700, sweepTo: 220, attackMs: 30 });
        break;
      case 'launch':
        this.noise({ ms: 220, gain: 0.45 * v, lowpass: 1200, sweepTo: 300 });
        this.tone(320, { ms: 220, gain: 0.25 * v, type: 'triangle', slideTo: 110 });
        break;
      case 'explode':
        this.noise({ ms: 720, gain: 0.95 * v, lowpass: 900, sweepTo: 80, attackMs: 4 });
        this.tone(70, { ms: 420, gain: 0.5 * v, type: 'sine', slideTo: 35 });
        break;
      case 'hit_flesh':
        this.noise({ ms: 60, gain: 0.32 * v, lowpass: 800 });
        this.tone(95, { ms: 70, gain: 0.22 * v, type: 'triangle', slideTo: 60 });
        break;
      case 'hit_crit':
        this.tone(640, { ms: 90, gain: 0.18 * v, type: 'square', slideTo: 320 });
        break;
      case 'hit_wall':
        this.noise({ ms: 40, gain: 0.2 * v, highpass: 2800 });
        break;
      case 'enemy_die':
        this.tone(170, { ms: 420, gain: 0.28 * v, type: 'sawtooth', slideTo: 55, attackMs: 20 });
        this.noise({ ms: 220, gain: 0.18 * v, lowpass: 500 });
        break;
      case 'enemy_shot':
        this.noise({ ms: 70, gain: 0.28 * v, lowpass: 2600 });
        this.tone(140, { ms: 60, gain: 0.15 * v, type: 'triangle' });
        break;
      case 'enemy_leap':
        this.noise({ ms: 180, gain: 0.25 * v, bandpass: 300, sweepTo: 900, attackMs: 40 });
        break;
      case 'player_hurt':
        this.tone(230, { ms: 120, gain: 0.28 * v, type: 'square', slideTo: 115 });
        this.noise({ ms: 90, gain: 0.2 * v, lowpass: 900 });
        break;
      case 'player_die':
        this.tone(200, { ms: 900, gain: 0.35 * v, type: 'sawtooth', slideTo: 38, attackMs: 30 });
        break;
      case 'consciousness':
        this.tone(440, { ms: 160, gain: 0.2 * v, type: 'sine', slideTo: 880 });
        this.tone(880, { ms: 260, gain: 0.16 * v, type: 'sine', delayMs: 150 });
        break;
      case 'level_up':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, { ms: 150, gain: 0.22 * v, type: 'triangle', delayMs: i * 110 }));
        break;
      case 'pickup_won':
        this.tone(1250, { ms: 40, gain: 0.16 * v });
        this.tone(1900, { ms: 90, gain: 0.14 * v, delayMs: 35 });
        break;
      case 'pickup_item':
        this.tone(620, { ms: 50, gain: 0.14 * v, type: 'square' });
        this.tone(930, { ms: 60, gain: 0.1 * v, type: 'square', delayMs: 45 });
        break;
      case 'ui_open':
        this.tone(880, { ms: 45, gain: 0.1 * v, slideTo: 1150 });
        break;
      case 'ui_close':
        this.tone(1150, { ms: 45, gain: 0.1 * v, slideTo: 820 });
        break;
      case 'ui_click':
        this.tone(1500, { ms: 25, gain: 0.08 * v, type: 'square' });
        break;
      case 'quest_done':
        [784, 988, 1175].forEach((f, i) => this.tone(f, { ms: 180, gain: 0.2 * v, type: 'triangle', delayMs: i * 130 }));
        break;
      case 'assault_success':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, { ms: 220, gain: 0.22 * v, type: 'triangle', delayMs: i * 120 }));
        break;
      case 'assault_fail':
        this.tone(300, { ms: 650, gain: 0.25 * v, type: 'sawtooth', slideTo: 140, attackMs: 40 });
        break;
      case 'jump':
        this.noise({ ms: 130, gain: 0.18 * v, bandpass: 400, sweepTo: 1300, attackMs: 20 });
        break;
      case 'no_ammo':
        this.tone(2000, { ms: 18, gain: 0.09 * v, type: 'square' });
        this.noise({ ms: 25, gain: 0.08 * v, highpass: 3000, delayMs: 40 });
        break;
      case 'heal':
        this.tone(440, { ms: 220, gain: 0.16 * v, slideTo: 880, attackMs: 30 });
        break;
      case 'enhance_ok':
        this.tone(880, { ms: 120, gain: 0.18 * v, type: 'triangle' });
        this.tone(1320, { ms: 220, gain: 0.18 * v, type: 'triangle', delayMs: 110 });
        break;
      case 'enhance_fail':
        this.tone(420, { ms: 320, gain: 0.2 * v, type: 'sawtooth', slideTo: 190 });
        break;
      case 'travel':
        this.noise({ ms: 500, gain: 0.2 * v, lowpass: 600, sweepTo: 2400, attackMs: 120 });
        break;
    }
  }

  /** A sound that happens somewhere in the world: attenuated by distance from the player. */
  at(name: SfxName, x: number, y: number): void {
    const me = gameState.worldProvider?.().player;
    const d = me ? Math.hypot(x - me.x, y - me.y) : 0;
    this.play(name, spatialGain(d));
  }

  /** The player's own weapon report, by class. */
  gunshot(cls: WeaponClass, subFire = false): void {
    const base = GUN_PROFILES[cls];
    const p = subFire ? subFireProfile(base) : base;
    if (!this.gate('shot')) return;
    this.record(`shot:${cls}`);
    if (!this.ctx || !gameState.settings.sfxOn) return;
    if (this.sample(`shot:${cls}`, subFire ? 0.6 : 1) || this.sample('shot', subFire ? 0.6 : 1)) return;
    switch (p.kind) {
      case 'gun':
        this.gunFromProfile(p, 1);
        break;
      case 'swing':
        this.noise({ ms: p.noiseMs, gain: p.gain, bandpass: p.lowpassHz, sweepTo: 220, attackMs: 30 });
        break;
      case 'launch':
        this.noise({ ms: p.noiseMs, gain: p.gain, lowpass: p.lowpassHz, sweepTo: 300 });
        this.tone(p.thumpHz, { ms: p.thumpMs, gain: p.gain * 0.5, type: 'triangle', slideTo: p.thumpHz / 3 });
        break;
      case 'claws':
        this.noise({ ms: p.noiseMs, gain: p.gain, bandpass: p.lowpassHz, sweepTo: 500, attackMs: 8 });
        this.tone(p.thumpHz, { ms: p.thumpMs, gain: p.gain * 0.5, type: 'sawtooth', slideTo: 90 });
        break;
    }
  }

  private gunFromProfile(p: GunProfile, v: number): void {
    this.noise({ ms: p.noiseMs, gain: p.gain * v, lowpass: p.lowpassHz, sweepTo: Math.max(200, p.lowpassHz * 0.25) });
    this.tone(p.thumpHz, { ms: p.thumpMs, gain: p.gain * 0.6 * v, type: 'sine', slideTo: p.thumpHz * 0.4 });
  }

  // --- ambient beds -------------------------------------------------------------------------

  ambient(kind: AmbientKind): void {
    if (kind === this.ambientKind && this.ambientNodes.length) return;
    this.ambientKind = kind;
    this.record(`ambient:${kind}`);
    this.stopAmbient();
    if (!this.ctx) return; // will start on unlock
    this.startAmbient(kind);
  }

  private stopAmbient(): void {
    for (const n of this.ambientNodes) n.stop();
    this.ambientNodes = [];
    if (this.ambientTimer) clearInterval(this.ambientTimer);
    this.ambientTimer = null;
  }

  private loopNoise(gain: number, opts: { lowpass?: number; highpass?: number; lfoHz?: number; lfoDepth?: number }): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuf || !this.ambBus) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    let node: AudioNode = src;
    if (opts.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.lowpass;
      node.connect(f);
      node = f;
    }
    if (opts.highpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = opts.highpass;
      node.connect(f);
      node = f;
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), ctx.currentTime + 1.5);
    node.connect(g);
    g.connect(this.ambBus);
    let lfo: OscillatorNode | null = null;
    if (opts.lfoHz) {
      lfo = ctx.createOscillator();
      lfo.frequency.value = opts.lfoHz;
      const lg = ctx.createGain();
      lg.gain.value = (opts.lfoDepth ?? 0.5) * gain;
      lfo.connect(lg);
      lg.connect(g.gain);
      lfo.start();
    }
    src.start();
    this.ambientNodes.push({
      stop: () => {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        setTimeout(() => {
          try {
            src.stop();
            lfo?.stop();
          } catch {
            /* already stopped */
          }
          src.disconnect();
          g.disconnect();
        }, 700);
      },
    });
  }

  private loopTone(freq: number, gain: number, type: OscillatorType = 'sawtooth', lowpass = 140): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambBus) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), ctx.currentTime + 2);
    osc.connect(f);
    f.connect(g);
    g.connect(this.ambBus);
    osc.start();
    this.ambientNodes.push({
      stop: () => {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        setTimeout(() => {
          try {
            osc.stop();
          } catch {
            /* already stopped */
          }
          osc.disconnect();
          g.disconnect();
        }, 700);
      },
    });
  }

  private startAmbient(kind: AmbientKind): void {
    switch (kind) {
      case 'rain':
        this.loopNoise(0.07, { highpass: 1200, lowpass: 6500, lfoHz: 0.08, lfoDepth: 0.35 });
        this.loopNoise(0.03, { lowpass: 250, lfoHz: 0.05, lfoDepth: 0.6 });
        break;
      case 'safe':
        this.loopTone(55, 0.05, 'sawtooth', 130); // parking-garage electrical hum
        this.loopNoise(0.025, { lowpass: 220 });
        break;
      case 'field':
        this.loopNoise(0.055, { lowpass: 650, lfoHz: 0.11, lfoDepth: 0.7 }); // wind over empty streets
        this.loopNoise(0.02, { highpass: 2500, lowpass: 5000, lfoHz: 0.07, lfoDepth: 0.8 });
        break;
      case 'dark':
        this.loopNoise(0.045, { lowpass: 300, lfoHz: 0.06, lfoDepth: 0.5 });
        this.loopTone(38, 0.04, 'sine', 120);
        // irregular drips
        this.ambientTimer = setInterval(() => {
          if (!this.ctx || Math.random() < 0.35) return;
          const f = 900 + Math.random() * 900;
          this.tone(f, { ms: 60, gain: 0.05 * (gameState.settings.ambientOn ? 1 : 0), slideTo: f * 0.55 });
        }, 1400);
        break;
      case 'none':
        break;
    }
  }

  // --- BGM (procedural sequencer) -----------------------------------------------------------

  bgm(kind: BgmKind): void {
    if (kind === this.bgmKind) return;
    this.bgmKind = kind;
    this.record(`bgm:${kind}`);
    this.stopBgm();
    if (!this.ctx || kind === 'none') return; // starts on unlock
    this.startBgm();
  }

  private stopBgm(): void {
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    this.bgmTimer = null;
    for (const n of this.bgmNodes) n.stop();
    this.bgmNodes = [];
  }

  private startBgm(): void {
    const ctx = this.ctx;
    if (!ctx || this.bgmKind === 'none' || this.bgmTimer) return;
    const def = BGM[this.bgmKind];
    const step = stepSeconds(def.bpm);
    this.bgmStep = 0;
    this.bgmNextAt = ctx.currentTime + 0.1;
    const LOOKAHEAD = 0.35;
    const tick = () => {
      if (!this.ctx || this.bgmKind === 'none') return;
      while (this.bgmNextAt < this.ctx.currentTime + LOOKAHEAD) {
        this.scheduleStep(def, this.bgmStep, this.bgmNextAt, step);
        this.bgmStep = (this.bgmStep + 1) % 64;
        this.bgmNextAt += step;
      }
    };
    tick();
    this.bgmTimer = setInterval(tick, 120);
  }

  /** One 16th-note step of the 4-bar loop: pad on bar starts, bass on beats, arp every step, drums per pattern. */
  private scheduleStep(def: (typeof BGM)[keyof typeof BGM], globalStep: number, t: number, step: number): void {
    const ctx = this.ctx;
    const bus = this.bgmBus;
    if (!ctx || !bus) return;
    const bar = Math.floor(globalStep / 16) % 4;
    const s16 = globalStep % 16;
    const chord = def.chords[bar];
    if (s16 === 0 && def.padGain > 0) {
      for (const n of chord) this.bgmTone(bus, midiHz(n), t, step * 16, def.padGain / chord.length, def.padType, 0.4);
    }
    if (s16 % 4 === 0 && def.bassGain > 0) this.bgmTone(bus, midiHz(def.bass[bar]), t, step * 3.5, def.bassGain, 'triangle', 0.01);
    if (def.arp.length && def.arpGain > 0 && s16 % 2 === 0) {
      const idx = def.arp[(s16 / 2) % def.arp.length];
      this.bgmTone(bus, midiHz(chord[idx % chord.length] + 12), t, step * 1.6, def.arpGain, 'square', 0.005);
    }
    const d = def.drums[bar][s16] ?? '.';
    if (def.drumGain > 0 && d !== '.') this.bgmDrum(bus, d, t, def.drumGain);
  }

  private bgmTone(bus: GainNode, hz: number, t: number, dur: number, gain: number, type: OscillatorType, attack: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = hz;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = type === 'sawtooth' || type === 'square' ? Math.min(6000, hz * 6) : 12000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.setValueAtTime(Math.max(0.0002, gain), t + Math.max(attack, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(f);
    f.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private bgmDrum(bus: GainNode, kind: string, t: number, gain: number): void {
    const ctx = this.ctx!;
    if (!this.noiseBuf) return;
    if (kind === 'k') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain * 1.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + 0.22);
      osc.onended = () => {
        osc.disconnect();
        g.disconnect();
      };
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    if (kind === 's') {
      f.type = 'bandpass';
      f.frequency.value = 1800;
    } else {
      f.type = 'highpass';
      f.frequency.value = 7000;
    }
    const g = ctx.createGain();
    const dur = kind === 's' ? 0.14 : 0.05;
    g.gain.setValueAtTime(gain * (kind === 's' ? 1.1 : 0.5), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus);
    src.start(t, Math.random() * (NOISE_SECONDS - 0.5));
    src.stop(t + dur + 0.02);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
    };
  }

  snapshot(): { unlocked: boolean; ambient: AmbientKind; bgm: BgmKind; recent: string[] } {
    return { unlocked: this.unlocked, ambient: this.ambientKind, bgm: this.bgmKind, recent: [...this.recent] };
  }
}

export const audio = new AudioManager();
