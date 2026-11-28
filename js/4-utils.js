/* ==========================================================================
   [4. UTILS & AUDIO]
   Fonctions utilitaires (RNG pondéré, formatage) et synthétiseur Web Audio
   ========================================================================== */
const Utils = {
  formatNum(n) {
    if (!isFinite(n)) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.floor(n).toString();
  },

  formatDuration(sec) {
    const s = Math.max(0, Math.ceil(sec));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m < 60) return `${m}m ${rem}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  },

  /**
   * Tirage aléatoire pondéré : oddsTable = { key: weight, ... }
   */
  rollWeighted(oddsTable) {
    const entries = Object.entries(oddsTable).filter(([, w]) => w > 0);
    const total = entries.reduce((acc, [, w]) => acc + w, 0);
    let r = Math.random() * total;
    for (const [key, w] of entries) {
      r -= w;
      if (r <= 0) return key;
    }
    return entries[entries.length - 1][0];
  },

  // Arrondit des pourcentages à l'entier en garantissant une somme EXACTE de 100
  // (méthode du plus grand reste). `weights` : { clé: valeur >= 0 } ; renvoie des entiers.
  roundTo100(weights) {
    const keys = Object.keys(weights);
    const total = keys.reduce((a, k) => a + weights[k], 0) || 1;
    const raw = keys.map(k => ({ k, v: (weights[k] / total) * 100 }));
    const out = {};
    let used = 0;
    for (const r of raw) { out[r.k] = Math.floor(r.v); used += out[r.k]; }
    raw.sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
    for (let i = 0; i < 100 - used; i++) out[raw[i % raw.length].k]++;
    return out;
  },

  randomOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
};

const AudioFX = {
  ctx: null,

  _ensureCtx() {
    if (!state.soundEnabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  },

  _tone(freq, dur, type = 'sine', gainVal = 0.12, delay = 0, freqEnd = null) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + dur);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  },

  play(id) {
    try {
      switch (id) {
        case 'click':
          this._tone(540, 0.06, 'sine', 0.06, 0, 720);
          break;
        case 'correct':
          this._tone(523.25, 0.12, 'triangle', 0.12, 0);
          this._tone(659.25, 0.12, 'triangle', 0.12, 0.08);
          this._tone(783.99, 0.22, 'triangle', 0.13, 0.16);
          break;
        case 'wrong':
          this._tone(260, 0.16, 'sawtooth', 0.08, 0, 180);
          this._tone(180, 0.24, 'sawtooth', 0.08, 0.14, 130);
          break;
        case 'incubate':
          this._tone(300, 0.22, 'sine', 0.1, 0, 520);
          this._tone(440, 0.26, 'triangle', 0.08, 0.12, 660);
          break;
        case 'alert':
          this._tone(660, 0.12, 'sine', 0.09, 0);
          this._tone(520, 0.18, 'sine', 0.09, 0.14);
          break;
        case 'fuse_charge':
          this._tone(220, 1.25, 'triangle', 0.1, 0, 780);
          break;
        case 'hatch_common':
          this._tone(440, 0.12, 'triangle', 0.11, 0);
          this._tone(554, 0.18, 'triangle', 0.11, 0.09);
          break;
        case 'hatch_rare':
          [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.18, 'triangle', 0.12, i * 0.07));
          break;
        case 'hatch_epic':
          [440, 554, 659, 880, 1108].forEach((f, i) => this._tone(f, 0.24, 'triangle', 0.13, i * 0.07));
          break;
        case 'hatch_legendary':
          [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => this._tone(f, 0.34, 'triangle', 0.14, i * 0.08));
          this._tone(261.6, 0.7, 'sine', 0.12, 0.1);
          break;
        case 'chromatic':
          [1046, 1318, 1568, 2093].forEach((f, i) => this._tone(f, 0.2, 'sine', 0.1, 0.12 + i * 0.06));
          break;
      }
    } catch (e) {}
  }
};
