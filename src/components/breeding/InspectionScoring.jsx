// Système de scoring pour les inspections de studbook - Nouvelle formule 5 catégories

const SCORING_CATEGORIES = {
  conformation: {
    name: 'Model / Conformation',
    description: 'Overall balance, legs, back, neck, body type, soundness',
    maxScore: 25
  },
  locomotion: {
    name: 'Locomotion',
    description: 'Gait quality, stride, flexibility, regularity, propulsion',
    maxScore: 25
  },
  breedType: {
    name: 'Breed type',
    description: 'Standard conformity, head, proportions, expression, consistency',
    maxScore: 20
  },
  genetics: {
    name: 'Genetics / Health',
    description: 'Genetic diseases, lineage quality, DNA tests, major defects',
    maxScore: 20
  },
  performance: {
    name: 'Performance / Potential',
    description: 'Competition results, sport potential, aptitude, mental',
    maxScore: 10
  }
};

// Poids de scoring par race (totalisant 100)
const RACE_SCORING_WEIGHTS = {
  'Arabian': {
    conformation: 25,
    locomotion: 15,
    breedType: 30,
    genetics: 15,
    performance: 15
  },
  'Thoroughbred': {
    conformation: 20,
    locomotion: 25,
    breedType: 15,
    genetics: 20,
    performance: 20
  },
  'Selle Français': {
    conformation: 25,
    locomotion: 25,
    breedType: 10,
    genetics: 20,
    performance: 20
  },
  'KWPN': {
    conformation: 25,
    locomotion: 25,
    breedType: 10,
    genetics: 20,
    performance: 20
  },
  'Hanoverian': {
    conformation: 25,
    locomotion: 25,
    breedType: 10,
    genetics: 20,
    performance: 20
  },
  'Holsteiner': {
    conformation: 25,
    locomotion: 25,
    breedType: 10,
    genetics: 20,
    performance: 20
  },
  'Friesian': {
    conformation: 25,
    locomotion: 20,
    breedType: 25,
    genetics: 20,
    performance: 10
  },
  'Lipizzaner': {
    conformation: 25,
    locomotion: 20,
    breedType: 25,
    genetics: 15,
    performance: 15
  },
  'Anglo-Arabian': {
    conformation: 25,
    locomotion: 20,
    breedType: 20,
    genetics: 20,
    performance: 15
  },
  'Haflinger': {
    conformation: 25,
    locomotion: 20,
    breedType: 25,
    genetics: 15,
    performance: 15
  },
  'Connemara': {
    conformation: 25,
    locomotion: 20,
    breedType: 20,
    genetics: 20,
    performance: 15
  },
  'Belgian Warmblood': {
    conformation: 25,
    locomotion: 25,
    breedType: 10,
    genetics: 20,
    performance: 20
  },
  'Oldenburg': {
    conformation: 25,
    locomotion: 25,
    breedType: 10,
    genetics: 20,
    performance: 20
  }
};

// Poids par défaut pour les races non listées
const DEFAULT_SCORING_WEIGHTS = {
  conformation: 25,
  locomotion: 25,
  breedType: 10,
  genetics: 20,
  performance: 20
};

