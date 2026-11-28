/* ==========================================================================
   [2. DATA & GENERATORS]
   Catalogue des 11 espèces polynésiennes mutantes (avec SVG), synergies
   et générateurs procéduraux d'exercices pédagogiques en français
   ========================================================================== */
const SYNERGIES = [
  { id: 'harmonie', name: 'Harmonie du Fenua', types: ['Faune', 'Flore', 'Marin'], bonus: 0.45, desc: 'Faune + Flore + Marin (+45%)' },
  { id: 'symbiose', name: 'Symbiose Terrestre', types: ['Faune', 'Flore'], bonus: 0.25, desc: 'Flore + Faune (+25%)' },
  { id: 'recif',    name: 'Récif Bioluminescent', types: ['Flore', 'Marin'], bonus: 0.25, desc: 'Flore + Marin (+25%)' },
  { id: 'lagon',    name: 'Écosystème Lagon', types: ['Faune', 'Marin'], bonus: 0.20, desc: 'Faune + Marin (+20%)' }
];

/**
 * Génère une illustration SVG stylisée et unique pour chaque espèce mutante.
 */
function getSpeciesSVG(speciesId, isChromatic) {
  const aura = isChromatic
    ? `<circle cx="50" cy="50" r="44" fill="none" stroke="url(#gradChroma)" stroke-width="3" stroke-dasharray="6 4" opacity="0.9"/>
       <defs><linearGradient id="gradChroma" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
         <stop offset="0%" stop-color="#ff6b9d"/><stop offset="33%" stop-color="#facc15"/>
         <stop offset="66%" stop-color="#2ef2e0"/><stop offset="100%" stop-color="#c084fc"/>
       </linearGradient></defs>`
    : '';

  const art = {
    tupa_corail: `
      <ellipse cx="50" cy="78" rx="28" ry="6" fill="rgba(0,0,0,0.35)"/>
      <!-- Branches de corail bioluminescent -->
      <path d="M38 42 C32 28 28 24 22 22 M32 30 C35 22 39 18 41 14 M62 42 C68 28 73 25 78 21 M68 30 C64 21 60 17 58 13" stroke="#2ef2e0" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <circle cx="22" cy="22" r="3" fill="#ff7eb6"/><circle cx="41" cy="14" r="3" fill="#ff7eb6"/>
      <circle cx="78" cy="21" r="3" fill="#ff7eb6"/><circle cx="58" cy="13" r="3" fill="#ff7eb6"/>
      <!-- Pattes -->
      <path d="M27 58 L14 66 L10 74 M28 65 L17 75 M73 58 L86 66 L90 74 M72 65 L83 75" stroke="#10b981" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <!-- Pinces -->
      <path d="M30 48 C18 44 14 34 21 28 C25 32 26 37 22 39" stroke="#34d399" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M70 48 C82 44 86 34 79 28 C75 32 74 37 78 39" stroke="#34d399" stroke-width="5" stroke-linecap="round" fill="none"/>
      <!-- Carapace -->
      <ellipse cx="50" cy="56" rx="24" ry="17" fill="#0d9488" stroke="#5eead4" stroke-width="2.5"/>
      <path d="M36 56 Q50 47 64 56" stroke="#99f6e4" stroke-width="2" fill="none" opacity="0.7"/>
      <!-- Yeux -->
      <circle cx="41" cy="45" r="5" fill="#fff"/><circle cx="42" cy="45" r="2.5" fill="#041321"/>
      <circle cx="59" cy="45" r="5" fill="#fff"/><circle cx="58" cy="45" r="2.5" fill="#041321"/>`,

    tiare_luciole: `
      <ellipse cx="50" cy="82" rx="22" ry="5" fill="rgba(0,0,0,0.35)"/>
      <path d="M50 80 Q46 66 50 56" stroke="#10b981" stroke-width="4.5" stroke-linecap="round" fill="none"/>
      <path d="M50 72 Q34 68 28 58 Q40 60 50 67" fill="#059669"/>
      <path d="M50 72 Q66 68 72 58 Q60 60 50 67" fill="#059669"/>
      <!-- 6 pétales de Tiare Tahiti -->
      <g transform="translate(50 46)">
        <ellipse cx="0" cy="-19" rx="7" ry="15" fill="#e6fffa" stroke="#5eead4" stroke-width="1.5"/>
        <ellipse cx="0" cy="-19" rx="7" ry="15" fill="#e6fffa" stroke="#5eead4" stroke-width="1.5" transform="rotate(60)"/>
        <ellipse cx="0" cy="-19" rx="7" ry="15" fill="#e6fffa" stroke="#5eead4" stroke-width="1.5" transform="rotate(120)"/>
        <ellipse cx="0" cy="-19" rx="7" ry="15" fill="#e6fffa" stroke="#5eead4" stroke-width="1.5" transform="rotate(180)"/>
        <ellipse cx="0" cy="-19" rx="7" ry="15" fill="#e6fffa" stroke="#5eead4" stroke-width="1.5" transform="rotate(240)"/>
        <ellipse cx="0" cy="-19" rx="7" ry="15" fill="#e6fffa" stroke="#5eead4" stroke-width="1.5" transform="rotate(300)"/>
        <circle cx="0" cy="0" r="8" fill="#facc15"/>
        <circle cx="0" cy="0" r="4" fill="#fef08a"/>
      </g>
      <!-- Lucioles -->
      <circle cx="20" cy="26" r="3.5" fill="#fef08a"/><circle cx="80" cy="24" r="3" fill="#2ef2e0"/><circle cx="77" cy="54" r="2.5" fill="#fef08a"/>`,

    moo_sables: `
      <ellipse cx="50" cy="80" rx="28" ry="6" fill="rgba(0,0,0,0.35)"/>
      <!-- Queue enroulée -->
      <path d="M68 62 C86 64 88 44 74 42 C66 41 66 50 72 50" stroke="#e2b45a" stroke-width="7" stroke-linecap="round" fill="none"/>
      <!-- Pattes -->
      <path d="M36 52 L22 44 M38 66 L24 72 M58 54 L68 42 M58 66 L68 74" stroke="#ca9a42" stroke-width="5" stroke-linecap="round"/>
      <!-- Corps -->
      <path d="M30 56 Q48 44 68 62 Q48 70 30 56Z" fill="#f2c975" stroke="#fde68a" stroke-width="2"/>
      <!-- Motifs bioluminescents -->
      <circle cx="44" cy="55" r="3" fill="#2ef2e0"/><circle cx="54" cy="56" r="2.8" fill="#2ef2e0"/><circle cx="62" cy="59" r="2.2" fill="#2ef2e0"/>
      <!-- Tête expressive -->
      <ellipse cx="26" cy="54" rx="13" ry="10" fill="#f5d084" stroke="#fde68a" stroke-width="2"/>
      <circle cx="22" cy="50" r="4.2" fill="#041321"/><circle cx="21" cy="49" r="1.6" fill="#2ef2e0"/>
      <path d="M16 58 Q22 61 28 58" stroke="#78350f" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,

    tupa_lave: `
      <ellipse cx="50" cy="80" rx="30" ry="6" fill="rgba(249,115,22,0.35)"/>
      <!-- Pattes basalte -->
      <path d="M26 56 L12 64 L9 74 M28 65 L16 76 M74 56 L88 64 L91 74 M72 65 L84 76" stroke="#475569" stroke-width="5" stroke-linecap="round" fill="none"/>
      <!-- Pinces incandescentes -->
      <path d="M28 45 C13 40 10 25 22 19 C26 26 27 32 21 36" stroke="#f97316" stroke-width="6.5" stroke-linecap="round" fill="none"/>
      <path d="M72 45 C87 40 90 25 78 19 C74 26 73 32 79 36" stroke="#f97316" stroke-width="6.5" stroke-linecap="round" fill="none"/>
      <!-- Carapace volcanique -->
      <path d="M24 54 C24 34 76 34 76 54 C76 70 24 70 24 54Z" fill="#1e293b" stroke="#fb923c" stroke-width="2.5"/>
      <!-- Failles de lave -->
      <path d="M36 42 L45 54 L41 64 M62 42 L54 53 L60 63 M45 54 L54 53" stroke="#facc15" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      <circle cx="40" cy="44" r="4.5" fill="#facc15"/><circle cx="40" cy="44" r="2" fill="#7c2d12"/>
      <circle cx="60" cy="44" r="4.5" fill="#facc15"/><circle cx="60" cy="44" r="2" fill="#7c2d12"/>`,

    tiare_volt: `
      <circle cx="50" cy="48" r="34" fill="rgba(56,189,248,0.16)"/>
      <!-- Arcs électriques -->
      <path d="M16 32 L26 38 L20 46 L30 50 M84 28 L72 36 L80 44 L68 50 M42 12 L48 22 L44 26" stroke="#38bdf8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M50 84 L50 60" stroke="#0284c7" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Pétales électriques -->
      <g transform="translate(50 48)">
        <polygon points="0,-32 8,-10 0,-4 -8,-10" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5"/>
        <polygon points="0,-32 8,-10 0,-4 -8,-10" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5" transform="rotate(60)"/>
        <polygon points="0,-32 8,-10 0,-4 -8,-10" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5" transform="rotate(120)"/>
        <polygon points="0,-32 8,-10 0,-4 -8,-10" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5" transform="rotate(180)"/>
        <polygon points="0,-32 8,-10 0,-4 -8,-10" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5" transform="rotate(240)"/>
        <polygon points="0,-32 8,-10 0,-4 -8,-10" fill="#bae6fd" stroke="#38bdf8" stroke-width="1.5" transform="rotate(300)"/>
        <circle cx="0" cy="0" r="9" fill="#0ea5e9" stroke="#e0f2fe" stroke-width="2"/>
        <path d="M-2 -5 L3 -1 L-1 1 L3 6" stroke="#fef08a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      </g>`,

    maito_neon: `
      <!-- Queue -->
      <path d="M72 50 L92 32 L86 50 L92 68 Z" fill="#ec4899" stroke="#38bdf8" stroke-width="2"/>
      <!-- Nageoires dorsale & ventrale -->
      <path d="M32 34 Q54 14 74 38" fill="#0ea5e9" opacity="0.85"/>
      <path d="M36 66 Q54 84 72 62" fill="#0ea5e9" opacity="0.85"/>
      <!-- Corps Maito -->
      <ellipse cx="48" cy="50" rx="30" ry="20" fill="#172554" stroke="#38bdf8" stroke-width="2.5"/>
      <!-- Rayures néon -->
      <path d="M34 33 Q40 50 34 67 M46 31 Q52 50 46 69 M58 33 Q64 50 58 67" stroke="#2ef2e0" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M40 32 Q46 50 40 68 M52 32 Q58 50 52 68" stroke="#f472b6" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <!-- Œil -->
      <circle cx="28" cy="46" r="5" fill="#fef08a"/><circle cx="27" cy="46" r="2.4" fill="#041321"/>
      <path d="M18 54 L25 53" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/>`,

    honu_cristal: `
      <!-- Nageoires -->
      <path d="M34 40 C16 26 10 34 18 48 C22 52 28 50 34 50Z" fill="#7e22ce" stroke="#e9d5ff" stroke-width="1.8"/>
      <path d="M66 40 C84 26 90 34 82 48 C78 52 72 50 66 50Z" fill="#7e22ce" stroke="#e9d5ff" stroke-width="1.8"/>
      <path d="M36 68 C26 78 30 86 42 78Z" fill="#6b21a8"/>
      <path d="M64 68 C74 78 70 86 58 78Z" fill="#6b21a8"/>
      <!-- Tête -->
      <ellipse cx="50" cy="23" rx="9" ry="11" fill="#a855f7" stroke="#f3e8ff" stroke-width="2"/>
      <circle cx="46" cy="20" r="2.4" fill="#fef08a"/><circle cx="54" cy="20" r="2.4" fill="#fef08a"/>
      <!-- Carapace cristal facettée -->
      <polygon points="50,30 72,44 68,70 50,78 32,70 28,44" fill="#581c87" stroke="#d8b4fe" stroke-width="2.5"/>
      <polygon points="50,36 62,48 58,64 42,64 38,48" fill="#c084fc" opacity="0.85"/>
      <path d="M50 30 L50 36 M72 44 L62 48 M28 44 L38 48 M68 70 L58 64 M32 70 L42 64 M50 78 L50 64" stroke="#f3e8ff" stroke-width="1.5"/>
      <polygon points="50,43 56,52 50,60 44,52" fill="#2ef2e0"/>`,

    puhi_plasma: `
      <!-- Aura plasma -->
      <path d="M18 34 Q30 16 44 26 M74 26 Q88 40 78 58" stroke="#e879f9" stroke-width="2.2" stroke-dasharray="4 3" fill="none"/>
      <!-- Corps serpentin murène -->
      <path d="M24 72 C14 58 26 42 46 48 C66 54 78 38 66 26 C56 16 38 20 34 32" stroke="#6b21a8" stroke-width="15" stroke-linecap="round" fill="none"/>
      <path d="M24 72 C14 58 26 42 46 48 C66 54 78 38 66 26 C56 16 38 20 34 32" stroke="#c084fc" stroke-width="9" stroke-linecap="round" fill="none"/>
      <!-- Crête plasma -->
      <path d="M26 68 C18 56 28 44 46 48 C64 52 74 38 64 28" stroke="#2ef2e0" stroke-width="2.5" stroke-dasharray="5 5" fill="none"/>
      <!-- Tête féroce -->
      <ellipse cx="32" cy="34" rx="13" ry="9" fill="#9333ea" stroke="#f0abfc" stroke-width="2"/>
      <path d="M20 36 L30 38 L22 41" fill="#041321"/>
      <circle cx="29" cy="31" r="3" fill="#fef08a"/><circle cx="28.5" cy="31" r="1.2" fill="#041321"/>`,

    fai_eclipse: `
      <!-- Queue fine -->
      <path d="M50 72 Q54 84 48 92" stroke="#c084fc" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Ailes raie manta -->
      <path d="M50 26 C64 28 84 36 92 48 C78 54 66 64 50 74 C34 64 22 54 8 48 C16 36 36 28 50 26Z" fill="#1e1b4b" stroke="#c084fc" stroke-width="2.5"/>
      <!-- Cornes céphaliques -->
      <path d="M41 28 C38 18 42 15 46 22 M59 28 C62 18 58 15 54 22" stroke="#a855f7" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <!-- Symbole Éclipse sur le dos -->
      <circle cx="50" cy="48" r="12" fill="#facc15"/>
      <circle cx="53" cy="47" r="10.5" fill="#0f172a"/>
      <!-- Étoiles sur les ailes -->
      <circle cx="26" cy="47" r="2.2" fill="#2ef2e0"/><circle cx="74" cy="47" r="2.2" fill="#2ef2e0"/>
      <circle cx="34" cy="55" r="1.8" fill="#fef08a"/><circle cx="66" cy="55" r="1.8" fill="#fef08a"/>`,

    moo_celeste: `
      <!-- Halo céleste -->
      <circle cx="50" cy="50" r="39" fill="rgba(250,204,21,0.12)" stroke="#facc15" stroke-width="1.8" stroke-dasharray="5 4"/>
      <path d="M50 8 L53 16 L61 16 L55 21 L57 29 L50 24 L43 29 L45 21 L39 16 L47 16Z" fill="#fef08a"/>
      <!-- Queue stellaire -->
      <path d="M68 62 C86 64 90 42 74 36 C65 34 62 44 70 46" stroke="#38bdf8" stroke-width="7" stroke-linecap="round" fill="none"/>
      <!-- Pattes -->
      <path d="M36 52 L22 44 M38 66 L24 74 M58 54 L70 44 M58 66 L70 76" stroke="#facc15" stroke-width="4.8" stroke-linecap="round"/>
      <!-- Corps translucide cosmique -->
      <path d="M28 56 Q48 40 70 62 Q48 73 28 56Z" fill="#0284c7" stroke="#fef08a" stroke-width="2.5"/>
      <!-- Constellation interne -->
      <path d="M38 55 L48 51 L57 57 L64 54" stroke="#fef08a" stroke-width="1.6" fill="none"/>
      <circle cx="38" cy="55" r="2.6" fill="#fff"/><circle cx="48" cy="51" r="2.8" fill="#fef08a"/><circle cx="57" cy="57" r="2.5" fill="#2ef2e0"/>
      <!-- Tête royale -->
      <ellipse cx="26" cy="54" rx="13" ry="10" fill="#38bdf8" stroke="#fef08a" stroke-width="2.2"/>
      <circle cx="22" cy="50" r="4" fill="#fef08a"/><circle cx="21.5" cy="50" r="1.8" fill="#041321"/>`,

    tupa_solaire: `
      <!-- Rayons solaires -->
      <g stroke="#facc15" stroke-width="3" stroke-linecap="round" opacity="0.85">
        <line x1="50" y1="7" x2="50" y2="17"/><line x1="24" y1="16" x2="30" y2="24"/><line x1="76" y1="16" x2="70" y2="24"/>
        <line x1="12" y1="36" x2="21" y2="39"/><line x1="88" y1="36" x2="79" y2="39"/>
      </g>
      <!-- Pattes dorées -->
      <path d="M25 58 L11 67 L8 77 M28 67 L17 79 M75 58 L89 67 L92 77 M72 67 L83 79" stroke="#d97706" stroke-width="5.2" stroke-linecap="round" fill="none"/>
      <!-- Pinces royales -->
      <path d="M27 48 C12 42 10 26 23 21 C27 28 28 34 22 38" stroke="#facc15" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M73 48 C88 42 90 26 77 21 C73 28 72 34 78 38" stroke="#facc15" stroke-width="7" stroke-linecap="round" fill="none"/>
      <!-- Carapace d'or solaire -->
      <ellipse cx="50" cy="56" rx="26" ry="19" fill="#eab308" stroke="#fef9c3" stroke-width="2.8"/>
      <polygon points="50,42 56,54 50,65 44,54" fill="#2ef2e0" stroke="#fff" stroke-width="1.4"/>
      <circle cx="38" cy="45" r="4.8" fill="#fff"/><circle cx="38" cy="45" r="2.2" fill="#0ea5e9"/>
      <circle cx="62" cy="45" r="4.8" fill="#fff"/><circle cx="62" cy="45" r="2.2" fill="#0ea5e9"/>`
  };

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${aura}${art[speciesId] || ''}</svg>`;
}

function getEggSVG(isSupercharged) {
  const stroke = isSupercharged ? '#facc15' : '#2ef2e0';
  const fillTop = isSupercharged ? '#a855f7' : '#0ea5e9';
  const fillBot = isSupercharged ? '#7e22ce' : '#0f766e';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="eggG_${isSupercharged ? 's' : 'n'}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${fillTop}"/><stop offset="100%" stop-color="${fillBot}"/>
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="88" rx="26" ry="6" fill="rgba(0,0,0,0.4)"/>
    <path d="M50 12 C72 12 80 44 76 66 C73 80 63 86 50 86 C37 86 27 80 24 66 C20 44 28 12 50 12Z"
          fill="url(#eggG_${isSupercharged ? 's' : 'n'})" stroke="${stroke}" stroke-width="3.5"/>
    <path d="M32 54 L44 46 L52 56 L66 44" stroke="#fef08a" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <circle cx="42" cy="32" r="4" fill="rgba(255,255,255,0.55)"/>
    <circle cx="60" cy="68" r="3" fill="${stroke}"/>
  </svg>`;
}

