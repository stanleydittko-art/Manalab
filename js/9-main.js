/* ==========================================================================
   [9. INIT & LOOP]
   Initialisation propre, câblage Engine <-> UI/FX, boucle logique 1s,
   sauvegarde auto 15s et boucle Canvas 60 FPS
   ========================================================================== */
function init() {
  Storage.load();
  FXRenderer.init();

  // Brancher le gestionnaire pédagogique dans le pont EffortBridge
  EffortBridge.setPedagoHandler((cfg, onSuccess, onFail) => {
    UI.openQuizModal(cfg, onSuccess, onFail);
  });

  // Câbler les événements du moteur vers UI et FX (découplage strict)
  GameEngine.onEvent((type, payload) => {
    if (type === 'stateChanged') UI.markDirty(payload.areas || []);
    if (type === 'toast') UI.showToast(payload.text, payload.tone);
    if (type === 'fx') {
      if (payload.kind === 'burst') FXRenderer.spawnBurst(payload.rarity, payload.chromatic);
      if (payload.kind === 'floatText') FXRenderer.spawnFloatText(payload.text);
    }
  });

  UI.bindEvents();
  UI.renderDirty();

  // Afficher les gains hors-ligne s'il y en a eu
  if (Storage.offlineReport) {
    UI.showOfflineModal(Storage.offlineReport);
  }

  // Boucle logique (1 Hz : production, timers d'œufs, instabilité ADN)
  setInterval(() => {
    GameEngine.tick(CONFIG.TICK_MS / 1000);
    UI.updateLiveTickDisplay();
    UI.renderDirty();
  }, CONFIG.TICK_MS);

  // Sauvegarde automatique toutes les 15 secondes
  setInterval(() => Storage.save(), CONFIG.AUTOSAVE_MS);
  window.addEventListener('beforeunload', () => Storage.save());

  // Boucle d'animation Canvas 60 FPS
  function renderLoop(ts) {
    FXRenderer.draw(ts);
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);
}

window.addEventListener('load', init);

// Enregistrement du Service Worker (mode hors-ligne PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