export function applyModifiers(score, horse, parentHorses, healthRecord, inbreedingCoef) {
  let modifiedScore = score;
  const modifiers = { bonuses: [], penalties: [] };

  // === BONUS POSITIFS ===

  // 1. Parents approuvés / élite
  if (parentHorses && parentHorses.length > 0) {
    const approvedParents = parentHorses.filter(p => {
      const status = p.breeding_approval_status;
      return status === 'elite' || status === 'provisional' || status === 'approved';
    }).length;
    if (approvedParents > 0) {
      const bonus = approvedParents === 2 ? 5 : 2; // +5 si les deux parents approuvés, +2 sinon
      modifiedScore += bonus;
      modifiers.bonuses.push({ type: 'approved_parents', value: bonus,         description: `Approved parents (+${bonus})` });
    }
  }

  // 2. Performances supérieures à la moyenne
  if (horse.stats) {
    const avgStat = Object.values(horse.stats).reduce((a, b) => a + b, 0) / Object.keys(horse.stats).length;
    if (avgStat >= 70) {
      const bonus = Math.min(5, Math.round((avgStat - 70) / 6));
      modifiedScore += bonus;
      modifiers.bonuses.push({ type: 'high_performance', value: bonus,         description: `Superior performance (+${bonus})` });
    }
  }

  // 3. Tempérament excellent
  if (horse.stats?.temperament && horse.stats.temperament >= 75) {
    const bonus = Math.min(3, Math.round((horse.stats.temperament - 75) / 8));
    modifiedScore += bonus;
    modifiers.bonuses.push({ type: 'excellent_temperament', value: bonus,         description: `Excellent temperament (+${bonus})` });
  }

  // === MALUS ===

  // 1. Porteur maladie génétique
  const carrierDiseases = horse.health_genes?.filter(h => h.status === 'carrier') || [];
  if (carrierDiseases.length > 0) {
    const penalty = -4 * carrierDiseases.length;
    modifiedScore += penalty;
    modifiers.penalties.push({ type: 'carrier_diseases', value: penalty,         description: `Disease carrier (${penalty})` });
  }

  // 2. Faible locomotion
  if (horse.stats) {
    const locomotionScore = Math.round(
      (horse.stats.agility || 50) * 0.4 + (horse.stats.speed || 50) * 0.35 + (horse.stats.endurance || 50) * 0.25
    );
    if (locomotionScore < 40) {
      const penalty = Math.round(-3 - (40 - locomotionScore) / 2);
      modifiedScore += penalty;
      modifiers.penalties.push({ type: 'low_locomotion', value: penalty,         description: `Weak locomotion (${penalty})` });
    }
  }

  // 3. Faible type racial (peu de gènes rares)
  const rareGeneCount = horse.genotype
    ? Object.entries(horse.genotype).filter(([k, v]) => {
        return !['nn', 'gg', 'zz', 'dd', 'ee', 'aa', 'nd2nd2', 'toto'].includes(v) && v;
      }).length
    : 0;
  if (rareGeneCount === 0) {
    const penalty = -3;
    modifiedScore += penalty;
    modifiers.penalties.push({ type: 'weak_breed_type', value: penalty,         description: `Weak breed type (${penalty})` });
  }

  // 4. Consanguinité élevée
  if (inbreedingCoef !== undefined && inbreedingCoef > 0.10) {
    const penalty = Math.round(-2 - (inbreedingCoef - 0.10) * 50);
    modifiedScore += penalty;
    modifiers.penalties.push({ type: 'high_inbreeding', value: penalty,         description: `High inbreeding (${penalty})` });
  }

  // 5. Blessure récente / visite véto problématique
  if (healthRecord?.current_illness && healthRecord.illness_severity) {
    const severityPenalty = {
      'mild': -3,
      'moderate': -6,
      'severe': -10
    };
    const penalty = severityPenalty[healthRecord.illness_severity] || -3;
    modifiedScore += penalty;
    modifiers.penalties.push({ type: 'recent_health_issue', value: penalty,         description: `Recent health issue (${penalty})` });
  }

  return { modifiedScore: Math.max(0, Math.min(100, modifiedScore)), modifiers };
}

