// Horse Genetics Engine - handles inheritance, coat color determination, disease transmission

// Races européennes principales pour l'élevage sport
const BREEDS = [
  // Studbooks fermés (sangs purs uniquement)
  "Arabian",
  "Thoroughbred",
  "Friesian",
  "Lipizzaner",
  
  // Studbooks semi-ouverts (acceptent certains apports)
  "Anglo-Arabian",
  "Haflinger",
  "Connemara",
  
  // Warmblood européens (studbooks ouverts, sportifs)
  "Selle Français",
  "KWPN",
  "Hanoverian",
  "Holsteiner",
  "Oldenburg",
  "Belgian Warmblood"
];

const DISEASES = [
  {
    name: "HYPP",
    fullName: "Hyperkalemic Periodic Paralysis",
    gene: "HYPP",
    dominance: "dominant",
    severity: "grave",
    breeds: ["Quarter Horse", "Paint Horse"],
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
    breeds: ["Quarter Horse", "Percheron", "Comtois", "Boulonnais", "Warmblood"],
    lethal_homozygous: false,
    lethal_age: null,
    effects: ["baisse endurance", "récupération lente"],
    test_available: true,
  },
  {
    name: "HERDA",
    fullName: "Hereditary Equine Regional Dermal Asthenia",
    gene: "HERDA",
    dominance: "recessive",
    severity: "grave",
    breeds: ["Quarter Horse"],
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
    breeds: ["Paint Horse", "Appaloosa"],
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
    breeds: ["Arabe"],
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
    breeds: ["Arabe"],
    lethal_homozygous: true,
    lethal_age: null,
    effects: ["poulain neurologique", "mort rapide"],
    test_available: true,
  },
  { name: "DSLD", fullName: "Degenerative Suspensory Ligament Desmitis", severity: "grave", breeds: ["Pur-Sang Anglais", "Arabe", "Selle Français"] },
  { name: "ERU", fullName: "Uvéite Récurrente Équine", severity: "modérée", breeds: ["Appaloosa"] },
];

function randomAllele(locus) {
  const alleles = {
    extension: ["E", "e"],
    agouti: ["A", "a"],
    cream: ["Cr", "n"],
    grey: ["G", "g"],
    tobiano: ["TO", "n"],
    roan: ["RN", "n"],
    dun: ["D", "d"],
    champagne: ["CH", "n"],
    silver: ["Z", "z"],
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
    cream: { "CrCr": ["Cr","Cr"], "Crn": ["Cr","n"], "nn": ["n","n"] },
    grey: { "GG": ["G","G"], "Gg": ["G","g"], "gg": ["g","g"] },
    tobiano: { "TOTO": ["TO","TO"], "TOn": ["TO","n"], "nn": ["n","n"] },
    roan: { "RNn": ["RN","n"], "nn": ["n","n"], "RNRN": ["RN","RN"] },
    dun: { "DD": ["D","D"], "Dd": ["D","d"], "dd": ["d","d"] },
    champagne: { "CHn": ["CH","n"], "nn": ["n","n"], "CHCH": ["CH","CH"] },
    silver: { "ZZ": ["Z","Z"], "Zz": ["Z","z"], "zz": ["z","z"] },
  };
  return mappings[locus]?.[genotypeStr] || [randomAllele(locus), randomAllele(locus)];
}

function combineAlleles(locus, a1, a2) {
  const dominant = { extension: "E", agouti: "A", cream: "Cr", grey: "G", tobiano: "TO", roan: "RN", dun: "D", champagne: "CH", silver: "Z" };
  const recessive = { extension: "e", agouti: "a", cream: "n", grey: "g", tobiano: "n", roan: "n", dun: "d", champagne: "n", silver: "z" };
  const d = dominant[locus], r = recessive[locus];
  
  if (a1 === d && a2 === d) return d + d;
  if ((a1 === d && a2 === r) || (a1 === r && a2 === d)) return d + r;
  return r + r;
}

