/**
 * Système de validation et de génération probabiliste des robes par race.
 * Basé sur les données des stud-books et les fréquences réelles.
 * 
 * Légende des fréquences :
 *   🟢 fréquent   (60-80%) → poids 60
 *   🟡 fréquent    (15-30%) → poids 20
 *   🟠 rare        (1-10%)  → poids 5
 *   ❌ impossible  (0%)     → omission
 */

// Catégories de base pour le matching
const BASE_CATS = {
  bay:        { extension: "E", agouti: "A" },
  chestnut:   { extension: "e", agouti: null },
  black:      { extension: "E", agouti: "a" },
  grey:       { grey: true },
  palomino:   { cream: "Crn", extension: "e" },
  buckskin:   { cream: "Crn", extension: "E", agouti: "A" },
  smoky_black:{ cream: "Crn", extension: "E", agouti: "a" },
  cremello:   { cream: "CrCr" },
  perlino:    { cream: "CrCr", extension: "E", agouti: "A" },
  dun:        { dun: true, extension: "E", agouti: "A" },
  grullo:     { dun: true, extension: "E", agouti: "a" },
  dun_chestnut:{dun: true, extension: "e" },
  roan:       { roan: true },
  tobiano:    { tobiano: true },
  overo:      { overo: true },
  appaloosa:  { leopard: true },
};

/**
 * Tableau 2D des fréquences de robe par race.
 * Format : { race, fréquences: { baseCat: poids } }
 * Les races non listées utilisent la génération libre existante.
 */
// Rabicano (Rb) : poils blancs en racine de queue, stries sur les flancs
// Dominant White (DW) : robe presque entièrement blanche, parfois avec petites zones pigmentées
// Ces catégories sont rares et spécifiques à certaines races
const RARE_COAT_FREQ_ADDONS = {
  rabicano: 5,   // ~5% dans les races qui l'acceptent
  dominant_white: 3, // ~3% chez Quarter Horse / Paint Horse / Shetland
};