export function calculateInspectionScore(horse) {
  if (!horse || !horse.stats) return { total: 0, breakdown: {}, bonuses: [], penalties: [] };

  const breakdown = {};
  const bonuses = [];
  const penalties = [];

  // Récupérer les poids pour la race du cheval
  const weights = RACE_SCORING_WEIGHTS[horse.breed] || DEFAULT_SCORING_WEIGHTS;

  // A. Conformation - basé sur strength, agility, temperament
  const conformationScore = Math.round(
    (horse.stats.strength || 50) * 0.4 +
    (horse.stats.agility || 50) * 0.3 +
    (horse.stats.temperament || 50) * 0.3
  );
  breakdown.conformation = Math.round((conformationScore / 100) * weights.conformation);

  // B. Locomotion - basé sur agility, speed, endurance
  const locomotionScore = Math.round(
    (horse.stats.agility || 50) * 0.4 +
    (horse.stats.speed || 50) * 0.35 +
    (horse.stats.endurance || 50) * 0.25
  );
  breakdown.locomotion = Math.round((locomotionScore / 100) * weights.locomotion);

  // C. Type racial - basé sur gènes rares et cohérence
  const rareGeneCount = horse.genotype
    ? Object.entries(horse.genotype).filter(([k, v]) => {
        return !['nn', 'gg', 'zz', 'dd', 'ee', 'aa', 'nd2nd2', 'toto'].includes(v) && v;
      }).length
    : 0;
  const maxBreedTypeScore = Math.min(weights.breedType, 8 + (rareGeneCount * 1.5));
  breakdown.breedType = Math.round(maxBreedTypeScore);

  // D. Génétique / Santé
  let geneticScore = Math.round(weights.genetics * 0.6); // Base
  const affectedCount = horse.health_genes?.filter(h => h.status === 'affected').length || 0;
  const carrierCount = horse.health_genes?.filter(h => h.status === 'carrier').length || 0;

  if (affectedCount === 0 && carrierCount === 0) {
    geneticScore += Math.round(weights.genetics * 0.25);
    bonuses.push({ key: 'cleanGenetics', description: 'Healthy DNA without carrier' });
  }

  if (rareGeneCount >= 2) {
    geneticScore += 1;
    bonuses.push({ key: 'rareGenes', description: 'Rare/sought-after genes' });
  }

  if (affectedCount > 0) {
    geneticScore -= Math.round((weights.genetics * 0.5) * affectedCount);
    for (let i = 0; i < affectedCount; i++) {
      penalties.push({ key: 'affectedGenes', description: 'Affected by genetic disease' });
    }
  }

  if (carrierCount > 0) {
    geneticScore -= Math.round((weights.genetics * 0.2) * carrierCount);
    for (let i = 0; i < carrierCount; i++) {
      penalties.push({ key: 'carrierDisease', description: 'Carrier of genetic disease' });
    }
  }

  breakdown.genetics = Math.max(0, Math.min(weights.genetics, geneticScore));

  // E. Performances / Potentiel - basé sur jumping, dressage, endurance, speed
  const performanceScore = Math.round(
    (horse.stats.jumping || 50) * 0.25 +
    (horse.stats.dressage || 50) * 0.25 +
    (horse.stats.endurance || 50) * 0.25 +
    (horse.stats.speed || 50) * 0.25
  );
  breakdown.performance = Math.round((performanceScore / 100) * weights.performance);

  // Calcul du total /100
  const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Variation aléatoire mineure (±3)
  const variation = (Math.random() - 0.5) * 6;
  const finalScore = Math.max(0, Math.min(100, totalScore + variation));

  return {
    total: Math.round(finalScore),
    breakdown,
    bonuses: bonuses.filter((b, i, arr) => arr.findIndex(x => x.key === b.key) === i),
    penalties: penalties.filter((b, i, arr) => arr.findIndex(x => x.key === b.key) === i)
  };
}

// Fonction utilitaire pour calculer le coefficient de consanguinité (simple)
export function calculateInbreedingCoefficient(parentHorses) {
  if (!parentHorses || parentHorses.length < 2) return 0;
  // Implémentation simple : si parents proches dans la même race, faible inbreeding
  // Peut être amélioré avec vrai calcul d'ascendants
  const avgCoefficient = parentHorses.reduce((sum, p) => sum + (p.estimated_inbreeding_coef || 0), 0) / parentHorses.length;
  return Math.min(0.25, avgCoefficient + 0.05); // Cap à 25%
}

