/* ==========================================================================
   [8. UI - MODALES]
   Extension de UI (defini dans 8-ui.js)
   ========================================================================== */
Object.assign(UI, {
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
});
