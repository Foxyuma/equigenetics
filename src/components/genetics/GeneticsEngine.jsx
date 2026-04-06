// Horse Genetics Engine - handles inheritance, coat color determination, disease transmission

const BREEDS = [
  "Pur-Sang Anglais", "Arabe", "Quarter Horse", "Frison", "Andalou",
  "Lusitanien", "Hanovrien", "Selle Français", "Trakehner", "Holsteiner",
  "KWPN", "Connemara", "Fjord", "Haflinger", "Welsh Pony",
  "Shetland", "Appaloosa", "Paint Horse", "Mustang", "Percheron",
  "Boulonnais", "Comtois", "Camargue", "Mérens", "Lipizzan"
];

const DISEASES = [
  { name: "HYPP", fullName: "Paralysie Hyperkaliémique", severity: "grave", breeds: ["Quarter Horse", "Paint Horse", "Appaloosa"] },
  { name: "GBED", fullName: "Glycogen Branching Enzyme Deficiency", severity: "letale", breeds: ["Quarter Horse", "Paint Horse"] },
  { name: "HERDA", fullName: "Hereditary Equine Regional Dermal Asthenia", severity: "grave", breeds: ["Quarter Horse"] },
  { name: "OLWS", fullName: "Overo Lethal White Syndrome", severity: "letale", breeds: ["Paint Horse"] },
  { name: "CA", fullName: "Ataxie Cérébelleuse", severity: "grave", breeds: ["Arabe"] },
  { name: "SCID", fullName: "Immunodéficience Combinée Sévère", severity: "letale", breeds: ["Arabe"] },
  { name: "LFS", fullName: "Syndrome du Poulain Lavande", severity: "letale", breeds: ["Arabe"] },
  { name: "PSSM", fullName: "Polysaccharide Storage Myopathy", severity: "modérée", breeds: ["Quarter Horse", "Percheron", "Comtois", "Boulonnais"] },
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
  // Parse the two alleles from the genotype string
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
  
  // Breed-specific adjustments
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
  
  // Grey overrides everything visually
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
      // Spontaneous mutation chance
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
  
  // Random chance of carrying diseases
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
  
  // Disease penalty
  const affected = horse.health_genes?.filter(h => h.status === "affected") || [];
  score -= affected.length * 10;
  
  // Random variation
  score += (Math.random() - 0.5) * 15;
  
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

const COAT_MULTIPLIERS = [
  // Common
  { keywords: ['bai', 'alezan'], multiplier: 1.00 },
  // Uncommon
  { keywords: ['noir', 'gris'], multiplier: 1.15 },
  // Rare
  { keywords: ['palomino', 'isabelle', 'dun', 'cremello', 'perlino', 'smoky'], multiplier: 1.35 },
  // Rare+ (roan)
  { keywords: ['roan'], multiplier: 1.40 },
  // Very rare
  { keywords: ['silver', 'tobiano'], multiplier: 1.70 },
  // Very rare+ (champagne)
  { keywords: ['champagne'], multiplier: 1.85 },
  // Exceptional
  { keywords: ['perle', 'pearl', 'blanc', 'white'], multiplier: 2.50 },
];

function getCoatMultiplier(coatColor) {
  if (!coatColor) return 1.00;
  const lower = coatColor.toLowerCase();
  // Match from most specific (highest multiplier) to least
  for (let i = COAT_MULTIPLIERS.length - 1; i >= 0; i--) {
    if (COAT_MULTIPLIERS[i].keywords.some(k => lower.includes(k))) {
      return COAT_MULTIPLIERS[i].multiplier;
    }
  }
  return 1.00;
}

/**
 * Estime la valeur marchande d'un cheval en Genesis (€ x 1)
 * Basé sur les tranches réelles du marché équin :
 * Loisir €1k-8k | Amateur €8k-25k | Pro €25k-150k | Elite €150k+
 * Poulains €3k-15k | Jeunes (2-3 ans) €10k-40k
 */
export function estimateHorseValue(horse) {
  const avgStat = horse.stats
    ? Math.round(Object.values(horse.stats).reduce((a, b) => a + b, 0) / 7)
    : 50;
  const age = horse.age ?? 0;
  const wins = horse.competition_wins || 0;
  const hasDisease = horse.health_genes?.some(g => g.status === 'affected');

  let base;

  if (age <= 1) {
    // Poulains : €3 000 – €15 000
    base = 3000 + Math.max(0, (avgStat - 30)) * 240;
    base = Math.max(3000, Math.min(15000, base));
  } else if (age <= 3) {
    // Jeunes 2-3 ans : €10 000 – €40 000
    base = 10000 + Math.max(0, (avgStat - 30)) * 857;
    base = Math.max(10000, Math.min(40000, base));
  } else if (avgStat < 45) {
    // Loisir : €1 000 – €8 000
    base = 1000 + (avgStat / 45) * 7000;
  } else if (avgStat < 65) {
    // Amateur sport : €8 000 – €25 000
    base = 8000 + ((avgStat - 45) / 20) * 17000;
  } else if (avgStat < 82) {
    // Pro sport : €25 000 – €150 000
    base = 25000 + ((avgStat - 65) / 17) * 125000;
  } else {
    // Elite / Champion : €150 000 – €1 000 000+
    base = 150000 + ((avgStat - 82) / 18) * 850000;
  }

  // Multiplicateur robe
  base *= getCoatMultiplier(horse.coat_color);

  // Bonus victoires : +10% par victoire, max ×3
  const winsMultiplier = Math.min(3, 1 + wins * 0.1);
  base *= winsMultiplier;

  // Malus maladie génétique : -60%
  if (hasDisease) base *= 0.4;

  return Math.round(base / 100) * 100;
}

export { BREEDS, DISEASES };