// === PIPELINE FINAL D'INSPECTION ===
// Orchestre les 6 étapes du système d'approbation
export function performFullInspection(horse, parentHorses, healthRecord) {
  const inspection = {
    horse_id: horse.id,
    horse_name: horse.name,
    breed: horse.breed,
    age: horse.age,
    timestamp: new Date().toISOString()
  };

  // ÉTAPE 1: Calcul des sous-notes
  const scoreData = calculateInspectionScore(horse);
  inspection.baseScore = scoreData.total;
  inspection.breakdown = scoreData.breakdown;
  inspection.baseGenetic = scoreData;

  // ÉTAPE 2: Application des pondérations selon la race (DÉJÀ INCLUSE dans calculateInspectionScore)
  // Les poids par race sont appliqués lors du calcul des scores de chaque catégorie

  // ÉTAPE 3: Calcul du score total /100
  // Le score total est déjà calculé dans calculateInspectionScore
  inspection.totalScore = scoreData.total;

  // ÉTAPE 4: Vérification des blocages
  const blocages = {
    autoRejects: detectAutoRejects(horse, healthRecord),
    autoRestrictions: detectAutoRestrictions(horse)
  };
  inspection.blocages = blocages;
  inspection.isBlocked = blocages.autoRejects.length > 0;

  // Si refus automatique, retourner directement
  if (inspection.isBlocked) {
    inspection.finalStatus = APPROVAL_THRESHOLDS.rejected.status;
    inspection.finalLabel = APPROVAL_THRESHOLDS.rejected.label;
    inspection.finalIcon = APPROVAL_THRESHOLDS.rejected.icon;
    inspection.blockedReason = blocages.autoRejects[0].reason;
    inspection.zone = null;
    inspection.modifiers = { bonuses: [], penalties: [] };
    return inspection;
  }

  // ÉTAPE 5: Détermination de la zone de probabilité
  const zone = APPROVAL_PROBABILITY_ZONES.find(
    z => inspection.totalScore >= z.range[0] && inspection.totalScore <= z.range[1]
  );
  inspection.zone = zone?.name || 'Zone inconnue';
  inspection.zoneRange = zone?.range || [0, 0];

  // ÉTAPE 6: Tirage aléatoire du statut final
  const approvalResult = getRandomApprovalStatus(inspection.totalScore, horse);
  inspection.finalStatus = approvalResult.status;
  inspection.finalLabel = approvalResult.label;
  inspection.finalIcon = approvalResult.icon;

  // Ajouter les modificateurs appliqués (bonus/malus)
  inspection.modifiers = { bonuses: scoreData.bonuses, penalties: scoreData.penalties };
  inspection.restrictions = blocages.autoRestrictions;

  return inspection;
}

const APPROVAL_THRESHOLDS = {
  elite: { min: 90, status: 'elite', label: 'Elite', icon: '⭐' },
  premium: { min: 80, status: 'provisional', label: 'Premium', icon: '🌟' },
  approved: { min: 65, status: 'approved', label: 'Approuvé', icon: '✅' },
  restricted: { min: 50, status: 'approved_restricted', label: 'Candidat restreint', icon: '⚠️' },
  rejected: { min: 0, status: 'not_approved', label: 'Refusé', icon: '❌' }
};

// Zones de probabilités finales
const APPROVAL_PROBABILITY_ZONES = [
  {
    name: 'Zone 1: Very low',
    range: [0, 49],
    outcomes: [
      { status: 'not_approved', probability: 0.95 },
      { status: 'approved_restricted', probability: 0.05 }
    ]
  },
  {
    name: 'Zone 2: Fair',
    range: [50, 64],
    outcomes: [
      { status: 'not_approved', probability: 0.45 },
      { status: 'approved_restricted', probability: 0.45 },
      { status: 'approved', probability: 0.10 }
    ]
  },
  {
    name: 'Zone 3: Good',
    range: [65, 79],
    outcomes: [
      { status: 'approved_restricted', probability: 0.20 },
      { status: 'approved', probability: 0.65 },
      { status: 'provisional', probability: 0.15 }
    ]
  },
  {
    name: 'Zone 4: Very good',
    range: [80, 89],
    outcomes: [
      { status: 'approved', probability: 0.20 },
      { status: 'provisional', probability: 0.60 },
      { status: 'elite', probability: 0.20 }
    ]
  },
  {
    name: 'Zone 5: Excellent',
    range: [90, 100],
    outcomes: [
      { status: 'provisional', probability: 0.25 },
      { status: 'elite', probability: 0.75 }
    ]
  }
];

export function detectAutoRejects(horse, healthRecord) {
  const rejects = [];

  // Refus 1: Maladie génétique létale exprimée
  const affectedLethals = horse.health_genes?.filter(h => h.status === 'affected') || [];
  if (affectedLethals.length > 0) {
    rejects.push({
      type: 'lethal_disease',
      reason: `Genetic disease affected: ${affectedLethals.map(d => d.disease).join(', ')}`,
      severity: 'critical',
      forceRejected: true
    });
  }

  // Refus 2: Défaut grave de conformation
  if (horse.stats) {
    const conformationScore = Math.min(30, Math.round(
      (horse.stats.strength || 50) * 0.4 + (horse.stats.agility || 50) * 0.3 + (horse.stats.temperament || 50) * 0.3
    ));
    if (conformationScore < 8) {
      rejects.push({
        type: 'severe_conformation',
        reason: 'Severe conformation defect (score < 8/30)',
        severity: 'critical',
        forceRejected: true
      });
    }
  }

  // Refus 3: Boiterie active
  if (healthRecord?.current_illness && healthRecord.current_illness.toLowerCase().includes('laméness')) {
    rejects.push({
      type: 'active_lameness',
      reason: 'Active lameness detected',
      severity: 'critical',
      forceRejected: true
    });
  }

  // Refus 4: Âge insuffisant
  if ((horse.age || 0) < 3) {
    rejects.push({
      type: 'insufficient_age',
      reason: `Insufficient age (${horse.age}y < 3y minimum)`,
      severity: 'critical',
      forceRejected: true
    });
  }

  return rejects;
}

