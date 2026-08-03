// Horse Genetics Engine - handles inheritance, coat color determination, disease transmission
import { BREED_PROFILES, getBreedDisciplineBonus } from '@/lib/breedProfiles';
import { rollCoatCategory, BREED_COAT_FREQUENCIES } from '@/lib/coatValidation';
import {
  generateMentalTraits,
  generateMorphology,
  generateStarterPotential,
  generateGeneticPotential,
  applyTraitsToScore,
  getCompetitiveVariance,
} from '@/lib/horseTraits';

// Toutes les races jouables
const BREEDS = [
  // Sangs purs / orientaux
  "Arabian",
  "Thoroughbred",
  "Friesian",
  "Lipizzaner",
  // Semi-ouverts
  "Anglo-Arabian",
  "Haflinger",
  "Connemara",
  // Warmblood européens sport
  "Selle Français",
  "KWPN",
  "Hanoverian",
  "Holsteiner",
  "Oldenburg",
  "Belgian Warmblood",
  // Western / américains
  "Quarter Horse",
  "Paint Horse",
  "Appaloosa",
  // Races lourdes / poneys
  "Shire",
  "Shetland",
];

const DISEASES = [
  {
    name: "HYPP",
    fullName: "Hyperkalemic Periodic Paralysis",
    gene: "HYPP",
    dominance: "dominant",
    severity: "severe",
    // Dominant: a single allele is enough → carrier = affected
    // Initial carrier rate ~2% in the QH population
    breeds: ["Quarter Horse", "Paint Horse"],
    base_carrier_rate: 0.02,
    lethal_homozygous: false,
    lethal_age: null,
    effects: ["muscle crises", "tremors", "possible paralysis"],
    test_available: true,
  },
  {
    name: "PSSM1",
    fullName: "Polysaccharide Storage Myopathy",
    gene: "PSSM",
    dominance: "dominant",
    severity: "moderate",
    breeds: ["Quarter Horse", "Paint Horse", "Warmblood", "Hanoverian", "KWPN", "Holsteiner", "Oldenburg", "Belgian Warmblood", "Selle Français"],
    base_carrier_rate: 0.08,
    lethal_homozygous: false,
    lethal_age: null,
    effects: ["reduced endurance", "slow recovery", "muscle fatigue"],
    test_available: true,
  },
  {
    name: "HERDA",
    fullName: "Hereditary Equine Regional Dermal Asthenia",
    gene: "HERDA",
    dominance: "recessive",
    severity: "severe",
    breeds: ["Quarter Horse", "Paint Horse"],
    base_carrier_rate: 0.04,
    lethal_homozygous: false,
    lethal_age: null,
    effects: ["fragile skin", "frequent injuries"],
    test_available: true,
  },
  {
    name: "GBED",
    fullName: "Glycogen Branching Enzyme Deficiency",
    gene: "GBED",
    dominance: "recessive",
    severity: "lethal",
    breeds: ["Quarter Horse", "Paint Horse"],
    base_carrier_rate: 0.05,
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["death before or shortly after birth"],
    test_available: true,
  },
  {
    name: "OLWS",
    fullName: "Overo Lethal White Syndrome",
    gene: "Frame",
    dominance: "recessive",
    severity: "lethal",
    breeds: ["Paint Horse"],
    base_carrier_rate: 0.15,
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["white foal", "death after birth"],
    test_available: true,
  },
  {
    name: "SCID",
    fullName: "Severe Combined Immunodeficiency",
    gene: "SCID",
    dominance: "recessive",
    severity: "lethal",
    breeds: ["Arabian"],
    base_carrier_rate: 0.10,
    lethal_homozygous: false,
    lethal_age: 0.5,
    effects: ["no immune system", "death between 3 and 6 months"],
    test_available: true,
  },
  {
    name: "LFS",
    fullName: "Lavender Foal Syndrome",
    gene: "LFS",
    dominance: "recessive",
    severity: "lethal",
    breeds: ["Arabian"],
    base_carrier_rate: 0.06,
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["neurological foal", "rapid death"],
    test_available: true,
  },
  {
    name: "WFFS",
    fullName: "Warmblood Fragile Foal Syndrome",
    gene: "WFFS",
    dominance: "recessive",
    severity: "lethal",
    breeds: ["Warmblood", "Hanoverian", "KWPN", "Holsteiner", "Oldenburg", "Belgian Warmblood", "Selle Français"],
    base_carrier_rate: 0.10,
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["fragile skin and joints", "death at birth or shortly after"],
    test_available: true,
  },
];

function randomAllele(locus) {
  const alleles = {
    extension: ["E", "e"],
    agouti: ["A", "a"],
    cream: ["Cr", "n", "prl"],
    grey: ["G", "g"],
    kit: ["To", "dw", "Sb1", "sb1", "Rn", "rn", "to", "nw", "sb1", "rn"],
    dun: ["D", "nd1", "nd2"],
    champagne: ["CH", "n"],
    silver: ["Z", "z"],
    splash: ["Spl", "n"],
    overo: ["Fr", "n"],
    frame: ["Fr", "n"],
    mushroom: ["Mu", "mu"],
    rabicano: ["Rb", "rb"],
    // Patterns ponctuels
    leopard: ["Lp", "lp"],
    pattern1: ["PATN1", "patn1"],
    // Modificateurs (hypothétiques / non testables dans la vraie vie — tout en jeu)
    sooty: ["So", "so"],           // fonce la robe (poils noirs disséminés)
    flaxen: ["F", "f"],             // récessif, éclaircit les crins des alezans
    pangare: ["P", "p"],            // éclaircit le ventre, le museau, le tour des yeux
    bringe: ["BR1", "br1"],         // stries bringées (X-linked syndrome partiel)
  };
  const opts = alleles[locus] || ["n", "n"];
  return opts[Math.floor(Math.random() * opts.length)];
}

function inheritAllele(parentGenotype, locus) {
  if (!parentGenotype || !parentGenotype[locus]) return randomAllele(locus);
  const g = parentGenotype[locus];
  const parsed = parseGenotype(locus, g);
  return parsed[Math.floor(Math.random() * 2)];
}