export function generateRandomGenotype(breed) {
  const loci = ["extension", "agouti", "cream", "grey", "tobiano", "roan", "dun", "champagne", "silver"];
  const genotype = {};
  
  loci.forEach(locus => {
    const a1 = randomAllele(locus);
    const a2 = randomAllele(locus);
    genotype[locus] = combineAlleles(locus, a1, a2);
  });
  
  if (breed === "Frison") {
    genotype.extension = "EE";
    genotype.agouti = "aa";
    genotype.grey = "gg";
    genotype.cream = "nn";
  }
  if (breed === "Fjord") {
    genotype.dun = Math.random() > 0.2 ? "DD" : "Dd";
  }
  if (breed === "Camargue") {
    genotype.grey = Math.random() > 0.3 ? "Gg" : "GG";
  }
  
  return genotype;
}

export function breedGenotype(fatherGenotype, motherGenotype) {
  const loci = ["extension", "agouti", "cream", "grey", "tobiano", "roan", "dun", "champagne", "silver"];
  const childGenotype = {};
  
  loci.forEach(locus => {
    const a1 = inheritAllele(fatherGenotype, locus);
    const a2 = inheritAllele(motherGenotype, locus);
    childGenotype[locus] = combineAlleles(locus, a1, a2);
  });
  
  return childGenotype;
}

export function determineCoatColor(genotype) {
  if (!genotype) return "Inconnu";
  
  if (genotype.grey === "GG" || genotype.grey === "Gg") return "Gris";
  
  const isBlack = genotype.extension !== "ee";
  const hasAgouti = genotype.agouti !== "aa";
  const hasCream = genotype.cream === "Crn";
  const doubleCream = genotype.cream === "CrCr";
  const hasDun = genotype.dun !== "dd";
  const hasChampagne = genotype.champagne === "CHn" || genotype.champagne === "CHCH";
  const hasSilver = genotype.silver !== "zz";
  const hasTobiano = genotype.tobiano !== "nn";
  const hasRoan = genotype.roan === "RNn" || genotype.roan === "RNRN";
  
  let base = "";
  
  if (!isBlack) {
    base = "Alezan";
    if (hasCream) base = "Palomino";
    if (doubleCream) base = "Cremello";
    if (hasChampagne) base = "Alezan Champagne";
  } else if (hasAgouti) {
    base = "Bai";
    if (hasCream) base = "Isabelle";
    if (doubleCream) base = "Perlino";
    if (hasChampagne) base = "Ambre Champagne";
    if (hasSilver) base = "Bai Silver";
  } else {
    base = "Noir";
    if (hasCream) base = "Smoky Black";
    if (doubleCream) base = "Smoky Cream";
    if (hasChampagne) base = "Noir Champagne";
    if (hasSilver) base = "Noir Silver";
  }
  
  if (hasDun) base += " Dun";
  if (hasTobiano) base += " Tobiano";
  if (hasRoan) base += " Roan";
  
  return base;
}

export function generateRandomStats(fatherStats, motherStats) {
  const statNames = ["speed", "endurance", "agility", "strength", "temperament", "jumping", "dressage"];
  const stats = {};
  
  statNames.forEach(stat => {
    const fatherVal = fatherStats?.[stat] || (30 + Math.random() * 40);
    const motherVal = motherStats?.[stat] || (30 + Math.random() * 40);
    const avg = (fatherVal + motherVal) / 2;
    const variation = (Math.random() - 0.5) * 30;
    stats[stat] = Math.max(5, Math.min(100, Math.round(avg + variation)));
  });
  
  return stats;
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
  const relevantDiseases = DISEASES.filter(d => d.breeds.includes(breed) || Math.random() < 0.05);
  
  relevantDiseases.forEach(disease => {
    const fatherGene = fatherHealth?.find(h => h.disease === disease.name);
    const motherGene = motherHealth?.find(h => h.disease === disease.name);
    
    const fatherCarrier = fatherGene?.status === "carrier" || fatherGene?.status === "affected";
    const motherCarrier = motherGene?.status === "carrier" || motherGene?.status === "affected";
    
    let status = "clear";
    if (fatherCarrier && motherCarrier) {
      const roll = Math.random();
      if (roll < 0.25) status = "affected";
      else if (roll < 0.75) status = "carrier";
    } else if (fatherCarrier || motherCarrier) {
      status = Math.random() < 0.5 ? "carrier" : "clear";
    } else {
      if (Math.random() < 0.02) status = "carrier";
    }
    
    if (status !== "clear") {
      childHealth.push({ disease: disease.name, status });
    }
  });
  
  return childHealth;
}

