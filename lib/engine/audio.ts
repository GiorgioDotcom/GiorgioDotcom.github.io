// Every sound is synthesised with Web Audio. Zero audio files.

export class ChipAudio {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private hum: { osc: OscillatorNode; gain: GainNode } | null = null;
  muted = false;

  /** Must be called from a user gesture (browsers gate audio behind one). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    const len = Math.floor(this.ctx.sampleRate * 0.25);
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.05);
  }

  private burst(freq: number, q: number, dur: number, vol: number) {
    if (!this.ctx || !this.noise || !this.master) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /** Relay-like click on every beat of the clock. */
  tick(accent = false) {
    this.burst(accent ? 2600 : 4200, 6, accent ? 0.05 : 0.025, accent ? 0.5 : 0.22);
  }

  /** Rising filtered noise while the button is held. */
  holdStep(progress: number) {
    this.burst(600 + progress * 3400, 12, 0.03, 0.08 + progress * 0.12);
  }

  powerOn() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.burst(1800, 2, 0.18, 0.6);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.6);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.4);
    gain.gain.setTargetAtTime(0.035, t + 0.6, 0.4);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    this.hum = { osc, gain };
  }

  powerOff() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.burst(900, 2, 0.2, 0.4);
    if (this.hum) {
      const { osc, gain } = this.hum;
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      gain.gain.setTargetAtTime(0.0001, t, 0.12);
      osc.stop(t + 0.8);
      this.hum = null;
    }
  }
}
