// Procedural WebAudio sound: no files. Created on the first user gesture.
export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private grind: { osc: OscillatorNode; gain: GainNode } | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this.ensure();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, when = 0, slide = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol = 0.3, hp = 1000) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master);
    src.start();
  }

  shutter() {
    this.noise(0.08, 0.35, 2500);
    this.tone(1800, 0.05, 'square', 0.08, 0.06);
  }
  ok() {
    [660, 880, 1320].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.22, i * 0.08));
  }
  miss() {
    this.tone(330, 0.25, 'sawtooth', 0.12, 0, -120);
  }
  jump() {
    this.tone(420, 0.18, 'sine', 0.18, 0, 380);
  }
  token() {
    this.tone(990, 0.15, 'triangle', 0.2);
    this.tone(1480, 0.2, 'triangle', 0.16, 0.06);
  }
  sleep() {
    [523, 440, 349, 262].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.16, i * 0.18));
  }
  wake() {
    [392, 523, 659].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.16, i * 0.1));
  }
  train() {
    this.tone(587, 0.6, 'sawtooth', 0.08);
    this.tone(740, 0.6, 'sawtooth', 0.07);
    this.tone(587, 0.5, 'sawtooth', 0.08, 0.7);
    this.tone(740, 0.5, 'sawtooth', 0.07, 0.7);
  }
  fail() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.18, i * 0.16));
  }
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.2, i * 0.1));
  }
  wave() {
    this.noise(1.2, 0.4, 200);
  }
  snore() {
    this.tone(110, 0.8, 'sawtooth', 0.06, 0, -30);
    this.tone(90, 0.8, 'sawtooth', 0.05, 1.1, 40);
  }

  setGrind(on: boolean) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (on && !this.grind) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 95;
      gain.gain.value = 0.035;
      osc.connect(gain).connect(this.master);
      osc.start();
      this.grind = { osc, gain };
    } else if (!on && this.grind) {
      this.grind.osc.stop();
      this.grind = null;
    }
  }
}