function parseGenotype(locus, genotypeStr) {
  const mappings = {
    extension: { "EE": ["E","E"], "Ee": ["E","e"], "ee": ["e","e"] },
    agouti: { "AA": ["A","A"], "Aa": ["A","a"], "aa": ["a","a"] },
    cream: { "CrCr": ["Cr","Cr"], "Crn": ["Cr","n"], "nn": ["n","n"], "Crprl": ["Cr","prl"], "nprl": ["n","prl"], "prlprl": ["prl","prl"] },
    grey: { "GG": ["G","G"], "Gg": ["G","g"], "gg": ["g","g"] },
    tobiano: { "TOTO": ["TO","TO"], "TOn": ["TO","n"], "nn": ["n","n"] },
    roan: { "RNn": ["RN","n"], "nn": ["n","n"], "RNRN": ["RN","RN"] },
    dun: { "DD": ["D","D"], "Dnd1": ["D","nd1"], "Dnd2": ["D","nd2"], "nd1nd1": ["nd1","nd1"], "nd1nd2": ["nd1","nd2"], "nd2nd2": ["nd2","nd2"] },
    champagne: { "CHn": ["CH","n"], "nn": ["n","n"], "CHCH": ["CH","CH"] },
    silver: { "ZZ": ["Z","Z"], "Zz": ["Z","z"], "zz": ["z","z"] },
    kit: { "ToTo": ["To","To"], "Toto": ["To","to"], "Sb1Sb1": ["Sb1","Sb1"], "Sb1sb1": ["Sb1","sb1"], "RnRn": ["Rn","Rn"], "Rnrn": ["Rn","rn"], "ToSb1": ["To","Sb1"], "ToRn": ["To","Rn"], "Sb1Rn": ["Sb1","Rn"], "dwdw": ["dw","dw"], "dwnw": ["dw","nw"], "dwto": ["dw","to"], "dwsb1": ["dw","sb1"], "dwrn": ["dw","rn"], "toto": ["to","to"], "nwnw": ["nw","nw"], "sb1sb1": ["sb1","sb1"], "rnrn": ["rn","rn"] },
    sabino: { "SbSb": ["Sb","Sb"], "Sbn": ["Sb","n"], "nn": ["n","n"] },
    splash: { "SplSpl": ["Spl","Spl"], "Spln": ["Spl","n"], "nn": ["n","n"] },
    overo: { "FrFr": ["Fr","Fr"], "Frn": ["Fr","n"], "nn": ["n","n"] },
    frame: { "FrFr": ["Fr","Fr"], "Frn": ["Fr","n"], "nn": ["n","n"] },
    rabicano: { "RbRb": ["Rb","Rb"], "Rbrb": ["Rb","rb"], "rbrb": ["rb","rb"] },
    leopard: { "LpLp": ["Lp","Lp"], "Lplp": ["Lp","lp"], "lplp": ["lp","lp"] },
    pattern1: { "PATN1PATN1": ["PATN1","PATN1"], "PATN1patn1": ["PATN1","patn1"], "patn1patn1": ["patn1","patn1"] },
    sooty: { "SoSo": ["So","So"], "Soso": ["So","so"], "soso": ["so","so"] },
    flaxen: { "FF": ["F","F"], "Ff": ["F","f"], "ff": ["f","f"] },
    pangare: { "PP": ["P","P"], "Pp": ["P","p"], "pp": ["p","p"] },
    bringe: { "BR1BR1": ["BR1","BR1"], "BR1br1": ["BR1","br1"], "br1br1": ["br1","br1"] },
    mushroom: { "mumu": ["mu","mu"], "Mumu": ["Mu","mu"], "MuMu": ["Mu","Mu"] },
  };
  return mappings[locus]?.[genotypeStr] || [randomAllele(locus), randomAllele(locus)];
}

const THREE_ALLELE_ORDER = {
  cream: ["Cr", "n", "prl"],
  dun: ["D", "nd1", "nd2"],
};
function sortThreeAlleles(locus, a1, a2) {
  const order = THREE_ALLELE_ORDER[locus];
  const i1 = order.indexOf(a1), i2 = order.indexOf(a2);
  return (i1 < i2 ? [a1, a2] : [a2, a1]).join("");
}
// Locus KIT : 7 allèles (To>DW>Sb1>Rn>to>sb1>rn)
// DW = Dominant White (multiples mutations sur KIT, patron blanc allant de balzanes à robe entièrement blanche)
const KIT_DOM = ["To","dw","Sb1","Rn"], KIT_REC = ["to","nw","sb1","rn"];
const KIT_ALL = [...KIT_DOM, ...KIT_REC];
// Convertisseur ancien format (3 locus) → nouveau format "kit"
// Priorité : To > Sb1 > Rn (un seul actif par cheval)
export function migrateKit(genotype) {
  if (genotype.kit && typeof genotype.kit === 'string' && genotype.kit.length >= 3 
      && !genotype.tobiano && !genotype.roan && !genotype.sabino) return genotype.kit;
  const toVal = genotype.tobiano;
  const roVal = genotype.roan;
  const sbVal = genotype.sabino;
  const hasTo = toVal && ['TOTO','TOn','TO'].includes(toVal.toUpperCase());
  const hasSb1 = sbVal && ['SBSB','SBN','SB'].includes(sbVal.toUpperCase());
  const hasRo = roVal && ['RNRN','RNN','RN'].includes(roVal.toUpperCase());
  if (hasTo) return toVal.toUpperCase() === 'TOTO' ? 'ToTo' : 'Toto';
  if (hasSb1) return (sbVal.toUpperCase() === 'SBSB') ? 'Sb1Sb1' : 'Sb1sb1';
  if (hasRo) return (roVal.toUpperCase() === 'RNRN') ? 'RnRn' : 'Rnrn';
  return 'toto';
}
// Détecte si le cheval a un allèle KIT actif
export function isKitActive(val) { return val && val !== 'toto' && typeof val === 'string' && val.length >= 3; }
export function hasKit(val) { return isKitActive(val); }
// Accesseurs pratiques
export function getKitLabel(val) {
  if (!val || val === 'toto') return null;
  const low = val.toLowerCase();
  if (low.includes('dw')) return 'Dominant White';
  if (low.includes('to')) return 'Tobiano';
  if (low.includes('sb1')) return 'Sabino';
  if (low.includes('rn')) return 'Roan';
  return 'Pattern KIT';
}
function sortKitAlleles(a1, a2) {
  const getOrder = a => {
    const d = KIT_DOM.indexOf(a);
    if(d>=0) return d * 2;
    const r = KIT_REC.indexOf(a);
    if(r>=0) return r * 2 + 1;
    // 'dw' dominé par To mais domine Sb1 — mais ici ne devrait arriver que par randomAllele qui utilise 'dw' directement
    // À noter : randomAllele utilise 'dw' comme dominant et 'to' comme récessif dans le tableau, donc ce cas est géré
    return 8; // dernier recours
  };
  return getOrder(a1) <= getOrder(a2) ? a1 + a2 : a2 + a1;
}
function combineAlleles(locus, a1, a2) {
  if (THREE_ALLELE_ORDER[locus]) return sortThreeAlleles(locus, a1, a2);
  if (locus === "kit") return sortKitAlleles(a1, a2);
  const dominant = { extension: "E", agouti: "A", grey: "G", tobiano: "TO", roan: "RN", champagne: "CH", silver: "Z", sabino: "Sb", splash: "Spl", overo: "Fr", frame: "Fr", rabicano: "Rb", leopard: "Lp", pattern1: "PATN1", sooty: "So", flaxen: "F", pangare: "P", bringe: "BR1", mushroom: "Mu" };
  const recessive = { extension: "e", agouti: "a", grey: "g", tobiano: "n", roan: "n", dun: "n", champagne: "n", silver: "z", sabino: "n", splash: "n", overo: "n", frame: "n", rabicano: "rb", leopard: "lp", pattern1: "patn1", sooty: "so", flaxen: "f", pangare: "p", bringe: "br1", mushroom: "mu" };
  // Remarque : cream et dun (3 allèles) sont triés en ligne, pas ici.
  if (THREE_ALLELE_ORDER[locus]) return sortThreeAlleles(locus, a1, a2);
  const d = dominant[locus], r = recessive[locus];
  
  if (a1 === d && a2 === d) return d + d;
  if ((a1 === d && a2 === r) || (a1 === r && a2 === d)) return d + r;
  return r + r;
}

