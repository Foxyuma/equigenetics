// Horse Genetics Engine - handles inheritance, coat color determination, disease transmission
import { BREED_PROFILES, getBreedDisciplineBonus } from '@/lib/breedProfiles';
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
    severity: "grave",
    // Dominant : un seul allèle suffit → porteur = atteint
    // Taux porteur initial ~2% dans la population QH
    breeds: ["Quarter Horse", "Paint Horse"],
    base_carrier_rate: 0.02,
    lethal_homozygous: false,
    lethal_age: null,
    effects: ["crises musculaires", "tremblements", "paralysie possible"],
    test_available: true,
  },
  {
    name: "PSSM1",
    fullName: "Polysaccharide Storage Myopathy",
    gene: "PSSM",
    dominance: "dominant",
    severity: "modérée",
    breeds: ["Quarter Horse", "Paint Horse", "Warmblood", "Hanoverian", "KWPN", "Holsteiner", "Oldenburg", "Belgian Warmblood", "Selle Français"],
    base_carrier_rate: 0.08,
    lethal_homozygous: false,
    lethal_age: null,
    effects: ["baisse endurance", "récupération lente", "fatigue musculaire"],
    test_available: true,
  },
  {
    name: "HERDA",
    fullName: "Hereditary Equine Regional Dermal Asthenia",
    gene: "HERDA",
    dominance: "recessive",
    severity: "grave",
    breeds: ["Quarter Horse", "Paint Horse"],
    base_carrier_rate: 0.04,
    lethal_homozygous: false,
    lethal_age: null,
    effects: ["peau fragile", "blessures fréquentes"],
    test_available: true,
  },
  {
    name: "GBED",
    fullName: "Glycogen Branching Enzyme Deficiency",
    gene: "GBED",
    dominance: "recessive",
    severity: "letale",
    breeds: ["Quarter Horse", "Paint Horse"],
    base_carrier_rate: 0.05,
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["mort avant ou peu après naissance"],
    test_available: true,
  },
  {
    name: "OLWS",
    fullName: "Overo Lethal White Syndrome",
    gene: "Frame",
    dominance: "recessive",
    severity: "letale",
    breeds: ["Paint Horse"],
    base_carrier_rate: 0.15,
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["poulain blanc", "mort après naissance"],
    test_available: true,
  },
  {
    name: "SCID",
    fullName: "Severe Combined Immunodeficiency",
    gene: "SCID",
    dominance: "recessive",
    severity: "letale",
    breeds: ["Arabian"],
    base_carrier_rate: 0.10,
    lethal_homozygous: false,
    lethal_age: 0.5,
    effects: ["immunité inexistante", "mort entre 3 et 6 mois"],
    test_available: true,
  },
  {
    name: "LFS",
    fullName: "Lavender Foal Syndrome",
    gene: "LFS",
    dominance: "recessive",
    severity: "letale",
    breeds: ["Arabian"],
    base_carrier_rate: 0.06,
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["poulain neurologique", "mort rapide"],
    test_available: true,
  },
  {
    name: "WFFS",
    fullName: "Warmblood Fragile Foal Syndrome",
    gene: "WFFS",
    dominance: "recessive",
    severity: "letale",
    breeds: ["Warmblood", "Hanoverian", "KWPN", "Holsteiner", "Oldenburg", "Belgian Warmblood", "Selle Français"],
    base_carrier_rate: 0.10,
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["peau et articulations fragiles", "mort à la naissance ou peu après"],
    test_available: true,
  },
];

function randomAllele(locus) {
  const alleles = {
    extension: ["E", "e"],
    agouti: ["A", "a"],
    cream: ["Cr", "n", "prl"],
    grey: ["G", "g"],
    tobiano: ["TO", "n"],
    roan: ["RN", "n"],
    dun: ["D", "d"],
    champagne: ["CH", "n"],
    silver: ["Z", "z"],
    sabino: ["Sb", "n"],
    splash: ["Spl", "n"],
    overo: ["Fr", "n"],
    mushroom: ["Mu", "mu"],
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
    dun: { "DD": ["D","D"], "Dd": ["D","d"], "dd": ["d","d"] },
    champagne: { "CHn": ["CH","n"], "nn": ["n","n"], "CHCH": ["CH","CH"] },
    silver: { "ZZ": ["Z","Z"], "Zz": ["Z","z"], "zz": ["z","z"] },
    sabino: { "SbSb": ["Sb","Sb"], "Sbn": ["Sb","n"], "nn": ["n","n"] },
    splash: { "SplSpl": ["Spl","Spl"], "Spln": ["Spl","n"], "nn": ["n","n"] },
    overo: { "FrFr": ["Fr","Fr"], "Frn": ["Fr","n"], "nn": ["n","n"] },
    mushroom: { "mumu": ["mu","mu"], "Mumu": ["Mu","mu"], "MuMu": ["Mu","Mu"] },
  };
  return mappings[locus]?.[genotypeStr] || [randomAllele(locus), randomAllele(locus)];
}