export function generateStarterHorse(breed) {
  const genotype = generateRandomGenotype(breed);
  const stats = generateRandomStats();
  const healthGenes = [];
  
  const relevantDiseases = DISEASES.filter(d => d.breeds.includes(breed));
  relevantDiseases.forEach(disease => {
    if (Math.random() < 0.15) {
      healthGenes.push({ disease: disease.name, status: "carrier" });
    }
  });
  
  return {
    genotype,
    coat_color: determineCoatColor(genotype),
    stats,
    health_genes: healthGenes,
    energy: 100,
    competition_wins: 0,
    is_for_sale: false,
    price: 0
  };
}

export function getCompetitionScore(horse, discipline) {
  if (!horse?.stats) return 0;
  const weights = {
    dressage: { dressage: 0.4, temperament: 0.3, agility: 0.2, strength: 0.1 },
    show_jumping: { jumping: 0.4, agility: 0.25, speed: 0.2, strength: 0.15 },
    cross_country: { endurance: 0.3, jumping: 0.25, speed: 0.25, agility: 0.2 },
    endurance: { endurance: 0.5, speed: 0.2, strength: 0.2, temperament: 0.1 },
    reining: { agility: 0.35, temperament: 0.3, speed: 0.2, dressage: 0.15 },
    barrel_racing: { speed: 0.4, agility: 0.35, temperament: 0.15, endurance: 0.1 },
    polo: { speed: 0.3, agility: 0.3, temperament: 0.2, endurance: 0.2 },
    eventing: { jumping: 0.25, dressage: 0.25, endurance: 0.25, speed: 0.25 },
    vaulting: { temperament: 0.4, dressage: 0.3, strength: 0.2, agility: 0.1 },
    driving: { temperament: 0.3, endurance: 0.3, strength: 0.25, dressage: 0.15 },
    trail: { temperament: 0.35, endurance: 0.3, agility: 0.2, speed: 0.15 },
    western_pleasure: { temperament: 0.4, dressage: 0.3, agility: 0.2, speed: 0.1 },
  };
  
  const w = weights[discipline] || weights.dressage;
  let score = 0;
  Object.entries(w).forEach(([stat, weight]) => {
    score += (horse.stats[stat] || 50) * weight;
  });
  
  const affected = horse.health_genes?.filter(h => h.status === "affected") || [];
  score -= affected.length * 10;
  
  score += (Math.random() - 0.5) * 15;
  
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
    : 50;
  const age = horse.age ?? 0;
  const wins = horse.competition_wins || 0;
  const hasDisease = horse.health_genes?.some(g => g.status === 'affected');
  const approvalStatus = horse.breeding_approval_status;

  let base;

  if (age <= 1) {
    base = 3000 + Math.max(0, (avgStat - 30)) * 240;
    base = Math.max(3000, Math.min(15000, base));
  } else if (age <= 3) {
    base = 10000 + Math.max(0, (avgStat - 30)) * 857;
    base = Math.max(10000, Math.min(40000, base));
  } else if (avgStat < 45) {
    base = 1000 + (avgStat / 45) * 7000;
  } else if (avgStat < 65) {
    base = 8000 + ((avgStat - 45) / 20) * 17000;
  } else if (avgStat < 82) {
    base = 25000 + ((avgStat - 65) / 17) * 125000;
  } else {
    base = 150000 + ((avgStat - 82) / 18) * 850000;
  }

  base *= getCoatMultiplier(horse.coat_color);

  const winsMultiplier = Math.min(3, 1 + wins * 0.1);
  base *= winsMultiplier;

  if (hasDisease) base *= 0.4;

  // Apply approval status multiplier
  const approvalMultiplier = {
    elite: 2.0,
    provisional: 1.5,
    approved: 1.2,
    approved_restricted: 1.1,
    not_approved: 0.6,
    not_evaluated: 1.0
  };
  base *= approvalMultiplier[approvalStatus] || 1.0;

  return Math.round(base / 100) * 100;
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