export function generateRandomGenotype(breed) {
  // Étape 1 : tirer une catégorie de robe dans les fréquences de la race
  const roll = rollCoatCategory(breed);
  const profile = BREED_PROFILES[breed];

  // Étape 2 : générer le génotype de base depuis la catégorie tirée
  const genotype = generateGenotypeFromCoatCategory(roll, breed);

  // Étape 3 : override de forcedGenotype si présent
  if (profile?.forcedGenotype) {
    Object.assign(genotype, profile.forcedGenotype);
  }

  // Étape 4 : patterns pie/ponctuels selon les fréquences de race
  applyBreedPatterns(genotype, breed, roll);

  // Étape 5 : modificateurs rares
  applyBreedModifiers(genotype, breed);

  // Étape 6 : races sans pie (override final)
  if (["Haflinger","Lipizzaner","Friesian","Arabian","Thoroughbred"].includes(breed)) {
    genotype.kit = "toto";
    genotype.splash = "nn";
    genotype.overo = "nn";
    genotype.frame = "nn";
  }

  return genotype;
}

// Génère un génotype qui correspond à une catégorie de robe donnée
function generateGenotypeFromCoatCategory(category, breed) {
  const loci = ["extension", "agouti", "cream", "grey", "kit", "dun", "champagne", "silver", "splash", "overo", "frame", "rabicano", "leopard", "pattern1", "sooty", "flaxen", "pangare", "bringe", "mushroom"];
  const g = {};

  // Initialiser tous les locus aléatoirement
  loci.forEach(locus => {
    const a1 = randomAllele(locus);
    const a2 = randomAllele(locus);
    g[locus] = combineAlleles(locus, a1, a2);
  });

  // Locus à 3 allèles
  g.cream = sortThreeAlleles("cream",
    THREE_ALLELE_ORDER.cream[Math.floor(Math.random() * THREE_ALLELE_ORDER.cream.length)],
    THREE_ALLELE_ORDER.cream[Math.floor(Math.random() * THREE_ALLELE_ORDER.cream.length)]
  );
  g.dun = sortThreeAlleles("dun",
    THREE_ALLELE_ORDER.dun[Math.floor(Math.random() * THREE_ALLELE_ORDER.dun.length)],
    THREE_ALLELE_ORDER.dun[Math.floor(Math.random() * THREE_ALLELE_ORDER.dun.length)]
  );

  if (!category || !BREED_COAT_FREQUENCIES[breed]) return g;

  // Forcer le génotype pour correspondre à la catégorie tirée
  switch (category) {
    case 'bay':
      g.extension = Math.random() < 0.5 ? 'EE' : 'Ee';
      g.agouti = Math.random() < 0.5 ? 'AA' : 'Aa';
      g.cream = 'nn';
      g.grey = 'gg';
      break;
    case 'chestnut':
      g.extension = 'ee';
      g.agouti = Math.random() < 0.5 ? 'Aa' : 'aa';
      g.cream = 'nn';
      g.grey = 'gg';
      break;
    case 'black':
      g.extension = Math.random() < 0.5 ? 'EE' : 'Ee';
      g.agouti = 'aa';
      g.cream = 'nn';
      g.grey = 'gg';
      break;
    case 'grey':
      g.grey = Math.random() < 0.3 ? 'GG' : 'Gg';
      // Base sous-jacente aléatoire
      g.extension = Math.random() < 0.5 ? 'EE' : 'Ee';
      g.agouti = Math.random() < 0.5 ? 'Aa' : 'aa';
      g.cream = 'nn';
      break;
    case 'palomino':
      g.extension = 'ee';
      g.cream = 'Crn';
      g.grey = 'gg';
      break;
    case 'buckskin':
      g.extension = Math.random() < 0.5 ? 'EE' : 'Ee';
      g.agouti = Math.random() < 0.5 ? 'AA' : 'Aa';
      g.cream = 'Crn';
      g.grey = 'gg';
      break;
    case 'smoky_black':
      g.extension = Math.random() < 0.5 ? 'EE' : 'Ee';
      g.agouti = 'aa';
      g.cream = 'Crn';
      g.grey = 'gg';
      break;
    case 'cremello':
      g.extension = 'ee';
      g.cream = 'CrCr';
      g.grey = 'gg';
      break;
    case 'perlino':
      g.extension = Math.random() < 0.5 ? 'EE' : 'Ee';
      g.agouti = Math.random() < 0.5 ? 'AA' : 'Aa';
      g.cream = 'CrCr';
      g.grey = 'gg';
      break;
    case 'dun':
      g.extension = Math.random() < 0.5 ? 'EE' : 'Ee';
      g.agouti = Math.random() < 0.5 ? 'AA' : 'Aa';
      g.dun = Math.random() < 0.7 ? 'DD' : 'Dnd1';
      g.cream = 'nn';
      g.grey = 'gg';
      break;
    case 'grullo':
      g.extension = Math.random() < 0.5 ? 'EE' : 'Ee';
      g.agouti = 'aa';
      g.dun = Math.random() < 0.7 ? 'DD' : 'Dnd1';
      g.cream = 'nn';
      g.grey = 'gg';
      break;
    case 'dun_chestnut':
      g.extension = 'ee';
      g.dun = Math.random() < 0.7 ? 'DD' : 'Dnd1';
      g.cream = 'nn';
      g.grey = 'gg';
      break;
    case 'roan':
      // Roan via locus KIT
      g.kit = Math.random() < 0.3 ? 'RnRn' : 'Rnrn';
      break;
    case 'tobiano':
      g.kit = Math.random() < 0.3 ? 'ToTo' : 'Toto';
      break;
    case 'overo':
      g.overo = 'Frn';
      break;
    case 'rabicano':
      g.rabicano = Math.random() < 0.3 ? 'RbRb' : 'Rbrb';
      break;
    case 'dominant_white':
      g.kit = Math.random() < 0.3 ? 'dwdw' : 'dwnw';
      break;
    case 'appaloosa':
      g.leopard = Math.random() < 0.3 ? 'LpLp' : 'Lplp';
      g.pattern1 = Math.random() < 0.6 ? 'PATN1patn1' : 'patn1patn1';
      break;
  }

  return g;
}

function applyBreedPatterns(genotype, breed, roll) {
  // Si on a déjà forcé un KIT via la catégorie, ne pas écraser
  const kitActive = genotype.kit && genotype.kit !== 'toto';

  if (breed === "Paint Horse") {
    // Paint = pie obligatoire
    if (!kitActive) {
      if (Math.random() < 0.50) genotype.kit = Math.random() < 0.5 ? "Toto" : "ToTo";
      else if (Math.random() < 0.65) genotype.kit = Math.random() < 0.5 ? "dwdw" : "dwnw";
      else { genotype.kit = "toto"; genotype.overo = "Frn"; }
    }
    if (Math.random() < 0.25) genotype.splash = "Spln";
    if (Math.random() < 0.15) genotype.frame = "Frn";
    if (Math.random() < 0.20) genotype.rabicano = "Rbrb";
  } else if (breed === "Appaloosa") {
    if (!kitActive) genotype.kit = Math.random() < 0.4 ? (Math.random() < 0.5 ? "Rnrn" : "RnRn") : "toto";
    if (Math.random() < 0.30) genotype.rabicano = "Rbrb";
    // Léopard — déjà forcé si catégorie 'appaloosa', sinon chance
    const lpActive = genotype.leopard && genotype.leopard !== 'lplp';
    if (!lpActive && Math.random() < 0.55) genotype.leopard = Math.random() < 0.3 ? "LpLp" : "Lplp";
    if (genotype.leopard !== "lplp" && Math.random() < 0.65) {
      genotype.pattern1 = Math.random() < 0.3 ? "PATN1PATN1" : "PATN1patn1";
    }
    // Patterns pie interdits
    genotype.kit = "toto";
    genotype.splash = "nn";
    genotype.overo = "nn";
    genotype.frame = "nn";
  } else if (roll === 'roan' || roll === 'tobiano' || roll === 'dominant_white') {
    // Déjà géré par la catégorie via KIT dans generateGenotypeFromCoatCategory
  } else if (roll === 'overo') {
    // Déjà géré par la catégorie overo
  } else if (roll === 'rabicano') {
    // Déjà géré par la catégorie rabicano
  } else if (roll === 'appaloosa') {
    // Déjà géré par la catégorie appaloosa
  } else if (!kitActive) {
    // Autres races : patterns rares via KIT (sizes réduites car moins pertinentes)
    const r = Math.random();
    if (r < 0.05) genotype.kit = "Toto";
    else if (r < 0.08) genotype.kit = Math.random() < 0.5 ? "dwnw" : "dwdw";
    else if (r < 0.14) genotype.kit = Math.random() < 0.5 ? "Sb1sb1" : "Sb1Sb1";
    else if (r < 0.20) genotype.kit = Math.random() < 0.5 ? "Rnrn" : "RnRn";
    if (Math.random() < 0.03) genotype.splash = "Spln";
    if (Math.random() < 0.02) genotype.overo = "Frn";
    if (Math.random() < 0.03) genotype.frame = "Frn";
    if (Math.random() < 0.05) genotype.rabicano = "Rbrb";
    // Léopard très rare
    if (Math.random() < 0.01) genotype.leopard = "Lplp";
    if (Math.random() < 0.003) genotype.pattern1 = "PATN1patn1";
  }
}

