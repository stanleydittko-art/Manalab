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
    if (this.dirty.hud) { this.renderHUD(); this.dirty.hud = false; }
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

  // --- ONGLET 1 : ENCLOS ---
  renderEnclosures() {
    const container = document.getElementById('tab-enclosures');
    const nextBoostCost = CONFIG.LAB_BOOST_COSTS[state.labBoostLevel];
    const nextLockedEnc = state.enclosures.find(e => !e.unlocked);

    const enclosuresHtml = state.enclosures.filter(e => e.unlocked).map(enc => {
      const stats = GameEngine.computeEnclosureStats(enc);
      const slotsHtml = enc.slots.map(uid => {
        if (!uid) {
          return `<div class="slot-box empty-clickable" data-action="quick-fill" data-enc="${enc.id}">
            <span style="font-size:1.3rem;opacity:0.45;">＋</span>
            <span style="font-size:0.7rem;color:var(--text-dim);">Emplacement libre</span>
          </div>`;
        }
        const sp = state.specimens[uid];
        const def = SPECIES[sp.speciesId];
        return `<div class="slot-box filled ${sp.chromatic ? 'chromatic-card' : ''}">
          <button class="slot-remove-btn" data-action="remove-specimen" data-uid="${uid}" title="Envoyer en réserve">×</button>
          <div class="creature-svg-sm">${getSpeciesSVG(def.id, sp.chromatic)}</div>
          <div style="font-size:0.74rem;font-weight:800;line-height:1.15;">${def.name}</div>
          <div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center;">
            <span class="type-pill">${def.type}</span>
            ${sp.chromatic ? '<span class="chromatic-badge">🌈 ×3</span>' : ''}
          </div>
          <div style="font-size:0.72rem;color:var(--accent-cyan);font-weight:700;">+${def.prod * (sp.chromatic ? 3 : 1)}/s</div>
        </div>`;
      }).join('');

      return `<div class="enclosure-card ${enc.unstable ? 'unstable' : ''}">
        <div class="enclosure-head">
          <div>
            <div style="font-weight:800;font-size:0.98rem;">${enc.name}</div>
            <div style="font-size:0.76rem;color:var(--text-muted);">Production : <strong style="color:#2ef2e0;">+${stats.finalProd.toFixed(1).replace(/\.0$/, '')} Éclats/s</strong></div>
          </div>
          ${stats.chromaAura > 0 ? `<span class="chromatic-badge">Aura +${Math.round(stats.chromaAura * 100)}%</span>` : ''}
        </div>

        ${enc.unstable ? `
          <div class="unstable-alert">
            <span>⚠️ <strong>ADN instable (-50% prod.)</strong> — Révision mémoire requise !</span>
            <button class="btn btn-sm btn-danger" data-action="stabilize" data-enc="${enc.id}">🧬 Stabiliser (10s)</button>
          </div>
        ` : ''}

        <div class="enclosure-slots">${slotsHtml}</div>

        <div class="synergy-banner">
          ${stats.activeSynergy
            ? `<span>✨ Synergie : <strong>${stats.activeSynergy.name}</strong></span><strong style="color:#2ef2e0;">+${Math.round(stats.synBonus * 100)}%</strong>`
            : `<span style="color:var(--text-muted);">💡 Astuce : combine 2 types différents (ex. Flore + Faune) pour +25% !</span>`}
        </div>
      </div>`;
    }).join('');

    // Réserve (spécimens non placés)
    const reserve = GameEngine.getReserveSpecimens();
    const unlockedEnclosures = state.enclosures.filter(e => e.unlocked);
    const hasFreeSlot = unlockedEnclosures.some(e => e.slots.includes(null));

    const reserveHtml = reserve.length === 0
      ? `<div style="text-align:center;padding:18px;color:var(--text-muted);font-size:0.86rem;">
          Ta réserve est vide. Fais des <strong>Exercices</strong> puis passe à l'<strong>Incubateur</strong> pour faire éclore de nouveaux spécimens !
        </div>`
      : `<div class="inventory-grid">
          ${reserve.map(sp => {
            const def = SPECIES[sp.speciesId];
            return `<div class="specimen-card ${sp.chromatic ? 'chromatic-card' : ''}">
              <div class="creature-svg-sm">${getSpeciesSVG(def.id, sp.chromatic)}</div>
              <div style="font-weight:800;font-size:0.86rem;">${def.name}</div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;">
                <span class="rarity-pill rar-${def.rarity}">${CONFIG.RARITY_LABELS[def.rarity]}</span>
                <span class="type-pill">${def.type}</span>
                ${sp.chromatic ? '<span class="chromatic-badge">🌈 Chroma</span>' : ''}
              </div>
              <div style="font-size:0.78rem;color:var(--accent-cyan);font-weight:700;">+${def.prod * (sp.chromatic ? 3 : 1)} Éclats/s</div>
              <button class="btn btn-sm btn-primary" style="width:100%;" data-action="place-auto" data-uid="${sp.uid}" ${hasFreeSlot ? '' : 'disabled'}>
                ${hasFreeSlot ? '🏝️ Placer en enclos' : 'Enclos pleins'}
              </button>
            </div>`;
          }).join('')}
        </div>`;

    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">🏝️ Enclos du Lagon Bioluminescent</div>
            <div class="panel-desc">Place tes mutants pour générer des Éclats en continu et activer des synergies d'écosystème.</div>
          </div>
          <button class="btn btn-sm btn-ghost" data-action="goto-tab" data-target="exercises">⚡ Gagner du Mana</button>
        </div>
        <div class="enclosures-grid">${enclosuresHtml}</div>
        <div class="upgrades-row">
          ${nextLockedEnc ? `
            <button class="btn upgrade-pill-btn" data-action="unlock-enclosure" data-enc="${nextLockedEnc.id}" ${state.shards >= CONFIG.ENCLOSURE_COSTS[nextLockedEnc.id] ? '' : 'disabled'}>
              <span>🔓 Débloquer ${nextLockedEnc.name} (+3 places)</span>
              <strong>${Utils.formatNum(CONFIG.ENCLOSURE_COSTS[nextLockedEnc.id])} ✦</strong>
            </button>` : ''}
          ${nextBoostCost !== undefined ? `
            <button class="btn upgrade-pill-btn btn-purple" data-action="buy-lab-boost" ${state.shards >= nextBoostCost ? '' : 'disabled'}>
              <span>🔬 Amplificateur Labo Niv.${state.labBoostLevel + 1} (+20% prod. globale)</span>
              <strong>${Utils.formatNum(nextBoostCost)} ✦</strong>
            </button>` : '<span class="biome-pill">🔬 Amplificateur au niveau MAX (+80%)</span>'}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">📦 Réserve du Laboratoire (${reserve.length})</div>
            <div class="panel-desc">Les spécimens en réserve peuvent être placés en enclos ou fusionnés dans l'onglet Fusion.</div>
          </div>
        </div>
        ${reserveHtml}
      </div>
    `;
  },

  // --- ONGLET 2 : INCUBATEUR & PROBABILITÉS ---
  renderIncubator() {
    const container = document.getElementById('tab-incubator');
    const sel = state.manaSelection;
    const totalSel = sel.raw + sel.pure + sel.prismatic;
    const odds = ProbaEngine.computeOdds(sel);
    const chromaPct = Math.round(ProbaEngine.getChromaticChance() * 100);
    const freeInc = state.incubators.find(i => i.unlocked && !i.egg);
    const nextLockedInc = state.incubators.find(i => !i.unlocked);

    const manaControls = [
      { key: 'raw', label: 'Mana Brut', badge: 'mana-raw', desc: 'Facile • -9% Commun → +Rare', stock: state.mana.raw },
      { key: 'pure', label: 'Mana Pur', badge: 'mana-pure', desc: 'Moyen • -18% Commun → +Rare/Épique', stock: state.mana.pure },
      { key: 'prismatic', label: 'Mana Prismatique', badge: 'mana-prismatic', desc: 'Difficile • -30% Commun → +Épique/Lég.', stock: state.mana.prismatic }
    ].map(m => `
      <div class="mana-control">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="mana-badge ${m.badge}">${m.label}</span>
          <span style="font-size:0.78rem;color:var(--text-muted);">Stock : <strong>${m.stock}</strong></span>
        </div>
        <div style="font-size:0.74rem;color:var(--text-dim);">${m.desc}</div>
        <div class="mana-stepper">
          <button class="stepper-btn" data-action="mana-step" data-mana="${m.key}" data-delta="-1" ${sel[m.key] <= 0 ? 'disabled' : ''}>−</button>
          <span style="font-size:1.15rem;font-weight:800;">${sel[m.key]}</span>
          <button class="stepper-btn" data-action="mana-step" data-mana="${m.key}" data-delta="1" ${(sel[m.key] >= m.stock || totalSel >= CONFIG.MAX_MANA_PER_EGG) ? 'disabled' : ''}>+</button>
        </div>
      </div>
    `).join('');

    const podsHtml = state.incubators.filter(i => i.unlocked).map(inc => {
      if (!inc.egg) {
        return `<div class="incubator-pod">
          <div style="font-weight:800;font-size:0.92rem;">Incubateur #${inc.id + 1}</div>
          <div style="text-align:center;padding:16px 0;color:var(--text-dim);font-size:0.84rem;">
            Vide — Prêt à recevoir un œuf mutant.
          </div>
        </div>`;
      }
      const ready = inc.egg.remainingSec <= 0;
      const pct = Math.min(100, Math.round(((inc.egg.durationSec - inc.egg.remainingSec) / inc.egg.durationSec) * 100));
      const o = inc.egg.odds;
      return `<div class="incubator-pod ${ready ? 'ready' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:800;font-size:0.92rem;">Incubateur #${inc.id + 1}</span>
          <span class="biome-pill" data-inc-timer="${inc.id}">${ready ? 'PRÊT !' : Math.ceil(inc.egg.remainingSec) + 's'}</span>
        </div>
        <div class="egg-visual ${ready ? 'egg-wobble' : ''}">${getEggSVG(inc.egg.overchargeWon)}</div>
        <div style="font-size:0.74rem;color:var(--text-muted);text-align:center;">
          C:${o.common}% • R:${o.rare}% • É:${o.epic}% • L:${o.legendary}%
        </div>
        <div class="progress-track">
          <div class="progress-fill" data-inc-bar="${inc.id}" style="width:${pct}%;background:${ready ? 'linear-gradient(90deg,#facc15,#fef08a)' : 'linear-gradient(90deg,#14b8a6,#38bdf8)'};"></div>
        </div>
        ${ready
          ? `<button class="btn btn-gold" data-action="open-hatch-modal" data-inc="${inc.id}">✨ Ouvrir / Surcharger l'Œuf</button>`
          : `<button class="btn btn-sm btn-purple" data-action="accelerate-egg" data-inc="${inc.id}">⚡ Accélérer (Flash-Quiz 10s)</button>`}
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">🧪 Synthèse & Probabilités en Direct</div>
            <div class="panel-desc">Injecte jusqu'à ${CONFIG.MAX_MANA_PER_EGG} doses de Mana pour manipuler les pourcentages avant d'incuber.</div>
          </div>
          <span class="chromatic-badge">🌈 Chance Chromatique : ${chromaPct}%</span>
        </div>

        <div class="proba-bar-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <strong style="font-size:0.88rem;">
              ${odds.pityTriggered ? '🔥 JAUGE DE CHANCE À 100% : Épique ou Légendaire GARANTI !' : `Distribution de l'œuf (${totalSel}/${CONFIG.MAX_MANA_PER_EGG} doses injectées)`}
            </strong>
            <span style="font-size:0.76rem;color:var(--text-muted);">Total exact : 100%</span>
          </div>

          <div class="proba-bar-track">
            <div class="proba-seg common" style="width:${odds.common}%">${odds.common >= 11 ? odds.common + '%' : ''}</div>
            <div class="proba-seg rare" style="width:${odds.rare}%">${odds.rare >= 11 ? odds.rare + '%' : ''}</div>
            <div class="proba-seg epic" style="width:${odds.epic}%">${odds.epic >= 9 ? odds.epic + '%' : ''}</div>
            <div class="proba-seg legendary" style="width:${odds.legendary}%">${odds.legendary >= 8 ? odds.legendary + '%' : ''}</div>
          </div>

          <div class="proba-legend">
            <div class="proba-legend-item"><span class="rarity-pill rar-common">Commun</span><strong>${odds.common}%</strong></div>
            <div class="proba-legend-item"><span class="rarity-pill rar-rare">Rare</span><strong>${odds.rare}%</strong></div>
            <div class="proba-legend-item"><span class="rarity-pill rar-epic">Épique</span><strong>${odds.epic}%</strong></div>
            <div class="proba-legend-item"><span class="rarity-pill rar-legendary">Légendaire</span><strong>${odds.legendary}%</strong></div>
          </div>

          <div class="pity-bar-wrap">
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;">
              <span>🍀 <strong>Jauge de Chance Garantie (Pity)</strong> : +10% par Commun tiré</span>
              <strong style="color:#facc15;">${state.pity}% / 100%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${state.pity}%;background:linear-gradient(90deg,#c084fc,#facc15);"></div>
            </div>
          </div>
        </div>

        <div class="mana-selector-grid">${manaControls}</div>

        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;">
          <button class="btn btn-lg btn-primary" data-action="start-incubation" ${(!freeInc || totalSel === 0) ? 'disabled' : ''}>
            🥚 Lancer l'Incubation (${Math.round(CONFIG.INCUBATION_BASE_SEC + totalSel * CONFIG.INCUBATION_PER_MANA_SEC)}s)
          </button>
          ${totalSel === 0 ? `<button class="btn btn-sm btn-ghost" data-action="goto-tab" data-target="exercises">⚡ Faire un exercice pour gagner du Mana</button>` : ''}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">🥚 Cuves d'Incubation</div>
            <div class="panel-desc">Quand un œuf est prêt, tu peux l'ouvrir ou risquer une <strong>Surcharge (Stop ou Encore)</strong> !</div>
          </div>
          ${nextLockedInc ? `
            <button class="btn btn-sm btn-gold" data-action="unlock-incubator" data-inc="${nextLockedInc.id}" ${state.shards >= CONFIG.INCUBATOR_COSTS[nextLockedInc.id] ? '' : 'disabled'}>
              🔓 Incubateur #${nextLockedInc.id + 1} (${Utils.formatNum(CONFIG.INCUBATOR_COSTS[nextLockedInc.id])} ✦)
            </button>` : ''}
        </div>
        <div class="incubators-list">${podsHtml}</div>
      </div>
    `;
  },

  // --- ONGLET 3 : EXERCICES (MANA) ---
  renderExercises() {
    const container = document.getElementById('tab-exercises');
    const chromaPct = Math.round(ProbaEngine.getChromaticChance() * 100);
    const accuracy = state.stats.exercisesTotal > 0
      ? Math.round((state.stats.exercisesWon / state.stats.exercisesTotal) * 100)
      : 100;

    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">⚡ Extraction de Mana par Exercices</div>
            <div class="panel-desc">Plus le défi est difficile, plus le Mana extrait fait grimper tes probabilités d'Épique et Légendaire !</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span class="biome-pill">Précision : ${accuracy}%</span>
            <span class="chromatic-badge">🔥 Série ${state.streak} → Chroma ${chromaPct}%</span>
          </div>
        </div>

        <div class="exercise-tiers">
          <div class="tier-card easy">
            <div>
              <span class="rarity-pill rar-common">★ Facile</span>
              <h3 style="margin:8px 0 4px;">Calcul Mental Rapide</h3>
              <p style="font-size:0.83rem;color:var(--text-muted);">Additions, soustractions, tables de multiplication et moitiés.</p>
            </div>
            <div style="font-size:0.82rem;color:#a7f3d0;">
              Récompense : <strong>+1 Mana Brut ●</strong> + 8 ✦
            </div>
            <button class="btn btn-primary" data-action="start-exercise" data-diff="easy">▶ Lancer (Facile)</button>
          </div>

          <div class="tier-card medium">
            <div>
              <span class="rarity-pill rar-rare">★★ Moyen</span>
              <h3 style="margin:8px 0 4px;">Pourcentages & Probas Simples</h3>
              <p style="font-size:0.83rem;color:var(--text-muted);">10%, 25%, 50%, 75%, multiplications et tirages de probabilités simples.</p>
            </div>
            <div style="font-size:0.82rem;color:#bae6fd;">
              Récompense : <strong>+1 Mana Pur ◆</strong> + 18 ✦
            </div>
            <button class="btn btn-primary" data-action="start-exercise" data-diff="medium">▶ Lancer (Moyen)</button>
          </div>

          <div class="tier-card hard">
            <div>
              <span class="rarity-pill rar-epic">★★★ Difficile</span>
              <h3 style="margin:8px 0 4px;">Probas Avancées & % Inverses</h3>
              <p style="font-size:0.83rem;color:var(--text-muted);">Retrouver 100%, événements complémentaires, unions et tirages indépendants.</p>
            </div>
            <div style="font-size:0.82rem;color:#f3e8ff;">
              Récompense : <strong>+1 Mana Prismatique ★</strong> + 35 ✦
            </div>
            <button class="btn btn-purple" data-action="start-exercise" data-diff="hard">▶ Lancer (Difficile)</button>
          </div>
        </div>

        <div style="margin-top:14px;padding:12px;border-radius:var(--radius-sm);background:rgba(46,242,224,0.08);border:1px solid rgba(46,242,224,0.22);font-size:0.82rem;color:#cde8f5;">
          🔥 <strong>Règle de Série (Combo) :</strong> Chaque bonne réponse d'affilée ajoute <strong>+5% de chance Chromatique</strong> (spécimen arc-en-ciel valant <strong>×3</strong>), et chaque palier de 3 réussites offre <strong>+1 dose de Mana bonus</strong> ! Attention : une erreur remet le combo à 0.
        </div>
      </div>
    `;
  },

  // --- ONGLET 4 : FUSION RISQUÉE ---
  renderFusion() {
    const container = document.getElementById('tab-fusion');
    const groups = GameEngine.getFusableGroups();

    // Vérifier aussi s'il y a des doublons placés en enclos pour aider le joueur
    const allCounts = {};
    Object.values(state.specimens).forEach(sp => {
      if (SPECIES[sp.speciesId].rarity === 'legendary') return;
      allCounts[sp.speciesId] = (allCounts[sp.speciesId] || 0) + 1;
    });
    const placedDuplicates = Object.entries(allCounts)
      .filter(([id, cnt]) => cnt >= 2 && !groups.some(g => g.speciesDef.id === id))
      .map(([id]) => SPECIES[id].name);

    const listHtml = groups.length === 0
      ? `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.88rem;">
          Tu as besoin d'au moins <strong>2 doublons identiques en réserve</strong> (Commun, Rare ou Épique) pour tenter une fusion.
          ${placedDuplicates.length > 0 ? `<div style="margin-top:10px;color:#facc15;">💡 Tu possèdes des doublons de <strong>${placedDuplicates.join(', ')}</strong> actuellement placés en enclos : retire-les vers la réserve pour les fusionner !</div>` : ''}
        </div>`
      : `<div class="fusion-grid">
          ${groups.map(g => {
            const def = g.speciesDef;
            const nextRar = CONFIG.RARITY_ORDER[CONFIG.RARITY_ORDER.indexOf(def.rarity) + 1];
            const canSafe = g.list.length >= CONFIG.FUSION_SAFE_COUNT;
            return `<div class="fusion-card">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="creature-svg-sm">${getSpeciesSVG(def.id, false)}</div>
                <div>
                  <div style="font-weight:800;">${def.name}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted);">En réserve : <strong style="color:#fff;">×${g.list.length}</strong></div>
                  <div style="margin-top:4px;display:flex;align-items:center;gap:6px;">
                    <span class="rarity-pill rar-${def.rarity}">${CONFIG.RARITY_LABELS[def.rarity]}</span>
                    <span>→</span>
                    <span class="rarity-pill rar-${nextRar}">${CONFIG.RARITY_LABELS[nextRar]}</span>
                  </div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
                <button class="btn btn-primary" data-action="fuse" data-species="${def.id}" data-mode="safe" ${canSafe ? '' : 'disabled'}>
                  🛡️ Fusion Sûre : 3 doublons (100% réussite)
                </button>
                <button class="btn btn-purple" data-action="fuse" data-species="${def.id}" data-mode="risky">
                  🎲 Fusion Risquée : 2 doublons (65% réussite / 35% perte)
                </button>
              </div>
            </div>`;
          }).join('')}
        </div>`;

    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">🧬 Chambre de Fusion Probabiliste</div>
            <div class="panel-desc">Compare l'espérance de gain : sécurise avec 3 doublons (100%) ou tente le risque avec 2 doublons (65% succès, 35% de perdre 1 spécimen) !</div>
          </div>
        </div>
        ${listHtml}
      </div>
    `;
  },

  // --- ONGLET 5 : MANADEX ---
  renderManaDex() {
    const container = document.getElementById('tab-manadex');
    const discovered = GameEngine.getDiscoveredCount();
    const pct = Math.round((discovered / SPECIES_LIST.length) * 100);

    const cardsHtml = SPECIES_LIST.map(def => {
      const entry = state.manadex[def.id];
      const found = !!(entry && entry.discovered);
      const chroma = !!(entry && entry.chromatic);
      return `<div class="dex-card ${found ? '' : 'locked'} ${chroma ? 'chromatic-card' : ''}">
        <div class="creature-svg-md">${getSpeciesSVG(def.id, chroma)}</div>
        <div style="font-weight:800;font-size:0.94rem;">${found ? def.name : '??? Spécimen Inconnu'}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;">
          <span class="rarity-pill rar-${def.rarity}">${CONFIG.RARITY_LABELS[def.rarity]}</span>
          <span class="type-pill">${def.type}</span>
          ${chroma ? '<span class="chromatic-badge">🌈 Chroma</span>' : ''}
        </div>
        <div style="font-size:0.78rem;color:var(--accent-cyan);font-weight:700;">
          ${found ? `+${def.prod} Éclats/s • Capturés : ${entry.count}` : 'Non découvert'}
        </div>
        <p style="font-size:0.76rem;color:var(--text-muted);line-height:1.35;">
          ${found ? def.desc : 'Explore l’incubateur ou la fusion pour révéler ce spécimen.'}
        </p>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">📘 ManaDex — Lagon Bioluminescent</div>
            <div class="panel-desc">Découvre les ${SPECIES_LIST.length} spécimens mutants et leurs variantes Chromatiques ultra-rares.</div>
          </div>
          <span class="biome-pill">${discovered} / ${SPECIES_LIST.length} (${pct}%)</span>
        </div>
        <div class="progress-track" style="margin-bottom:14px;">
          <div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,#22d39c,#38bdf8,#facc15);"></div>
        </div>
        <div class="manadex-grid">${cardsHtml}</div>
      </div>
    `;
  },

  // --- MODALE DE QUIZ (branchée dans EffortBridge) ---
  openQuizModal(config, onSuccess, onFail) {
    const { title, question, timeLimitSec } = config;
    let answered = false;

    this.openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div style="font-weight:800;font-size:1rem;color:var(--accent-cyan);">${title}</div>
        ${timeLimitSec ? `<span id="quiz-sec-left" class="biome-pill">${timeLimitSec}s</span>` : '<span class="biome-pill">Sans chrono</span>'}
      </div>
      ${question.isReview ? '<div style="margin-top:6px;font-size:0.76rem;color:#fef08a;">🧠 Question de répétition espacée (déjà rencontrée)</div>' : ''}
      ${timeLimitSec ? `<div class="quiz-timer-track"><div id="quiz-timer-fill" class="quiz-timer-fill" style="width:100%;"></div></div>` : '<div style="height:10px;"></div>'}
      <div class="quiz-question-box">${question.prompt}</div>
      <div class="quiz-choices">
        ${question.choices.map((ch, idx) => `<button class="quiz-choice-btn" data-choice="${idx}">${ch}</button>`).join('')}
      </div>
      <div id="quiz-feedback" class="quiz-feedback"></div>
    `);

    const finish = (isCorrect, timedOut = false) => {
      if (answered) return;
      answered = true;
      this._clearQuizTimer();
      GameEngine.recordQuestionResult(question, isCorrect);

      const btns = document.querySelectorAll('#modal-box .quiz-choice-btn');
      btns.forEach((b, i) => {
        b.disabled = true;
        if (i === question.answerIndex) b.classList.add('correct');
      });

      const fb = document.getElementById('quiz-feedback');
      fb.className = `quiz-feedback show ${isCorrect ? 'ok' : 'ko'}`;
      fb.innerHTML = isCorrect
        ? `✅ <strong>Bravo !</strong> ${question.explain}`
        : `❌ <strong>${timedOut ? 'Temps écoulé !' : 'Raté !'}</strong> ${question.explain}`;

      AudioFX.play(isCorrect ? 'correct' : 'wrong');

      setTimeout(() => {
        this.closeModal();
        if (isCorrect) { if (onSuccess) onSuccess(); }
        else { if (onFail) onFail(); }
        this.renderDirty();
      }, 1350);
    };

    document.querySelectorAll('#modal-box .quiz-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.choice);
        if (idx !== question.answerIndex) btn.classList.add('wrong');
        finish(idx === question.answerIndex, false);
      });
    });

    if (timeLimitSec) {
      const start = Date.now();
      const totalMs = timeLimitSec * 1000;
      this._quizInterval = setInterval(() => {
        const leftMs = Math.max(0, totalMs - (Date.now() - start));
        const pct = (leftMs / totalMs) * 100;
        const bar = document.getElementById('quiz-timer-fill');
        const lbl = document.getElementById('quiz-sec-left');
        if (bar) {
          bar.style.width = `${pct}%`;
          if (pct < 30) bar.classList.add('danger');
        }
        if (lbl) lbl.textContent = `${Math.ceil(leftMs / 1000)}s`;
        if (leftMs <= 0) finish(false, true);
      }, 80);
    }
  },

  // --- MODALE D'ÉCLOSION (SUSPENSE + STOP OU ENCORE) ---
  openHatchModal(incId) {
    const inc = state.incubators[incId];
    if (!inc || !inc.egg || inc.egg.remainingSec > 0) return;
    const o = inc.egg.odds;
    const previewOvercharge = ProbaEngine.computeOverchargedOdds(o);

    this.openModal(`
      <div style="text-align:center;">
        <span class="biome-pill">Incubateur #${incId + 1}</span>
        <h2 style="margin:8px 0 4px;">${inc.egg.overchargeWon ? '⚡ ŒUF SURCHARGÉ PRÊT !' : '🥚 L’Œuf Mutant va éclore !'}</h2>
        <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:12px;">
          ${inc.egg.overchargeTried
            ? (inc.egg.overchargeWon ? 'Surcharge réussie ! La rareté minimale a été éliminée !' : 'Surcharge échouée : les probabilités sont retombées au niveau de base.')
            : 'Ouvre maintenant pour sécuriser tes pourcentages, ou tente le Stop ou Encore !'}
        </p>
        <div class="egg-visual egg-wobble" style="width:96px;height:96px;">${getEggSVG(inc.egg.overchargeWon)}</div>

        <div class="proba-bar-track" style="margin:14px 0 8px;">
          <div class="proba-seg common" style="width:${o.common}%">${o.common >= 12 ? o.common + '%' : ''}</div>
          <div class="proba-seg rare" style="width:${o.rare}%">${o.rare >= 12 ? o.rare + '%' : ''}</div>
          <div class="proba-seg epic" style="width:${o.epic}%">${o.epic >= 10 ? o.epic + '%' : ''}</div>
          <div class="proba-seg legendary" style="width:${o.legendary}%">${o.legendary >= 8 ? o.legendary + '%' : ''}</div>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:16px;">
          Commun <strong>${o.common}%</strong> • Rare <strong>${o.rare}%</strong> • Épique <strong>${o.epic}%</strong> • Légendaire <strong>${o.legendary}%</strong>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <button id="btn-hatch-now" class="btn btn-lg btn-gold">✨ Ouvrir l'Œuf maintenant</button>
          ${!inc.egg.overchargeTried ? `
            <button id="btn-overcharge" class="btn btn-purple">
              ⚡ STOP OU ENCORE : Surcharger (Défi 12s)
            </button>
            <div style="font-size:0.74rem;color:var(--text-muted);">
              Si réussi → <strong style="color:#facc15;">C:${previewOvercharge.common}% • R:${previewOvercharge.rare}% • É:${previewOvercharge.epic}% • L:${previewOvercharge.legendary}%</strong><br>
              Si raté → retombe à 65% / 25% / 9% / 1%
            </div>
          ` : ''}
          <button id="btn-hatch-cancel" class="btn btn-sm btn-ghost">Fermer</button>
        </div>
      </div>
    `);

    document.getElementById('btn-hatch-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-hatch-now').addEventListener('click', () => {
      const res = GameEngine.hatchEgg(incId);
      if (res) this.showSpecimenRevealModal(res, '✨ Éclosion Réussie !');
    });

    const overBtn = document.getElementById('btn-overcharge');
    if (overBtn) {
      overBtn.addEventListener('click', () => {
        EffortBridge.requestAction(
          'OVERCHARGE',
          'medium',
          () => {
            GameEngine.applyOverchargeResult(incId, true);
            this.showToast('⚡ SURCHARGE RÉUSSIE ! Rareté minimale éliminée !', 'gold');
            this.openHatchModal(incId);
          },
          () => {
            GameEngine.applyOverchargeResult(incId, false);
            this.showToast('💥 Surcharge ratée : retour aux probabilités de base.', 'danger');
            this.openHatchModal(incId);
          }
        );
      });
    }
  },

  // --- MODALE DE RÉVÉLATION DE SPÉCIMEN (Éclosion ou Fusion) ---
  showSpecimenRevealModal(res, headerText) {
    const { speciesDef, rarity, chromatic, isNewDiscovery, autoPlacedEnc } = res;
    this.openModal(`
      <div style="text-align:center;">
        <div style="font-size:0.84rem;font-weight:800;color:var(--accent-cyan);margin-bottom:6px;">${headerText}</div>
        ${isNewDiscovery ? '<div style="margin-bottom:8px;"><span class="biome-pill" style="background:rgba(250,204,21,0.2);border-color:#facc15;color:#fef08a;">★ NOUVELLE ESPÈCE AU MANADEX !</span></div>' : ''}
        <div class="creature-svg-lg">${getSpeciesSVG(speciesDef.id, chromatic)}</div>
        <h2 style="margin:8px 0 6px;">${speciesDef.name}</h2>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
          <span class="rarity-pill rar-${rarity}">${CONFIG.RARITY_LABELS[rarity]}</span>
          <span class="type-pill">${speciesDef.type}</span>
          ${chromatic ? '<span class="chromatic-badge">🌈 CHROMATIQUE ×3 !</span>' : ''}
        </div>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:10px;">${speciesDef.desc}</p>
        <div style="font-size:0.95rem;font-weight:800;color:#2ef2e0;margin-bottom:14px;">
          Production : +${speciesDef.prod * (chromatic ? 3 : 1)} Éclats/s
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:16px;">
          ${autoPlacedEnc ? `🏝️ Placé automatiquement dans <strong>${autoPlacedEnc}</strong>.` : '📦 Envoyé dans ta <strong>Réserve</strong> (enclos pleins).'}
        </div>
        <button id="btn-reveal-ok" class="btn btn-lg btn-primary" style="width:100%;">Super !</button>
      </div>
    `);
    document.getElementById('btn-reveal-ok').addEventListener('click', () => {
      this.closeModal();
      this.renderDirty();
    });
  },

  // --- MODALE DE SUSPENSE DE FUSION ---
  openFusionSuspenseModal(speciesId, mode) {
    const def = SPECIES[speciesId];
    const chanceText = mode === 'safe' ? '100% (Sécurisée)' : '65% de réussite / 35% de perte';
    AudioFX.play('fuse_charge');
    this.openModal(`
      <div style="text-align:center;">
        <h2 style="margin-bottom:6px;">🧬 Fusion en cours...</h2>
        <p style="font-size:0.85rem;color:var(--text-muted);">Combinaison de ${def.name} • Probabilité : <strong>${chanceText}</strong></p>
        <div class="creature-svg-lg">${getSpeciesSVG(def.id, false)}</div>
        <div class="fusion-spinner-bar"><div id="fusion-fill" class="fusion-spinner-fill"></div></div>
        <div style="font-size:0.8rem;color:var(--accent-cyan);">Stabilisation moléculaire...</div>
      </div>
    `);
    requestAnimationFrame(() => {
      const fill = document.getElementById('fusion-fill');
      if (fill) fill.style.width = '100%';
    });
    setTimeout(() => {
      const res = GameEngine.executeFusion(speciesId, mode);
      if (!res.ok) {
        this.closeModal();
        this.showToast(res.msg, 'danger');
        return;
      }
      if (res.success) {
        this.showSpecimenRevealModal(
          { speciesDef: res.newDef, rarity: res.targetRarity, chromatic: res.chromatic, isNewDiscovery: res.isNewDiscovery, autoPlacedEnc: null },
          '🧬 FUSION RÉUSSIE !'
        );
      } else {
        this.openModal(`
          <div style="text-align:center;">
            <h2 style="color:var(--accent-danger);margin-bottom:8px;">💥 Fusion Instable (35%)</h2>
            <p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:14px;">
              L'expérience à 65% a échoué : un <strong>${res.lostDef.name}</strong> a été perdu, le second est retourné en réserve.
            </p>
            <p style="font-size:0.8rem;color:#bae6fd;margin-bottom:16px;">
              💡 En probabilités, même avec 65% de chance de succès, le risque de 35% finit toujours par tomber environ 1 fois sur 3 !
            </p>
            <button id="btn-fuse-fail-ok" class="btn btn-primary" style="width:100%;">Compris</button>
          </div>
        `);
        document.getElementById('btn-fuse-fail-ok').addEventListener('click', () => {
          this.closeModal();
          this.renderDirty();
        });
      }
    }, 1450);
  },

  // --- MODALE DU GARDIEN ALPHA (OBJECTIF FINAL DU BIOME 1) ---
  openGuardianModal() {
    const discovered = GameEngine.getDiscoveredCount();
    const canFight = GameEngine.canChallengeGuardian();

    this.openModal(`
      <div style="text-align:center;">
        <span class="biome-pill" style="border-color:#facc15;color:#fef08a;">BOSS DU BIOME 1</span>
        <h2 style="margin:8px 0 4px;">👑 Gardien Alpha : Léviathan du Lagon</h2>
        <div style="width:150px;height:125px;margin:6px auto;">${getGuardianSVG()}</div>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:14px;">
          Réussis <strong>3 défis chronométrés d'affilée (15s chacun)</strong> pour apaiser le Gardien et terminer le prototype du Biome 1 !
        </p>
        ${state.guardianDefeated ? `<div style="margin-bottom:12px;color:#22d39c;font-weight:800;">★ Déjà vaincu ! Tu peux le réaffronter pour gagner +500 ✦ et +1 Mana Prismatique.</div>` : ''}
        ${canFight ? `
          <button id="btn-start-guardian" class="btn btn-lg btn-gold" style="width:100%;margin-bottom:8px;">⚔️ Affronter le Gardien Alpha (3 manches)</button>
        ` : `
          <div style="padding:12px;border-radius:var(--radius-sm);background:rgba(255,255,255,0.05);margin-bottom:12px;font-size:0.84rem;">
            Condition de déblocage : <strong>${discovered} / ${CONFIG.GUARDIAN_SPECIES_REQ} espèces découvertes</strong> au ManaDex
          </div>
          <button id="btn-unlock-guardian-shards" class="btn btn-purple" style="width:100%;margin-bottom:8px;" ${state.shards >= CONFIG.GUARDIAN_SHARD_BYPASS ? '' : 'disabled'}>
            🔓 Forcer le portail avec ${Utils.formatNum(CONFIG.GUARDIAN_SHARD_BYPASS)} Éclats ✦
          </button>
        `}
        <button id="btn-guardian-close" class="btn btn-sm btn-ghost">Fermer</button>
      </div>
    `);

    document.getElementById('btn-guardian-close').addEventListener('click', () => this.closeModal());
    const unlockBtn = document.getElementById('btn-unlock-guardian-shards');
    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => {
        if (GameEngine.unlockGuardianWithShards()) this.openGuardianModal();
      });
    }
    const fightBtn = document.getElementById('btn-start-guardian');
    if (fightBtn) {
      fightBtn.addEventListener('click', () => this.runGuardianRound(1));
    }
  },

  runGuardianRound(round) {
    const question = round === 1 ? ExerciseGenerators.medium() : ExerciseGenerators.hard();
    let answered = false;
    const heartsHtml = [1, 2, 3].map(i => `<div class="boss-heart ${i < round ? 'lost' : ''}"></div>`).join('');

    this.openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:800;color:#facc15;">👑 Gardien Alpha — Manche ${round}/3</span>
        <span id="quiz-sec-left" class="biome-pill">${CONFIG.GUARDIAN_QUIZ_SEC}s</span>
      </div>
      <div class="boss-hp-row">${heartsHtml}</div>
      <div class="quiz-timer-track"><div id="quiz-timer-fill" class="quiz-timer-fill" style="width:100%;"></div></div>
      <div class="quiz-question-box">${question.prompt}</div>
      <div class="quiz-choices">
        ${question.choices.map((c, idx) => `<button class="quiz-choice-btn" data-choice="${idx}">${c}</button>`).join('')}
      </div>
      <div id="quiz-feedback" class="quiz-feedback"></div>
    `);

    const finish = (ok, timedOut = false) => {
      if (answered) return;
      answered = true;
      this._clearQuizTimer();
      GameEngine.recordQuestionResult(question, ok);
      document.querySelectorAll('#modal-box .quiz-choice-btn').forEach((b, i) => {
        b.disabled = true;
        if (i === question.answerIndex) b.classList.add('correct');
      });
      const fb = document.getElementById('quiz-feedback');
      fb.className = `quiz-feedback show ${ok ? 'ok' : 'ko'}`;
      fb.innerHTML = ok
        ? `⚡ <strong>Coup critique !</strong> ${question.explain}`
        : `💥 <strong>${timedOut ? 'Temps écoulé !' : 'Le Gardien riposte !'}</strong> ${question.explain}`;
      AudioFX.play(ok ? 'correct' : 'wrong');

      setTimeout(() => {
        if (!ok) {
          this.closeModal();
          this.showToast('Le Gardien Alpha t’a repoussé. Entraîne-toi et retente !', 'danger');
          this.renderDirty();
        } else if (round < 3) {
          this.runGuardianRound(round + 1);
        } else {
          const v = GameEngine.grantGuardianVictory();
          this.openModal(`
            <div style="text-align:center;">
              <span class="chromatic-badge" style="font-size:0.82rem;padding:4px 12px;">🏆 VICTOIRE DU BIOME 1</span>
              <h2 style="margin:12px 0 8px;color:#fef08a;">Gardien Alpha Apaisé !</h2>
              <div style="width:130px;height:110px;margin:0 auto;">${getGuardianSVG()}</div>
              <p style="font-size:0.9rem;color:var(--text-main);margin:10px 0;">
                Tu maîtrises les probabilités du <strong>Lagon Bioluminescent</strong> ! Le Cœur de la Station est stabilisé.
              </p>
              <div style="padding:10px;border-radius:var(--radius-sm);background:rgba(250,204,21,0.14);border:1px solid rgba(250,204,21,0.4);margin-bottom:14px;font-weight:700;color:#fef08a;">
                Récompense : ${v.firstTime ? '+2 000 Éclats ✦ et +3 Mana Prismatique ★' : '+500 Éclats ✦ et +1 Mana Prismatique ★'}
              </div>
              <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:14px;">
                Tu peux continuer à jouer pour compléter 100% du ManaDex et capturer les Légendaires Chromatiques !
              </p>
              <button id="btn-victory-ok" class="btn btn-lg btn-gold" style="width:100%;">Continuer l'aventure</button>
            </div>
          `);
          document.getElementById('btn-victory-ok').addEventListener('click', () => {
            this.closeModal();
            this.renderDirty();
          });
        }
      }, 1250);
    };

    document.querySelectorAll('#modal-box .quiz-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.choice);
        if (idx !== question.answerIndex) btn.classList.add('wrong');
        finish(idx === question.answerIndex, false);
      });
    });

    const start = Date.now();
    const totalMs = CONFIG.GUARDIAN_QUIZ_SEC * 1000;
    this._quizInterval = setInterval(() => {
      const leftMs = Math.max(0, totalMs - (Date.now() - start));
      const pct = (leftMs / totalMs) * 100;
      const bar = document.getElementById('quiz-timer-fill');
      const lbl = document.getElementById('quiz-sec-left');
      if (bar) { bar.style.width = `${pct}%`; if (pct < 30) bar.classList.add('danger'); }
      if (lbl) lbl.textContent = `${Math.ceil(leftMs / 1000)}s`;
      if (leftMs <= 0) finish(false, true);
    }, 80);
  },

  // --- MODALE DE CONFIRMATION RESET & HORS-LIGNE ---
  openResetConfirmModal() {
    this.openModal(`
      <div style="text-align:center;">
        <h2 style="margin-bottom:8px;">↺ Réinitialiser la partie ?</h2>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:16px;">
          Toute ta progression (spécimens, Éclats, ManaDex) sera effacée et tu recommenceras avec 1 Tupa Corail et 2 Mana Brut.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button id="btn-reset-cancel" class="btn btn-ghost" style="flex:1;">Annuler</button>
          <button id="btn-reset-confirm" class="btn btn-danger" style="flex:1;">Oui, réinitialiser</button>
        </div>
      </div>
    `);
    document.getElementById('btn-reset-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('btn-reset-confirm').addEventListener('click', () => {
      Storage.reset();
      this.closeModal();
      this.markDirty(['hud', 'nav', 'enclosures', 'incubator', 'exercises', 'fusion', 'manadex']);
      this.renderDirty();
      this.showToast('Nouvelle partie démarrée !', 'cyan');
    });
  },

  showOfflineModal(report) {
    this.openModal(`
      <div style="text-align:center;">
        <span class="biome-pill">Bon retour au labo !</span>
        <h2 style="margin:8px 0;">⏳ Gains hors-ligne</h2>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:12px;">
          Pendant ton absence (<strong>${Utils.formatDuration(report.elapsedSec)}</strong>), tes enclos ont continué à tourner :
        </p>
        <div style="font-size:1.35rem;font-weight:800;color:#2ef2e0;margin-bottom:10px;">
          +${Utils.formatNum(report.gained)} Éclats d'Énergie ✦
        </div>
        ${report.eggsReady > 0 ? `<div style="color:#facc15;font-weight:700;margin-bottom:12px;">🥚 ${report.eggsReady} œuf(s) prêt(s) à éclore !</div>` : ''}
        <button id="btn-offline-ok" class="btn btn-primary" style="width:100%;">Récupérer</button>
      </div>
    `);
    document.getElementById('btn-offline-ok').addEventListener('click', () => this.closeModal());
  },

  // --- LIAISON DES ÉVÉNEMENTS (Délégation propre) ---
  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.nav-tab[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `tab-${tabName}`);
    });
    this.markDirty([tabName]);
    this.renderDirty();
  },

  bindEvents() {
    // Boutons HUD
    document.getElementById('btn-sound').addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      if (state.soundEnabled) AudioFX.play('click');
      this.markDirty(['hud']);
      this.renderDirty();
      Storage.save();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      AudioFX.play('click');
      this.openResetConfirmModal();
    });

    // Navigation par onglets
    document.querySelector('.nav-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      AudioFX.play('click');
      if (btn.dataset.action === 'open-guardian') {
        this.openGuardianModal();
        return;
      }
      if (btn.dataset.tab) this.switchTab(btn.dataset.tab);
    });

    // Délégation globale sur le contenu principal
    document.querySelector('main').addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el || el.disabled) return;
      const action = el.dataset.action;

      switch (action) {
        case 'goto-tab':
          AudioFX.play('click');
          this.switchTab(el.dataset.target);
          break;

        case 'remove-specimen':
          AudioFX.play('click');
          GameEngine.removeSpecimenFromEnclosure(el.dataset.uid);
          break;

        case 'place-auto': {
          AudioFX.play('click');
          const freeEnc = state.enclosures.find(enc => enc.unlocked && enc.slots.includes(null));
          if (freeEnc) GameEngine.assignSpecimenToEnclosure(el.dataset.uid, freeEnc.id);
          break;
        }

        case 'quick-fill': {
          const reserve = GameEngine.getReserveSpecimens();
          if (reserve.length > 0) {
            AudioFX.play('click');
            GameEngine.assignSpecimenToEnclosure(reserve[0].uid, Number(el.dataset.enc));
          } else {
            this.showToast('Aucun spécimen en réserve. Incube un œuf !', 'cyan');
          }
          break;
        }

        case 'unlock-enclosure':
          GameEngine.unlockEnclosure(Number(el.dataset.enc));
          break;

        case 'buy-lab-boost':
          GameEngine.buyLabBoost();
          break;

        case 'stabilize': {
          const encId = Number(el.dataset.enc);
          EffortBridge.requestAction(
            'STABILIZE',
            'flash',
            () => GameEngine.stabilizeEnclosure(encId),
            () => this.showToast('Stabilisation ratée — réessaie le flash-quiz !', 'danger')
          );
          break;
        }

        case 'mana-step':
          GameEngine.adjustManaSelection(el.dataset.mana, Number(el.dataset.delta));
          break;

        case 'start-incubation': {
          const res = GameEngine.startIncubation();
          if (!res.ok) this.showToast(res.msg, 'danger');
          break;
        }

        case 'unlock-incubator':
          GameEngine.unlockIncubator(Number(el.dataset.inc));
          break;

        case 'accelerate-egg': {
          const incId = Number(el.dataset.inc);
          EffortBridge.requestAction(
            'ACCELERATE',
            'flash',
            () => GameEngine.accelerateEgg(incId),
            () => this.showToast('Accélération ratée, l’incubation continue normalement.', 'danger')
          );
          break;
        }

        case 'open-hatch-modal':
          AudioFX.play('click');
          this.openHatchModal(Number(el.dataset.inc));
          break;

        case 'start-exercise': {
          const diff = el.dataset.diff;
          EffortBridge.requestAction(
            'EARN_MANA',
            diff,
            () => {
              const rew = GameEngine.grantExerciseReward(diff);
              const names = { raw: 'Mana Brut', pure: 'Mana Pur', prismatic: 'Mana Prismatique' };
              this.showToast(`+${rew.gained} ${names[rew.manaKey]} & +${rew.shardBonus} ✦ !`, rew.bonusDose ? 'gold' : 'cyan');
            },
            () => this.showToast('Série réinitialisée ! Analyse l’explication et retente.', 'danger')
          );
          break;
        }

        case 'fuse':
          this.openFusionSuspenseModal(el.dataset.species, el.dataset.mode);
          break;
      }
      this.renderDirty();
    });
  }
};
