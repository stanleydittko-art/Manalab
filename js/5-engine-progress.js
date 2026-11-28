/* ==========================================================================
   [5. ENGINE - PROGRESSION]
   Déblocages par paliers, mission du moment, paliers d'exercices, succès.
   Extension de GameEngine (défini dans 5-engine.js) — ZÉRO accès au DOM.
   ========================================================================== */
Object.assign(GameEngine, {
  // --- Progression par paliers (ZÉRO DOM : renvoie des données / émet des événements) ---
  checkUnlocks() {
    const P = CONFIG.PROGRESSION;
    const conds = {
      enclosures: () => state.stats.eggsHatched >= P.enclosures.eggsHatched,
      producer: () => state.stats.eggsHatched >= P.producer.eggsHatched,
      manadex: () => this.getDiscoveredCount() >= P.manadex.species,
      fusion: () => this.getFusableGroups().length > 0,
      guardian: () => this.getDiscoveredCount() >= CONFIG.GUARDIAN_SPECIES_REQ
    };
    const newly = [];
    for (const key of Object.keys(conds)) {
      if (!state.unlocked[key] && conds[key]()) {
        state.unlocked[key] = true;
        newly.push(key);
        this.emit('toast', { text: `🔓 Débloqué : ${P[key].label} !`, tone: 'gold' });
      }
    }
    if (newly.length > 0) {
      AudioFX.play('correct');
      this.emit('stateChanged', { areas: ['hud', 'nav', 'enclosures', 'fusion', 'manadex', 'incubator'] });
    }
    return newly;
  },

  unlockAll() {
    for (const key of Object.keys(state.unlocked)) state.unlocked[key] = true;
    state.teacherMode = true;
    this.emit('stateChanged', { areas: ['hud', 'nav', 'enclosures', 'fusion', 'manadex', 'incubator', 'exercises'] });
  },

  isExerciseTierOpen(diff) {
    return state.teacherMode || state.stats.exercisesWon >= (CONFIG.EXERCISE_TIER_REQ[diff] || 0);
  },

  // Dosage automatique pour le mode simplifié de l'incubateur (1 dose de Mana Brut)
  setAutoDose() {
    state.manaSelection = { raw: Math.min(1, state.mana.raw), pure: 0, prismatic: 0 };
  },

  // --- Maîtrise requise pour débloquer (en plus des Éclats) ---
  // kind : 'enclosure' | 'incubator' | 'boost' ; renvoie { items:[{label,have,need,done}], met }
  getUnlockRequirement(kind, idx) {
    const table = { enclosure: CONFIG.ENCLOSURE_REQ, incubator: CONFIG.INCUBATOR_REQ, boost: CONFIG.LAB_BOOST_REQ }[kind];
    const req = table && table[idx];
    const items = [];
    if (req) {
      const catLabels = { calcul: 'en calcul mental', pourcentage: 'en pourcentages', proba: 'en probabilités' };
      if (req.wins) items.push({ label: 'bonnes réponses', have: state.stats.exercisesWon, need: req.wins });
      for (const [cat, need] of Object.entries(req.cat || {})) {
        items.push({ label: `bonnes réponses ${catLabels[cat]}`, have: (state.catStats[cat] || { ok: 0 }).ok, need });
      }
      if (req.accuracy) {
        const recent = state.recentAnswers;
        const have = recent.length >= CONFIG.ACCURACY_MIN_ANSWERS
          ? Math.round((recent.filter(a => a.ok).length / recent.length) * 100) : 0;
        items.push({ label: '% de réussite récente', have, need: req.accuracy, unit: ' %' });
      }
    }
    for (const it of items) it.done = it.have >= it.need;
    return { items, met: state.teacherMode || items.every(it => it.done) };
  },

  // --- Réservoir d'Éclats ---
  getReservoirCap() {
    return Math.max(0, this.getTotalProductionPerSec() * CONFIG.RESERVOIR_CAP_SEC);
  },

  getReservoirRatio() {
    const cap = this.getReservoirCap();
    return cap > 0 ? Math.min(1, state.reservoir / cap) : 0;
  },

  isReservoirAlert() {
    return state.reservoir >= 1 && this.getReservoirRatio() >= CONFIG.RESERVOIR_ALERT_RATIO;
  },

  // Gain d'une récolte réussie : réservoir × (1 + bonus de série)
  getCollectGain() {
    const bonus = Math.min(state.streak, CONFIG.COLLECT_STREAK_MAX) * CONFIG.COLLECT_STREAK_BONUS;
    return Math.floor(state.reservoir * (1 + bonus));
  },

  // À appeler uniquement après une réponse juste (via EffortBridge 'COLLECT')
  collectReservoir() {
    const gain = this.getCollectGain();
    if (gain <= 0) return 0;
    state.reservoir = 0;
    state.shards += gain;
    state.totalShardsEarned += gain;
    this.emit('fx', { kind: 'floatText', text: `+${gain} ✦` });
    this.emit('stateChanged', { areas: ['hud', 'nav', 'enclosures'] });
    return gain;
  },

  // --- Succès ---
  checkAchievements() {
    const earned = [];
    for (const a of ACHIEVEMENTS) {
      if (!state.achievements[a.id] && a.test(state)) {
        state.achievements[a.id] = true;
        earned.push(a);
        this.emit('toast', { text: `🏆 Succès : ${a.label} !`, tone: 'gold' });
      }
    }
    if (earned.length > 0) {
      AudioFX.play('correct');
      this.emit('stateChanged', { areas: ['manadex'] });
    }
    return earned;
  },

  // Bilan enseignant : données pures (aucun DOM)
  getReport() {
    const cats = { calcul: 'Calcul mental', pourcentage: 'Pourcentages', proba: 'Probabilités' };
    const rows = Object.keys(cats).map(k => {
      const c = state.catStats[k] || { ok: 0, total: 0 };
      return { key: k, label: cats[k], ok: c.ok, total: c.total, pct: c.total > 0 ? Math.round((c.ok / c.total) * 100) : null };
    });
    const missed = [...state.questionHistory]
      .filter(h => h.wrongCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 3)
      .map(h => ({ prompt: h.question.prompt, wrong: h.wrongCount, right: h.correctCount }));
    return {
      rows, missed,
      total: state.stats.exercisesTotal,
      won: state.stats.exercisesWon,
      pct: state.stats.exercisesTotal > 0 ? Math.round((state.stats.exercisesWon / state.stats.exercisesTotal) * 100) : null,
      bestStreak: state.bestStreak,
      eggs: state.stats.eggsHatched,
      species: this.getDiscoveredCount()
    };
  },

  // Objectif unique affiché à l'élève (« Mission du moment ») ; null si tout est accompli
  getMission() {
    const P = CONFIG.PROGRESSION;
    const hatched = state.stats.eggsHatched;
    const discovered = this.getDiscoveredCount();
    const eggs = state.incubators.filter(i => i.unlocked && i.egg);
    const totalMana = state.mana.raw + state.mana.pure + state.mana.prismatic;
    if (eggs.some(i => i.egg.remainingSec <= 0)) {
      return { text: 'Ton œuf est prêt ! Ouvre-le.', tab: 'incubator' };
    }
    if (state.unlocked.enclosures && this.isReservoirAlert()) {
      return { text: 'Ton réservoir d’Éclats est presque plein : récolte-le !', tab: 'enclosures' };
    }
    if (hatched < 1) {
      if (eggs.length > 0) return { text: 'Ton œuf incube… patiente quelques secondes.', tab: 'incubator' };
      if (totalMana < 1) return { text: 'Réponds à une question facile pour gagner du Mana.', tab: 'exercises' };
      if (state.shards < CONFIG.EGG_SHARD_COST) return { text: 'Il te faut des Éclats ✦ pour lancer un œuf : fais un exercice.', tab: 'exercises' };
      return { text: 'Utilise ton Mana pour lancer ton premier œuf.', tab: 'incubator' };
    }
    if (hatched < P.producer.eggsHatched) {
      const needMana = totalMana < 1 && eggs.length === 0;
      return {
        text: needMana
          ? `Plus de Mana ? Réponds à une question (œufs : ${hatched}/${P.producer.eggsHatched}).`
          : `Fais éclore ${P.producer.eggsHatched} œufs (${hatched}/${P.producer.eggsHatched}).`,
        tab: needMana ? 'exercises' : 'incubator'
      };
    }
    if (discovered < P.manadex.species) {
      return { text: `Découvre ${P.manadex.species} espèces différentes (${discovered}/${P.manadex.species}).`, tab: 'incubator' };
    }
    if (!state.guardianDefeated && discovered < CONFIG.GUARDIAN_SPECIES_REQ) {
      return { text: `Découvre ${CONFIG.GUARDIAN_SPECIES_REQ} espèces pour défier le Gardien Alpha (${discovered}/${CONFIG.GUARDIAN_SPECIES_REQ}).`, tab: 'incubator' };
    }
    if (!state.guardianDefeated) {
      const req = this.getGuardianRequirements();
      if (!req.ok) {
        const text = req.wins.have < req.wins.need
          ? `Prépare le Gardien : continue les exercices (${req.wins.have}/${req.wins.need} bonnes réponses).`
          : req.answers.have < req.answers.need
          ? `Prépare le Gardien : réponds à ${req.answers.need} questions (${req.answers.have}/${req.answers.need}).`
          : req.hard.have < req.hard.need
            ? `Prépare le Gardien : réussis ${req.hard.need} questions Difficiles récentes (${req.hard.have}/${req.hard.need}).`
            : `Prépare le Gardien : atteins ${req.accuracy.need} % de réussite (${req.accuracy.have} %).`;
        return { text, tab: 'exercises' };
      }
      return { text: 'Affronte le Gardien Alpha !', tab: 'guardian' };
    }
    return null;
  },
});