function getGuardianSVG() {
  return `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="50" r="44" fill="rgba(244,63,94,0.14)" stroke="#facc15" stroke-width="2" stroke-dasharray="6 4"/>
    <path d="M18 68 C24 38 42 22 60 22 C78 22 96 38 102 68 C84 58 72 78 60 72 C48 78 36 58 18 68Z" fill="#0f172a" stroke="#2ef2e0" stroke-width="3"/>
    <path d="M36 28 L26 10 L46 22 M84 28 L94 10 L74 22" fill="#facc15"/>
    <polygon points="60,30 68,46 60,58 52,46" fill="#f43f5e" stroke="#fef08a" stroke-width="2"/>
    <circle cx="43" cy="46" r="6" fill="#facc15"/><circle cx="43" cy="46" r="2.8" fill="#7f1d1d"/>
    <circle cx="77" cy="46" r="6" fill="#facc15"/><circle cx="77" cy="46" r="2.8" fill="#7f1d1d"/>
    <path d="M44 62 L52 68 L60 62 L68 68 L76 62" stroke="#2ef2e0" stroke-width="2.5" fill="none"/>
  </svg>`;
}

const SPECIES = {
  // COMMUNS (3)
  tupa_corail: {
    id: 'tupa_corail', name: 'Tupa Corail', rarity: 'common', type: 'Faune', prod: 4,
    desc: 'Crabe terrestre du lagon dont la carapace nourrit un récif miniature fluorescent.'
  },
  tiare_luciole: {
    id: 'tiare_luciole', name: 'Tiare-Luciole', rarity: 'common', type: 'Flore', prod: 5,
    desc: 'Fleur de Tiare mutante qui libère un parfum lumineux attirant l’énergie nocturne.'
  },
  moo_sables: {
    id: 'moo_sables', name: "Mo'o des Sables", rarity: 'common', type: 'Faune', prod: 5,
    desc: 'Gecko vif aux motifs tribaux cyan qui absorbe la chaleur des motu.'
  },
  // RARES (3)
  tupa_lave: {
    id: 'tupa_lave', name: 'Tupa de Lave', rarity: 'rare', type: 'Faune', prod: 14,
    desc: 'Né près des coulées de basalte, ses pinces crépitent d’énergie volcanique.'
  },
  tiare_volt: {
    id: 'tiare_volt', name: 'Tiare-Volt', rarity: 'rare', type: 'Flore', prod: 16,
    desc: 'Ses six pétales agissent comme des bobines électriques chargées par les alizés.'
  },
  maito_neon: {
    id: 'maito_neon', name: 'Maito Néon', rarity: 'rare', type: 'Marin', prod: 15,
    desc: 'Poisson chirurgien bioluminescent qui trace des sillages fluo sous la passe.'
  },
  // ÉPIQUES (3)
  honu_cristal: {
    id: 'honu_cristal', name: 'Honu Cristal', rarity: 'epic', type: 'Marin', prod: 42,
    desc: 'Tortue ancestrale à carapace d’améthyste capable de diffracter le Mana pur.'
  },
  puhi_plasma: {
    id: 'puhi_plasma', name: 'Puhi Plasma', rarity: 'epic', type: 'Marin', prod: 48,
    desc: 'Murène des récifs profonds entourée d’une aura de plasma instable.'
  },
  fai_eclipse: {
    id: 'fai_eclipse', name: 'Fai Éclipse', rarity: 'epic', type: 'Marin', prod: 52,
    desc: 'Raie manta silencieuse portant l’empreinte lumineuse d’une éclipse totale.'
  },
  // LÉGENDAIRES (2)
  moo_celeste: {
    id: 'moo_celeste', name: "Mo'o Céleste", rarity: 'legendary', type: 'Faune', prod: 135,
    desc: 'Spécimen mythique né directement du fragment d’étoile Te Feti’a.'
  },
  tupa_solaire: {
    id: 'tupa_solaire', name: "Tupa d'Or Solaire", rarity: 'legendary', type: 'Faune', prod: 150,
    desc: 'Souverain doré du lagon dont l’aura rayonne sur toute la station ManaLab.'
  }
};

const SPECIES_LIST = Object.values(SPECIES);