function applyBreedModifiers(genotype, breed) {
  // Mushroom → Shetland uniquement
  if (breed === "Shetland" && Math.random() < 0.08) {
    genotype.mushroom = "mumu";
  }
  // Flaxen → Haflinger obligatoire, fréquent Shetland/Connemara, rare ailleurs
  if (breed === "Haflinger") {
    genotype.flaxen = "ff";
  } else if (["Shetland", "Connemara"].includes(breed)) {
    if (Math.random() < 0.30) genotype.flaxen = "ff";
  } else if (Math.random() < 0.02) {
    genotype.flaxen = "ff";
  }
  // Sooty → ~5% général
  if (Math.random() < 0.05) genotype.sooty = Math.random() < 0.3 ? "SoSo" : "Soso";
  // Pangaré → fréquent Shetland/Haflinger/Connemara, rare ailleurs
  if (["Shetland", "Haflinger", "Connemara"].includes(breed)) {
    if (Math.random() < 0.70) genotype.pangare = Math.random() < 0.4 ? "PP" : "Pp";
  } else if (Math.random() < 0.08) {
    genotype.pangare = Math.random() < 0.4 ? "PP" : "Pp";
  }
  // Bringé → très rare (<1%)
  if (Math.random() < 0.003) genotype.bringe = "BR1br1";
}

export function breedGenotype(fatherGenotype, motherGenotype) {
  const loci = ["extension", "agouti", "grey", "kit", "dun", "champagne", "silver", "splash", "overo", "frame", "rabicano", "leopard", "pattern1", "sooty", "flaxen", "pangare", "bringe", "mushroom"];
  const childGenotype = {};
  
  loci.forEach(locus => {
    const a1 = inheritAllele(fatherGenotype, locus);
    const a2 = inheritAllele(motherGenotype, locus);
    childGenotype[locus] = combineAlleles(locus, a1, a2);
  });

  // Locus à 3 allèles : héritage puis tri par dominance (Cr>n>prl, D>nd1>nd2)
  childGenotype.cream = sortThreeAlleles("cream",
    inheritAllele(fatherGenotype, "cream"),
    inheritAllele(motherGenotype, "cream")
  );
  childGenotype.dun = sortThreeAlleles("dun",
    inheritAllele(fatherGenotype, "dun"),
    inheritAllele(motherGenotype, "dun")
  );
  return childGenotype;
}

// Étape A : Déterminer la base de robe
function determineBaseColor(genotype) {
  if (!genotype) return 'chestnut';
  
  // e/e = chestnut
  if (genotype.extension === 'ee') return 'chestnut';
  
  // E/_ + A/_ = bay
  if (genotype.agouti !== 'aa') return 'bay';
  
  // E/_ + a/a = black
  return 'black';
}

// Étape B : Appliquer les dilutions (cream/MATP, dun, champagne, silver, mushroom)
function applyDilutions(baseColor, genotype) {
  if (!genotype) return baseColor;
  
  let color = baseColor;
  const cream = genotype.cream;
  const hasDun = genotype.dun !== 'nd2nd2';
  const hasChampagne = genotype.champagne !== 'nn';
  const hasSilver = genotype.silver !== 'zz';
  const isDoubleMushroom = genotype.mushroom === 'mumu';
  
  // ── Perle (allèle prl du gène MATP, récessif) ──
  // Même gène que Crème : prlprl = dilution homozygote, Crprl = Crème-Perle (double dilution)
  if (cream === 'prlprl') {
    if (baseColor === 'chestnut') color = 'Double Perle Alezan';
    else if (baseColor === 'bay') color = 'Double Perle Bai';
    else if (baseColor === 'black') color = 'Double Perle Noir';
  } else if (cream === 'Crprl') {
    if (baseColor === 'chestnut') color = 'Palomino Perle';
    else if (baseColor === 'bay') color = 'Isabelle Perle';
    else if (baseColor === 'black') color = 'Smoky Black Perle';
  }
  
  // ── Crème (dominante incomplète — pas si déjà parlée) ──
  if (cream !== 'prlprl' && cream !== 'Crprl') {
    const doubleCream = cream === 'CrCr';
    const hasCream = cream === 'Crn';
    if (doubleCream) {
      if (baseColor === 'chestnut') color = 'Cremello';
      else if (baseColor === 'bay') color = 'Perlino';
      else if (baseColor === 'black') color = 'Smoky Cream';
    } else if (hasCream) {
      if (baseColor === 'chestnut') color = 'Palomino';
      else if (baseColor === 'bay') color = 'Buckskin';
      else if (baseColor === 'black') color = 'Smoky Black';
    }
  }
  
  // ── Mushroom (dilution récessive de la phéomélanine) ──
  // Agit seulement sur alezan et bai (pas sur base noire)
  if (isDoubleMushroom && baseColor !== 'black') {
    color = (baseColor === 'chestnut' ? 'Ale' : 'B') + 'zan Mushroom';
  }
  
  // ── Dun (masqué par les doubles dilutions fortes) ──
  const isStrongDilution = ['prlprl', 'Crprl'].includes(cream);
  const baseNotModified = !isStrongDilution && cream === 'nn' && !isDoubleMushroom;
  if (hasDun) {
    if (baseNotModified) {
      if (baseColor === 'chestnut') color = 'Red Dun';
      else if (baseColor === 'bay') color = 'Bay Dun';
      else if (baseColor === 'black') color = 'Grullo';
    } else {
      color += ' Dun';
    }
  }
  
  // ── Champagne ──
  if (hasChampagne && !color.toLowerCase().includes('champagne')) {
    if (baseColor === 'chestnut') color = 'Gold Champagne';
    else if (baseColor === 'bay') color = 'Amber Champagne';
    else if (baseColor === 'black') color = 'Classic Champagne';
  }
  
  // ── Silver (sur noir seulement) ──
  if (hasSilver && (baseColor === 'black' || baseColor === 'bay')) {
    if (baseColor === 'black') color = 'Silver Black';
    else if (baseColor === 'bay') color = 'Silver Bay';
  }
  
  return color;
}

