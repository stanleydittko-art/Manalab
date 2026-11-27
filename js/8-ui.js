/* ==========================================================================
   [8. UI & MODALS]
   Rendu DOM réactif piloté par dirty flags, modales de quiz, d'éclosion
   (Stop ou Encore), de Fusion et du Gardien Alpha
   ========================================================================== */
const UI = {
  activeTab: 'enclosures',
  dirty: { hud: true, nav: true, enclosures: true, incubator: true, exercises: true, fusion: true, manadex: true },
  _quizInterval: null,
  _modalOpen: false,

  markDirty(areas) {
    for (const a of areas) {
      if (a in this.dirty) this.dirty[a] = true;
    }
  },

  showToast(text, tone = 'cyan') {
    const stack = document.getElementById('toast-stack');
    const el = document.createElement('div');
    el.className = `toast ${tone}`;
    el.textContent = text;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      el.style.transition = 'all 0.25s ease';
      setTimeout(() => el.remove(), 260);
    }, 3200);
  },

  openModal(html) {
    this._clearQuizTimer();
    const box = document.getElementById('modal-box');
    const backdrop = document.getElementById('modal-backdrop');
    box.innerHTML = html;
    backdrop.classList.add('open');
    this._modalOpen = true;
  },

  closeModal() {
    this._clearQuizTimer();
    document.getElementById('modal-backdrop').classList.remove('open');
    this._modalOpen = false;
  },

  _clearQuizTimer() {
    if (this._quizInterval) {
      clearInterval(this._quizInterval);
      this._quizInterval = null;
    }
  },

  // --- Mise à jour légère à 1 Hz (ne détruit aucun bouton cliquable) ---
  updateLiveTickDisplay() {
    const prod = GameEngine.getTotalProductionPerSec();
    document.getElementById('hud-shards').textContent = Utils.formatNum(state.shards);
    document.getElementById('hud-prod-rate').textContent = `+${prod.toFixed(1).replace(/\.0$/, '')}/s`;

    // Mettre à jour les barres de progression d'incubation en place
    if (this.activeTab === 'incubator') {
      for (const inc of state.incubators) {
        if (!inc.egg) continue;
        const timerEl = document.querySelector(`[data-inc-timer="${inc.id}"]`);
        const barEl = document.querySelector(`[data-inc-bar="${inc.id}"]`);
        if (timerEl && barEl) {
          const pct = Math.min(100, Math.round(((inc.egg.durationSec - inc.egg.remainingSec) / inc.egg.durationSec) * 100));
          timerEl.textContent = inc.egg.remainingSec > 0 ? `${Math.ceil(inc.egg.remainingSec)}s` : 'PRÊT !';
          barEl.style.width = `${pct}%`;
        }
      }
    }
  },

  renderDirty() {
    const progressDirty = this.dirty.hud || this.dirty.nav;
    if (this.dirty.hud) { this.renderHUD(); this.dirty.hud = false; }
    if (progressDirty) this.renderProgress();
    if (this.dirty.nav) { this.renderNavBadges(); this.dirty.nav = false; }
    if (this.activeTab === 'enclosures' && this.dirty.enclosures) { this.renderEnclosures(); this.dirty.enclosures = false; }
    if (this.activeTab === 'incubator' && this.dirty.incubator) { this.renderIncubator(); this.dirty.incubator = false; }
    if (this.activeTab === 'exercises' && this.dirty.exercises) { this.renderExercises(); this.dirty.exercises = false; }
    if (this.activeTab === 'fusion' && this.dirty.fusion) { this.renderFusion(); this.dirty.fusion = false; }
    if (this.activeTab === 'manadex' && this.dirty.manadex) { this.renderManaDex(); this.dirty.manadex = false; }
  },

  renderHUD() {
    const prod = GameEngine.getTotalProductionPerSec();
    document.getElementById('hud-shards').textContent = Utils.formatNum(state.shards);
    document.getElementById('hud-prod-rate').textContent = `+${prod.toFixed(1).replace(/\.0$/, '')}/s`;
    document.getElementById('hud-mana-raw').textContent = state.mana.raw;
    document.getElementById('hud-mana-pure').textContent = state.mana.pure;
    document.getElementById('hud-mana-prismatic').textContent = state.mana.prismatic;

    const chromaPct = Math.round(ProbaEngine.getChromaticChance() * 100);
    const streakBonusPct = Math.round((ProbaEngine.getChromaticChance() - CONFIG.CHROMATIC_CHANCE) * 100);
    document.getElementById('hud-streak').textContent = state.streak;
    document.getElementById('hud-chroma-chance').textContent = `Chroma ${chromaPct}%`;
    document.getElementById('hud-streak-bonus').textContent = `(+${streakBonusPct}% Chroma)`;

    document.getElementById('hud-dex-count').textContent = `${GameEngine.getDiscoveredCount()} / ${SPECIES_LIST.length}`;
    document.getElementById('hud-dex-chroma').textContent = `(${GameEngine.getChromaticDiscoveredCount()} 🌈)`;
    document.getElementById('hud-pity-mini').textContent = `Chance ${state.pity}%`;

    document.getElementById('btn-sound').textContent = state.soundEnabled ? '🔊 Son : ON' : '🔇 Son : OFF';
    document.getElementById('hud-victory-badge').style.display = state.guardianDefeated ? 'inline' : 'none';
  },

  renderNavBadges() {
    const unstableCount = state.enclosures.filter(e => e.unlocked && e.unstable).length;
    const bEnc = document.getElementById('badge-enclosures');
    bEnc.style.display = unstableCount > 0 ? 'grid' : 'none';
    bEnc.textContent = unstableCount;

    const readyEggs = state.incubators.filter(i => i.unlocked && i.egg && i.egg.remainingSec <= 0).length;
    const bInc = document.getElementById('badge-incubator');
    bInc.style.display = readyEggs > 0 ? 'grid' : 'none';
    bInc.textContent = readyEggs;

    const fusableCount = GameEngine.getFusableGroups().length;
    const bFus = document.getElementById('badge-fusion');
    bFus.style.display = fusableCount > 0 ? 'grid' : 'none';
    bFus.textContent = fusableCount;

    const gBtn = document.getElementById('btn-guardian-tab');
    gBtn.classList.toggle('won', state.guardianDefeated);
  },
};
