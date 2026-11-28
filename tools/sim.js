/* Simulateur d'économie ManaLab : `node tools/sim.js [minutes] [questions/min]`
   Fait jouer un élève virtuel (réponses justes ~80 %) avec le vrai moteur et affiche
   à quelle minute de jeu actif chaque palier est atteint. Sert à régler CONFIG. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const mkEl = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  addEventListener() {}, appendChild() {}, querySelector: () => mkEl(), textContent: '', innerHTML: '', remove() {}, click() {} });
const store = {};
const ctx = { document: { getElementById: () => mkEl(), querySelector: () => mkEl(), querySelectorAll: () => [], createElement: () => mkEl(), addEventListener() {}, documentElement: mkEl() },
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem() {} },
  console: { log() {}, warn() {} }, setInterval() {}, setTimeout() {}, requestAnimationFrame() {}, navigator: {}, Math, Date, JSON };
ctx.window = ctx; ctx.addEventListener = () => {};
vm.createContext(ctx);
vm.runInContext(scripts.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n') +
  '\n;this.__t = { CONFIG, state: () => state, GameEngine, ExerciseGenerators, Storage };', ctx);
const T = ctx.__t, G = T.GameEngine, C = T.CONFIG;
T.Storage.load();
const st = () => T.state();

const minutes = Number(process.argv[2] || 240);
const qPerMin = Number(process.argv[3] || 3.5);
const qEvery = 60 / qPerMin;
const accBy = { easy: 0.85, medium: 0.75, hard: 0.65 };
const marks = {};
const mark = (k, t) => { if (!(k in marks)) marks[k] = Math.round(t / 60); };
const timeline = [];
let nextQ = 0, lastCollect = 0, answers = 0;

const answer = (diff) => {
  answers++;
  const q = T.ExerciseGenerators[diff](st().questionHistory);
  const ok = Math.random() < accBy[diff];
  G.recordQuestionResult(q, ok);
  if (ok) G.grantExerciseReward(diff);
  return ok;
};

for (let t = 0; t < minutes * 60; t++) {
  G.tick(1);
  const s = st();
  // Achats dès que possible (conditions de maîtrise + Éclats)
  for (const enc of s.enclosures) if (!enc.unlocked) { if (G.unlockEnclosure(enc.id)) mark('enclos' + (enc.id + 1), t); break; }
  for (const inc of s.incubators) if (!inc.unlocked) { if (G.unlockIncubator(inc.id)) mark('incub' + (inc.id + 1), t); break; }
  if (s.shards >= (C.LAB_BOOST_COSTS[s.labBoostLevel] ?? 1e12) && G.buyLabBoost()) mark('boost' + s.labBoostLevel, t);
  // Éclosions et lancement d'œufs
  for (const inc of s.incubators) if (inc.unlocked && inc.egg && inc.egg.remainingSec <= 0) G.hatchEgg(inc.id);
  const free = s.incubators.find(i => i.unlocked && !i.egg);
  if (free && s.mana.raw + s.mana.pure + s.mana.prismatic > 0) {
    const sel = { raw: 0, pure: 0, prismatic: 0 };
    let n = 0;
    for (const k of ['prismatic', 'pure', 'raw']) while (s.mana[k] > sel[k] && n < 2) { sel[k]++; n++; }
    s.manaSelection = sel;
    G.startIncubation();
  }
  // Actions de l'élève : 1 question toutes les qEvery secondes
  if (t >= nextQ) {
    nextQ = t + qEvery;
    const unstable = s.enclosures.find(e => e.unlocked && e.unstable);
    if (unstable) { if (answer('easy')) G.stabilizeEnclosure(unstable.id); }
    else if (t - lastCollect > 150 && G.getCollectGain() > 0) { lastCollect = t; if (answer('easy')) G.collectReservoir(); }
    else {
      const diff = G.isExerciseTierOpen('hard') ? 'hard' : G.isExerciseTierOpen('medium') ? 'medium' : 'easy';
      answer(diff);
    }
  }
  if (t % 1800 === 0 && t > 0) timeline.push(`  [${t / 60} min] Éclats ${Math.floor(st().shards)}  réservoir ${Math.floor(st().reservoir)}  prod ${G.getTotalProductionPerSec().toFixed(1)}/s`);
  if (G.getDiscoveredCount() >= 3) mark('3 espèces', t);
  if (G.getDiscoveredCount() >= 5) mark('5 espèces', t);
  if (G.getDiscoveredCount() >= 11) mark('11 espèces', t);
  if (s.stats.exercisesWon >= C.EXERCISE_TIER_REQ.medium) mark('palier Moyen', t);
  if (s.stats.exercisesWon >= C.EXERCISE_TIER_REQ.hard) mark('palier Difficile', t);
  if (G.canChallengeGuardian()) mark('GARDIEN prêt', t);
}
const s = st();
console.log(`Minutes de jeu actif (marqueurs) — ${qPerMin} questions/min`);
console.log(Object.entries(marks).sort((a, b) => a[1] - b[1]).map(([k, v]) => `  ${String(v).padStart(4)} min  ${k}`).join('\n'));
console.log(timeline.join('\n'));
console.log(`Fin (${minutes} min) : ${answers} réponses, ${s.stats.eggsHatched} œufs, ${G.getDiscoveredCount()} espèces, Éclats ${Math.floor(s.shards)}, prod ${G.getTotalProductionPerSec().toFixed(1)}/s`);