// Étape C : Appliquer le gène Grey
function applyGrey(displayColor, baseColor, genotype) {
  if (!genotype) return { displayColor, baseColorAtBirth: baseColor };
  
  const isGrey = genotype.grey === 'GG' || genotype.grey === 'Gg';
  
  return {
    displayColor: isGrey ? 'Grey' : displayColor,
    baseColorAtBirth: baseColor,
    isGrey
  };
}

// Étape D : Complexe Léopard (Lp + Pattern1)
// TABLEAU DU SITE :
//   LP_ patn1patn1 → Varnish Roan
//   LP_ PATN1_ → Léopard / Few Spot / Capé selon zygosité et blanc
function applyLeopard(color, genotype) {
  const lp = genotype.leopard;
  const patn = genotype.pattern1;
  const lpActive = lp && lp !== 'lplp';
  const patnActive = patn && patn !== 'patn1patn1';
  if (!lpActive) return color;
  if (!patnActive) return color + ' Varnish Roan';
  // LP_ + PATN1_ → Léopard / Few Spot / Capé
  if (lp === 'LpLp' && patn === 'PATN1PATN1') return color + ' Few Spot';
  if (lp === 'LpLp') return color + ' Capé';
  if (patn === 'PATN1PATN1') return color + ' Leopard Taché';
  return color + ' Léopard';
}

// Étape E : Modificateurs (Sooty, Flaxen, Pangaré, Calico, Bringe)
function applyModifiers(color, genotype) {
  const hasSooty = genotype.sooty && genotype.sooty !== 'soso';
  const hasFlaxen = genotype.flaxen === 'ff';
  const hasPangare = genotype.pangare && genotype.pangare !== 'pp';
  const hasBringe = genotype.bringe && (genotype.bringe === 'BR1BR1' || genotype.bringe === 'BR1br1');
  if (!hasSooty && !hasFlaxen && !hasPangare && !hasBringe) return color;
  const mod = [];
  if (hasSooty) mod.push('Sooty');
  if (hasFlaxen) mod.push('Flaxen');
  if (hasPangare) mod.push('Pangaré');
  if (hasBringe) mod.push('Bringé');
  return color + ' [' + mod.join(' ') + ']';
}

// Étape D : Appliquer les patterns blancs (KIT, frame, splash, rabicano)
function applyPatterns(color, genotype) {
  if (!genotype) return color;
  
  const kit = genotype.kit;
  const hasFrame = genotype.frame && genotype.frame !== 'nn' && genotype.frame !== 'toto';
  const hasSplash = genotype.splash && genotype.splash !== 'nn';
  const hasOvero = genotype.overo && genotype.overo !== 'nn';
  const hasRabicano = genotype.rabicano && genotype.rabicano !== 'rbrb';
  
  let patterns = [];
  
  // KIT locus
  if (kit && kit !== 'toto') {
    const lower = kit.toLowerCase();
    if (lower.includes('dw')) patterns.push('Dominant White');
    else if (lower.includes('to')) patterns.push('Tobiano');
    else if (lower.includes('sb1')) patterns.push('Sabino');
    else if (lower.includes('rn')) patterns.push('Roan');
    else patterns.push('Pattern KIT');
  }
  if (hasFrame) patterns.push('Frame Overo');
  if (hasSplash) patterns.push('Splash');
  if (hasOvero) patterns.push('Overo');
  if (hasRabicano) patterns.push('Rabicano');
  
  return patterns.length > 0 ? color + ' ' + patterns.join(' ') : color;
}

// Fonction principale : déterminer la robe complète
// Si age < 3 (poulain), un cheval gris affiche sa couleur de naissance pleine, PAS "Gris"
// — conformément à l'article Nature 2024 : les chevaux gris naissent entièrement pigmentés et grisonnent à partir de 1 an.
export function determineCoatColor(genotype, age) {
  if (!genotype) return 'Unknown';
  
  // Étape A : base
  const baseColor = determineBaseColor(genotype);
  
  // Étape B : dilutions
  let displayColor = applyDilutions(baseColor, genotype);
  
  // Étape C : grey
  const { displayColor: finalDisplay, baseColorAtBirth, isGrey } = applyGrey(displayColor, baseColor, genotype);
  displayColor = finalDisplay;
  
  // Poulain (< 3 ans) → couleur de naissance pleine, PAS le gris.
  // D'après Nature 2024 : les chevaux gris naissent avec leur robe complète et grisonnent la 1re année.
  if (isGrey && (age !== undefined && age < 3)) {
    const dil = applyDilutions(baseColorAtBirth, genotype);
    let c = applyPatterns(dil, genotype);
    c = applyLeopard(c, genotype);
    c = applyModifiers(c, genotype);
    return c;
  }
  
  // Étape D : patterns
  let finalColor = isGrey ? displayColor : displayColor;
  if (!isGrey) {
    finalColor = applyPatterns(displayColor, genotype);
    finalColor = applyLeopard(finalColor, genotype);
    finalColor = applyModifiers(finalColor, genotype);
  }
  
  return finalColor;
}

// Retourner aussi la couleur de naissance pour les gris
export function getCoatColorInfo(genotype) {
  if (!genotype) return { displayColor: 'Unknown', baseColorAtBirth: 'Unknown', isGrey: false };
  
  const baseColor = determineBaseColor(genotype);
  const dilutedColor = applyDilutions(baseColor, genotype);
  const { displayColor, baseColorAtBirth, isGrey } = applyGrey(dilutedColor, baseColor, genotype);
  const applied = applyPatterns(displayColor, genotype);
  const finalApplied = applyLeopard(applied, genotype);
  const finalWithMods = applyModifiers(finalApplied, genotype);
  
  return {
    displayColor: isGrey ? displayColor : finalWithMods,
    baseColorAtBirth: isGrey ? applyModifiers(applyLeopard(applyPatterns(dilutedColor, genotype), genotype), genotype) : finalWithMods,
    isGrey
  };
}

export function isPrimitiveMarked(genotype) {
  if (!genotype || !genotype.dun) return false;
  return genotype.dun !== 'nd2nd2';
}

export function generateRandomStats(fatherStats, motherStats) {
  const statNames = ["speed", "endurance", "agility", "strength", "temperament", "jumping", "dressage"];
  const stats = {};
  
  statNames.forEach(stat => {
    const fatherVal = fatherStats?.[stat] ?? (15 + Math.random() * 20);
    const motherVal = motherStats?.[stat] ?? (15 + Math.random() * 20);
    const avg = (fatherVal + motherVal) / 2;
    const variation = (Math.random() - 0.5) * 20;
    stats[stat] = Math.max(5, Math.min(100, Math.round(avg + variation)));
  });
  
  return stats;
}

// Génère les traits d'un poulain (héritage mental, morphologie, potentiel)
export function generateFoalTraits(father, mother, breed) {
  // Caractère
  const parentChars = [father?.character, mother?.character].filter(Boolean);
  const characters = ["energique", "anxieux", "intelligent", "paresseux", "courageux", "docile"];
  const character = Math.random() < 0.4 && parentChars.length > 0
    ? parentChars[Math.floor(Math.random() * parentChars.length)]
    : characters[Math.floor(Math.random() * characters.length)];

  // Traits mentaux (héritage partiel)
  const mental_traits = generateMentalTraits(character);

  // Morphologie (légèrement biaisée par les parents)
  const morphology = generateMorphology(breed);

  // Potentiel génétique hérité
  const genetic_potential = generateGeneticPotential(
    father?.genetic_potential,
    mother?.genetic_potential,
    breed
  );

  return { character, mental_traits, morphology, genetic_potential };
}

