/* ==========================================================================
   [8. UI - ONGLETS]
   Extension de UI (defini dans 8-ui.js)
   ========================================================================== */
Object.assign(UI, {
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
});