export function detectAutoRestrictions(horse) {
  const restrictions = [];

  // Restriction 1: Porteur de maladie génétique surveillée
  const carrierDiseases = horse.health_genes?.filter(h => h.status === 'carrier') || [];
  if (carrierDiseases.length > 0) {
    restrictions.push({
      type: 'carrier_diseases',
      reason: `Carrier of ${carrierDiseases.length} genetic disease(s)`,
      severity: 'high',
      forceRestricted: true
    });
  }

  // Restriction 2: Modèle correct mais faible locomotion
  if (horse.stats) {
    const conformationScore = Math.min(30, Math.round(
      (horse.stats.strength || 50) * 0.4 + (horse.stats.agility || 50) * 0.3 + (horse.stats.temperament || 50) * 0.3
    ));
    const locomotionScore = Math.min(20, Math.round(
      (horse.stats.agility || 50) * 0.4 + (horse.stats.speed || 50) * 0.35 + (horse.stats.endurance || 50) * 0.25
    ));

    if (conformationScore >= 18 && locomotionScore < 10) {
      restrictions.push({
        type: 'low_locomotion',
        reason: 'Good model but insufficient locomotion',
        severity: 'medium',
        forceRestricted: true
      });
    }
  }

  // Restriction 3: Bonnes origines mais peu de résultats compétitifs
  if (horse.stats && horse.competition_wins !== undefined) {
    const performanceScore = Math.round(
      (horse.stats.jumping || 50) * 0.25 + (horse.stats.dressage || 50) * 0.25 +
      (horse.stats.endurance || 50) * 0.25 + (horse.stats.speed || 50) * 0.25
    );
    if (performanceScore >= 70 && horse.competition_wins < 2 && horse.age >= 4) {
      restrictions.push({
        type: 'unproven_performance',
        reason: 'Good potential but insufficient results',
        severity: 'medium',
        forceRestricted: true
      });
    }
  }

  return restrictions;
}

function isYoungAndInexperienced(horse) {
  const age = horse.age || 0;
  const wins = horse.competition_wins || 0;
  // Jeune = moins de 5 ans, inexpérimenté = moins de 5 victoires
  return age < 5 && wins < 5;
}

export function getRandomApprovalStatus(score, horse = null) {
  // Trouver la zone correspondant au score
  const zone = APPROVAL_PROBABILITY_ZONES.find(z => score >= z.range[0] && score <= z.range[1]);
  if (!zone) return { ...APPROVAL_THRESHOLDS.rejected, zone: 'unknown' };

  // Si cheval jeune et inexpérimenté, appliquer règle provisional
  if (horse && isYoungAndInexperienced(horse)) {
    if (score >= 65 && score < 80) {
      // Score bon mais jeune → provisional
      return { ...APPROVAL_THRESHOLDS.premium, zone: zone.name, reason: 'young_inexperienced' };
    }
    if (score >= 80) {
      // Score excellent mais jeune → provisional ou approved (75/25)
      const roll = Math.random();
      const selectedStatus = roll < 0.75 ? 'provisional' : 'approved';
      const statusMap = {
        'provisional': APPROVAL_THRESHOLDS.premium,
        'approved': APPROVAL_THRESHOLDS.approved
      };
      return { ...statusMap[selectedStatus], zone: zone.name, reason: 'young_excellent' };
    }
  }

  // Tirage aléatoire normal selon les probabilités de la zone
  const roll = Math.random();
  let accumulated = 0;
  let selectedStatus = zone.outcomes[0].status;

  for (const outcome of zone.outcomes) {
    accumulated += outcome.probability;
    if (roll <= accumulated) {
      selectedStatus = outcome.status;
      break;
    }
  }

  // Chercher le label correspondant
  const statusMap = {
    'elite': APPROVAL_THRESHOLDS.elite,
    'provisional': APPROVAL_THRESHOLDS.premium,
    'approved': APPROVAL_THRESHOLDS.approved,
    'approved_restricted': APPROVAL_THRESHOLDS.restricted,
    'not_approved': APPROVAL_THRESHOLDS.rejected
  };

  return { ...statusMap[selectedStatus], zone: zone.name };
}