export function checkFoalViability(fatherHealth, motherHealth, breed) {
  const relevantDiseases = DISEASES.filter(d => d.breeds.includes(breed));
  
  for (const disease of relevantDiseases) {
    const fatherGene = fatherHealth?.find(h => h.disease === disease.name);
    const motherGene = motherHealth?.find(h => h.disease === disease.name);
    
    const fatherAffected = fatherGene?.status === "affected";
    const motherAffected = motherGene?.status === "affected";
    
    if (fatherAffected && motherAffected && disease.lethal_homozygous) {
      return { viable: false, cause: disease.name, reason: "stillborn" };
    }
  }

  // Frame Overo (LWO) : homozygote OO = létal (col non fonctionnel)
  if (fatherHealth && motherHealth) {
    const sireFrame = fatherHealth.some(h => h.disease === 'OLWS' && (h.status === 'carrier' || h.status === 'affected'));
    const damFrame  = motherHealth.some(h => h.disease === 'OLWS' && (h.status === 'carrier' || h.status === 'affected'));
    if (sireFrame && damFrame && breed === 'Paint Horse') {
      return { viable: false, cause: 'OLWS', reason: 'stillborn' };
    }
  }
  return { viable: true };
}

export function inheritDiseases(fatherHealth, motherHealth, breed) {
  const childHealth = [];
  // Maladies pertinentes pour la race + mutation spontanée très rare
  const relevantDiseases = DISEASES.filter(d => d.breeds.some(b => b === breed));

  relevantDiseases.forEach(disease => {
    const fatherGene = fatherHealth?.find(h => h.disease === disease.name);
    const motherGene = motherHealth?.find(h => h.disease === disease.name);

    const fatherStatus = fatherGene?.status || "clear";
    const motherStatus = motherGene?.status || "clear";

    const isDominant = disease.dominance === "dominant";
    let status = "clear";

    if (isDominant) {
      // Dominant : carrier = affected (un allèle suffit)
      // Sain × Sain → 0% atteint
      // Porteur/Atteint × Sain → ~50% atteints
      // Porteur/Atteint × Porteur/Atteint → ~75% atteints (25% sains)
      const fatherAffected = fatherStatus === "carrier" || fatherStatus === "affected";
      const motherAffected = motherStatus === "carrier" || motherStatus === "affected";
      if (fatherAffected && motherAffected) {
        status = Math.random() < 0.75 ? "affected" : "clear";
      } else if (fatherAffected || motherAffected) {
        status = Math.random() < 0.5 ? "affected" : "clear";
      }
      // Pour les dominants, pas de "porteur sain" — atteint ou sain
    } else {
      // Récessif : porteur (N/n) ou atteint (n/n)
      // Porteur × Sain → 50% porteurs, 0% atteints
      // Porteur × Porteur → 25% atteints, 50% porteurs, 25% sains
      // Atteint × Porteur → 50% atteints, 50% porteurs
      // Atteint × Sain → 50% porteurs (parents : atteint = n/n, sain = N/N → tous N/n)
      const fatherIsCarrier = fatherStatus === "carrier";
      const fatherIsAffected = fatherStatus === "affected";
      const motherIsCarrier = motherStatus === "carrier";
      const motherIsAffected = motherStatus === "affected";

      if (fatherIsAffected && motherIsAffected) {
        status = "affected"; // n/n × n/n = 100% atteints
      } else if (fatherIsAffected && motherIsCarrier || fatherIsCarrier && motherIsAffected) {
        status = Math.random() < 0.5 ? "affected" : "carrier"; // 50/50
      } else if (fatherIsAffected || motherIsAffected) {
        status = "carrier"; // Atteint × Sain → 100% porteurs
      } else if (fatherIsCarrier && motherIsCarrier) {
        const roll = Math.random();
        if (roll < 0.25) status = "affected";
        else if (roll < 0.75) status = "carrier";
        // 25% sains
      } else if (fatherIsCarrier || motherIsCarrier) {
        status = Math.random() < 0.5 ? "carrier" : "clear";
      } else {
        // Mutation spontanée ultra-rare
        if (Math.random() < 0.005) status = "carrier";
      }
    }

    if (status !== "clear") {
      childHealth.push({ disease: disease.name, status });
    }
  });

  return childHealth;
}

export function generateStarterHorse(breed) {
  const genotype = generateRandomGenotype(breed);
  const statNames = ["speed", "endurance", "agility", "strength", "temperament", "jumping", "dressage"];
  const stats = {};
  statNames.forEach(s => { stats[s] = Math.round(15 + Math.random() * 20); });
  const profile = BREED_PROFILES[breed];
  if (profile) {
    Object.entries(profile.statBonuses || {}).forEach(([s, b]) => { stats[s] = Math.min(100, (stats[s] || 0) + Math.round(b * 0.5)); });
    Object.entries(profile.statPenalties || {}).forEach(([s, p]) => { stats[s] = Math.max(5, (stats[s] || 0) + Math.round(p * 0.5)); });
  }

  const healthGenes = [];
  const relevantDiseases = DISEASES.filter(d => d.breeds.some(b => b === breed));
  relevantDiseases.forEach(disease => {
    const rate = disease.base_carrier_rate ?? 0.05;
    if (Math.random() < rate) {
      const status = disease.dominance === "dominant" ? "affected" : "carrier";
      healthGenes.push({ disease: disease.name, status });
    }
  });

  // Caractère aléatoire pour le starter
  const characters = ["energique", "anxieux", "intelligent", "paresseux", "courageux", "docile"];
  const character = characters[Math.floor(Math.random() * characters.length)];

  // Nouveaux traits
  const mental_traits = generateMentalTraits(character);
  const morphology = generateMorphology(breed);
  const genetic_potential = generateStarterPotential(breed);
  
  return {
    genotype,
    coat_color: determineCoatColor(genotype, 0),
    stats,
    health_genes: healthGenes,
    energy: 100,
    competition_wins: 0,
    is_for_sale: false,
    price: 0,
    character,
    mental_traits,
    morphology,
    genetic_potential,
  };
}

