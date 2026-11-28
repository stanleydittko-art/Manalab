/* ==========================================================================
   [6. EFFORT BRIDGE]
   Pont unique entre la boucle de jeu et la source d'effort.
   En mode 'PEDAGO' : lance un exercice/flash-quiz adapté.
   En futur mode 'COMMERCIAL' : brancher ici SDK Pub Récompensée ou Gemmes.
   ========================================================================== */
const EffortBridge = {
  _pedagoHandler: null,

  setPedagoHandler(fn) {
    this._pedagoHandler = fn;
  },

  /**
   * @param {string} actionType - 'EARN_MANA' | 'STABILIZE' | 'ACCELERATE' | 'OVERCHARGE'
   * @param {string} difficulty - 'easy' | 'medium' | 'hard' | 'flash'
   * @param {Function} onSuccess
   * @param {Function} onFail
   */
  requestAction(actionType, difficulty, onSuccess, onFail) {
    if (CONFIG.MODE === 'COMMERCIAL') {
      // ===================================================================
      // POINT DE BRANCHEMENT VERSION COMMERCIALE (Grand Public)
      // Exemple :
      //   if (actionType === 'ACCELERATE') return AdSDK.showRewardedVideo(onSuccess, onFail);
      //   if (actionType === 'OVERCHARGE') return StoreSDK.spendGems(15, onSuccess, onFail);
      // ===================================================================
      if (onSuccess) onSuccess();
      return;
    }

    // Mode PEDAGO : génération d'une question adaptée à l'action
    let question;
    let timeLimitSec = null;
    let title = 'Défi ManaLab';

    if (difficulty === 'flash' || actionType === 'STABILIZE' || actionType === 'ACCELERATE') {
      question = ExerciseGenerators.flashcard(state.questionHistory);
      timeLimitSec = CONFIG.FLASH_QUIZ_SEC;
      title = actionType === 'STABILIZE'
        ? '🧬 Stabilisation ADN (Flash-Quiz Mémoire)'
        : '⚡ Accélération d’Incubation (Flash-Quiz)';
    } else if (actionType === 'OVERCHARGE') {
      question = Math.random() < 0.5 ? ExerciseGenerators.medium() : ExerciseGenerators.hard();
      timeLimitSec = CONFIG.OVERCHARGE_QUIZ_SEC;
      title = '⚡ SURCHARGE : Stop ou Encore !';
    } else {
      question = ExerciseGenerators[difficulty] ? ExerciseGenerators[difficulty](state.questionHistory) : ExerciseGenerators.easy(state.questionHistory);
      const labels = { easy: 'Facile (Mana Brut)', medium: 'Moyen (Mana Pur)', hard: 'Difficile (Mana Prismatique)' };
      title = `🧪 Extraction de Mana — ${labels[difficulty] || ''}`;
    }

    if (this._pedagoHandler) {
      this._pedagoHandler({ title, question, timeLimitSec, actionType, difficulty }, onSuccess, onFail);
    }
  }
};
