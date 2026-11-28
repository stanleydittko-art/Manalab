/* ==========================================================================
   [8. UI - RÉGLAGES]
   Réglages (accessibilité, sauvegarde), panneau enseignant, bilan, succès
   Extension de UI (défini dans 8-ui.js)
   ========================================================================== */
Object.assign(UI, {
  applySettings() {
    const root = document.documentElement;
    root.classList.toggle('big-font', !!state.settings.bigFont);
    root.classList.toggle('high-contrast', !!state.settings.contrast);
  },

  openSettingsModal() {
    const st = state.settings;
    this.openModal(`
      <div>
        <h2 style="margin-bottom:12px;text-align:center;">⚙️ Réglages</h2>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="set-font" class="btn btn-ghost">🔠 Grande police : ${st.bigFont ? 'OUI' : 'NON'}</button>
          <button id="set-contrast" class="btn btn-ghost">🌓 Contraste élevé : ${st.contrast ? 'OUI' : 'NON'}</button>
          <button id="set-save" class="btn btn-ghost">💾 Sauvegarde (export / import)</button>
          <button id="set-teacher" class="btn btn-ghost">🎓 Mode enseignant</button>
          <button id="set-reset" class="btn btn-danger">↺ Nouvelle partie</button>
          <button id="set-close" class="btn btn-primary">Fermer</button>
        </div>
      </div>
    `);
    const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
    on('set-font', () => { st.bigFont = !st.bigFont; this.applySettings(); Storage.save(); this.openSettingsModal(); });
    on('set-contrast', () => { st.contrast = !st.contrast; this.applySettings(); Storage.save(); this.openSettingsModal(); });
    on('set-save', () => this.openSaveModal());
    on('set-teacher', () => this.openTeacherModal());
    on('set-reset', () => this.openResetConfirmModal());
    on('set-close', () => this.closeModal());
  },

  // --- Export / import de la sauvegarde (code texte copiable) ---
  openSaveModal() {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    this.openModal(`
      <div>
        <h2 style="margin-bottom:8px;text-align:center;">💾 Sauvegarde</h2>
        <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:8px;">Copie ce code pour retrouver ta partie sur un autre appareil :</p>
        <textarea id="save-export" readonly rows="3" class="code-area">${code}</textarea>
        <button id="save-copy" class="btn btn-primary" style="width:100%;margin:8px 0 14px;">📋 Copier le code</button>
        <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:8px;">Ou colle un code ici pour importer une partie :</p>
        <textarea id="save-import" rows="3" class="code-area" placeholder="Colle le code ici"></textarea>
        <div style="display:flex;gap:10px;margin-top:8px;">
          <button id="save-back" class="btn btn-ghost" style="flex:1;">Retour</button>
          <button id="save-load" class="btn btn-gold" style="flex:1;">Importer</button>
        </div>
      </div>
    `);
    document.getElementById('save-copy').addEventListener('click', async () => {
      const area = document.getElementById('save-export');
      try { await navigator.clipboard.writeText(area.value); this.showToast('Code copié !', 'cyan'); }
      catch (e) { area.select(); this.showToast('Sélectionné : copie-le à la main.', 'cyan'); }
    });
    document.getElementById('save-back').addEventListener('click', () => this.openSettingsModal());
    document.getElementById('save-load').addEventListener('click', () => {
      try {
        const txt = document.getElementById('save-import').value.trim();
        const parsed = JSON.parse(decodeURIComponent(escape(atob(txt))));
        if (!parsed || !Array.isArray(parsed.enclosures)) throw new Error('format');
        state = Storage.migrate(parsed);
        Storage.save();
        location.reload();
      } catch (e) {
        this.showToast('Code invalide : la partie actuelle est conservée.', 'danger');
      }
    });
  },

  // --- Panneau enseignant (après saisie du code) ---
  openTeacherPanel() {
    const grades = [[1, '6e'], [2, '5e'], [3, '4e'], [4, '3e / Tous']];
    this.openModal(`
      <div>
        <h2 style="margin-bottom:10px;text-align:center;">🎓 Espace enseignant</h2>
        <div style="font-size:0.84rem;color:var(--text-muted);margin-bottom:6px;">Niveau des exercices :</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
          ${grades.map(([g, l]) => `<button class="btn btn-sm ${state.grade === g ? 'btn-primary' : 'btn-ghost'}" data-grade="${g}" style="flex:1 1 40%;">${l}</button>`).join('')}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="tp-report" class="btn btn-primary">📊 Bilan de l'élève</button>
          <button id="tp-unlock" class="btn btn-gold">🔓 Tout débloquer</button>
          <button id="tp-close" class="btn btn-ghost">Fermer</button>
        </div>
      </div>
    `);
    document.querySelectorAll('#modal-box [data-grade]').forEach(b => b.addEventListener('click', () => {
      state.grade = Number(b.dataset.grade);
      ExerciseGenerators.grade = state.grade;
      Storage.save();
      this.openTeacherPanel();
    }));
    document.getElementById('tp-report').addEventListener('click', () => this.openReportModal());
    document.getElementById('tp-unlock').addEventListener('click', () => {
      GameEngine.unlockAll();
      Storage.save();
      this.closeModal();
      this.showToast('🎓 Tout est débloqué.', 'gold');
      this.renderDirty();
    });
    document.getElementById('tp-close').addEventListener('click', () => this.closeModal());
  },

  openReportModal() {
    const r = GameEngine.getReport();
    const fmt = v => (v === null ? '—' : `${v} %`);
    const rowsHtml = r.rows.map(x => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;font-size:0.86rem;"><span>${x.label}</span><strong>${fmt(x.pct)} (${x.ok}/${x.total})</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${x.pct || 0}%;background:linear-gradient(90deg,#14b8a6,#38bdf8);"></div></div>
      </div>`).join('');
    const missedHtml = r.missed.length === 0
      ? '<div style="font-size:0.84rem;color:var(--text-muted);">Aucune erreur enregistrée.</div>'
      : r.missed.map(m => `<div style="font-size:0.82rem;margin-bottom:6px;">❌ ${m.prompt} <em>(ratée ${m.wrong}×)</em></div>`).join('');
    const text = [
      'Bilan ManaLab',
      `Réussite globale : ${fmt(r.pct)} (${r.won}/${r.total})`,
      ...r.rows.map(x => `${x.label} : ${fmt(x.pct)} (${x.ok}/${x.total})`),
      `Meilleure série : ${r.bestStreak} — Œufs : ${r.eggs} — Espèces : ${r.species}`,
      ...r.missed.map(m => `À revoir : ${m.prompt}`)
    ].join('\n');
    this.openModal(`
      <div>
        <h2 style="margin-bottom:10px;text-align:center;">📊 Bilan</h2>
        <div style="font-size:0.9rem;margin-bottom:10px;">Réussite globale : <strong>${fmt(r.pct)}</strong> (${r.won}/${r.total}) • Meilleure série : <strong>${r.bestStreak}</strong></div>
        ${rowsHtml}
        <div style="font-weight:800;margin:10px 0 6px;">À revoir</div>
        ${missedHtml}
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button id="rp-back" class="btn btn-ghost" style="flex:1;">Retour</button>
          <button id="rp-copy" class="btn btn-primary" style="flex:1;">📋 Copier</button>
        </div>
      </div>
    `);
    document.getElementById('rp-back').addEventListener('click', () => this.openTeacherPanel());
    document.getElementById('rp-copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); this.showToast('Bilan copié !', 'cyan'); }
      catch (e) { this.showToast('Copie impossible sur cet appareil.', 'danger'); }
    });
  },

  // Section « Succès » (affichée dans le ManaDex)
  achievementsHtml() {
    const items = ACHIEVEMENTS.map(a => {
      const got = !!state.achievements[a.id];
      return `<div class="achv ${got ? 'got' : ''}"><span class="achv-ico">${got ? a.icon : '🔒'}</span><span>${a.label}</span></div>`;
    }).join('');
    const n = ACHIEVEMENTS.filter(a => state.achievements[a.id]).length;
    return `<div class="panel-title" style="margin:16px 0 8px;">🏆 Succès (${n}/${ACHIEVEMENTS.length})</div><div class="achv-grid">${items}</div>`;
  }
});
