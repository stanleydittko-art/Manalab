/* ==========================================================================
   [8. UI - EVENEMENTS]
   Extension de UI (defini dans 8-ui.js)
   ========================================================================== */
Object.assign(UI, {
  // --- LIAISON DES ÉVÉNEMENTS (Délégation propre) ---
  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.nav-tab[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `tab-${tabName}`);
    });
    this.markDirty([tabName, 'nav']);
    this.renderDirty();
    this.maybeShowFirstTip(tabName);
  },

  bindEvents() {
    // Boutons HUD
    document.getElementById('btn-sound').addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      if (state.soundEnabled) AudioFX.play('click');
      this.markDirty(['hud']);
      this.renderDirty();
      Storage.save();
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      AudioFX.play('click');
      this.openSettingsModal();
    });

    document.getElementById('mission-bubble').addEventListener('click', (ev) => {
      const tab = ev.currentTarget.dataset.tab;
      if (tab) { AudioFX.play('click'); this.goToTab(tab); }
    });

    // Navigation par onglets
    document.querySelector('.nav-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      AudioFX.play('click');
      if (btn.dataset.action === 'open-guardian') {
        this.goToTab('guardian');
        return;
      }
      if (btn.dataset.tab) this.goToTab(btn.dataset.tab);
    });

    // Délégation globale sur le contenu principal
    document.querySelector('main').addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el || el.disabled) return;
      const action = el.dataset.action;

      switch (action) {
        case 'goto-tab':
          AudioFX.play('click');
          this.switchTab(el.dataset.target);
          break;

        case 'remove-specimen':
          AudioFX.play('click');
          GameEngine.removeSpecimenFromEnclosure(el.dataset.uid);
          break;

        case 'place-auto': {
          AudioFX.play('click');
          const freeEnc = state.enclosures.find(enc => enc.unlocked && enc.slots.includes(null));
          if (freeEnc) GameEngine.assignSpecimenToEnclosure(el.dataset.uid, freeEnc.id);
          break;
        }

        case 'quick-fill': {
          const reserve = GameEngine.getReserveSpecimens();
          if (reserve.length > 0) {
            AudioFX.play('click');
            GameEngine.assignSpecimenToEnclosure(reserve[0].uid, Number(el.dataset.enc));
          } else {
            this.showToast('Aucun spécimen en réserve. Incube un œuf !', 'cyan');
          }
          break;
        }

        case 'unlock-enclosure':
          GameEngine.unlockEnclosure(Number(el.dataset.enc));
          break;

        case 'buy-lab-boost':
          GameEngine.buyLabBoost();
          break;

        case 'stabilize': {
          const encId = Number(el.dataset.enc);
          EffortBridge.requestAction(
            'STABILIZE',
            'flash',
            () => GameEngine.stabilizeEnclosure(encId),
            () => this.showToast('Stabilisation ratée — réessaie le flash-quiz !', 'danger')
          );
          break;
        }

        case 'mana-step':
          GameEngine.adjustManaSelection(el.dataset.mana, Number(el.dataset.delta));
          break;

        case 'start-incubation': {
          const res = GameEngine.startIncubation();
          if (!res.ok) this.showToast(res.msg, 'danger');
          break;
        }

        case 'unlock-incubator':
          GameEngine.unlockIncubator(Number(el.dataset.inc));
          break;

        case 'accelerate-egg': {
          const incId = Number(el.dataset.inc);
          EffortBridge.requestAction(
            'ACCELERATE',
            'flash',
            () => GameEngine.accelerateEgg(incId),
            () => this.showToast('Accélération ratée, l’incubation continue normalement.', 'danger')
          );
          break;
        }

        case 'open-hatch-modal':
          AudioFX.play('click');
          this.openHatchModal(Number(el.dataset.inc));
          break;

        case 'show-tip':
          AudioFX.play('click');
          this.showTip(el.dataset.tip);
          break;

        case 'start-exercise': {
          const diff = el.dataset.diff;
          if (!GameEngine.isExerciseTierOpen(diff)) break;
          EffortBridge.requestAction(
            'EARN_MANA',
            diff,
            () => {
              const rew = GameEngine.grantExerciseReward(diff);
              const names = { raw: 'Mana Brut', pure: 'Mana Pur', prismatic: 'Mana Prismatique' };
              this.showToast(`+${rew.gained} ${names[rew.manaKey]} & +${rew.shardBonus} ✦ !`, rew.bonusDose ? 'gold' : 'cyan');
            },
            () => this.showToast('Série réinitialisée ! Analyse l’explication et retente.', 'danger')
          );
          break;
        }

        case 'fuse':
          this.openFusionSuspenseModal(el.dataset.species, el.dataset.mode);
          break;
      }
      this.renderDirty();
    });
  }
});
