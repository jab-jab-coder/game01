// Dźwięki syntetyzowane w WebAudio — zero plików do ładowania.

export class Sfx {
  constructor() { this.ctx = null; }

  // Przeglądarka pozwala włączyć dźwięk dopiero po kliknięciu / klawiszu.
  unlock() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch { /* brak audio — gramy po cichu */ }
  }

  get muted() { return !this.ctx || this.ctx.state !== 'running'; }

  tone(freq, dur, { type = 'square', vol = 0.12, to = null, delay = 0 } = {}) {
    if (this.muted) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(dur, { vol = 0.2, freq = 800, delay = 0 } = {}) {
    if (this.muted) return;
    const c = this.ctx, t = c.currentTime + delay;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  }

  play(name, arg) {
    switch (name) {
      case 'pick': {
        const f = 420 + (arg || 1) * 90;
        this.tone(f, 0.08, { type: 'triangle', vol: 0.18 });
        this.tone(f * 1.5, 0.12, { type: 'triangle', vol: 0.16, delay: 0.07 });
        break;
      }
      case 'bad':
        this.tone(300, 0.5, { type: 'sawtooth', vol: 0.12, to: 70 });
        this.tone(310, 0.5, { type: 'sine', vol: 0.12, to: 90, delay: 0.05 });
        break;
      case 'whoosh': this.noise(0.12, { vol: 0.12, freq: 2500 }); break;
      case 'thump':
        this.noise(0.15, { vol: 0.35, freq: 500 });
        this.tone(140, 0.15, { type: 'sine', vol: 0.3, to: 50 });
        break;
      case 'dash': this.noise(0.2, { vol: 0.1, freq: 1800 }); break;
      case 'warn':
        this.tone(95, 0.25, { type: 'sawtooth', vol: 0.18, to: 70 });
        this.tone(85, 0.35, { type: 'sawtooth', vol: 0.18, to: 55, delay: 0.3 });
        break;
      case 'charge':
        this.tone(120, 0.6, { type: 'sawtooth', vol: 0.2, to: 220 });
        this.noise(0.6, { vol: 0.15, freq: 400 });
        break;
      case 'crash':
        this.noise(0.4, { vol: 0.45, freq: 700 });
        this.tone(90, 0.4, { type: 'square', vol: 0.2, to: 35 });
        break;
      case 'shoo': this.tone(500, 0.12, { type: 'square', vol: 0.08, to: 700 }); break;
      case 'squeal':
        this.tone(500, 0.5, { type: 'sawtooth', vol: 0.12, to: 1400 });
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone(f, 0.16, { type: 'triangle', vol: 0.16, delay: 0.25 + i * 0.09 }));
        break;
      case 'whistle':
        for (let i = 0; i < 6; i++) this.tone(i % 2 ? 2350 : 2100, 0.07, { type: 'square', vol: 0.07, delay: i * 0.07 });
        break;
      case 'splash': this.noise(0.3, { vol: 0.25, freq: 1400 }); this.tone(300, 0.2, { type: 'sine', vol: 0.1, to: 120 }); break;
      case 'squeak': this.tone(1500, 0.06, { type: 'square', vol: 0.07, to: 2200 }); this.tone(1800, 0.06, { type: 'square', vol: 0.07, to: 2600, delay: 0.08 }); break;
      case 'select': this.tone(660, 0.06, { type: 'triangle', vol: 0.14 }); break;
      case 'ready': this.tone(660, 0.08, { type: 'triangle', vol: 0.16 }); this.tone(990, 0.14, { type: 'triangle', vol: 0.16, delay: 0.08 }); break;
      case 'beep': this.tone(440, 0.12, { type: 'square', vol: 0.1 }); break;
      case 'go': this.tone(880, 0.35, { type: 'square', vol: 0.12 }); break;
      case 'tick': this.tone(1000, 0.04, { type: 'square', vol: 0.06 }); break;
      case 'join': this.tone(523, 0.1, { type: 'triangle', vol: 0.18 });
        this.tone(784, 0.18, { type: 'triangle', vol: 0.18, delay: 0.1 }); break;
      case 'end':
        [392, 523, 659, 784, 1047].forEach((f, i) =>
          this.tone(f, 0.22, { type: 'triangle', vol: 0.18, delay: i * 0.12 }));
        break;
    }
  }
}
