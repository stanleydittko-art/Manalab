/* ==========================================================================
   [7. FX - VIVARIUM]
   Scène animée de l'onglet Enclos : les créatures placées se promènent,
   les cristaux du réservoir s'empilent (toucher = récolter), les animaux
   sautent de joie après une bonne réponse.
   100 % visuel : aucune logique de jeu ici, uniquement la lecture de `state`.
   Déplacements = transitions CSS (pas de boucle d'animation JS), mises en
   pause hors de l'onglet, quand l'écran est masqué ou en mode « animations réduites ».
   ========================================================================== */
const Vivarium = {
  ACTOR: 48,           // taille d'une créature (px) = cible tactile
  HEIGHT: 190,         // hauteur de la scène (px)
  MOVE_EVERY_MS: 2600,
  SPEED_PX_S: 26,
  _timer: null,
  _pos: {},            // dernière position connue par spécimen (survit aux re-rendus)

  reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  },

  // Spécimens affichés : les plus rares d'abord, limités pour rester fluide
  placed() {
    const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
    const list = [];
    for (const enc of state.enclosures) {
      if (!enc.unlocked) continue;
      for (const uid of enc.slots) if (uid && state.specimens[uid]) list.push(state.specimens[uid]);
    }
    list.sort((a, b) => order[SPECIES[a.speciesId].rarity] - order[SPECIES[b.speciesId].rarity]);
    return list.slice(0, CONFIG.VIVARIUM_MAX);
  },

  sceneHtml() {
    return `<div class="viv-scene" id="vivarium" style="height:${this.HEIGHT}px;">
      <div class="viv-glow"></div>
      <div class="viv-actors"></div>
      <button class="viv-pile" data-action="collect-pile" aria-label="Récolter les cristaux"></button>
      <div class="viv-empty" style="display:none;">Place une créature en enclos pour la voir vivre ici.</div>
    </div>`;
  },

  // À appeler après chaque rendu de l'onglet Enclos
  mount() {
    const root = document.getElementById('vivarium');
    if (!root) { this.stop(); return; }
    const list = this.placed();
    const box = root.querySelector('.viv-actors');
    root.querySelector('.viv-empty').style.display = list.length ? 'none' : '';
    box.innerHTML = list.map(sp => {
      const def = SPECIES[sp.speciesId];
      return `<button class="viv-actor r-${def.rarity} ${sp.chromatic ? 'chroma' : ''}" data-uid="${sp.uid}" aria-label="${def.name}">
        <span class="viv-flip"><span class="viv-bob">${getSpeciesSVG(def.id, sp.chromatic)}</span></span>
      </button>`;
    }).join('');

    const w = root.clientWidth || 320;
    box.querySelectorAll('.viv-actor').forEach(el => {
      const uid = el.dataset.uid;
      const p = this._pos[uid] || this._randomPoint(w);
      this._place(el, p.x, p.y, 0);
    });
    box.onclick = (e) => {
      const el = e.target.closest('.viv-actor');
      if (el) this.poke(el, root);
    };
    this.updatePile();
    if (!this._timer && !this.reducedMotion()) this._timer = setInterval(() => this.tick(), this.MOVE_EVERY_MS);
  },

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  _randomPoint(w) {
    const y = Math.round(this.HEIGHT * 0.32 + Math.random() * (this.HEIGHT * 0.68 - this.ACTOR - 6));
    // en bas à droite : on laisse la place au tas de cristaux
    const maxX = w - this.ACTOR - 8 - (y > this.HEIGHT * 0.5 ? 70 : 0);
    return { x: Math.round(Math.random() * Math.max(10, maxX)), y };
  },

  _place(el, x, y, durSec) {
    el.style.transitionDuration = `${durSec}s`;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.zIndex = String(Math.round(y));
    this._pos[el.dataset.uid] = { x, y };
  },

  // Les créatures ne bougent que si la scène est visible
  isActive() {
    return !document.hidden && UI.activeTab === 'enclosures' && !UI._modalOpen && !!document.getElementById('vivarium');
  },

  tick() {
    if (!document.getElementById('vivarium')) { this.stop(); return; }
    if (!this.isActive()) return;
    const root = document.getElementById('vivarium');
    const w = root.clientWidth || 320;
    root.querySelectorAll('.viv-actor').forEach(el => {
      if (Math.random() < 0.4) return; // pause : toutes ne bougent pas en même temps
      const cur = this._pos[el.dataset.uid] || this._randomPoint(w);
      const target = this._randomPoint(w);
      const nx = Math.round(cur.x + (target.x - cur.x) * 0.5);
      const ny = Math.round(cur.y + (target.y - cur.y) * 0.5);
      const dist = Math.hypot(nx - cur.x, ny - cur.y);
      if (dist < 8) return;
      const dur = Math.max(1, dist / this.SPEED_PX_S);
      el.querySelector('.viv-flip').classList.toggle('left', nx < cur.x);
      el.classList.add('walking');
      this._place(el, nx, ny, dur);
      setTimeout(() => el.classList.remove('walking'), dur * 1000);
    });
  },

  // Toucher une créature : petit saut + bulle d'info
  poke(el, root) {
    const sp = state.specimens[el.dataset.uid];
    if (!sp) return;
    const def = SPECIES[sp.speciesId];
    this._hop(el);
    root.querySelectorAll('.viv-bubble').forEach(b => b.remove());
    const pos = this._pos[el.dataset.uid] || { x: 0, y: 0 };
    const b = document.createElement('div');
    b.className = 'viv-bubble';
    b.textContent = `${def.name} • +${Utils.formatRate(Utils.specimenRate(def, sp.chromatic))}/s`;
    b.style.left = `${Math.max(4, Math.min(pos.x - 20, (root.clientWidth || 320) - 150))}px`;
    b.style.top = `${Math.max(2, pos.y - 30)}px`;
    root.appendChild(b);
    setTimeout(() => b.remove(), 2200);
    AudioFX.play('click');
  },

  _hop(el) {
    const bob = el.querySelector('.viv-bob');
    if (!bob) return;
    bob.classList.remove('hop');
    void bob.offsetWidth; // relance l'animation
    bob.classList.add('hop');
  },

  // Fête : toutes les créatures sautent (après une bonne réponse, une récolte...)
  celebrate() {
    const root = document.getElementById('vivarium');
    if (!root || this.reducedMotion()) return;
    root.querySelectorAll('.viv-actor').forEach((el, i) => setTimeout(() => this._hop(el), i * 90));
  },

  // Tas de cristaux : grossit avec le réservoir, toucher = récolter (flash-quiz)
  updatePile() {
    const pile = document.querySelector('.viv-pile');
    if (!pile) return;
    const gain = GameEngine.getCollectGain();
    const ratio = GameEngine.getReservoirRatio();
    const n = gain > 0 ? 1 + Math.floor(ratio * 5) : 0;
    if (pile.dataset.n !== String(n)) {
      pile.dataset.n = String(n);
      pile.innerHTML = '<span class="viv-rock"></span>' + Array.from({ length: n }, (_, i) => `<span class="viv-crystal c${i}">💎</span>`).join('');
    }
    pile.disabled = gain <= 0;
    pile.classList.toggle('full', ratio >= 0.85);
  }
};
