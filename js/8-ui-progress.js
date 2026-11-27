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

  openTeacherModal() {
    this.openModal(`
      <div style="text-align:center;">
        <h2 style="margin-bottom:8px;">🎓 Mode enseignant</h2>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:12px;">
          Saisis le code pour débloquer toutes les fonctionnalités.
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
        GameEngine.unlockAll();
        Storage.save();
        this.closeModal();
        this.showToast('🎓 Mode enseignant : tout est débloqué.', 'gold');
        this.renderDirty();
      } else {
        this.showToast('Code incorrect.', 'danger');
      }
    };
    document.getElementById('btn-teacher-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-teacher-ok').addEventListener('click', submit);
    document.getElementById('teacher-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }
});
