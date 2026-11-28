/* ==========================================================================
   [5. ENGINE & PROBA]
   Logique métier pure (ZÉRO référence au DOM) : probabilités, incubation,
   Surcharge Stop ou Encore, synergies, instabilité ADN et Fusion Risquée
   ========================================================================== */
const ProbaEngine = {
  /**
   * Calcule les probabilités exactes Commun/Rare/Épique/Légendaire selon les
   * doses de Mana injectées et l'état de la Jauge de Chance Garantie (Pity).
   */
  computeOdds(manaSelection, options = {}) {
    const usePity = options.ignorePity ? false : (state.pity >= CONFIG.PITY_THRESHOLD);
    if (usePity) {
      return { common: 0, rare: 0, epic: 75, legendary: 25, pityTriggered: true };
    }

    let { common, rare, epic, legendary } = CONFIG.BASE_ODDS;
    const sel = manaSelection || { raw: 0, pure: 0, prismatic: 0 };

    const applyShift = (count, shift) => {
      for (let i = 0; i < count; i++) {
        // Priorité : retirer des Communs ; si Communs insuffisants, puiser dans Rare
        let pulled = Math.min(common, shift.pullCommon);
        common -= pulled;
        const leftover = shift.pullCommon - pulled;
        if (leftover > 0) {
          const fromRare = Math.min(Math.max(0, rare - 5), leftover);
          rare -= fromRare;
          pulled += fromRare;
        }
        const totalAdd = shift.addRare + shift.addEpic + shift.addLegendary;
        if (pulled > 0 && totalAdd > 0) {
          const ratio = pulled / totalAdd;
          rare += shift.addRare * ratio;
          epic += shift.addEpic * ratio;
          legendary += shift.addLegendary * ratio;
        }
      }
    };

    applyShift(sel.raw || 0, CONFIG.MANA_SHIFTS.raw);
    applyShift(sel.pure || 0, CONFIG.MANA_SHIFTS.pure);
    applyShift(sel.prismatic || 0, CONFIG.MANA_SHIFTS.prismatic);

    // Normalisation stricte à 100 % (entiers, somme exacte)
    ({ common, rare, epic, legendary } = Utils.roundTo100({ common, rare, epic, legendary }));

    return { common, rare, epic, legendary, pityTriggered: false };
  },

  /**
   * Calcule les nouvelles probabilités si la Surcharge "Stop ou Encore" réussit :
   * supprime la rareté minimale disponible et booste fortement Épique & Légendaire.
   */
  computeOverchargedOdds(baseOdds) {
    let { common, rare, epic, legendary } = baseOdds;
    if (common > 0) {
      // Supprime 100% des Communs et redistribue vers Rare / Épique / Légendaire
      const pool = common;
      common = 0;
      rare += pool * 0.35;
      epic += pool * 0.42;
      legendary += pool * 0.23;
    } else if (rare > 0) {
      // Déjà 0% Commun -> supprime Rare pour garantir Épique ou Légendaire !
      const pool = rare;
      rare = 0;
      epic += pool * 0.62;
      legendary += pool * 0.38;
    } else {
      // Déjà Épique/Légendaire -> boost massif Légendaire
      const shift = epic * 0.5;
      epic -= shift;
      legendary += shift;
    }
    ({ common, rare, epic, legendary } = Utils.roundTo100({ common, rare, epic, legendary }));
    return { common, rare, epic, legendary, overcharged: true };
  },

  getChromaticChance() {
    return Math.min(
      CONFIG.MAX_CHROMATIC_CHANCE,
      CONFIG.CHROMATIC_CHANCE + state.streak * CONFIG.STREAK_CHROMATIC_BONUS
    );
  },

  rollSpeciesByRarity(rarity) {
    const pool = SPECIES_LIST.filter(s => s.rarity === rarity);
    return Utils.randomOf(pool);
  }
};

