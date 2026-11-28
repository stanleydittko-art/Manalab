/* ==========================================================================
   [2. DATA - EXERCICES]
   Générateurs procéduraux (calcul, pourcentages, probabilités).
   Chaque modèle de question a un niveau de classe minimum (1=6e … 4=3e) et une
   catégorie (calcul | pourcentage | proba) utilisée par le bilan enseignant.
   Résultats toujours entiers, 4 choix distincts, explication en français.
   ========================================================================== */
const ExerciseGenerators = {
  grade: 4, // 4 = tous les modèles (valeur par défaut) ; réglable par l'enseignant
  REVIEW_CHANCE: 0.25, // part de questions déjà ratées qui reviennent (répétition espacée)

  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  _pick(arr) {
    return arr[this._randInt(0, arr.length - 1)];
  },

  _buildChoices(correctVal, unit, deltas) {
    const set = new Set([correctVal]);
    const pool = [...deltas].sort(() => Math.random() - 0.5);
    for (const d of pool) {
      const candidate = correctVal + d;
      if (candidate > 0 && !set.has(candidate)) set.add(candidate);
      if (set.size === 4) break;
    }
    let guard = 1;
    while (set.size < 4) {
      const fallback = correctVal + guard * 5;
      if (!set.has(fallback)) set.add(fallback);
      guard++;
    }
    const arr = Array.from(set).sort(() => Math.random() - 0.5);
    const suffix = unit || '';
    return {
      choices: arr.map(v => `${v}${suffix}`),
      answerIndex: arr.indexOf(correctVal)
    };
  },

  // --- Modèles de questions : { grade, cat, make() -> {prompt, val, unit?, explain, deltas} } ---
  KINDS: {
    easy: [
      { grade: 1, cat: 'calcul', make(g) {
        const a = g._randInt(14, 58), b = g._randInt(12, 39);
        return { prompt: `Calcul rapide : ${a} + ${b} = ?`, val: a + b, explain: `${a} + ${b} = ${a + b}.`, deltas: [-10, -2, -1, 1, 2, 10] };
      } },
      { grade: 1, cat: 'calcul', make(g) {
        const a = g._randInt(45, 95), b = g._randInt(12, 38);
        return { prompt: `Calcul rapide : ${a} − ${b} = ?`, val: a - b, explain: `${a} − ${b} = ${a - b}.`, deltas: [-10, -3, -1, 1, 3, 10] };
      } },
      { grade: 1, cat: 'calcul', make(g) {
        const a = g._randInt(4, 9), b = g._randInt(4, 9);
        return { prompt: `Table de multiplication : ${a} × ${b} = ?`, val: a * b, explain: `${a} × ${b} = ${a * b}.`, deltas: [-a, -2, 2, a, -b, b] };
      } },
      { grade: 1, cat: 'calcul', make(g) {
        const half = g._randInt(14, 48);
        return { prompt: `Quelle est la moitié de ${half * 2} ?`, val: half, explain: `La moitié de ${half * 2} est ${half * 2} ÷ 2 = ${half}.`, deltas: [-4, -2, -1, 1, 2, 4] };
      } },
      { grade: 1, cat: 'calcul', make(g) {
        const a = g._randInt(12, 79);
        return { prompt: `Calcule ${a} × 10 :`, val: a * 10, explain: `Multiplier par 10 décale d'un rang : ${a} × 10 = ${a * 10}.`, deltas: [-100, -10, 10, 100, -a, a] };
      } },
      { grade: 1, cat: 'calcul', make(g) {
        const a = g._randInt(11, 89);
        return { prompt: `Combien manque-t-il à ${a} pour arriver à 100 ?`, val: 100 - a, explain: `100 − ${a} = ${100 - a}.`, deltas: [-10, -5, -1, 1, 5, 10] };
      } }
    ],
    medium: [
      { grade: 2, cat: 'pourcentage', make(g) {
        const pct = g._pick([10, 20, 25, 50, 75]), base = g._pick([40, 60, 80, 120, 160, 200, 240]);
        const val = (pct * base) / 100;
        return { prompt: `Calcule ${pct}% de ${base} Éclats :`, val, explain: `${pct}% de ${base} = (${pct} × ${base}) ÷ 100 = ${val}.`, deltas: [-15, -10, -5, 5, 10, 20] };
      } },
      { grade: 1, cat: 'calcul', make(g) {
        const a = g._randInt(11, 19), b = g._randInt(4, 8);
        return { prompt: `Un enclos produit ${a} Éclats/s pendant ${b} s. Total ?`, val: a * b, explain: `${a} × ${b} = ${a * b} Éclats.`, deltas: [-a, -4, 4, a, -10, 10] };
      } },
      { grade: 2, cat: 'proba', make(g) {
        const total = g._pick([10, 20, 25]), fav = g._randInt(2, total - 3);
        const val = Math.round((fav / total) * 100);
        return { prompt: `Un bassin contient ${fav} spécimens Rares sur ${total} au total. Probabilité de tirer un Rare ?`, val, unit: '%', explain: `${fav} ÷ ${total} = ${val}%.`, deltas: [-15, -10, -5, 5, 10, 15] };
      } },
      { grade: 3, cat: 'pourcentage', make(g) {
        const base = g._pick([50, 80, 100, 120, 200]), pct = g._pick([10, 25, 50]);
        const add = (base * pct) / 100;
        return { prompt: `Une synergie ajoute +${pct}% à une production de ${base}. Nouvelle production ?`, val: base + add, explain: `${pct}% de ${base} = ${add}, donc ${base} + ${add} = ${base + add}.`, deltas: [-20, -10, -5, 5, 10, 20] };
      } },
      { grade: 2, cat: 'pourcentage', make(g) {
        const [num, den, val] = g._pick([[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [1, 10, 10], [3, 10, 30], [4, 5, 80]]);
        return { prompt: `Écris la fraction ${num}/${den} en pourcentage :`, val, unit: '%', explain: `${num} ÷ ${den} = ${val / 100}, soit ${val}%.`, deltas: [-15, -10, -5, 5, 10, 15] };
      } },
      { grade: 3, cat: 'pourcentage', make(g) {
        const price = g._pick([40, 50, 80, 100, 200]), pct = g._pick([10, 20, 25, 50]);
        const val = price - (price * pct) / 100;
        return { prompt: `Une amélioration coûte ${price} Éclats, mais elle est en promotion à −${pct}%. Nouveau prix ?`, val, explain: `${pct}% de ${price} = ${(price * pct) / 100}, donc ${price} − ${(price * pct) / 100} = ${val}.`, deltas: [-20, -10, -5, 5, 10, 20] };
      } }
    ],
    hard: [
      { grade: 4, cat: 'pourcentage', make(g) {
        const pct = g._pick([20, 25, 40, 50]), total = g._pick([60, 80, 100, 120, 150, 200]);
        const part = (pct * total) / 100;
        return { prompt: `${pct}% d'une réserve de Mana vaut ${part}. Combien vaut la réserve entière (100%) ?`, val: total, explain: `Si ${pct}% = ${part}, alors 100% = (${part} × 100) ÷ ${pct} = ${total}.`, deltas: [-40, -20, -10, 10, 20, 40] };
      } },
      { grade: 2, cat: 'proba', make(g) {
        const fail = g._randInt(15, 75);
        return { prompt: `Une mutation risquée a ${fail}% de risque d'échouer. Quelle est sa probabilité de réussir ?`, val: 100 - fail, unit: '%', explain: `Les deux probabilités font 100% : 100% − ${fail}% = ${100 - fail}%.`, deltas: [-15, -10, -5, 5, 10, 15] };
      } },
      { grade: 3, cat: 'proba', make(g) {
        const epic = g._randInt(8, 24), leg = g._randInt(3, 14);
        return { prompt: `Un œuf a ${epic}% d'être Épique et ${leg}% d'être Légendaire. Probabilité d'avoir Épique OU Légendaire ?`, val: epic + leg, unit: '%', explain: `Événements incompatibles : ${epic}% + ${leg}% = ${epic + leg}%.`, deltas: [-8, -4, -2, 2, 4, 8] };
      } },
      { grade: 4, cat: 'proba', make(g) {
        const [p1, p2, val] = g._pick([[50, 50, 25], [50, 20, 10], [40, 50, 20], [80, 50, 40], [60, 50, 30], [20, 50, 10], [40, 25, 10]]);
        return { prompt: `Deux tirages indépendants ont ${p1}% et ${p2}% de réussite. Probabilité de réussir les DEUX ?`, val, unit: '%', explain: `On multiplie les probabilités : ${p1}% × ${p2}% = (${p1} × ${p2}) ÷ 100 = ${val}%.`, deltas: [-10, -5, 5, 10, 15, 25] };
      } },
      { grade: 3, cat: 'pourcentage', make(g) {
        const [pct, base, val] = g._pick([[15, 200, 30], [35, 120, 42], [12, 250, 30], [30, 140, 42], [45, 80, 36], [15, 160, 24]]);
        return { prompt: `Calcul avancé : combien font ${pct}% de ${base} ?`, val, explain: `${pct}% de ${base} = (${pct} × ${base}) ÷ 100 = ${val}.`, deltas: [-12, -6, -3, 3, 6, 12] };
      } },
      { grade: 4, cat: 'pourcentage', make(g) {
        const base = g._pick([100, 200, 300, 400]), pct = g._pick([10, 20, 50]);
        const up = base + (base * pct) / 100, val = up - (up * pct) / 100;
        return { prompt: `Une production de ${base} augmente de ${pct}%, puis diminue de ${pct}%. Quelle est la production finale ?`, val, explain: `${base} + ${pct}% = ${up}. Puis ${up} − ${pct}% = ${val}. On n'est pas revenu à ${base} : les ${pct}% ne portent pas sur le même nombre !`, deltas: [-10, -5, 5, 10, 20, 30] };
      } },
      { grade: 3, cat: 'proba', make(g) {
        const [r, b, v] = g._pick([[3, 5, 2], [2, 6, 2], [4, 4, 2], [1, 7, 2], [5, 3, 2]]);
        const total = r + b + v, val = Math.round(((total - r) / total) * 100);
        return { prompt: `Un sac contient ${r} billes rouges, ${b} bleues et ${v} vertes. Probabilité de NE PAS tirer une rouge ?`, val, unit: '%', explain: `Billes non rouges : ${b} + ${v} = ${b + v} sur ${total}. ${b + v} ÷ ${total} = ${val}%.`, deltas: [-20, -10, -5, 5, 10, 15] };
      } }
    ]
  },

  _byGrade(diff) {
    const list = this.KINDS[diff].filter(k => k.grade <= this.grade);
    return list.length > 0 ? list : this.KINDS[diff];
  },

  // Génère une question ; peut rejouer une question déjà ratée du même niveau (répétition espacée)
  generate(diff, history) {
    if (history && Math.random() < this.REVIEW_CHANCE) {
      const missed = history.filter(h => h.wrongCount > 0 && h.question && h.question.difficulty === diff);
      if (missed.length > 0) {
        return { ...this._pick(missed).question, isReview: true };
      }
    }
    const kind = this._pick(this._byGrade(diff));
    const q = kind.make(this);
    const { choices, answerIndex } = this._buildChoices(q.val, q.unit, q.deltas);
    const letter = { easy: 'E', medium: 'M', hard: 'H' }[diff];
    return { key: `${letter}:${q.prompt}`, difficulty: diff, cat: kind.cat, prompt: q.prompt, choices, answerIndex, explain: q.explain, isReview: false };
  },

  easy(history) { return this.generate('easy', history); },
  medium(history) { return this.generate('medium', history); },
  hard(history) { return this.generate('hard', history); },

  // FLASH-QUIZ (Répétition espacée : pioche en priorité dans les questions déjà rencontrées)
  flashcard(history) {
    if (history && history.length > 0) {
      // Prioriser les questions ratées ou les plus anciennes
      const sorted = [...history].sort((a, b) => (a.wrongCount > b.wrongCount ? -1 : a.lastSeen - b.lastSeen));
      const topPool = sorted.slice(0, Math.min(4, sorted.length));
      const picked = topPool[Math.floor(Math.random() * topPool.length)];
      return { ...picked.question, isReview: true };
    }
    return { ...this.easy(), isReview: false };
  }
};
