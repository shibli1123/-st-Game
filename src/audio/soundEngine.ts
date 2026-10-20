/**
 * Procedural Web Audio API sound synthesizer for GTA V style experience.
 * Zero external audio assets, fully self-contained.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Car engine sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Tire screech nodes
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;

  // Siren nodes
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: number | null = null;
  private isSirenActive: boolean = false;

  // Radio synthesizer nodes & loop
  private currentStationIndex: number = 0;
  private radioGain: GainNode | null = null;
  private radioTimer: number | null = null;
  private radioBeatIndex: number = 0;

  // Rain audio synthesis
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private isRainSetup: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSound();
      this.setupScreechSound();
      this.setupRadio();
      this.setupRainSound();
    } catch {
      // AudioContext blocked or unsupported
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ---- CAR ENGINE SYNTHESIS ----
  private setupEngineSound() {
    if (!this.ctx || !this.masterGain) return;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3, this.ctx.currentTime);

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start();
    this.engineSubOsc.start();
    this.isEngineRunning = true;
  }

  public updateEngine(speedKmH: number, isAccelerating: boolean, isInVehicle: boolean) {
    if (!this.ctx || !this.engineGain || !this.engineOsc || !this.engineSubOsc || !this.engineFilter) return;

    if (!isInVehicle) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      return;
    }

    const absSpeed = Math.abs(speedKmH);
    // Base idle RPM 40Hz, max RPM ~ 180Hz with gear shift feel
    const gear = Math.floor(absSpeed / 35) + 1;
    const gearSpeed = (absSpeed % 35) / 35;
    const targetFreq = 42 + gearSpeed * 50 + (gear - 1) * 8 + (isAccelerating ? 15 : 0);
    const filterFreq = 180 + absSpeed * 12 + (isAccelerating ? 200 : 0);
    const targetVol = 0.18 + Math.min(absSpeed / 120, 0.22);

    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, this.ctx.currentTime, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.08);
    this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.08);
  }

  // ---- TIRE SCREECH SYNTHESIS ----
  private setupScreechSound() {
    if (!this.ctx || !this.masterGain) return;
    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    // Procedural noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.masterGain);
    whiteNoise.start();
  }

  public setTireScreech(intensity: number) {
    if (!this.ctx || !this.screechGain) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    this.screechGain.gain.setTargetAtTime(clamped * 0.25, this.ctx.currentTime, 0.05);
  }

  // ---- PROCEDURAL RAIN AUDIO ----
  private setupRainSound() {
    if (!this.ctx || !this.masterGain || this.isRainSetup) return;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.rainFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // Procedural rain noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.65;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    whiteNoise.start();
    this.isRainSetup = true;
  }

  public setRainIntensity(intensity: number) {
    if (!this.ctx) return;
    if (!this.isRainSetup) {
      this.setupRainSound();
    }
    if (!this.rainGain) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    this.rainGain.gain.setTargetAtTime(clamped * 0.16, this.ctx.currentTime, 0.25);
  }

  // ---- POLICE SIREN ----
  public setSiren(active: boolean) {
    if (!this.ctx || !this.masterGain) return;
    if (active === this.isSirenActive) return;
    this.isSirenActive = active;

    if (active) {
      if (!this.sirenOsc) {
        this.sirenGain = this.ctx.createGain();
        this.sirenGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

        this.sirenOsc = this.ctx.createOscillator();
        this.sirenOsc.type = 'sawtooth';
        this.sirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

        this.sirenOsc.connect(filter);
        filter.connect(this.sirenGain);
        this.sirenGain.connect(this.masterGain);
        this.sirenOsc.start();
      }

      let high = false;
      this.sirenTimer = window.setInterval(() => {
        if (!this.sirenOsc || !this.ctx) return;
        high = !high;
        this.sirenOsc.frequency.setTargetAtTime(high ? 920 : 640, this.ctx.currentTime, 0.18);
      }, 420);
    } else {
      if (this.sirenTimer) {
        clearInterval(this.sirenTimer);
        this.sirenTimer = null;
      }
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
        setTimeout(() => {
          if (!this.isSirenActive && this.sirenOsc) {
            this.sirenOsc.stop();
            this.sirenOsc.disconnect();
            this.sirenOsc = null;
          }
        }, 300);
      }
    }
  }

  // ---- GUNSHOT SOUND ----
  public playGunshot() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Transient attack noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // Low punch
    const kick = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(140, now);
    kick.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    kickGain.gain.setValueAtTime(0.5, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    kick.connect(kickGain);
    kickGain.connect(this.masterGain);
    kick.start(now);
    kick.stop(now + 0.14);
  }

  // ---- NITRO WHOOSH ----
  public playNitro(active: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    if (!active) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // ---- BULLET TIME SLOW-MO SOUND ----
  public playSlowMo(active: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(active ? 110 : 55, now);
    osc.frequency.exponentialRampToValueAtTime(active ? 45 : 120, now + 0.4);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // ---- CASH SOUND ----
  public playCash() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  }

  // ---- HEARTBEAT FOR TENSE ROMANCE / LOW HEALTH ----
  public playHeartbeat() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const playThump = (time: number, freq: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(25, time + 0.1);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.13);
    };

    playThump(now, 70);
    playThump(now + 0.14, 55);
  }

  // ---- MISSION PASSED FANFARE ----
  public playMissionPassed() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 261.63, t: 0, d: 0.18 },    // C4
      { f: 329.63, t: 0.18, d: 0.18 }, // E4
      { f: 392.00, t: 0.36, d: 0.18 }, // G4
      { f: 466.16, t: 0.54, d: 0.22 }, // Bb4
      { f: 523.25, t: 0.76, d: 0.65 }  // C5 (triumphant sustain)
    ];

    notes.forEach((n) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now + n.t);

      gain.gain.setValueAtTime(0.28, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
  }

  // ---- WASTED SCREEN HIT/STINGER ----
  public playWasted() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 1.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  // ---- PROCEDURAL SYNTH RADIO STATIONS ----
  private setupRadio() {
    if (!this.ctx || !this.masterGain) return;
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.radioGain.connect(this.masterGain);

    this.startRadioLoop();
  }

  public setStation(index: number) {
    this.currentStationIndex = index;
    // Station blip sound
    if (this.ctx && this.masterGain && !this.isMuted) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  public setRadioVolume(vol: number) {
    if (!this.ctx || !this.radioGain) return;
    this.radioGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)) * 0.25, this.ctx.currentTime, 0.1);
  }

  private startRadioLoop() {
    if (this.radioTimer) return;
    // 120 BPM = 125ms per 16th note
    const stepTimeMs = 135;

    // Chord progressions for 4 stations
    // Station 0: Los Santos Synthwave (Am - F - C - G)
    const station0Bass = [110, 110, 110, 110, 87.31, 87.31, 87.31, 87.31, 130.81, 130.81, 130.81, 130.81, 98, 98, 98, 98];
    const station0Lead = [440, 0, 523.25, 0, 659.25, 523.25, 440, 0, 392, 0, 440, 0, 523.25, 0, 392, 0];

    // Station 1: West Coast Nights (G-funk bounce Dm - G)
    const station1Bass = [146.83, 0, 146.83, 0, 0, 174.61, 0, 196, 98, 0, 98, 0, 110, 0, 130.81, 0];
    const station1Lead = [0, 0, 880, 0, 0, 0, 987.77, 0, 0, 0, 1046.5, 0, 0, 880, 0, 0];

    // Station 2: Sunset Romance (Fmaj7 - Em7 - Dm7 - Cmaj7)
    const station2Chords = [174.61, 220, 261.63, 329.63]; // Fmaj7 warm
    const station2Bass = [87.31, 0, 87.31, 0, 82.41, 0, 82.41, 0, 73.42, 0, 73.42, 0, 65.41, 0, 65.41, 0];

    // Station 3: Radio Mirror Park (Driving Electro)
    const station3Bass = [130.81, 130.81, 261.63, 130.81, 130.81, 130.81, 261.63, 130.81, 164.81, 164.81, 329.63, 164.81, 174.61, 174.61, 349.23, 174.61];

    this.radioTimer = window.setInterval(() => {
      if (!this.ctx || !this.radioGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const beat = this.radioBeatIndex % 16;
      this.radioBeatIndex = (this.radioBeatIndex + 1) % 16;

      // Station OFF (index 4)
      if (this.currentStationIndex === 4) return;

      // Drum kick on 0, 4, 8, 12
      if (beat % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(130, now);
        kick.frequency.exponentialRampToValueAtTime(32, now + 0.1);
        kGain.gain.setValueAtTime(0.25, now);
        kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        kick.connect(kGain);
        kGain.connect(this.radioGain);
        kick.start(now);
        kick.stop(now + 0.12);
      }

      // Snare / Hi-hat on 2, 6, 10, 14
      if (beat % 4 === 2) {
        const snare = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        snare.type = 'triangle';
        snare.frequency.setValueAtTime(240, now);
        sGain.gain.setValueAtTime(0.12, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        snare.connect(sGain);
        sGain.connect(this.radioGain);
        snare.start(now);
        snare.stop(now + 0.09);
      }

      // Bass notes
      let bassFreq = 0;
      let leadFreq = 0;
      let waveType: OscillatorType = 'sawtooth';

      if (this.currentStationIndex === 0) {
        bassFreq = station0Bass[beat];
        leadFreq = station0Lead[beat];
        waveType = 'sawtooth';
      } else if (this.currentStationIndex === 1) {
        bassFreq = station1Bass[beat];
        leadFreq = station1Lead[beat];
        waveType = 'triangle';
      } else if (this.currentStationIndex === 2) {
        bassFreq = station2Bass[beat];
        leadFreq = (beat % 4 === 0) ? station2Chords[(beat / 4) % 4] : 0;
        waveType = 'sine';
      } else if (this.currentStationIndex === 3) {
        bassFreq = station3Bass[beat];
        leadFreq = (beat % 2 === 0) ? 523.25 : 0;
        waveType = 'sawtooth';
      }

      if (bassFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        const bFilt = this.ctx.createBiquadFilter();

        bOsc.type = waveType;
        bOsc.frequency.setValueAtTime(bassFreq, now);

        bFilt.type = 'lowpass';
        bFilt.frequency.setValueAtTime(450, now);

        bGain.gain.setValueAtTime(0.18, now);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        bOsc.connect(bFilt);
        bFilt.connect(bGain);
        bGain.connect(this.radioGain);

        bOsc.start(now);
        bOsc.stop(now + 0.13);
      }

      if (leadFreq > 0) {
        const lOsc = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();
        lOsc.type = 'sine';
        lOsc.frequency.setValueAtTime(leadFreq, now);

        lGain.gain.setValueAtTime(0.1, now);
        lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        lOsc.connect(lGain);
        lGain.connect(this.radioGain);

        lOsc.start(now);
        lOsc.stop(now + 0.19);
      }
    }, stepTimeMs);
  }
}

export const soundEngine = new SoundEngine();