function combineAlleles(locus, a1, a2) {
  const dominant = { extension: "E", agouti: "A", grey: "G", tobiano: "TO", roan: "RN", dun: "D", champagne: "CH", silver: "Z", sabino: "Sb", splash: "Spl", overo: "Fr", mushroom: "Mu" };
  const recessive = { extension: "e", agouti: "a", grey: "g", tobiano: "n", roan: "n", dun: "n", champagne: "n", silver: "z", sabino: "n", splash: "n", overo: "n", mushroom: "mu" };
  // Remarque : cream (MATP = 3 allèles Cr/n/prl) n'est pas traité par combineAlleles — généré en ligne.
  const d = dominant[locus], r = recessive[locus];
  
  if (a1 === d && a2 === d) return d + d;
  if ((a1 === d && a2 === r) || (a1 === r && a2 === d)) return d + r;
  return r + r;
}

export function generateRandomGenotype(breed) {
  const loci = ["extension", "agouti", "grey", "tobiano", "roan", "dun", "champagne", "silver", "sabino", "splash", "overo", "mushroom"];
  const genotype = {};
  
  loci.forEach(locus => {
    const a1 = randomAllele(locus);
    const a2 = randomAllele(locus);
    genotype[locus] = combineAlleles(locus, a1, a2);
  });

  // Générer cream en ligne (locus MATP : 3 allèles Cr/n/prl, ordre canonique Cr>n>prl)
  const matpPool = ["Cr", "n", "prl"];
  const a1 = matpPool[Math.floor(Math.random() * matpPool.length)];
  const a2 = matpPool[Math.floor(Math.random() * matpPool.length)];
  genotype.cream = (["Cr","n","prl"].indexOf(a1) <= ["Cr","n","prl"].indexOf(a2) ? [a1, a2] : [a2, a1]).join("");

  // Appliquer les gènes forcés depuis le profil de race
  const profile = BREED_PROFILES[breed];
  if (profile?.forcedGenotype) {
    Object.assign(genotype, profile.forcedGenotype);
  }

  // Mushroom : récessif, principalement chez les Shetland
  if (breed === "Shetland") {
    if (Math.random() < 0.08) genotype.mushroom = "mumu";
  }

  // Gris fréquent selon la race
  const greyFreq = profile?.greyFrequency ?? 0.10;
  if (Math.random() < greyFreq && !profile?.forcedGenotype?.grey) {
    genotype.grey = Math.random() < 0.3 ? "GG" : "Gg";
  }

  // Patterns pie : fréquences par race
  // Sabino : assez courant dans beaucoup de races
  // Splash / Overo : plus rares, concentrés dans les races pie
  if (breed === "Paint Horse") {
    // Paint = pie obligatoire : tobiano OU overo
    if (Math.random() < 0.7) genotype.tobiano = "TOn";
    if (Math.random() < 0.4) genotype.overo = "Frn";
    if (Math.random() < 0.25) genotype.splash = "Spln";
    if (Math.random() < 0.3) genotype.sabino = "Sbn";
  } else if (breed === "Appaloosa") {
    genotype.roan = "RNn";
    if (Math.random() < 0.3) genotype.sabino = "Sbn";
  } else {
    // Autres races : sabino modéré, splash/overo rares
    if (Math.random() < 0.15) genotype.sabino = "Sbn";
    if (Math.random() < 0.04) genotype.splash = "Spln";
    if (Math.random() < 0.03) genotype.overo = "Frn";
  }

  // Cas spéciaux legacy
  if (breed === "Haflinger") {
    genotype.extension = "ee";
    genotype.cream = "nn";
    genotype.grey = "gg";
    genotype.tobiano = "nn";
    genotype.roan = "nn";
    genotype.sabino = "nn";
    genotype.splash = "nn";
    genotype.overo = "nn";
  }
  if (breed === "Lipizzaner") {
    genotype.grey = Math.random() < 0.85 ? "Gg" : "gg";
    genotype.tobiano = "nn";
    genotype.sabino = "nn";
    genotype.splash = "nn";
    genotype.overo = "nn";
  }
  if (breed === "Friesian") {
    genotype.tobiano = "nn";
    genotype.sabino = "nn";
    genotype.splash = "nn";
    genotype.overo = "nn";
    genotype.roan = "nn";
  }
  if (breed === "Arabian" || breed === "Thoroughbred") {
    // Sang purs : pas de pie
    genotype.tobiano = "nn";
    genotype.sabino = "nn";
    genotype.splash = "nn";
    genotype.overo = "nn";
  }

  return genotype;
}

