/* ==========================================================================
   [2. DATA - AIDES]
   Textes d'aide courts (bouton ❓), affichés à la demande ou à la 1re visite
   ========================================================================== */
const TIPS = {
  exercises: {
    title: '⚡ Les exercices',
    text: 'Chaque bonne réponse te donne du Mana et des Éclats. Plus l’exercice est difficile, plus le Mana est précieux pour avoir des créatures rares.'
  },
  incubator: {
    title: '🥚 L’incubateur',
    text: 'Chaque œuf peut donner une créature Commune, Rare, Épique ou Légendaire. Les pourcentages montrent tes chances. Le total fait toujours 100 %.'
  },
  mana: {
    title: '✨ Doser le Mana',
    text: 'Chaque dose de Mana diminue la chance d’avoir un Commun et augmente celle des créatures rares. Regarde les pourcentages bouger avant de lancer l’œuf !'
  },
  pity: {
    title: '🍀 Chance garantie',
    text: 'Chaque Commun obtenu remplit la jauge de 10 %. À 100 %, ton prochain œuf est sûr d’être Épique ou Légendaire.'
  },
  streak: {
    title: '🔥 Série de bonnes réponses',
    text: 'Chaque bonne réponse d’affilée ajoute 5 % de chance d’avoir une créature Chromatique (production ×3). Tous les 3 succès, tu gagnes une dose de Mana bonus. Une erreur remet la série à 0.'
  },
  overcharge: {
    title: '⚡ Surcharge : Stop ou Encore',
    text: 'Quand l’œuf est prêt, tu peux l’ouvrir tout de suite ou relever un défi chronométré. Si tu réussis, tes chances de rareté augmentent. Si tu rates, elles reviennent au niveau de base.'
  },
  enclosures: {
    title: '🏝️ Les enclos',
    text: 'Place tes créatures dans un enclos : elles produisent des Éclats en continu. Deux types différents dans le même enclos donnent un bonus de synergie.'
  },
  instability: {
    title: '🧬 ADN instable',
    text: 'De temps en temps, un enclos devient instable et produit moitié moins. Réponds à un flash-quiz pour le stabiliser.'
  },
  fusion: {
    title: '🧬 La fusion',
    text: 'Avec 3 doublons, la fusion réussit à coup sûr (100 %). Avec 2 doublons, tu as 65 % de chances de réussir, mais 35 % de perdre une créature. À toi de décider !'
  },
  manadex: {
    title: '📘 Le ManaDex',
    text: 'C’est ta collection : découvre toutes les espèces, et leurs variantes Chromatiques très rares.'
  },
  guardian: {
    title: '👑 Le Gardien Alpha',
    text: 'Le dernier défi : une série de questions chronométrées. Réponds juste pour devenir Maître du lagon.'
  }
};

// Onglets dont l'aide s'ouvre automatiquement à la 1re visite
const FIRST_VISIT_TIPS = ['enclosures', 'fusion', 'manadex'];

// Succès : { id, icon, label, test(state) }
const ACHIEVEMENTS = [
  { id: 'first_hatch', icon: '🥚', label: 'Premier œuf', test: s => s.stats.eggsHatched >= 1 },
  { id: 'streak5', icon: '🔥', label: 'Série de 5', test: s => s.bestStreak >= 5 },
  { id: 'streak10', icon: '⚡', label: 'Série de 10', test: s => s.bestStreak >= 10 },
  { id: 'wins25', icon: '🧠', label: '25 bonnes réponses', test: s => s.stats.exercisesWon >= 25 },
  { id: 'dex5', icon: '📘', label: '5 espèces découvertes', test: s => Object.keys(s.manadex).filter(k => s.manadex[k].discovered).length >= 5 },
  { id: 'dex_all', icon: '🌴', label: 'ManaDex complet', test: s => Object.keys(s.manadex).filter(k => s.manadex[k].discovered).length >= SPECIES_LIST.length },
  { id: 'chroma', icon: '🌈', label: 'Premier Chromatique', test: s => Object.values(s.manadex).some(e => e.chromatic) },
  { id: 'fusion1', icon: '🧬', label: 'Première fusion réussie', test: s => s.stats.fusionsWon >= 1 },
  { id: 'shards1000', icon: '✦', label: '1 000 Éclats gagnés', test: s => s.totalShardsEarned >= 1000 },
  { id: 'guardian', icon: '👑', label: 'Gardien Alpha vaincu', test: s => s.guardianDefeated }
];
