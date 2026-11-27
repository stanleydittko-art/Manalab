/* ==========================================================================
   [7. RENDER / FX]
   Canvas plein écran 60 FPS : bulles bioluminescentes d'ambiance,
   explosions de particules/confettis et textes flottants (+Mana / +Éclats)
   ========================================================================== */
const FXRenderer = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  bubbles: [],
  particles: [],
  floats: [],
  lastTs: 0,

  init() {
    this.canvas = document.getElementById('fx-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Créer des micro-bulles bioluminescentes douces en arrière-plan
    this.bubbles = [];
    for (let i = 0; i < 24; i++) {
      this.bubbles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: 1.5 + Math.random() * 3.5,
        vy: 12 + Math.random() * 22,
        drift: Math.random() * Math.PI * 2,
        color: Math.random() < 0.7 ? 'rgba(46, 242, 224, 0.22)' : 'rgba(56, 189, 248, 0.2)'
      });
    }
  },

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  spawnBurst(rarity = 'rare', chromatic = false) {
    const cx = this.width / 2;
    const cy = this.height * 0.44;
    const palettes = {
      common: ['#22d39c', '#5eead4', '#a7f3d0'],
      rare: ['#38bdf8', '#2ef2e0', '#bae6fd', '#818cf8'],
      epic: ['#c084fc', '#e879f9', '#38bdf8', '#f3e8ff'],
      legendary: ['#facc15', '#fef08a', '#fb923c', '#2ef2e0', '#ffffff']
    };
    const chromaPalette = ['#ff6b9d', '#facc15', '#2ef2e0', '#38bdf8', '#c084fc', '#ffffff'];
    const colors = chromatic ? chromaPalette : (palettes[rarity] || palettes.rare);
    const count = rarity === 'legendary' || chromatic ? 90 : (rarity === 'epic' ? 60 : (rarity === 'rare' ? 38 : 20));

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * (rarity === 'legendary' ? 360 : 250);
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: 0.55 + Math.random() * 0.55,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 10
      });
    }
  },

  spawnFloatText(text, x, y) {
    this.floats.push({
      text,
      x: x ?? this.width * 0.5,
      y: y ?? this.height * 0.25,
      vy: -48,
      life: 1
    });
  },

  draw(ts) {
    if (!this.ctx) return;
    const dt = this.lastTs ? Math.min(0.05, (ts - this.lastTs) / 1000) : 0.016;
    this.lastTs = ts;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Bulles bioluminescentes d'ambiance
    for (const b of this.bubbles) {
      b.y -= b.vy * dt;
      b.drift += dt * 1.4;
      const bx = b.x + Math.sin(b.drift) * 14;
      if (b.y < -12) {
        b.y = this.height + 12;
        b.x = Math.random() * this.width;
      }
      ctx.beginPath();
      ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
    }

    // 2. Particules / Confettis d'éclosion
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt; // Gravité légère
      p.vx *= 0.985;
      p.rot += p.vrot * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }

    // 3. Textes flottants
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.y += f.vy * dt;
      f.life -= dt * 0.85;
      if (f.life <= 0) {
        this.floats.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.font = '800 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#041321';
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = '#2ef2e0';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }
};
