# AGENT.md — Règles de développement pour ManaLab

Ce fichier définit les règles strictes que tout agent IA (Antigravity ou autre) **DOIT** suivre pour développer et faire évoluer **ManaLab : L'Île aux Spécimens Mutants**.
Le propriétaire du projet travaille **100 % sur smartphone via GitHub** : la clarté, l'économie de jetons et la stabilité du code sont prioritaires sur tout le reste.

---

## 1. Identité du projet & Vision produit

* **Nom :** ManaLab — L'Île aux Spécimens Mutants.
* **Univers :** Science-fiction tropicale ancrée en Polynésie française (*Fenua*, *Mana*, *Tupa*, *Tiare*, *Mo'o*, *Honu*, *Puhi*, *Fai*, *ManaDex*).
* **Cible actuelle :** Élèves sur **iPad et smartphones (iOS / Android)** en classe, en mode **PWA hors-ligne**.
* **Cœur pédagogique :** Manipulation visuelle des **probabilités et pourcentages** (barre d'incubation dynamique, Surcharge *Stop ou Encore*, Fusion risquée 65 % / 100 %, Jauge de Chance Garantie *Pity*) et **répétition espacée** (stabilisation ADN par flash-quiz mémoire).
* **Évolution future :** Version commerciale grand public (Gemmes, publicités récompensées, Pass de Saison) sans réécrire le moteur de jeu.

---

## 2. Stack technique & Déploiement (iPad / Smartphones hors-ligne)

* **Zéro build, zéro dépendance lourde :** HTML5, CSS3 et JavaScript ES Modules natifs (`<script type="module">`) uniquement. **INTERDICTION** d'introduire React, TypeScript, Vite, Webpack, npm ou des CDN externes (le jeu doit tourner 100 % sans internet).
* **Priorité PWA hors-ligne (iPad & smartphones) :**
  * Le jeu repose sur `manifest.json` et un Service Worker (`sw.js`) qui met en cache tous les fichiers locaux dès la première ouverture.
  * **RÈGLE CRITIQUE CACHE :** À chaque ajout/suppression de fichier ou mise à jour notable, incrémenter `CACHE_NAME` dans `sw.js` (ex. `manalab-cache-v2` -> `v3`) et tenir à jour la liste des fichiers mis en cache. Ne jamais casser le mode hors-ligne.
* **Plan B fichier unique :** Si un workflow GitHub Actions génère `dist/manalab-offline.html`, ne jamais modifier `dist/` manuellement ; laisser l'action l'assembler automatiquement.

---

## 3. Architecture modulaire stricte (Carte du dépôt)

Le projet suit l'ordre de dépendance strict des **9 bannières ManaLab** découpées en petits modules natifs. **Un module ne doit jamais importer un module situé plus bas dans la liste.**

```text
manalab/
├── AGENT.md              # Ce fichier (source de vérité)
├── index.html            # Squelette HTML minimal + balises PWA iOS/Android
├── styles.css            # Design system mobile-first (lagon bioluminescent)
├── manifest.json         # Métadonnées PWA (icône, plein écran, thème)
├── sw.js                 # Service Worker (cache 100 % hors-ligne)
├── tests/run.js          # Tests auto : `node tests/run.js` (lancés aussi par GitHub Actions)
└── js/
    ├── 1-config.js       # Constantes, probabilités, coûts, timers, MODE ('PEDAGO'|'COMMERCIAL')
    ├── 2-data.js         # Espèces, SVG, synergies, biomes
    ├── 2-exercises.js    # Générateurs d'exercices (niveau de classe, catégories)
    ├── 2-tips.js         # Textes d'aide ❓ et liste des succès
    ├── 3-state.js        # État vivant (state), localStorage, migration, gains hors-ligne
    ├── 4-utils.js        # RNG pondéré, formatage nombres/durées, Web Audio synthétique
    ├── 5-engine.js       # Cœur logique PUR (ProbaEngine, GameEngine, tick) — ZÉRO DOM
    ├── 5-engine-progress.js # Paliers, mission, succès, bilan (Object.assign(GameEngine, …))
    ├── 6-bridge.js       # EffortBridge : pont unique Exercices <-> futures Pubs/Gemmes
    ├── 7-fx.js           # Canvas 60 FPS (bulles, confettis, textes flottants)
    ├── 8-ui.js           # Noyau UI (objet UI, HUD, dirty flags, toasts)
    ├── 8-ui-tabs.js      # Rendu des onglets (Object.assign(UI, …))
    ├── 8-ui-modals.js    # Modales (quiz, éclosion, fusion, Gardien…)
    ├── 8-ui-progress.js  # Onglets verrouillés, mission, aides ❓, code enseignant
    ├── 8-ui-settings.js  # Réglages, export/import, panneau enseignant, bilan, succès
    ├── 8-ui-events.js    # Événements tactiles (délégation)
    └── 9-main.js         # Point d'entrée, câblage Engine<->UI/FX, boucles tick & RAF
```

> **Note de transition :** Si le dépôt démarre avec un fichier unique `index.html` contenant les 9 bannières commentées (`[1. CONFIG & BALANCE]` ... `[9. INIT & LOOP]`), la toute première tâche d'architecture consiste à le découper proprement selon l'arborescence ci-dessus avant d'ajouter de nouvelles fonctionnalités.

---

## 4. Règles d'économie de jetons (Anti-dépassement)

1. **Lecture ciblée obligatoire :** Ne lis **que** les fichiers strictement nécessaires à la demande (généralement 1 à 2 fichiers). Ne scanne jamais tout le dépôt inutilement.
2. **Plafond de 500 lignes (tolérance 600) par fichier JS :** Si un fichier dépasse 500 lignes (ex. `js/2-data.js` avec plusieurs biomes ou `js/8-ui.js`), propose de le scinder proprement (ex. `js/data/biome1.js`, `js/data/exercises.js`, `js/ui/modals.js`) **avant** de le faire.
3. **Éditions chirurgicales uniquement :** Modifie uniquement les fonctions ou blocs concernés. **INTERDICTION** de réécrire un fichier complet ou de reformater du code non touché.
4. **Assets légers :** Les créatures et icônes utilisent du SVG inline compact ou du Canvas. Aucune image lourde en base64.

---

## 5. Règles anti-cassure & Garde-fous techniques

### A. Séparation stricte des responsabilités
* **`js/1-config.js` :** Toute valeur d'équilibrage (pourcentages, multiplicateurs, coûts, seuils *Pity*, durées) doit vivre ici. Aucun nombre magique caché dans le moteur ou l'UI.
* **`js/5-engine.js` :** **ZÉRO accès au DOM** (aucun `document`, `window.alert`, ou manipulation HTML). Le moteur communique vers l'extérieur uniquement via des retours de fonction et son bus d'événements (`GameEngine.emit(...)`).
* **`js/6-bridge.js` (`EffortBridge`) :** Toute récompense conditionnée à un effort (gagner du Mana, stabiliser un enclos, accélérer une incubation, surcharger un œuf, sauver une fusion) **DOIT** passer par `EffortBridge.requestAction(actionType, difficulty, onSuccess, onFail)`. Interdiction de court-circuiter ce pont : il garantit le futur passage au mode `COMMERCIAL`.
* **`js/8-ui.js` :** Ne jamais redessiner tout le DOM dans la boucle 1 seconde ou 60 FPS (cela détruit les clics tactiles). Utiliser le système de `dirty flags` pour les rendus complets et des mises à jour ciblées (`textContent`, `style.width`) pour les compteurs en direct.

### B. Protection absolue des sauvegardes (`localStorage`)
* Ne jamais renommer ni supprimer une clé existante dans `state` sans écrire une règle correspondante dans `Storage.migrate()` et incrémenter `CONFIG.SAVE_VERSION`.
* Toute nouvelle propriété ajoutée à `state` doit posséder une valeur par défaut sûre afin que les parties des élèves déjà en cours chargent sans erreur.

### C. Ergonomie Mobile-First (iPad & Smartphones)
* **Largeur minimale testée :** 360 px sans aucun débordement horizontal (`overflow-x: hidden`).
* **Zones tactiles :** Boutons et onglets d'au moins `44px × 44px`, utilisables au pouce.
* **Zéro dépendance au survol (`:hover`) :** Aucune information essentielle cachée dans un tooltip au survol souris.
* **Spécificités Safari iOS :**
  * L'audio Web Audio doit toujours être initialisé/débloqué suite à une interaction utilisateur et entouré de `try/catch`.
  * Respecter les zones sûres iOS (`env(safe-area-inset-bottom)`) et éviter les polices externes nécessitant internet.

---

## 6. Protocole de travail sur smartphone & Git

### Avant de coder (Validation rapide)
Pour toute tâche qui touche plus d'un fichier ou ajoute une mécanique/un biome :
1. Présente un **mini-plan de 3 à 5 lignes maximum** (fichiers ciblés + changements prévus).
2. Attends un **« OK »** de l'utilisateur avant d'éditer.
*(Pour une micro-correction évidente de texte, couleur ou constante, tu peux appliquer directement.)*

### Règle Git : 1 tâche = 1 commit atomique
* Ne mélange jamais deux sujets différents dans un même commit (ex. ne pas mélanger un rééquilibrage de probabilités et une refonte CSS).
* Message de commit court et clair en français :
  * `feat(data): ajoute 3 espèces au Biome 2`
  * `fix(proba): corrige l'arrondi à 100% après Surcharge`
  * `balance(config): ajuste le coût de l'Incubateur #2`
  * `chore(pwa): met à jour le cache sw.js en v3`

### Vérifications obligatoires avant de conclure
Avant de livrer une modification, lance `node tests/run.js` puis vérifie systématiquement :
1. Aucune erreur de syntaxe ni d'import/export relatif (`./...js`) cassé.
2. Les probabilités affichées dans l'incubateur somment toujours exactement à **100 %**.
3. Les sauvegardes existantes se chargent sans crash (`Storage.migrate`).
4. Si des fichiers ont été ajoutés/renommés, `sw.js` est mis à jour.
5. Aucune mécanique existante n'a été supprimée par inadvertance.

### Format de réponse final (Optimisé lecture téléphone)
Réponds toujours en **français**, de façon concise (**5 puces maximum**) :
* **Fichiers modifiés :** liste exacte.
* **Ce qui a changé :** résumé en 1 à 2 lignes.
* **Test rapide sur téléphone :** 1 parcours précis de 20 secondes à vérifier sur GitHub Pages.

---

## 7. Conventions de nommage & Langue

* **Code, fichiers, fonctions, variables :** Anglais clair et cohérent (`computeOdds`, `hatchEgg`, `enclosureId`).
* **Textes visibles du jeu, commentaires métier, échanges :** Français naturel, en respectant l'orthographe et l'esprit des termes polynésiens (*Mana*, *Fenua*, *Tupa*, *Tiare*, *Mo'o*, *Honu*, *Puhi*, *Fai*, *Te Feti'a*, *ManaDex*).
* **Générateurs d'exercices :** Tous les énoncés et explications pédagogiques doivent être en français clair, mathématiquement exacts (résultats entiers ou pourcentages propres), avec 4 choix distincts sans doublon.
## Équilibrage
- Tous les coûts/conditions de maîtrise sont dans `js/1-config.js` (`*_COSTS`, `*_REQ`, `GUARDIAN_MASTERY`, `PRODUCTION_MULT`).
- Après tout changement d'équilibrage : `node tools/sim.js 260 3` (élève virtuel, 3 questions/min). Cible actuelle : Gardien ≈ 100–130 min.