const GameEngine = {
  listeners: [],

  onEvent(fn) {
    this.listeners.push(fn);
  },

  emit(type, payload = {}) {
    for (const fn of this.listeners) fn(type, payload);
  },

  // --- Spécimens & ManaDex ---
  createSpecimen(speciesId, chromatic) {
    const uid = 'sp_' + state.nextSpecimenUid++;
    const sp = { uid, speciesId, chromatic: !!chromatic, enclosureId: null };
    state.specimens[uid] = sp;
    if (!state.manadex[speciesId]) {
      state.manadex[speciesId] = { discovered: true, chromatic: !!chromatic, count: 1 };
    } else {
      state.manadex[speciesId].discovered = true;
      state.manadex[speciesId].count += 1;
      if (chromatic) state.manadex[speciesId].chromatic = true;
    }
    return sp;
  },

  getDiscoveredCount() {
    return Object.values(state.manadex).filter(e => e.discovered).length;
  },

  getChromaticDiscoveredCount() {
    return Object.values(state.manadex).filter(e => e.chromatic).length;
  },

  getReserveSpecimens() {
    return Object.values(state.specimens).filter(s => s.enclosureId === null);
  },

  // --- Enclos & Synergies ---
  computeEnclosureStats(enc) {
    const creatures = enc.slots.map(uid => (uid ? state.specimens[uid] : null)).filter(Boolean);
    const typesSet = new Set(creatures.map(c => SPECIES[c.speciesId].type));
    let activeSynergy = null;
    for (const syn of SYNERGIES) {
      if (syn.types.every(t => typesSet.has(t))) {
        activeSynergy = syn;
        break;
      }
    }
    let baseProd = 0;
    let chromaCount = 0;
    for (const c of creatures) {
      const def = SPECIES[c.speciesId];
      baseProd += Utils.specimenRate(def, c.chromatic);
      if (c.chromatic) chromaCount++;
    }
    const synBonus = activeSynergy ? activeSynergy.bonus : 0;
    const chromaAura = chromaCount * CONFIG.CHROMATIC_AURA_BONUS;
    const labMult = 1 + state.labBoostLevel * 0.20;
    const unstableMult = enc.unstable ? CONFIG.INSTABILITY_PENALTY : 1;
    const finalProd = baseProd * (1 + synBonus + chromaAura) * labMult * unstableMult;
    return { creatures, activeSynergy, synBonus, chromaAura, labMult, unstableMult, finalProd };
  },

  getTotalProductionPerSec() {
    return state.enclosures
      .filter(e => e.unlocked)
      .reduce((sum, enc) => sum + this.computeEnclosureStats(enc).finalProd, 0);
  },

  assignSpecimenToEnclosure(uid, enclosureId) {
    const sp = state.specimens[uid];
    const enc = state.enclosures[enclosureId];
    if (!sp || !enc || !enc.unlocked) return false;
    const emptyIdx = enc.slots.indexOf(null);
    if (emptyIdx === -1) return false;
    // Retirer d'un autre enclos si nécessaire
    if (sp.enclosureId !== null) this.removeSpecimenFromEnclosure(uid);
    enc.slots[emptyIdx] = uid;
    sp.enclosureId = enclosureId;
    this.emit('stateChanged', { areas: ['enclosures', 'hud', 'fusion'] });
    return true;
  },

  removeSpecimenFromEnclosure(uid) {
    const sp = state.specimens[uid];
    if (!sp || sp.enclosureId === null) return false;
    const enc = state.enclosures[sp.enclosureId];
    if (enc) {
      const idx = enc.slots.indexOf(uid);
      if (idx !== -1) enc.slots[idx] = null;
      // Si l'enclos devient vide, il n'est plus instable
      if (enc.slots.every(s => s === null)) enc.unstable = false;
    }
    sp.enclosureId = null;
    this.emit('stateChanged', { areas: ['enclosures', 'hud', 'fusion'] });
    return true;
  },

  unlockEnclosure(enclosureId) {
    const enc = state.enclosures[enclosureId];
    const cost = CONFIG.ENCLOSURE_COSTS[enclosureId];
    if (!enc || enc.unlocked || state.shards < cost || !this.getUnlockRequirement('enclosure', enclosureId).met) return false;
    state.shards -= cost;
    enc.unlocked = true;
    AudioFX.play('correct');
    this.emit('toast', { text: `🏝️ ${enc.name} débloqué !`, tone: 'gold' });
    this.emit('stateChanged', { areas: ['enclosures', 'hud'] });
    return true;
  },

  buyLabBoost() {
    const cost = CONFIG.LAB_BOOST_COSTS[state.labBoostLevel];
    if (cost === undefined || state.shards < cost || !this.getUnlockRequirement('boost', state.labBoostLevel).met) return false;
    state.shards -= cost;
    state.labBoostLevel++;
    AudioFX.play('correct');
    this.emit('toast', { text: `🔬 Amplificateur ManaLab Niv.${state.labBoostLevel} (+${state.labBoostLevel * 20}% prod.) !`, tone: 'gold' });
    this.emit('stateChanged', { areas: ['enclosures', 'hud'] });
    return true;
  },

  stabilizeEnclosure(enclosureId) {
    const enc = state.enclosures[enclosureId];
    if (!enc || !enc.unstable) return;
    enc.unstable = false;
    const bonus = Math.max(25, Math.round(this.computeEnclosureStats(enc).finalProd * 6));
    state.shards += bonus;
    state.totalShardsEarned += bonus;
    this.emit('fx', { kind: 'burst', rarity: 'rare' });
    this.emit('toast', { text: `🧬 ${enc.name} stabilisé ! +${Utils.formatNum(bonus)} Éclats bonus`, tone: 'cyan' });
    this.emit('stateChanged', { areas: ['enclosures', 'hud', 'nav'] });
  },

  // --- Incubation & Stop ou Encore ---
  adjustManaSelection(manaType, delta) {
    const cur = state.manaSelection[manaType] || 0;
    const total = state.manaSelection.raw + state.manaSelection.pure + state.manaSelection.prismatic;
    const next = cur + delta;
    if (next < 0) return;
    if (delta > 0 && (next > state.mana[manaType] || total >= CONFIG.MAX_MANA_PER_EGG)) return;
    state.manaSelection[manaType] = next;
    AudioFX.play('click');
    this.emit('stateChanged', { areas: ['incubator'] });
  },

  unlockIncubator(incId) {
    const inc = state.incubators[incId];
    const cost = CONFIG.INCUBATOR_COSTS[incId];
    if (!inc || inc.unlocked || state.shards < cost || !this.getUnlockRequirement('incubator', incId).met) return false;
    state.shards -= cost;
    inc.unlocked = true;
    AudioFX.play('correct');
    this.emit('toast', { text: `🥚 Incubateur #${incId + 1} activé !`, tone: 'gold' });
    this.emit('stateChanged', { areas: ['incubator', 'hud'] });
    return true;
  },

  startIncubation() {
    const freeInc = state.incubators.find(i => i.unlocked && !i.egg);
    if (!freeInc) return { ok: false, msg: 'Aucun incubateur libre.' };

    const sel = state.manaSelection;
    const totalDoses = sel.raw + sel.pure + sel.prismatic;
    if (totalDoses <= 0) return { ok: false, msg: 'Injecte au moins 1 dose de Mana.' };
    if (sel.raw > state.mana.raw || sel.pure > state.mana.pure || sel.prismatic > state.mana.prismatic) {
      return { ok: false, msg: 'Stock de Mana insuffisant.' };
    }

    if (state.shards < CONFIG.EGG_SHARD_COST) {
      return { ok: false, msg: `Il faut ${CONFIG.EGG_SHARD_COST} ✦ pour lancer un œuf : récolte ton réservoir ou fais un exercice.` };
    }
    state.shards -= CONFIG.EGG_SHARD_COST;

    // Consommer le Mana
    state.mana.raw -= sel.raw;
    state.mana.pure -= sel.pure;
    state.mana.prismatic -= sel.prismatic;

    const odds = ProbaEngine.computeOdds(sel);
    const duration = Math.round(CONFIG.INCUBATION_BASE_SEC + totalDoses * CONFIG.INCUBATION_PER_MANA_SEC);
    freeInc.egg = {
      durationSec: duration,
      remainingSec: duration,
      odds,
      overchargeTried: false,
      overchargeWon: false
    };

    // Réajuster la sélection pour ne pas dépasser le stock restant
    state.manaSelection.raw = Math.min(state.manaSelection.raw, state.mana.raw);
    state.manaSelection.pure = Math.min(state.manaSelection.pure, state.mana.pure);
    state.manaSelection.prismatic = Math.min(state.manaSelection.prismatic, state.mana.prismatic);

    AudioFX.play('incubate');
    this.emit('stateChanged', { areas: ['incubator', 'hud', 'nav'] });
    return { ok: true, incubatorId: freeInc.id };
  },

  accelerateEgg(incId) {
    const inc = state.incubators[incId];
    if (!inc || !inc.egg || inc.egg.remainingSec <= 0) return;
    inc.egg.remainingSec = 0;
    this.emit('toast', { text: '⚡ Incubation terminée instantanément !', tone: 'gold' });
    this.emit('stateChanged', { areas: ['incubator', 'nav'] });
  },

  applyOverchargeResult(incId, won) {
    const inc = state.incubators[incId];
    if (!inc || !inc.egg) return null;
    inc.egg.overchargeTried = true;
    if (won) {
      inc.egg.overchargeWon = true;
      inc.egg.odds = ProbaEngine.computeOverchargedOdds(inc.egg.odds);
    } else {
      inc.egg.overchargeWon = false;
      inc.egg.odds = { ...CONFIG.BASE_ODDS, pityTriggered: false, overcharged: false };
    }
    this.emit('stateChanged', { areas: ['incubator'] });
    return inc.egg.odds;
  },

  hatchEgg(incId) {
    const inc = state.incubators[incId];
    if (!inc || !inc.egg || inc.egg.remainingSec > 0) return null;
    const odds = inc.egg.odds;
    const rarity = Utils.rollWeighted({
      common: odds.common,
      rare: odds.rare,
      epic: odds.epic,
      legendary: odds.legendary
    });

    const chromatic = Math.random() < ProbaEngine.getChromaticChance();
    const speciesDef = ProbaEngine.rollSpeciesByRarity(rarity);
    const isNewDiscovery = !state.manadex[speciesDef.id]?.discovered;

    // Mise à jour de la Jauge de Chance Garantie (Pity)
    if (odds.pityTriggered || rarity === 'epic' || rarity === 'legendary') {
      state.pity = 0;
    } else if (rarity === 'common') {
      state.pity = Math.min(CONFIG.PITY_THRESHOLD, state.pity + CONFIG.PITY_STEP);
    }

    const specimen = this.createSpecimen(speciesDef.id, chromatic);
    state.stats.eggsHatched++;
    inc.egg = null;

    // Placer automatiquement s'il y a une place libre dans un enclos débloqué
    let autoPlacedEnc = null;
    for (const enc of state.enclosures) {
      if (enc.unlocked && enc.slots.includes(null)) {
        this.assignSpecimenToEnclosure(specimen.uid, enc.id);
        autoPlacedEnc = enc.name;
        break;
      }
    }

    this.checkUnlocks();
    AudioFX.play('hatch_' + rarity);
    if (chromatic) AudioFX.play('chromatic');
    this.emit('fx', { kind: 'burst', rarity, chromatic });
    this.emit('stateChanged', { areas: ['incubator', 'enclosures', 'fusion', 'manadex', 'hud', 'nav'] });

    return { specimen, speciesDef, rarity, chromatic, isNewDiscovery, autoPlacedEnc, chance: odds[rarity], pityTriggered: !!odds.pityTriggered };
  },

  // --- Exercices & Récompenses Mana ---
  recordQuestionResult(question, isCorrect) {
    state.stats.exercisesTotal++;
    if (isCorrect) {
      state.stats.exercisesWon++;
      state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    } else {
      state.streak = 0;
    }

    // Fenêtre glissante des dernières réponses (maîtrise requise pour le Gardien)
    state.recentAnswers.push({ ok: !!isCorrect, d: question.difficulty || 'easy' });
    while (state.recentAnswers.length > CONFIG.GUARDIAN_MASTERY.window) state.recentAnswers.shift();

    // Bilan par catégorie (calcul / pourcentage / proba) pour l'enseignant
    if (question.cat) {
      const c = state.catStats[question.cat] || (state.catStats[question.cat] = { ok: 0, total: 0 });
      c.total++;
      if (isCorrect) c.ok++;
    }

    // Enregistrer dans l'historique de répétition espacée
    const existing = state.questionHistory.find(h => h.key === question.key);
    if (existing) {
      existing.lastSeen = Date.now();
      if (isCorrect) existing.correctCount++;
      else existing.wrongCount++;
    } else {
      state.questionHistory.push({
        key: question.key,
        question,
        correctCount: isCorrect ? 1 : 0,
        wrongCount: isCorrect ? 0 : 1,
        lastSeen: Date.now()
      });
      if (state.questionHistory.length > 35) state.questionHistory.shift();
    }
    this.emit('stateChanged', { areas: ['hud', 'incubator'] });
  },

  grantExerciseReward(difficulty) {
    const map = { easy: 'raw', medium: 'pure', prismatic: 'prismatic', hard: 'prismatic' };
    const manaKey = map[difficulty] || 'raw';
    // Bonus de série : +1 dose supplémentaire tous les 3 combos
    const bonusDose = (state.streak > 0 && state.streak % 3 === 0) ? 1 : 0;
    const gained = 1 + bonusDose;
    state.mana[manaKey] += gained;

    // Petit gain d'Éclats immédiat pour renforcer le plaisir
    const shardBonus = CONFIG.SHARD_REWARD[difficulty] || CONFIG.SHARD_REWARD.easy;
    state.shards += shardBonus;
    state.totalShardsEarned += shardBonus;

    // Sélectionner automatiquement si la sélection était à 0
    const selTotal = state.manaSelection.raw + state.manaSelection.pure + state.manaSelection.prismatic;
    if (selTotal === 0) state.manaSelection[manaKey] = 1;

    this.emit('fx', { kind: 'floatText', text: `+${gained} Mana` + (bonusDose ? ' (Combo!)' : '') });
    this.emit('stateChanged', { areas: ['hud', 'incubator', 'exercises'] });
    return { manaKey, gained, shardBonus, bonusDose };
  },

  // --- Fusion Risquée ---
  getFusableGroups() {
    const reserve = this.getReserveSpecimens();
    const groups = {};
    for (const sp of reserve) {
      const def = SPECIES[sp.speciesId];
      if (def.rarity === 'legendary') continue;
      if (!groups[sp.speciesId]) groups[sp.speciesId] = [];
      groups[sp.speciesId].push(sp);
    }
    return Object.entries(groups)
      .filter(([, list]) => list.length >= 2)
      .map(([speciesId, list]) => ({ speciesDef: SPECIES[speciesId], list }));
  },

  executeFusion(speciesId, mode) {
    const countNeeded = mode === 'safe' ? CONFIG.FUSION_SAFE_COUNT : CONFIG.FUSION_RISKY_COUNT;
    const pool = this.getReserveSpecimens().filter(s => s.speciesId === speciesId);
    if (pool.length < countNeeded) return { ok: false, msg: 'Spécimens insuffisants en réserve.' };

    const srcDef = SPECIES[speciesId];
    const nextIdx = CONFIG.RARITY_ORDER.indexOf(srcDef.rarity) + 1;
    if (nextIdx >= CONFIG.RARITY_ORDER.length) return { ok: false, msg: 'Rareté maximale atteinte.' };
    const targetRarity = CONFIG.RARITY_ORDER[nextIdx];

    const success = mode === 'safe' ? true : (Math.random() < CONFIG.FUSION_RISKY_CHANCE);
    // Privilégier la consommation des non-chromatiques en premier
    pool.sort((a, b) => Number(a.chromatic) - Number(b.chromatic));

    if (success) {
      const consumed = pool.slice(0, countNeeded);
      const hadChromatic = consumed.some(c => c.chromatic);
      for (const c of consumed) delete state.specimens[c.uid];

      const chromatic = hadChromatic || (Math.random() < ProbaEngine.getChromaticChance());
      const newDef = ProbaEngine.rollSpeciesByRarity(targetRarity);
      const isNewDiscovery = !state.manadex[newDef.id]?.discovered;
      const created = this.createSpecimen(newDef.id, chromatic);
      state.stats.fusionsWon++;

      AudioFX.play('hatch_' + targetRarity);
      if (chromatic) AudioFX.play('chromatic');
      this.emit('fx', { kind: 'burst', rarity: targetRarity, chromatic });
      this.emit('stateChanged', { areas: ['fusion', 'enclosures', 'manadex', 'hud', 'nav'] });
      return { ok: true, success: true, created, newDef, targetRarity, chromatic, isNewDiscovery };
    } else {
      // Échec de fusion risquée (35%) : 1 spécimen est perdu, l'autre survit
      const lost = pool[0];
      delete state.specimens[lost.uid];
      AudioFX.play('wrong');
      this.emit('stateChanged', { areas: ['fusion', 'enclosures', 'hud', 'nav'] });
      return { ok: true, success: false, lostDef: srcDef };
    }
  },

  // --- Gardien Alpha ---
  // Conditions du Gardien : espèces découvertes ET maîtrise sur les dernières réponses
  getGuardianRequirements() {
    const M = CONFIG.GUARDIAN_MASTERY;
    const recent = state.recentAnswers;
    const okCount = recent.filter(a => a.ok).length;
    const hardOk = recent.filter(a => a.ok && a.d === 'hard').length;
    const accuracy = recent.length > 0 ? Math.round((okCount / recent.length) * 100) : 0;
    const species = { have: this.getDiscoveredCount(), need: CONFIG.GUARDIAN_SPECIES_REQ };
    const answers = { have: recent.length, need: M.window };
    const acc = { have: accuracy, need: Math.round(M.minAccuracy * 100) };
    const hard = { have: hardOk, need: M.minHard };
    const wins = { have: state.stats.exercisesWon, need: M.minWins };
    const ok = species.have >= species.need && wins.have >= wins.need && answers.have >= answers.need
      && acc.have >= acc.need && hard.have >= hard.need;
    return { species, wins, answers, accuracy: acc, hard, ok };
  },

  canChallengeGuardian() {
    return this.getGuardianRequirements().ok;
  },

  grantGuardianVictory() {
    const firstTime = !state.guardianDefeated;
    state.guardianDefeated = true;
    if (firstTime) {
      state.shards += 2000;
      state.totalShardsEarned += 2000;
      state.mana.prismatic += 3;
    } else {
      state.shards += 500;
      state.mana.prismatic += 1;
    }
    AudioFX.play('hatch_legendary');
    AudioFX.play('chromatic');
    this.emit('fx', { kind: 'burst', rarity: 'legendary', chromatic: true });
    this.emit('stateChanged', { areas: ['hud', 'nav', 'incubator'] });
    return { firstTime };
  },

  // --- Boucle logique 1 seconde ---
  tick(dtSec) {
    this.checkUnlocks();
    this.checkAchievements();

    // 1. Production d'Éclats
    const prod = this.getTotalProductionPerSec();
    if (prod > 0) {
      const cap = this.getReservoirCap();
      const wasAlert = this.isReservoirAlert();
      state.reservoir = Math.min(cap, state.reservoir + prod * dtSec);
      if (!wasAlert && this.isReservoirAlert()) {
        this.emit('toast', { text: '💎 Ton réservoir d’Éclats est presque plein : récolte-le !', tone: 'gold' });
        this.emit('stateChanged', { areas: ['nav', 'hud'] });
      }
    }

    // 2. Décompte des incubateurs
    let eggJustFinished = false;
    for (const inc of state.incubators) {
      if (inc.egg && inc.egg.remainingSec > 0) {
        inc.egg.remainingSec = Math.max(0, inc.egg.remainingSec - dtSec);
        if (inc.egg.remainingSec === 0) {
          eggJustFinished = true;
          AudioFX.play('correct');
          this.emit('toast', { text: `🥚 Œuf prêt dans l'Incubateur #${inc.id + 1} !`, tone: 'gold' });
        }
      }
    }
    if (eggJustFinished) {
      this.emit('stateChanged', { areas: ['incubator', 'nav'] });
    }

    // 3. Instabilité ADN périodique (~45s) pour la répétition espacée
    const activeStableEnclosures = state.enclosures.filter(
      e => e.unlocked && !e.unstable && e.slots.some(s => s !== null)
    );
    if (state.unlocked.producer && activeStableEnclosures.length > 0) {
      state.instabilityTimer -= dtSec;
      if (state.instabilityTimer <= 0) {
        state.instabilityTimer = CONFIG.INSTABILITY_INTERVAL_SEC;
        const target = Utils.randomOf(activeStableEnclosures);
        target.unstable = true;
        AudioFX.play('alert');
        this.emit('toast', { text: `⚠️ ADN instable dans ${target.name} (-50% prod.) !`, tone: 'danger' });
        this.emit('stateChanged', { areas: ['enclosures', 'nav', 'hud'] });
      }
    }
  }
};