export function getApprovalStatus(score, horse, healthRecord) {
  // Vérifier refus automatique d'abord
  const autoRejects = horse ? detectAutoRejects(horse, healthRecord) : [];
  if (autoRejects.length > 0) {
    return { ...APPROVAL_THRESHOLDS.rejected, autoRejects };
  }

  const autoRestrictions = horse ? detectAutoRestrictions(horse) : [];
  const hasForceRestriction = autoRestrictions.some(r => r.forceRestricted);

  // Si restriction forcée détectée, limiter au statut "restricted"
  if (hasForceRestriction && score >= APPROVAL_THRESHOLDS.approved.min) {
    return { ...APPROVAL_THRESHOLDS.restricted, autoRestrictions };
  }

  // Utiliser le système de probabilités pour le résultat final
  const result = getRandomApprovalStatus(score, horse);
  result.autoRestrictions = autoRestrictions;
  return result;
}

export function getScoreColor(score) {
  if (score >= 90) return 'from-yellow-500 to-amber-500';
  if (score >= 80) return 'from-emerald-500 to-green-500';
  if (score >= 65) return 'from-blue-500 to-cyan-500';
  if (score >= 50) return 'from-orange-500 to-amber-500';
  return 'from-red-500 to-rose-500';
}

const APPROVAL_STATUS_MAP = {
  elite_approved: 'elite',
  approved_for_sport_breeding: 'provisional',
  approved_for_breeding: 'approved',
  approved_restricted: 'approved_restricted',
  rejected: 'not_approved',
  not_evaluated: 'not_evaluated',
  'not_approved': 'not_approved',
  elite: 'elite',
  provisional: 'provisional',
  approved: 'approved',
};

export function getBreedingImpact(approvalStatus) {
  const impacts = {
    elite: {
      breeddingAllowed: true,
      foalRegistration: 'full_studbook',
      restrictions: [],
      priceMultiplier: 1.5,
      prestigeBonus: 15,
      description: 'Saillie premium avec tous les avantages'
    },
    provisional: {
      breeddingAllowed: true,
      foalRegistration: 'full_studbook',
      restrictions: [],
      priceMultiplier: 1.2,
      prestigeBonus: 8,
      description: 'Saillie approuvée, jeune étalon sous surveillance'
    },
    approved: {
      breeddingAllowed: true,
      foalRegistration: 'full_studbook',
      restrictions: [],
      priceMultiplier: 1.0,
      prestigeBonus: 5,
      description: 'Saillie standard reconnu studbook'
    },
    approved_restricted: {
      breeddingAllowed: true,
      foalRegistration: 'full_studbook',
      restrictions: ['Juments sélectionnées uniquement', 'Nombre de saillies limité par saison', 'Suivi vétérinaire obligatoire'],
      priceMultiplier: 0.8,
      prestigeBonus: 2,
      description: 'Saillie possible mais avec limitations'
    },
    not_approved: {
      breeddingAllowed: true,
      foalRegistration: 'oc',
      restrictions: ['Poulains enregistrés comme OC', 'Marché secondaire uniquement', 'Pas d\'accès aux épreuves approuvées'],
      priceMultiplier: 0.5,
      prestigeBonus: -5,
      description: 'Reproduction en OC uniquement'
    },
    not_evaluated: {
      breeddingAllowed: true,
      foalRegistration: 'oc',
      restrictions: ['Poulains potentiellement OC', 'Inspection requise'],
      priceMultiplier: 0.6,
      prestigeBonus: 0,
      description: 'En attente d\'inspection studbook'
    }
  };
  const mappedKey = APPROVAL_STATUS_MAP[approvalStatus] || 'not_evaluated';
  return impacts[mappedKey] || impacts.not_evaluated;
}

export { SCORING_CATEGORIES, APPROVAL_THRESHOLDS, SCORING_CATEGORIES as SCORING_CRITERIA };