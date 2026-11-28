/* ==========================================================================
   [3. STATE & STORAGE]
   État complet du joueur, sauvegarde localStorage, migration et hors-ligne
   ========================================================================== */
function createDefaultState() {
  return {
    version: CONFIG.SAVE_VERSION,
    shards: 60,
    reservoir: 0,   // Éclats produits en attente de récolte (voir CONFIG.RESERVOIR_CAP_SEC)
    totalShardsEarned: 60,
    mana: { raw: 2, pure: 0, prismatic: 0 },
    streak: 0,
    bestStreak: 0,
    pity: 0,
    labBoostLevel: 0,
    soundEnabled: true,
    guardianDefeated: false,
    guardianUnlockedByShards: false,

    // Progression par paliers (voir CONFIG.PROGRESSION) & mode enseignant
    unlocked: { enclosures: false, producer: false, manadex: false, fusion: false, guardian: false },
    teacherMode: false,
    seenTips: {},
    achievements: {},
    catStats: {},   // bilan par catégorie : { calcul: { ok, total }, pourcentage: {...}, proba: {...} }
    settings: { bigFont: false, contrast: false },
    grade: 4,       // niveau de classe des exercices (1=6e … 4=3e / tous), réglé par l'enseignant

    // Enclos : 1 débloqué au départ contenant déjà le 1er Tupa Corail
    enclosures: [
      { id: 0, name: 'Bassin du Lagon #1', unlocked: true, unstable: false, slots: ['sp_init_1', null, null] },
      { id: 1, name: 'Bassin Corallien #2', unlocked: false, unstable: false, slots: [null, null, null] },
      { id: 2, name: 'Serre Bioluminescente #3', unlocked: false, unstable: false, slots: [null, null, null] },
      { id: 3, name: 'Sanctuaire Profond #4', unlocked: false, unstable: false, slots: [null, null, null] }
    ],

    // Incubateurs : 1 débloqué au départ
    incubators: [
      { id: 0, unlocked: true, egg: null },
      { id: 1, unlocked: false, egg: null },
      { id: 2, unlocked: false, egg: null }
    ],

    // Tous les spécimens possédés (id unique -> instance)
    specimens: {
      sp_init_1: { uid: 'sp_init_1', speciesId: 'tupa_corail', chromatic: false, enclosureId: 0 }
    },
    nextSpecimenUid: 2,

    // Sélection actuelle de Mana dans l'interface d'incubation
    manaSelection: { raw: 1, pure: 0, prismatic: 0 },

    // ManaDex : { speciesId: { discovered: true, chromatic: false, count: 1 } }
    manadex: {
      tupa_corail: { discovered: true, chromatic: false, count: 1 }
    },

    // Historique des questions vues pour la répétition espacée
    questionHistory: [],
    recentAnswers: [], // 20 dernières réponses { ok, d } pour la maîtrise du Gardien
    stats: { exercisesWon: 0, exercisesTotal: 0, eggsHatched: 0, fusionsWon: 0 },

    instabilityTimer: CONFIG.INSTABILITY_INTERVAL_SEC,
    lastSavedAt: Date.now()
  };
}

let state = createDefaultState();

const Storage = {
  offlineReport: null,

  save() {
    try {
      state.lastSavedAt = Date.now();
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Sauvegarde locale indisponible :', err);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (!raw) {
        state = createDefaultState();
        return;
      }
      const parsed = JSON.parse(raw);
      state = this.migrate(parsed);
      const now = Date.now();
      const elapsedSec = Math.max(0, Math.floor((now - (state.lastSavedAt || now)) / 1000));
      if (elapsedSec >= 10) {
        this.offlineReport = this.applyOfflineProgress(elapsedSec);
      }
    } catch (err) {
      console.warn('Erreur de chargement, nouvelle partie créée :', err);
      state = createDefaultState();
    }
  },

  migrate(saved) {
    const def = createDefaultState();
    if (!saved || typeof saved !== 'object') return def;
    // Fusion sécurisée des clés manquantes en cas d'évolution de version
    const merged = {
      ...def,
      ...saved,
      mana: { ...def.mana, ...(saved.mana || {}) },
      manaSelection: { ...def.manaSelection, ...(saved.manaSelection || {}) },
      stats: { ...def.stats, ...(saved.stats || {}) },
      unlocked: { ...def.unlocked, ...(saved.unlocked || {}) },
      reservoir: Number.isFinite(saved.reservoir) ? Math.max(0, saved.reservoir) : 0,
      seenTips: { ...(saved.seenTips || {}) },
      achievements: { ...(saved.achievements || {}) },
      catStats: { ...(saved.catStats || {}) },
      settings: { ...def.settings, ...(saved.settings || {}) },
      version: CONFIG.SAVE_VERSION
    };
    // Parties créées avant la progression par paliers : tout reste débloqué
    if (!saved.unlocked) {
      for (const k of Object.keys(merged.unlocked)) merged.unlocked[k] = true;
    }
    if (!Array.isArray(merged.enclosures) || merged.enclosures.length < 4) merged.enclosures = def.enclosures;
    if (!Array.isArray(merged.incubators) || merged.incubators.length < 3) merged.incubators = def.incubators;
    if (!merged.specimens || typeof merged.specimens !== 'object') merged.specimens = def.specimens;
    if (!merged.manadex || typeof merged.manadex !== 'object') merged.manadex = def.manadex;
    if (!Array.isArray(merged.questionHistory)) merged.questionHistory = [];
    if (!Array.isArray(merged.recentAnswers)) merged.recentAnswers = [];
    return merged;
  },

  applyOfflineProgress(elapsedSec) {
    // Plafond à 8 heures hors-ligne pour équilibrer le jeu pédagogique
    const cappedSec = Math.min(elapsedSec, 8 * 3600);
    // Avancer les œufs en cours
    let eggsReady = 0;
    for (const inc of state.incubators) {
      if (inc.egg && inc.egg.remainingSec > 0) {
        inc.egg.remainingSec = Math.max(0, inc.egg.remainingSec - cappedSec);
        if (inc.egg.remainingSec === 0) eggsReady++;
      }
    }
    // Calculer une estimation propre de production hors-ligne (sans dépendre d'Engine)
    const boostMult = 1 + state.labBoostLevel * 0.20;
    let rate = 0;
    for (const enc of state.enclosures) {
      if (!enc.unlocked) continue;
      let encBase = 0;
      for (const uid of enc.slots) {
        if (!uid) continue;
        const sp = state.specimens[uid];
        const def = sp && SPECIES[sp.speciesId];
        if (def) encBase += Utils.specimenRate(def, sp.chromatic);
      }
      if (enc.unstable) encBase *= CONFIG.INSTABILITY_PENALTY;
      rate += encBase * boostMult;
    }
    // La production hors-ligne remplit le réservoir (plafonné) : il faudra le récolter avec un flash-quiz
    const cap = rate * CONFIG.RESERVOIR_CAP_SEC;
    const before = state.reservoir;
    state.reservoir = Math.min(cap, state.reservoir + rate * cappedSec);
    const gained = Math.max(0, Math.floor(state.reservoir - before));
    if (gained <= 0 && eggsReady === 0) return null;
    return { elapsedSec: cappedSec, gained, eggsReady, full: state.reservoir >= cap };
  },

  reset() {
    try { localStorage.removeItem(CONFIG.SAVE_KEY); } catch (e) {}
    state = createDefaultState();
    this.save();
  }
};