export function getCompetitionScore(horse, discipline) {
  if (!horse?.stats) return 0;
  const weights = {
    dressage:         { dressage: 0.4, temperament: 0.3, agility: 0.2, strength: 0.1 },
    show_jumping:     { jumping: 0.4, agility: 0.25, speed: 0.2, strength: 0.15 },
    cross_country:    { endurance: 0.3, jumping: 0.25, speed: 0.25, agility: 0.2 },
    endurance:        { endurance: 0.5, speed: 0.2, strength: 0.2, temperament: 0.1 },
    reining:          { agility: 0.35, temperament: 0.3, speed: 0.2, dressage: 0.15 },
    barrel_racing:    { speed: 0.4, agility: 0.35, temperament: 0.15, endurance: 0.1 },
    polo:             { speed: 0.3, agility: 0.3, temperament: 0.2, endurance: 0.2 },
    eventing:         { jumping: 0.25, dressage: 0.25, endurance: 0.25, speed: 0.25 },
    vaulting:         { temperament: 0.4, dressage: 0.3, strength: 0.2, agility: 0.1 },
    driving:          { temperament: 0.3, endurance: 0.3, strength: 0.25, dressage: 0.15 },
    trail:            { temperament: 0.35, endurance: 0.3, agility: 0.2, speed: 0.15 },
    western_pleasure: { temperament: 0.4, dressage: 0.3, agility: 0.2, speed: 0.1 },
    racing:           { speed: 0.5, endurance: 0.3, agility: 0.2 },
  };
  
  const w = weights[discipline] || weights.dressage;
  let score = 0;
  Object.entries(w).forEach(([stat, weight]) => {
    score += (horse.stats[stat] || 20) * weight;
  });

  // Bonus de race par discipline (prédispositions génétiques)
  const breedBonus = getBreedDisciplineBonus(horse.breed, discipline);
  score += breedBonus * 0.3;

  // Malus maladies génétiques
  const affected = horse.health_genes?.filter(h => h.status === "affected") || [];
  score -= affected.length * 8;

  // Intégration des traits (affinité raciale %, mental, morphologie, potentiel)
  score = applyTraitsToScore(score, horse, discipline);

  // Aléatoire journalier — modulé par le mental
  const variancePts = getCompetitiveVariance(horse);
  score += (Math.random() - 0.5) * variancePts;
  
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

const COAT_MULTIPLIERS = [
  { keywords: ['bai', 'alezan'], multiplier: 1.00 },
  { keywords: ['noir', 'gris'], multiplier: 1.15 },
  { keywords: ['palomino', 'isabelle', 'dun', 'cremello', 'perlino', 'smoky'], multiplier: 1.35 },
  { keywords: ['roan'], multiplier: 1.40 },
  { keywords: ['silver', 'tobiano', 'sabino', 'roan'], multiplier: 1.70 },
  { keywords: ['splash', 'overo'], multiplier: 1.85 },
  { keywords: ['champagne'], multiplier: 1.90 },
  { keywords: ['frame overo'], multiplier: 2.00 },
  { keywords: ['rabicano'], multiplier: 1.50 },
  { keywords: ['dominant white'], multiplier: 2.70 },
  { keywords: ['varnish roan'], multiplier: 1.60 },
  { keywords: ['few spot', 'capé'], multiplier: 3.00 },
  { keywords: ['léopard', 'leopard'], multiplier: 2.60 },
  { keywords: ['sooty'], multiplier: 1.05 },
  { keywords: ['pangaré'], multiplier: 0.95 },
  { keywords: ['bringé'], multiplier: 2.20 },
  { keywords: ['flaxen'], multiplier: 1.10 },
  { keywords: ['mushroom'], multiplier: 2.10 },
  { keywords: ['perle', 'isabelle perle', 'smoky black perle', 'blanc', 'white'], multiplier: 2.50 },
  { keywords: ['double perle'], multiplier: 3.00 },
];

function getCoatMultiplier(coatColor) {
  if (!coatColor) return 1.00;
  const lower = coatColor.toLowerCase();
  for (let i = COAT_MULTIPLIERS.length - 1; i >= 0; i--) {
    if (COAT_MULTIPLIERS[i].keywords.some(k => lower.includes(k))) {
      return COAT_MULTIPLIERS[i].multiplier;
    }
  }
  return 1.00;
}

export function determineFoalDeathAge(healthGenes) {
  if (!healthGenes || healthGenes.length === 0) return null;
  
  const lethalDiseases = DISEASES.filter(d => d.lethal_age !== null && d.lethal_age !== undefined);
  
  for (const gene of healthGenes) {
    const disease = lethalDiseases.find(d => d.name === gene.disease);
    if (disease && gene.status === "affected" && disease.lethal_age !== null) {
      return disease.lethal_age;
    }
  }
  
  return null;
}

export function estimateHorseValue(horse) {
  const avgStat = horse.stats
    ? Math.round(Object.values(horse.stats).reduce((a, b) => a + b, 0) / 7)
    : 30;
  const age = horse.age ?? 0;
  const wins = horse.competition_wins || 0;
  const hasDisease = horse.health_genes?.some(g => g.status === 'affected');
  const approvalStatus = horse.breeding_approval_status;

  // Base selon les stats — courbe progressive calibrée pour débutants
  // Stats moyennes de départ ~25-35, les bons chevaux atteignent 60-75 avec effort
  let base;
  if (avgStat < 30) {
    base = 500 + avgStat * 20;                               // 500 → 1 100
  } else if (avgStat < 50) {
    base = 1100 + (avgStat - 30) * 80;                      // 1 100 → 2 700
  } else if (avgStat < 65) {
    base = 2700 + (avgStat - 50) * 500;                     // 2 700 → 10 200
  } else if (avgStat < 80) {
    base = 10200 + (avgStat - 65) * 2500;                   // 10 200 → 47 700
  } else {
    base = 47700 + (avgStat - 80) * 6000;                   // 47 700 → 167 700 à stat 100
  }

  // Modificateur robe
  base *= getCoatMultiplier(horse.coat_color);

  // Victoires : +5% par victoire, max ×2
  const winsMultiplier = Math.min(2, 1 + wins * 0.05);
  base *= winsMultiplier;

  // Maladie génétique : forte décote
  if (hasDisease) base *= 0.35;

  // Approbation studbook
  const approvalMultiplier = {
    elite_approved: 1.8,
    approved_for_sport_breeding: 1.4,
    approved_for_breeding: 1.15,
    not_evaluated: 1.0,
    rejected: 0.6,
  };
  base *= approvalMultiplier[approvalStatus] || 1.0;

  // Âge : les poulains valent moins
  if (age <= 1) base *= 0.4;
  else if (age <= 3) base *= 0.65;

  // Plafond absolu : 300 000 ₲
  return Math.min(300000, Math.round(base / 100) * 100);
}

// Studbook rules pour les races européennes
const STUDBOOK_RULES = {
  // === STUDBOOKS FERMÉS (sangs purs uniquement) ===
  'Arabian': {
    type: 'closed',
    acceptedCrosses: [{ sire: 'Arabian', dam: 'Arabian', result: 'Arabian' }]
  },
  'Thoroughbred': {
    type: 'closed',
    acceptedCrosses: [{ sire: 'Thoroughbred', dam: 'Thoroughbred', result: 'Thoroughbred' }]
  },
  'Friesian': {
    type: 'closed',
    acceptedCrosses: [{ sire: 'Friesian', dam: 'Friesian', result: 'Friesian' }]
  },
  'Lipizzaner': {
    type: 'closed',
    acceptedCrosses: [{ sire: 'Lipizzaner', dam: 'Lipizzaner', result: 'Lipizzaner' }]
  },
  
  // === STUDBOOKS SEMI-OUVERTS ===
  'Anglo-Arabian': {
    type: 'semi-open',
    minArabianBlood: 0.25,
    acceptedCrosses: [
      { sire: 'Arabian', dam: 'Thoroughbred', result: 'Anglo-Arabian' },
      { sire: 'Thoroughbred', dam: 'Arabian', result: 'Anglo-Arabian' },
      { sire: 'Anglo-Arabian', dam: 'Arabian', result: 'Anglo-Arabian' },
      { sire: 'Arabian', dam: 'Anglo-Arabian', result: 'Anglo-Arabian' },
      { sire: 'Anglo-Arabian', dam: 'Thoroughbred', result: 'Anglo-Arabian' },
      { sire: 'Thoroughbred', dam: 'Anglo-Arabian', result: 'Anglo-Arabian' },
      { sire: 'Anglo-Arabian', dam: 'Anglo-Arabian', result: 'Anglo-Arabian' }
    ]
  },
  'Haflinger': {
    type: 'semi-open',
    acceptedCrosses: [
      { sire: 'Haflinger', dam: 'Haflinger', result: 'Haflinger' },
      { sire: 'Haflinger', dam: 'Thoroughbred', result: 'Haflinger' },
      { sire: 'Thoroughbred', dam: 'Haflinger', result: 'Haflinger' }
    ]
  },
  'Connemara': {
    type: 'semi-open',
    acceptedCrosses: [
      { sire: 'Connemara', dam: 'Connemara', result: 'Connemara' },
      { sire: 'Connemara', dam: 'Thoroughbred', result: 'Connemara' },
      { sire: 'Thoroughbred', dam: 'Connemara', result: 'Connemara' }
    ]
  },
  
  // === WARMBLOOD OUVERTS (sportifs) ===
  'Selle Français': {
    type: 'open',
    acceptedCrosses: [
      { sire: 'Selle Français', dam: 'Selle Français', result: 'Selle Français' },
      { sire: 'Selle Français', dam: 'Thoroughbred', result: 'Selle Français' },
      { sire: 'Thoroughbred', dam: 'Selle Français', result: 'Selle Français' },
      { sire: 'Selle Français', dam: 'Anglo-Arabian', result: 'Selle Français' },
      { sire: 'Anglo-Arabian', dam: 'Selle Français', result: 'Selle Français' },
      { sire: 'Selle Français', dam: 'Hanoverian', result: 'Selle Français' },
      { sire: 'Hanoverian', dam: 'Selle Français', result: 'Selle Français' },
      { sire: 'Selle Français', dam: 'KWPN', result: 'Selle Français' },
      { sire: 'KWPN', dam: 'Selle Français', result: 'Selle Français' },
      { sire: 'Selle Français', dam: 'Holsteiner', result: 'Selle Français' },
      { sire: 'Holsteiner', dam: 'Selle Français', result: 'Selle Français' },
      { sire: 'Selle Français', dam: 'Oldenburg', result: 'Selle Français' },
      { sire: 'Oldenburg', dam: 'Selle Français', result: 'Selle Français' }
    ]
  },
  'KWPN': {
    type: 'open',
    acceptedCrosses: [
      { sire: 'KWPN', dam: 'KWPN', result: 'KWPN' },
      { sire: 'KWPN', dam: 'Thoroughbred', result: 'KWPN' },
      { sire: 'Thoroughbred', dam: 'KWPN', result: 'KWPN' },
      { sire: 'KWPN', dam: 'Anglo-Arabian', result: 'KWPN' },
      { sire: 'Anglo-Arabian', dam: 'KWPN', result: 'KWPN' },
      { sire: 'KWPN', dam: 'Hanoverian', result: 'KWPN' },
      { sire: 'Hanoverian', dam: 'KWPN', result: 'KWPN' },
      { sire: 'KWPN', dam: 'Holsteiner', result: 'KWPN' },
      { sire: 'Holsteiner', dam: 'KWPN', result: 'KWPN' },
      { sire: 'KWPN', dam: 'Oldenburg', result: 'KWPN' },
      { sire: 'Oldenburg', dam: 'KWPN', result: 'KWPN' }
    ]
  },
  'Hanoverian': {
    type: 'open',
    acceptedCrosses: [
      { sire: 'Hanoverian', dam: 'Hanoverian', result: 'Hanoverian' },
      { sire: 'Hanoverian', dam: 'Thoroughbred', result: 'Hanoverian' },
      { sire: 'Thoroughbred', dam: 'Hanoverian', result: 'Hanoverian' },
      { sire: 'Hanoverian', dam: 'Anglo-Arabian', result: 'Hanoverian' },
      { sire: 'Anglo-Arabian', dam: 'Hanoverian', result: 'Hanoverian' },
      { sire: 'Hanoverian', dam: 'KWPN', result: 'Hanoverian' },
      { sire: 'KWPN', dam: 'Hanoverian', result: 'Hanoverian' },
      { sire: 'Hanoverian', dam: 'Holsteiner', result: 'Hanoverian' },
      { sire: 'Holsteiner', dam: 'Hanoverian', result: 'Hanoverian' }
    ]
  },
  'Holsteiner': {
    type: 'open',
    acceptedCrosses: [
      { sire: 'Holsteiner', dam: 'Holsteiner', result: 'Holsteiner' },
      { sire: 'Holsteiner', dam: 'Thoroughbred', result: 'Holsteiner' },
      { sire: 'Thoroughbred', dam: 'Holsteiner', result: 'Holsteiner' },
      { sire: 'Holsteiner', dam: 'Anglo-Arabian', result: 'Holsteiner' },
      { sire: 'Anglo-Arabian', dam: 'Holsteiner', result: 'Holsteiner' },
      { sire: 'Holsteiner', dam: 'KWPN', result: 'Holsteiner' },
      { sire: 'KWPN', dam: 'Holsteiner', result: 'Holsteiner' },
      { sire: 'Holsteiner', dam: 'Hanoverian', result: 'Holsteiner' },
      { sire: 'Hanoverian', dam: 'Holsteiner', result: 'Holsteiner' }
    ]
  },
  'Oldenburg': {
    type: 'open',
    acceptedCrosses: [
      { sire: 'Oldenburg', dam: 'Oldenburg', result: 'Oldenburg' },
      { sire: 'Oldenburg', dam: 'Thoroughbred', result: 'Oldenburg' },
      { sire: 'Thoroughbred', dam: 'Oldenburg', result: 'Oldenburg' },
      { sire: 'Oldenburg', dam: 'Anglo-Arabian', result: 'Oldenburg' },
      { sire: 'Anglo-Arabian', dam: 'Oldenburg', result: 'Oldenburg' },
      { sire: 'Oldenburg', dam: 'KWPN', result: 'Oldenburg' },
      { sire: 'KWPN', dam: 'Oldenburg', result: 'Oldenburg' }
    ]
  },
  'Belgian Warmblood': {
    type: 'open',
    acceptedCrosses: [
      { sire: 'Belgian Warmblood', dam: 'Belgian Warmblood', result: 'Belgian Warmblood' },
      { sire: 'Belgian Warmblood', dam: 'Thoroughbred', result: 'Belgian Warmblood' },
      { sire: 'Thoroughbred', dam: 'Belgian Warmblood', result: 'Belgian Warmblood' },
      { sire: 'Belgian Warmblood', dam: 'KWPN', result: 'Belgian Warmblood' },
      { sire: 'KWPN', dam: 'Belgian Warmblood', result: 'Belgian Warmblood' }
    ]
  }
};

export function determineBreedFromParents(sireBreed, damBreed, sireApprovalStatus) {
  // Si l'étalon n'est pas approuvé → poulain OC automatiquement
  if (sireApprovalStatus && sireApprovalStatus !== 'approved' && sireApprovalStatus !== 'approved_restricted' && sireApprovalStatus !== 'provisional' && sireApprovalStatus !== 'elite') {
    return {
      breed: 'OC',
      isOC: true,
      message: `⚠️ L'étalon n'est pas approuvé à la monte. Le poulain sera enregistré comme OC (Origines Constatées). Exception : le poulain peut potentiellement être accepté au studbook maternel si la mère est de race pure.`
    };
  }

  // Vérifier si le croisement est reconnu
  for (const breed in STUDBOOK_RULES) {
    const rules = STUDBOOK_RULES[breed];
    const match = rules.acceptedCrosses.find(c => c.sire === sireBreed && c.dam === damBreed);
    if (match) return { breed: match.result, isOC: false, approved: true };
  }

  return {
    breed: 'OC',
    isOC: true,
    message: `⚠️ Le poulain sera enregistré comme OC (Origines Constatées) car ${sireBreed} × ${damBreed} n'est pas un croisement reconnu par les studbooks.`
  };
}

export { BREEDS, DISEASES };