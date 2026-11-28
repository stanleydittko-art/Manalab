/* ==========================================================================
   [8. UI - MASCOTTE TIKI]
   Robot-lézard du laboratoire : porte la « Mission du moment » dans une bulle,
   encourage après les réponses, et remplace du texte par une voix courte.
   Extension visuelle uniquement (aucune logique de jeu).
   ========================================================================== */
const Mascot = {
  _speakUntil: 0,
  _timer: null,

  PHRASES: {
    win: ['Bien joué !', 'Exact !', 'Les probabilités n’ont plus de secret !', 'Quel cerveau !', 'Continue comme ça !'],
    fail: ['Pas grave ! Lis l’explication, tu y es presque.', 'Une erreur, c’est une leçon. On réessaie ?', 'Respire, relis la question et retente !'],
    collect: ['Quelle récolte ! Les cristaux brillent !', 'Beau butin, chercheur !'],
    streak: n => `Série de ${n} ! Tu es en feu ! 🔥`
  },

  svg() {
    return `<svg class="tiki-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path class="t-tail" d="M44 50 C58 52 60 40 54 36 C58 44 50 46 42 44 Z" fill="#0f9d8f"/>
      <ellipse cx="30" cy="46" rx="15" ry="12" fill="#14b8a6"/>
      <ellipse cx="30" cy="49" rx="9" ry="7" fill="#99f6e4"/>
      <rect x="20" y="55" width="7" height="5" rx="2.5" fill="#0f766e"/>
      <rect x="33" y="55" width="7" height="5" rx="2.5" fill="#0f766e"/>
      <rect x="11" y="14" width="38" height="28" rx="14" fill="#2dd4bf"/>
      <path d="M11 28 l-4 -3 v8 z M49 28 l4 -3 v8 z" fill="#fbbf24"/>
      <line x1="30" y1="14" x2="30" y2="6" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round"/>
      <circle class="t-antenna" cx="30" cy="5" r="3.5" fill="#fde047"/>
      <circle cx="22" cy="26" r="6" fill="#fff"/><circle cx="38" cy="26" r="6" fill="#fff"/>
      <circle class="t-pupil" cx="23" cy="27" r="3" fill="#0b2a33"/><circle class="t-pupil" cx="39" cy="27" r="3" fill="#0b2a33"/>
      <path class="m-smile" d="M23 35 Q30 41 37 35" stroke="#0b2a33" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <ellipse class="m-open" cx="30" cy="37" rx="5" ry="4" fill="#0b2a33"/>
      <path class="m-flat" d="M25 37 H35" stroke="#0b2a33" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
  },

  // Construit (une seule fois) la bulle : [Tiki] [texte]
  ensure(bubble) {
    if (!bubble.querySelector('.tiki')) {
      bubble.innerHTML = `<span class="tiki" data-mood="happy">${this.svg()}</span><span class="mission-text"></span>`;
    }
    return bubble.querySelector('.mission-text');
  },

  isSpeaking() { return Date.now() < this._speakUntil; },

  setMood(mood) {
    const t = document.querySelector('#mission-bubble .tiki');
    if (t) t.dataset.mood = mood;
  },

  // Tiki parle quelques secondes à la place de la mission
  say(text, mood = 'happy', ms = 3600) {
    const bubble = document.getElementById('mission-bubble');
    if (!bubble) return;
    const txt = this.ensure(bubble);
    bubble.style.display = '';
    txt.textContent = text;
    this.setMood(mood);
    this._speakUntil = Date.now() + ms;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._speakUntil = 0;
      this.setMood('happy');
      UI.renderProgress();
    }, ms);
  },

  _pick(list) { return list[Math.floor(Math.random() * list.length)]; },

  // Réaction à un événement de jeu ('win' | 'fail' | 'collect')
  react(kind) {
    if (kind === 'win') {
      const s = state.streak;
      if (CONFIG.MASCOT_STREAKS.includes(s)) this.say(this.PHRASES.streak(s), 'celebrate');
      else this.say(this._pick(this.PHRASES.win), 'celebrate', 2200);
      Vivarium.celebrate();
    } else if (kind === 'fail') {
      this.say(this._pick(this.PHRASES.fail), 'think', 4200);
    } else if (kind === 'collect') {
      this.say(this._pick(this.PHRASES.collect), 'celebrate');
      Vivarium.celebrate();
    }
  }
};