export function breedGenotype(fatherGenotype, motherGenotype) {
  const loci = ["extension", "agouti", "grey", "tobiano", "roan", "dun", "champagne", "silver", "sabino", "splash", "overo", "mushroom"];
  const childGenotype = {};
  
  loci.forEach(locus => {
    const a1 = inheritAllele(fatherGenotype, locus);
    const a2 = inheritAllele(motherGenotype, locus);
    childGenotype[locus] = combineAlleles(locus, a1, a2);
  });

  // Héritage cream en ligne (MATP = 3 allèles)
  const fa = inheritAllele(fatherGenotype, "cream");
  const fb = inheritAllele(motherGenotype, "cream");
  const sorted = ["Cr","n","prl"];
  childGenotype.cream = (sorted.indexOf(fa) <= sorted.indexOf(fb) ? [fa, fb] : [fb, fa]).join("");
  
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

// Étape B : Appliquer les dilutions (cream, dun, champagne, silver)
function applyDilutions(baseColor, genotype) {
  if (!genotype) return baseColor;
  
  let color = baseColor;
  const hasCream = genotype.cream === 'Crn';
  const doubleCream = genotype.cream === 'CrCr';
  const hasDun = genotype.dun !== 'dd';
  const hasChampagne = genotype.champagne !== 'nn';
  const hasSilver = genotype.silver !== 'zz';
  
  // Cream (dominante incomplète)
  if (doubleCream) {
    if (baseColor === 'chestnut') color = 'Cremello';
    else if (baseColor === 'bay') color = 'Perlino';
    else if (baseColor === 'black') color = 'Smoky Cream';
  } else if (hasCream) {
    if (baseColor === 'chestnut') color = 'Palomino';
    else if (baseColor === 'bay') color = 'Buckskin';
    else if (baseColor === 'black') color = 'Smoky Black';
  }
  
  // Dun (affecte la base)
  if (hasDun && !doubleCream && !hasCream) {
    if (baseColor === 'chestnut') color = 'Red Dun';
    else if (baseColor === 'bay') color = 'Bay Dun';
    else if (baseColor === 'black') color = 'Grullo';
  } else if (hasDun && (doubleCream || hasCream)) {
    color += ' Dun';
  }
  
  // Champagne (gold, amber, classic)
  if (hasChampagne) {
    if (baseColor === 'chestnut') color = 'Gold Champagne';
    else if (baseColor === 'bay') color = 'Amber Champagne';
    else if (baseColor === 'black') color = 'Classic Champagne';
  }
  
  // Silver (sur noir seulement)
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

// Étape D : Appliquer les patterns blancs (tobiano, sabino, splash, roan, overo)
function applyPatterns(color, genotype) {
  if (!genotype) return color;
  
  const hasTobiano = genotype.tobiano && genotype.tobiano !== 'nn';
  const hasSabino = genotype.sabino && genotype.sabino !== 'nn';
  const hasSplash = genotype.splash && genotype.splash !== 'nn';
  const hasRoan = genotype.roan && genotype.roan !== 'nn';
  const hasOvero = genotype.overo && genotype.overo !== 'nn';
  
  let patterns = [];
  
  if (hasTobiano) patterns.push('Tobiano');
  if (hasSabino) patterns.push('Sabino');
  if (hasSplash) patterns.push('Splash');
  if (hasRoan) patterns.push('Roan');
  if (hasOvero) patterns.push('Overo');
  
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
    return applyPatterns(dil, genotype);
  }
  
  // Étape D : patterns — uniquement si le cheval n'est pas gris (le gris masque les patterns)
  const finalColor = isGrey ? displayColor : applyPatterns(displayColor, genotype);
  
  return finalColor;
}

// Retourner aussi la couleur de naissance pour les gris
export function getCoatColorInfo(genotype) {
  if (!genotype) return { displayColor: 'Unknown', baseColorAtBirth: 'Unknown', isGrey: false };
  
  const baseColor = determineBaseColor(genotype);
  const dilutedColor = applyDilutions(baseColor, genotype);
  const { displayColor, baseColorAtBirth, isGrey } = applyGrey(dilutedColor, baseColor, genotype);
  const finalColor = applyPatterns(displayColor, genotype);
  
  return {
    displayColor: isGrey ? displayColor : finalColor,
    baseColorAtBirth: isGrey ? applyPatterns(dilutedColor, genotype) : finalColor,
    isGrey
  };
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
  { keywords: ['silver', 'tobiano'], multiplier: 1.70 },
  { keywords: ['champagne'], multiplier: 1.85 },
  { keywords: ['perle', 'pearl', 'blanc', 'white'], multiplier: 2.50 },
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