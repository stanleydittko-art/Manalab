/* ==========================================================================
   [1. CONFIG & BALANCE]
   Constantes globales, mode pédagogique, probabilités et équilibrage
   ========================================================================== */
const CONFIG = {
  SAVE_KEY: 'manalab_lagon_v1',
  SAVE_VERSION: 2,
  MODE: 'PEDAGO', // 'PEDAGO' | 'COMMERCIAL' (futur pont SDK Pub / Gemmes)
  TICK_MS: 1000,
  AUTOSAVE_MS: 15000,

  // Probabilités de base d'une incubation (somme = 100)
  BASE_ODDS: { common: 65, rare: 25, epic: 9, legendary: 1 },

  // Impact de chaque dose de Mana sur le déplacement des probabilités
  MANA_SHIFTS: {
    raw:       { pullCommon: 9,  addRare: 6.8, addEpic: 1.9, addLegendary: 0.3 },
    pure:      { pullCommon: 18, addRare: 9.0, addEpic: 7.2, addLegendary: 1.8 },
    prismatic: { pullCommon: 30, addRare: 6.0, addEpic: 15.5, addLegendary: 8.5 }
  },
  MAX_MANA_PER_EGG: 5,

  // Chance Chromatique & Jauge de Chance Garantie (Pity)
  CHROMATIC_CHANCE: 0.01,        // 1% de base
  STREAK_CHROMATIC_BONUS: 0.05,  // +5% par niveau de Série/Combo
  MAX_CHROMATIC_CHANCE: 0.75,    // Plafond à 75% pour garder le frisson
  PRODUCTION_MULT: 0.15,         // échelle globale de la production des créatures (équilibrage)
  CHROMATIC_PROD_MULT: 3,        // Une créature Chromatique produit x3
  CHROMATIC_AURA_BONUS: 0.10,    // +10% à l'enclos par Chromatique présent
  PITY_STEP: 10,                 // +10% à chaque éclosion Commune
  PITY_THRESHOLD: 100,           // À 100%, garantit Épique (75%) ou Légendaire (25%)

  // Timers rapides pour tester le gameplay en quelques minutes
  INCUBATION_BASE_SEC: 15,
  INCUBATION_PER_MANA_SEC: 2,  // Max ~12 secondes pour 5 doses
  INSTABILITY_INTERVAL_SEC: 45,  // Un enclos devient instable toutes les ~45s
  INSTABILITY_PENALTY: 0.5,      // -50% de production tant que non stabilisé

  // Chronomètres des défis
  FLASH_QUIZ_SEC: 10,
  OVERCHARGE_QUIZ_SEC: 12,
  GUARDIAN_QUIZ_SEC: 15,

  // Coûts de progression du laboratoire
  ENCLOSURE_SLOTS: 3,
  ENCLOSURE_COSTS: [0, 300, 2000, 12000],
  INCUBATOR_COSTS: [0, 700, 5000],
  LAB_BOOST_COSTS: [600, 3000, 10000, 30000],

  // Maîtrise requise EN PLUS des Éclats (D). Clés : wins = bonnes réponses au total,
  // cat = bonnes réponses par catégorie (calcul | pourcentage | proba),
  // accuracy = % de réussite sur les dernières réponses (fenêtre GUARDIAN_MASTERY.window)
  ENCLOSURE_REQ: [null, { wins: 10 }, { wins: 60, cat: { pourcentage: 12 } }, { wins: 160, cat: { proba: 20, pourcentage: 20 }, accuracy: 70 }],
  INCUBATOR_REQ: [null, { wins: 30, cat: { pourcentage: 5 } }, { wins: 110, cat: { proba: 12 }, accuracy: 70 }],
  LAB_BOOST_REQ: [{ wins: 20 }, { wins: 70 }, { wins: 140 }, { wins: 240 }],
  ACCURACY_MIN_ANSWERS: 10,      // réponses minimum pour évaluer un % de réussite

  // Éclats : coût d'un œuf et récompense des exercices
  EGG_SHARD_COST: 40,
  SHARD_REWARD: { easy: 3, medium: 8, hard: 15 },
  GUARDIAN_SPECIES_REQ: 7,
  // Maîtrise requise pour défier le Gardien (plus de passage payant)
  GUARDIAN_MASTERY: { window: 20, minAccuracy: 0.7, minHard: 3, minWins: 300 },

  // Fusion Risquée
  FUSION_SAFE_COUNT: 3,
  FUSION_RISKY_COUNT: 2,
  FUSION_RISKY_CHANCE: 0.65,

  // Réservoir d'Éclats : la production remplit un réservoir plafonné, à vider avec un flash-quiz
  VIVARIUM_MAX: 12,              // créatures animées affichées dans l'enclos
  MASCOT_STREAKS: [3, 5, 10, 20], // séries de bonnes réponses saluées par Tiki
  RESERVOIR_CAP_SEC: 600,        // capacité = 10 minutes de production
  RESERVOIR_ALERT_RATIO: 0.8,    // alerte « réservoir presque plein » à 80 %
  COLLECT_STREAK_BONUS: 0.05,    // +5 % de gain par bonne réponse d'affilée...
  COLLECT_STREAK_MAX: 10,        // ... jusqu'à +50 %

  // Mode enseignant : code de déblocage de toutes les fonctionnalités
  TEACHER_CODE: 'secret',

  // Progression par paliers : onglets et mécaniques débloqués au fil du jeu
  PROGRESSION: {
    enclosures: { eggsHatched: 1, label: 'Enclos',   hint: 'Fais éclore ton 1er œuf' },
    producer:   { eggsHatched: 5, label: 'Production, Série et Surcharge', hint: 'Fais éclore 5 œufs' },
    manadex:    { species: 4,     label: 'ManaDex',  hint: 'Découvre 4 espèces' },
    fusion:     {                 label: 'Fusion',   hint: 'Obtiens 2 exemplaires de la même espèce' },
    guardian:   {                 label: 'Gardien Alpha', hint: 'Découvre 7 espèces' }
  },

  // Paliers d'exercices : bonnes réponses nécessaires pour ouvrir Moyen / Difficile
  EXERCISE_TIER_REQ: { easy: 0, medium: 8, hard: 40 },

  RARITY_ORDER: ['common', 'rare', 'epic', 'legendary'],
  RARITY_LABELS: {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  }
};
