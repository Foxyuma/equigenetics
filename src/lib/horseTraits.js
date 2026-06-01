/**
 * Système de traits : Affinité raciale, Potentiel individuel, Traits mentaux, Morphologie
 * Impact réaliste et progressif sur les performances
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. AFFINITÉ RACIALE PAR DISCIPLINE (modificateur %)
// ─────────────────────────────────────────────────────────────────────────────
export const BREED_AFFINITY = {
  "Arabian": {
    endurance:        +15, racing:          +12, cross_country:   +8,
    trail:            +10, eventing:        +5,
    strength:         -20, show_jumping:    -5,
  },
  "Thoroughbred": {
    racing:           +20, cross_country:   +12, eventing:        +8,
    show_jumping:     +5,
    dressage:         -10, driving:         -15, reining:         -12,
  },
  "Friesian": {
    dressage:         +18, driving:         +14, vaulting:        +10,
    speed:            -15, endurance:       -8, barrel_racing:    -18,
  },
  "Lipizzaner": {
    dressage:         +22, vaulting:        +14,
    racing:           -20, barrel_racing:   -20, cross_country:   -10,
  },
  "Hanoverian": {
    dressage:         +16, show_jumping:    +10,
    barrel_racing:    -14, reining:         -12, racing:          -8,
  },
  "KWPN": {
    show_jumping:     +16, dressage:        +12,
    barrel_racing:    -14, reining:         -12,
  },
  "Holsteiner": {
    show_jumping:     +20,
    endurance:        -10, reining:         -14,
  },
  "Oldenburg": {
    dressage:         +16, show_jumping:    +12,
    barrel_racing:    -15, racing:          -10,
  },
  "Selle Français": {
    show_jumping:     +18, eventing:        +14, cross_country:   +10,
    reining:          -12, driving:         -8,
  },
  "Belgian Warmblood": {
    show_jumping:     +14, eventing:        +10,
    reining:          -10,
  },
  "Anglo-Arabian": {
    eventing:         +16, endurance:       +10, show_jumping:    +8,
    driving:          -8,
  },
  "Connemara": {
    show_jumping:     +10, eventing:        +8, trail:           +6,
    racing:           -15, driving:         -10,
  },
  "Quarter Horse": {
    reining:          +20, barrel_racing:   +18, western_pleasure: +12,
    dressage:         -10, endurance:       -8, racing:          -5,
  },
  "Paint Horse": {
    barrel_racing:    +14, reining:         +10, western_pleasure: +8,
    dressage:         -8, endurance:        -6,
  },
  "Appaloosa": {
    trail:            +14, western_pleasure: +10, endurance:      +6,
    dressage:         -12, show_jumping:    -6,
  },
  "Haflinger": {
    trail:            +12, driving:         +10, vaulting:        +8,
    racing:           -18, show_jumping:    -10,
  },
  "Shire": {
    driving:          +20, strength:        +15,
    racing:           -25, show_jumping:    -20, barrel_racing:   -22, agility: -15,
  },
  "Shetland": {
    vaulting:         +8, driving:          +6,
    racing:           -20, show_jumping:    -15, endurance:       -10,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. TRAITS MENTAUX
// ─────────────────────────────────────────────────────────────────────────────
export const MENTAL_TRAITS = {
  // Positifs
  courage:        { label: "Courage",         icon: "🦁", impact: "competition +5%, moins de pénalité en cross/jumping" },
  concentration:  { label: "Concentration",   icon: "🎯", impact: "dressage +8%, moins d'aléatoire" },
  sang_froid:     { label: "Sang-froid",       icon: "🧊", impact: "stress compétitif -30%, pas de malus nervosité" },
  perseverance:   { label: "Persévérance",     icon: "💪", impact: "entraînement +5%, récupère mieux la fatigue" },
  confiance:      { label: "Confiance",        icon: "✨", impact: "nouveau terrain/discipline +10%" },
  sens_betail:    { label: "Sens du bétail",   icon: "🐄", impact: "reining/western_pleasure +12%" },
  // Neutres/négatifs
  nerveux:        { label: "Nerveux",          icon: "😬", impact: "aléatoire compétition x1.5, énergie mentale -20%" },
  timide:         { label: "Timide",           icon: "🙈", impact: "premières compétitions -8%" },
  dominant:       { label: "Dominant",         icon: "👑", impact: "énergie mentale coût +10%, mais bonus si bien géré" },
  entete:         { label: "Entêté",           icon: "🐴", impact: "progrès entraînement irréguliers" },
};

// Modificateurs sur le score de compétition par trait
export const MENTAL_SCORE_MODIFIERS = {
  courage:        { show_jumping: +5, cross_country: +7, eventing: +5 },
  concentration:  { dressage: +8, vaulting: +6 },
  sang_froid:     { all: +3, variance: -0.5 }, // réduit l'aléatoire
  perseverance:   { endurance: +6, cross_country: +4 },
  confiance:      { all: +3 },
  sens_betail:    { reining: +12, western_pleasure: +8, barrel_racing: +5 },
  nerveux:        { all: -4, variance: +1.5 },
  timide:         { all: -3 },
  dominant:       { all: -2 },
  entete:         { all: -1 },
};

// Pool de traits mentaux par pool positif/négatif
export const POSITIVE_TRAITS = ["courage", "concentration", "sang_froid", "perseverance", "confiance", "sens_betail"];
export const NEGATIVE_TRAITS = ["nerveux", "timide", "dominant", "entete"];

// ─────────────────────────────────────────────────────────────────────────────
// 3. MORPHOLOGIE CACHÉE
// ─────────────────────────────────────────────────────────────────────────────
export const MORPHOLOGY_TRAITS = {
  // Épaules
  epaules_inclinees:   { label: "Épaules inclinées",    icon: "💫", impact: "saut +5%, galop +3%" },
  epaules_droites:     { label: "Épaules droites",      icon: "⚠️", impact: "saut -8%, galop -4%" },
  // Dos
  dos_court:           { label: "Dos court",            icon: "💪", impact: "équilibre +5%, force +3%" },
  dos_long:            { label: "Dos long",             icon: "⚠️", impact: "stabilité -5%, endurance -3%" },
  // Jarrets
  jarrets_puissants:   { label: "Jarrets puissants",    icon: "⚡", impact: "engagement +8%, galop +5%" },
  jarrets_droits:      { label: "Jarrets droits",       icon: "⚠️", impact: "engagement -6%, risque blessure +15%" },
  // Encolure
  encolure_arquee:     { label: "Encolure arquée",      icon: "🎪", impact: "dressage +6%, équilibre +4%" },
  encolure_ewe:        { label: "Encolure de cerf",     icon: "⚠️", impact: "dressage -8%, collect -5%" },
  // Poitrine
  poitrine_large:      { label: "Poitrine large",       icon: "🫁", impact: "endurance +5%, souffle +4%" },
  poitrine_etroite:    { label: "Poitrine étroite",     icon: "⚠️", impact: "endurance -5%, effort max -3%" },
  // Aplombs
  aplombs_parfaits:    { label: "Aplombs parfaits",     icon: "✅", impact: "usure -20%, santé +5%" },
  aplombs_defectueux:  { label: "Aplombs défectueux",   icon: "⚠️", impact: "blessure risque +25%, vitesse -3%" },
};

// Impact des traits morpho sur le score compétitif
export const MORPHOLOGY_SCORE_MODIFIERS = {
  epaules_inclinees:   { show_jumping: +5, cross_country: +3, eventing: +3 },
  epaules_droites:     { show_jumping: -8, cross_country: -4, eventing: -4 },
  dos_court:           { reining: +5, western_pleasure: +4, dressage: +3 },
  dos_long:            { dressage: -5, endurance: -3, eventing: -3 },
  jarrets_puissants:   { dressage: +6, show_jumping: +5, reining: +6, barrel_racing: +5 },
  jarrets_droits:      { dressage: -6, show_jumping: -5, cross_country: -4 },
  encolure_arquee:     { dressage: +6, vaulting: +5 },
  encolure_ewe:        { dressage: -8, vaulting: -5 },
  poitrine_large:      { endurance: +5, cross_country: +4, racing: +3 },
  poitrine_etroite:    { endurance: -5, racing: -3, cross_country: -3 },
  aplombs_parfaits:    { all: +2 },
  aplombs_defectueux:  { all: -3 },
};

// Pools par catégorie
export const MORPHO_CATEGORIES = {
  epaules:   ["epaules_inclinees", "epaules_droites"],
  dos:       ["dos_court", "dos_long"],
  jarrets:   ["jarrets_puissants", "jarrets_droits"],
  encolure:  ["encolure_arquee", "encolure_ewe"],
  poitrine:  ["poitrine_large", "poitrine_etroite"],
  aplombs:   ["aplombs_parfaits", "aplombs_defectueux"],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. POTENTIEL GÉNÉTIQUE INDIVIDUEL
// ─────────────────────────────────────────────────────────────────────────────
// Plafond individuel différent par stat (0-100), hérité + variation aléatoire
export function generateGeneticPotential(fatherPotential, motherPotential, breed) {
  const stats = ["speed", "endurance", "agility", "strength", "temperament", "jumping", "dressage"];
  const potential = {};

  stats.forEach(stat => {
    const fVal = fatherPotential?.[stat] ?? (50 + Math.random() * 30);
    const mVal = motherPotential?.[stat] ?? (50 + Math.random() * 30);
    const inherited = (fVal + mVal) / 2;
    // Variation génétique ±15 pts autour de la moyenne parentale
    const variation = (Math.random() - 0.5) * 30;
    potential[stat] = Math.max(30, Math.min(100, Math.round(inherited + variation)));
  });

  return potential;
}

// Potentiel de départ pour un cheval starter
export function generateStarterPotential(breed) {
  const stats = ["speed", "endurance", "agility", "strength", "temperament", "jumping", "dressage"];
  const potential = {};
  stats.forEach(stat => {
    // Potentiel de base 40-80 pour les starters
    potential[stat] = Math.round(40 + Math.random() * 40);
  });
  return potential;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GÉNÉRATION DES TRAITS MENTAUX ET MORPHOLOGIE
// ─────────────────────────────────────────────────────────────────────────────
export function generateMentalTraits(character) {
  const traits = [];

  // 1-2 traits positifs selon le caractère
  const positivePool = character === 'courageux' ? ['courage', ...POSITIVE_TRAITS]
    : character === 'intelligent' ? ['concentration', 'perseverance', ...POSITIVE_TRAITS]
    : character === 'docile' ? ['sang_froid', 'confiance', ...POSITIVE_TRAITS]
    : POSITIVE_TRAITS;

  const numPositive = 1 + Math.floor(Math.random() * 2); // 1 ou 2
  const shuffled = [...new Set(positivePool)].sort(() => Math.random() - 0.5);
  traits.push(...shuffled.slice(0, numPositive));

  // 0-1 trait négatif selon le caractère
  const negativePool = character === 'anxieux' ? ['nerveux', 'timide', ...NEGATIVE_TRAITS]
    : character === 'paresseux' ? ['entete', ...NEGATIVE_TRAITS]
    : NEGATIVE_TRAITS;

  if (Math.random() < 0.45) {
    const negShuffled = [...new Set(negativePool)].sort(() => Math.random() - 0.5);
    traits.push(negShuffled[0]);
  }

  return traits;
}

export function generateMorphology(breed) {
  const traits = [];
  // Pour chaque catégorie morpho, probabilité selon la race
  const breedMorphoBias = {
    "Arabian":        { epaules: 0.8, jarrets: 0.7, poitrine: 0.6 }, // souvent bien conformé
    "Friesian":       { encolure: 0.9, dos: 0.4 },
    "Lipizzaner":     { encolure: 0.85, dos: 0.6 },
    "Quarter Horse":  { dos: 0.75, jarrets: 0.7 },
    "Holsteiner":     { epaules: 0.8, jarrets: 0.75 },
    "Hanoverian":     { epaules: 0.75, encolure: 0.7 },
    "Shire":          { poitrine: 0.9, dos: 0.5 },
  };

  const bias = breedMorphoBias[breed] || {};

  Object.entries(MORPHO_CATEGORIES).forEach(([cat, [good, bad]]) => {
    const biasVal = bias[cat] ?? 0.55; // 55% chance d'avoir le bon trait
    const trait = Math.random() < biasVal ? good : bad;
    traits.push(trait);
  });

  return traits;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CALCUL DU SCORE FINAL (intégration de tous les systèmes)
// ─────────────────────────────────────────────────────────────────────────────
export function applyTraitsToScore(baseScore, horse, discipline) {
  let score = baseScore;

  // A. Affinité raciale (%)
  const breedAffinity = BREED_AFFINITY[horse.breed];
  if (breedAffinity) {
    const affinityPct = breedAffinity[discipline] || 0;
    score += (baseScore * affinityPct) / 100;
  }

  // B. Traits mentaux
  const mentalTraits = horse.mental_traits || [];
  mentalTraits.forEach(trait => {
    const mod = MENTAL_SCORE_MODIFIERS[trait];
    if (!mod) return;
    if (mod.all) score += mod.all;
    if (mod[discipline]) score += mod[discipline];
    // Variance (aléatoire) est gérée côté GeneticsEngine
  });

  // C. Morphologie
  const morphology = horse.morphology || [];
  morphology.forEach(trait => {
    const mod = MORPHOLOGY_SCORE_MODIFIERS[trait];
    if (!mod) return;
    if (mod.all) score += mod.all;
    if (mod[discipline]) score += mod[discipline];
  });

  // D. Potentiel individuel : le plafond génétique pèse sur le score
  const potential = horse.genetic_potential;
  if (potential) {
    // La stat la plus pertinente pour la discipline
    const disciplineKey = {
      dressage: 'dressage', show_jumping: 'jumping', cross_country: 'endurance',
      endurance: 'endurance', racing: 'speed', reining: 'agility',
      barrel_racing: 'speed', eventing: 'jumping', vaulting: 'temperament',
      driving: 'temperament', trail: 'endurance', western_pleasure: 'temperament', polo: 'speed',
    }[discipline] || 'temperament';
    const potVal = potential[disciplineKey] || 75;
    // Si le cheval est proche de son plafond, légère pénalité (-5 max)
    const currentStat = horse.stats?.[disciplineKey] || 30;
    const proximity = currentStat / potVal; // 0→1
    if (proximity > 0.85) score -= (proximity - 0.85) * 30; // Near ceiling malus
  }

  return Math.max(0, score);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. VARIANCE COMPÉTITIVE (selon le mental)
// ─────────────────────────────────────────────────────────────────────────────
export function getCompetitiveVariance(horse) {
  let variancePts = 14; // base ±7
  const traits = horse.mental_traits || [];
  if (traits.includes('sang_froid')) variancePts *= 0.5;
  if (traits.includes('concentration')) variancePts *= 0.7;
  if (traits.includes('nerveux')) variancePts *= 1.8;
  if (traits.includes('timide')) variancePts *= 1.3;
  return variancePts;
}