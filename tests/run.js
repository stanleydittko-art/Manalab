/* Tests automatiques ManaLab (Node, sans dépendance) : `node tests/run.js` */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');

let failures = 0;
const check = (name, ok, info = '') => {
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' → ' + info}`);
};

// --- Ordre des scripts lu depuis index.html (source de vérité) ---
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

// --- 1. Service Worker : tous les fichiers référencés sont mis en cache ---
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const cacheList = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\]);/)[1]);
const needed = ['index.html', 'styles.css', 'manifest.json', ...scripts];
for (const f of needed) {
  check(`sw.js met ${f} en cache`, cacheList.includes(f), 'manquant dans FILES');
  check(`${f} existe`, fs.existsSync(path.join(root, f)), 'fichier absent');
}
for (const f of fs.readdirSync(path.join(root, 'js'))) {
  check(`js/${f} est chargé par index.html`, scripts.includes('js/' + f), 'non référencé');
}

// --- 2. Environnement navigateur minimal ---
const mkEl = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  addEventListener() {}, appendChild() {}, querySelector: () => mkEl(), textContent: '', innerHTML: '', remove() {}, click() {} });
const els = {};
const store = {};
const ctx = {
  document: { getElementById: id => els[id] || (els[id] = mkEl()), querySelector: () => mkEl(), querySelectorAll: () => [],
    createElement: () => mkEl(), addEventListener() {}, documentElement: mkEl() },
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  console, setInterval() {}, setTimeout() {}, requestAnimationFrame() {}, navigator: {}, Math, Date, JSON
};
ctx.window = ctx; ctx.addEventListener = () => {};
vm.createContext(ctx);
const src = scripts.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
vm.runInContext(src + '\n;this.__t = { CONFIG, state: () => state, GameEngine, ProbaEngine, ExerciseGenerators, Storage, Utils, UI, ACHIEVEMENTS, SPECIES_LIST, createDefaultState };', ctx);
const T = ctx.__t;
check('Les 13+ scripts se chargent sans erreur', true);

// --- 3. Probabilités : somme exacte de 100 % ---
let badOdds = 0;
for (let raw = 0; raw <= 5; raw++) for (let pure = 0; pure + raw <= 5; pure++) for (let pr = 0; pr + pure + raw <= 5; pr++) {
  const o = T.ProbaEngine.computeOdds({ raw, pure, prismatic: pr }, { ignorePity: true });
  const sum = o.common + o.rare + o.epic + o.legendary;
  const oc = T.ProbaEngine.computeOverchargedOdds(o);
  const sum2 = oc.common + oc.rare + oc.epic + oc.legendary;
  const ints = [o.common, o.rare, o.epic, o.legendary].every(Number.isInteger);
  if (sum !== 100 || sum2 !== 100 || !ints) badOdds++;
}
check('Probabilités entières, somme = 100 % (toutes doses + Surcharge)', badOdds === 0, `${badOdds} cas faux`);

// --- 4. Exercices : 4 choix distincts, réponse valide, explication ---
let badQ = 0, info = '';
for (const grade of [1, 2, 3, 4]) {
  T.ExerciseGenerators.grade = grade;
  for (const diff of ['easy', 'medium', 'hard']) for (let i = 0; i < 400; i++) {
    const q = T.ExerciseGenerators[diff]();
    const uniq = new Set(q.choices).size === 4 && q.choices.length === 4;
    const okIdx = q.answerIndex >= 0 && q.answerIndex < 4;
    const noNaN = !/NaN|undefined|\./.test(q.prompt + q.choices.join('')) || /\d\.\d/.test(q.prompt);
    if (!uniq || !okIdx || !q.explain || !q.cat || /NaN|undefined/.test(JSON.stringify(q))) { badQ++; info = q.prompt; }
  }
}
T.ExerciseGenerators.grade = 4;
check('Exercices : 4 choix distincts, réponse valide, catégorie (tous niveaux)', badQ === 0, info);

// --- 5. Sauvegardes ---
const def = T.createDefaultState();
check('Nouvelle partie : paliers verrouillés', !def.unlocked.enclosures && !def.unlocked.fusion);
const old = T.Storage.migrate({ shards: 5, mana: { raw: 1 } });
check('Ancienne sauvegarde : tout débloqué', Object.values(old.unlocked).every(Boolean));
check('Migration : nouvelles clés par défaut', old.achievements && old.settings && old.catStats && old.grade === 4);

// --- 6. Progression & mission ---
const eng = T.GameEngine;
T.Storage.load();
check('Mission de départ = lancer un œuf', /œuf/.test(eng.getMission().text));
eng.startIncubation(); T.state().incubators[0].egg.remainingSec = 0; eng.hatchEgg(0);
check('1re éclosion débloque les Enclos', T.state().unlocked.enclosures === true);
T.state().stats.eggsHatched = 5; eng.checkUnlocks();
check('3 éclosions débloquent Production/Surcharge', T.state().unlocked.producer === true);
check('Palier Moyen verrouillé au départ', eng.isExerciseTierOpen('medium') === false);
T.state().stats.exercisesWon = 8;
check('Palier Moyen ouvert après 5 bonnes réponses', eng.isExerciseTierOpen('medium') === true);
eng.recordQuestionResult({ key: 'x', cat: 'proba', difficulty: 'easy', prompt: 'p' }, false);
check('Bilan par catégorie', eng.getReport().rows.find(r => r.key === 'proba').total === 1);
eng.checkAchievements();
check('Succès « Premier œuf »', T.state().achievements.first_hatch === true);
eng.unlockAll();
check('unlockAll débloque tout', Object.values(T.state().unlocked).every(Boolean));

// --- 7. Réservoir d'Éclats ---
{
  const st = T.state();
  st.reservoir = 0;
  const prodNow = eng.getTotalProductionPerSec();
  check('Production > 0 pour tester le réservoir', prodNow > 0);
  const shardsBefore = st.shards;
  for (let i = 0; i < 5000; i++) eng.tick(1);
  check('Le réservoir est plafonné (10 min de production)', st.reservoir <= eng.getReservoirCap() + 1e-6 && st.reservoir > 0);
  check('La production passive ne crédite plus les Éclats directement', st.shards === shardsBefore);
  st.streak = 4;
  const expected = Math.floor(st.reservoir * 1.2);
  const gain = eng.collectReservoir();
  check('Récolte = réservoir × (1 + 5 % × série)', gain === expected && st.reservoir === 0 && st.shards === shardsBefore + gain, `${gain} vs ${expected}`);
  const off = T.Storage.migrate({ shards: 5 });
  check('Ancienne sauvegarde : réservoir à 0', off.reservoir === 0);
}

// --- 8. Gardien : plus de passage payant, maîtrise requise ---
{
  const st = T.state();
  st.shards = 999999;
  check('Le Gardien ne s\'achète pas', typeof eng.unlockGuardianWithShards === 'undefined' && T.CONFIG.GUARDIAN_SHARD_BYPASS === undefined);
  for (const sp of T.SPECIES_LIST) st.manadex[sp.id] = { discovered: true, chromatic: false, count: 1 };
  st.stats.exercisesWon = 300;
  st.recentAnswers = [];
  check('Gardien fermé sans réponses récentes', eng.canChallengeGuardian() === false);
  const fill = (n, okN, hardOkN) => { st.recentAnswers = []; for (let i = 0; i < n; i++) st.recentAnswers.push({ ok: i < okN, d: i < hardOkN ? 'hard' : 'easy' }); };
  fill(20, 20, 0);
  check('Gardien fermé sans question Difficile', eng.canChallengeGuardian() === false);
  fill(20, 13, 3);
  check('Gardien fermé sous 70 % de réussite', eng.canChallengeGuardian() === false);
  fill(20, 14, 3);
  check('Gardien ouvert : 5 espèces, 70 %, 3 Difficiles', eng.canChallengeGuardian() === true);
  fill(19, 19, 3);
  check('Gardien fermé : moins de 20 réponses', eng.canChallengeGuardian() === false);
}

console.log(failures === 0 ? '\nTous les tests passent.' : `\n${failures} test(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