export const BREED_COAT_FREQUENCIES = {
  Arabian: {
    bay: 60,
    chestnut: 20,
    black: 5,
    grey: 20,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Thoroughbred: {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 5,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Friesian: {
    black: 60,
    bay: 0,
    chestnut: 0,
    grey: 0,
    palomino: 0,
    buckskin: 0,
    smokey_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Lipizzaner: {
    grey: 60,
    black: 5,
    bay: 5,
    chestnut: 0,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  "Anglo-Arabian": {
    bay: 60,
    chestnut: 20,
    black: 5,
    grey: 20,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Haflinger: {
    chestnut: 60,
    bay: 0,
    black: 0,
    grey: 0,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Connemara: {
    grey: 60,
    bay: 20,
    black: 5,
    chestnut: 5,
    palomino: 20,
    buckskin: 20,
    smoky_black: 5,
    dun: 20,
    grullo: 5,
    roan: 5,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  "Selle Français": {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 15,
    palomino: 20,
    buckskin: 5,
    smoky_black: 5,
    cremello: 5,
    perlino: 5,
    dun: 5,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  KWPN: {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 15,
    palomino: 5,
    buckskin: 5,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Hanoverian: {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 15,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Holsteiner: {
    bay: 60,
    chestnut: 5,
    black: 15,
    grey: 15,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Oldenburg: {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 15,
    palomino: 5,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  "Belgian Warmblood": {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 15,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  "Quarter Horse": {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 15,
    palomino: 20,
    buckskin: 20,
    smoky_black: 5,
    cremello: 5,
    perlino: 5,
    dun: 20,
    grullo: 20,
    roan: 5,
    rabicano: 5,
    dominant_white: 3,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  "Paint Horse": {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 15,
    palomino: 20,
    buckskin: 20,
    smoky_black: 5,
    cremello: 5,
    perlino: 5,
    dun: 20,
    grullo: 20,
    roan: 5,
    rabicano: 10,
    dominant_white: 5,
    tobiano: 60,
    overo: 60,
    appaloosa: 0,
  },
  Appaloosa: {
    bay: 60,
    chestnut: 20,
    black: 15,
    grey: 15,
    palomino: 20,
    buckskin: 20,
    smoky_black: 5,
    cremello: 5,
    perlino: 5,
    dun: 20,
    grullo: 5,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 60,
  },
  Shire: {
    bay: 20,
    chestnut: 5,
    black: 60,
    grey: 5,
    palomino: 0,
    buckskin: 0,
    smoky_black: 0,
    cremello: 0,
    perlino: 0,
    dun: 0,
    grullo: 0,
    roan: 0,
    tobiano: 0,
    overo: 0,
    appaloosa: 0,
  },
  Shetland: {
    bay: 60,
    chestnut: 20,
    black: 20,
    grey: 15,
    palomino: 20,
    buckskin: 20,
    smoky_black: 5,
    cremello: 5,
    perlino: 5,
    dun: 20,
    grullo: 5,
    roan: 5,
    rabicano: 5,
    dominant_white: 3,
    tobiano: 20,
    overo: 20,
    appaloosa: 5,
  },
};

// Races non listées explicitement (Quarter Horse déjà présent, etc.)
// Les races absentes → pas de restriction (génération libre)

/**
 * Choisit une catégorie de base de robe selon les fréquences de la race.
 * Returns { baseCategory, genotypePartial }
 */
export function rollCoatCategory(breed) {
  const freqTable = BREED_COAT_FREQUENCIES[breed];
  if (!freqTable) return null;

  const entries = Object.entries(freqTable).filter(([, w]) => w > 0);
  if (entries.length === 0) return null;

  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [cat, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return cat;
  }
  return entries[entries.length - 1][0];
}

/**
 * Vérifie si une robe (décrite par genotype, coatColor) est autorisée
 * pour une race donnée.
 * Retourne { allowed, reason }
 */
export function validateCoatForBreed(breed, genotype, coatColor) {
  const freqTable = BREED_COAT_FREQUENCIES[breed];
  if (!freqTable) return { allowed: true, reason: null };

  const { getBaseCategory } = (() => {
    // Import horsePhotos to use getBaseCategory
    return { getBaseCategory: null };
  })();

  // Interdire les patterns pie pour les races européennes sport
  const hasPie = genotype?.tobiano && genotype.tobiano !== 'nn' &&
                 genotype.tobiano !== 'toto'
    || genotype?.overo && genotype.overo !== 'nn'
    || genotype?.frame && genotype.frame !== 'nn'
    || genotype?.splash && genotype.splash !== 'nn';

  const forbidsPie = breed === "Arabian"
    || breed === "Thoroughbred"
    || breed === "Friesian"
    || breed === "Lipizzaner"
    || breed === "Anglo-Arabian"
    || breed === "Connemara"
    || breed === "Selle Français"
    || breed === "KWPN"
    || breed === "Hanoverian"
    || breed === "Holsteiner"
    || breed === "Oldenburg"
    || breed === "Belgian Warmblood"
    || breed === "Shire";

  if (hasPie && forbidsPie) {
    return { allowed: false, reason: "Robe pie non admise pour cette race" };
  }

  // Interdire appaloosa pour quasi toutes les races sauf Appaloosa et Shetland
  const hasLeopard = genotype?.leopard && genotype.leopard !== 'lplp';
  if (hasLeopard && breed !== "Appaloosa" && breed !== "Shetland") {
    return { allowed: false, reason: "Robe appaloosa non admise pour cette race" };
  }

  // Haflinger : uniquement alezan
  if (breed === "Haflinger") {
    const ext = genotype?.extension || '';
    const isChestnut = ext === 'ee';
    if (!isChestnut) return { allowed: false, reason: "Haflinger doit être alezan uniquement" };
    // Flaxen obligatoire pour les crins lavés
    if (genotype?.flaxen !== 'ff') return { allowed: false, reason: "Haflinger doit avoir les crins lavés (flaxen)" };
  }

  // Friesian : uniquement noir
  if (breed === "Friesian") {
    const ext = genotype?.extension || '';
    const agouti = genotype?.agouti || '';
    if (!(ext !== 'ee' && agouti === 'aa')) return { allowed: false, reason: "Friesian doit être noir uniquement" };
  }

  // Lipizzaner : pas d'alezan
  if (breed === "Lipizzaner") {
    const ext = genotype?.extension || '';
    if (ext === 'ee') return { allowed: false, reason: "Lipizzaner : alezan non admis" };
  }

  // Vérifications spécifiques par race : crèmes / palomino / isabelle
  const hasCream = genotype?.cream && (genotype.cream === 'Crn' || genotype.cream === 'CrCr');
  if (breed === "Arabian" && hasCream) {
    return { allowed: false, reason: "Arabe : robes crème non admises" };
  }
  if (breed === "Thoroughbred" && hasCream) {
    return { allowed: false, reason: "Pur-sang : robes crème non admises" };
  }

  return { allowed: true, reason: null };
}

/**
 * Vérifie si une race est restreinte pour les patterns pie.
 * Utile pour l'UI (afficher un avertissement lors d'un croisement).
 */
export function isBreedPieRestricted(breed) {
  return breed === "Arabian"
    || breed === "Thoroughbred"
    || breed === "Friesian"
    || breed === "Lipizzaner"
    || breed === "Anglo-Arabian"
    || breed === "Connemara"
    || breed === "Selle Français"
    || breed === "KWPN"
    || breed === "Hanoverian"
    || breed === "Holsteiner"
    || breed === "Oldenburg"
    || breed === "Belgian Warmblood"
    || breed === "Shire";
}