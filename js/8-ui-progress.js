/* ==========================================================================
   [8. UI - PROGRESSION]
   Onglets verrouillés, HUD progressif, « Mission du moment », mode enseignant
   Extension de UI (défini dans 8-ui.js)
   ========================================================================== */
Object.assign(UI, {
  // Onglet -> clé de CONFIG.PROGRESSION (les onglets absents sont toujours ouverts)
  TAB_LOCKS: { enclosures: 'enclosures', fusion: 'fusion', manadex: 'manadex', guardian: 'guardian' },

  isTabLocked(tabName) {
    const key = this.TAB_LOCKS[tabName];
    return !!key && !state.unlocked[key];
  },

  lockedHint(tabName) {
    const key = this.TAB_LOCKS[tabName];
    return `🔒 Débloqué après : ${CONFIG.PROGRESSION[key].hint}`;
  },

  renderProgress() {
    // Onglets verrouillés (visibles, grisés, avec la condition d'accès)
    document.querySelectorAll('.nav-tab').forEach(btn => {
      const tab = btn.dataset.tab || (btn.id === 'btn-guardian-tab' ? 'guardian' : null);
      btn.classList.toggle('locked', !!tab && this.isTabLocked(tab));
    });

    // Compteurs du HUD révélés progressivement
    const show = (id, visible, display = '') => {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? display : 'none';
    };
    show('badge-mana-pure', state.unlocked.enclosures, 'inline-flex');
    show('badge-mana-prismatic', state.unlocked.fusion, 'inline-flex');
    show('chip-streak', state.unlocked.producer);
    show('chip-dex', state.unlocked.manadex);

    // Mission du moment + pulsation de l'onglet à ouvrir
    const mission = GameEngine.getMission();
    const bubble = document.getElementById('mission-bubble');
    document.querySelectorAll('.nav-tab.pulse').forEach(b => b.classList.remove('pulse'));
    if (!mission) {
      bubble.style.display = 'none';
      bubble.dataset.tab = '';
      return;
    }
    bubble.style.display = '';
    bubble.dataset.tab = mission.tab;
    bubble.textContent = `🎯 ${mission.text}`;
    const target = mission.tab === 'guardian'
      ? document.getElementById('btn-guardian-tab')
      : document.querySelector(`.nav-tab[data-tab="${mission.tab}"]`);
    if (target && this.activeTab !== mission.tab) target.classList.add('pulse');
  },

  // Ouvre l'onglet visé, ou affiche la condition de déblocage s'il est verrouillé
  goToTab(tabName) {
    if (this.isTabLocked(tabName)) {
      this.showToast(this.lockedHint(tabName), 'cyan');
      return;
    }
    if (tabName === 'guardian') this.openGuardianModal();
    else this.switchTab(tabName);
  },

  // --- Réservoir d'Éclats (affiché en haut de l'onglet Enclos) ---
  reservoirHtml() {
    const cap = GameEngine.getReservoirCap();
    const pct = Math.round(GameEngine.getReservoirRatio() * 100);
    const gain = GameEngine.getCollectGain();
    return `
      <div class="reservoir-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <strong>💎 Réservoir d'Éclats ${this.tipBtn('reservoir')}</strong>
          <span data-res-txt style="font-size:0.84rem;">${Utils.formatNum(Math.floor(state.reservoir))} / ${Utils.formatNum(Math.floor(cap))} ✦</span>
        </div>
        <div class="progress-track"><div data-res-bar class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,#14b8a6,#facc15);"></div></div>
        <button class="btn btn-gold" data-action="collect" ${gain > 0 ? '' : 'disabled'}>💎 Récolter (flash-quiz) <span data-res-gain>+${Utils.formatNum(gain)}</span> ✦</button>
      </div>`;
  },

  // Mise à jour légère (1 Hz) du réservoir, sans redessiner l'onglet
  updateReservoirDisplay() {
    const txt = document.querySelector('[data-res-txt]');
    if (!txt) return;
    const cap = GameEngine.getReservoirCap();
    txt.textContent = `${Utils.formatNum(Math.floor(state.reservoir))} / ${Utils.formatNum(Math.floor(cap))} ✦`;
    document.querySelector('[data-res-bar]').style.width = `${Math.round(GameEngine.getReservoirRatio() * 100)}%`;
    const gainEl = document.querySelector('[data-res-gain]');
    if (gainEl) gainEl.textContent = `+${Utils.formatNum(GameEngine.getCollectGain())}`;
    const btn = document.querySelector('[data-action="collect"]');
    if (btn) btn.disabled = GameEngine.getCollectGain() <= 0;
  },

  // --- Aides contextuelles (bouton ❓) ---
  tipBtn(key) {
    return `<button class="tip-btn" data-action="show-tip" data-tip="${key}" aria-label="Aide">❓</button>`;
  },

  showTip(key) {
    const tip = TIPS[key];
    if (!tip) return;
    state.seenTips[key] = true;
    this.openModal(`
      <div style="text-align:center;">
        <h2 style="margin-bottom:10px;">${tip.title}</h2>
        <p style="font-size:0.95rem;line-height:1.45;margin-bottom:16px;">${tip.text}</p>
        <button id="btn-tip-ok" class="btn btn-primary" style="width:100%;">OK, compris !</button>
      </div>
    `);
    document.getElementById('btn-tip-ok').addEventListener('click', () => this.closeModal());
  },

  // Explication d'une seule phrase à la 1re visite d'un onglet
  maybeShowFirstTip(tabName) {
    if (FIRST_VISIT_TIPS.includes(tabName) && !state.seenTips[tabName] && !this._modalOpen) {
      this.showTip(tabName);
      Storage.save();
    }
  },

  // Bouton de lancement d'un exercice, ou condition de déblocage du palier
  tierButton(diff, cls, label) {
    if (GameEngine.isExerciseTierOpen(diff)) {
      return `<button class="btn ${cls}" data-action="start-exercise" data-diff="${diff}">▶ Lancer (${label})</button>`;
    }
    const need = CONFIG.EXERCISE_TIER_REQ[diff];
    return `<button class="btn btn-ghost" disabled>🔒 ${state.stats.exercisesWon}/${need} bonnes réponses</button>`;
  },

  openTeacherModal() {
    this.openModal(`
      <div style="text-align:center;">
        <h2 style="margin-bottom:8px;">🎓 Mode enseignant</h2>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:12px;">
          Saisis le code enseignant.
        </p>
        <input id="teacher-code" type="password" autocomplete="off" autocapitalize="off"
          style="width:100%;min-height:44px;padding:10px;border-radius:10px;border:1px solid var(--glass-border);background:rgba(0,0,0,0.35);color:#fff;font-size:1rem;margin-bottom:12px;">
        <div style="display:flex;gap:10px;justify-content:center;">
          <button id="btn-teacher-cancel" class="btn btn-ghost" style="flex:1;">Annuler</button>
          <button id="btn-teacher-ok" class="btn btn-primary" style="flex:1;">Valider</button>
        </div>
      </div>
    `);
    const submit = () => {
      const val = document.getElementById('teacher-code').value.trim();
      if (val === CONFIG.TEACHER_CODE) {
        this.openTeacherPanel();
      } else {
        this.showToast('Code incorrect.', 'danger');
      }
    };
    document.getElementById('btn-teacher-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-teacher-ok').addEventListener('click', submit);
    document.getElementById('teacher-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }
});
