// Système de scoring pour les inspections de studbook - Nouvelle formule 5 catégories

const SCORING_CATEGORIES = {
  conformation: {
    name: 'Modèle / Conformation',
    description: 'Équilibre général, membres, dos, encolure, type de corps, solidité',
    maxScore: 30,
    weight: 0.30
  },
  locomotion: {
    name: 'Locomotion',
    description: 'Qualité des allures, amplitude, souplesse, régularité, propulsion',
    maxScore: 20,
    weight: 0.20
  },
  breedType: {
    name: 'Type racial',
    description: 'Ressemblance au standard, tête, proportions, expression, cohérence',
    maxScore: 15,
    weight: 0.15
  },
  genetics: {
    name: 'Génétique / Santé',
    description: 'Maladies génétiques, qualité des lignées, tests ADN, défauts majeurs',
    maxScore: 20,
    weight: 0.20
  },
  performance: {
    name: 'Performances / Potentiel',
    description: 'Résultats compétition, potentiel sportif, aptitude, mental',
    maxScore: 15,
    weight: 0.15
  }
};

export function calculateInspectionScore(horse) {
  if (!horse || !horse.stats) return { total: 0, breakdown: {}, bonuses: [], penalties: [] };

  const breakdown = {};
  const bonuses = [];
  const penalties = [];

  // A. Conformation (30 points) - basé sur strength, agility, temperament
  const conformationScore = Math.round(
    (horse.stats.strength || 50) * 0.4 +
    (horse.stats.agility || 50) * 0.3 +
    (horse.stats.temperament || 50) * 0.3
  );
  breakdown.conformation = Math.min(30, Math.round((conformationScore / 100) * 30));

  // B. Locomotion (20 points) - basé sur agility, speed, endurance
  const locomotionScore = Math.round(
    (horse.stats.agility || 50) * 0.4 +
    (horse.stats.speed || 50) * 0.35 +
    (horse.stats.endurance || 50) * 0.25
  );
  breakdown.locomotion = Math.min(20, Math.round((locomotionScore / 100) * 20));

  // C. Type racial (15 points) - basé sur gènes rares et cohérence
  const rareGeneCount = horse.genotype
    ? Object.entries(horse.genotype).filter(([k, v]) => {
        return !['nn', 'gg', 'zz', 'dd', 'ee', 'aa'].includes(v) && v;
      }).length
    : 0;
  breakdown.breedType = Math.min(15, 8 + (rareGeneCount * 1.5));

  // D. Génétique / Santé (20 points)
  let geneticScore = 12; // Base
  const affectedCount = horse.health_genes?.filter(h => h.status === 'affected').length || 0;
  const carrierCount = horse.health_genes?.filter(h => h.status === 'carrier').length || 0;
  const clearCount = horse.health_genes?.filter(h => h.status === 'clear').length || 0;

  if (affectedCount === 0 && carrierCount === 0) {
    geneticScore += 5;
    bonuses.push({ key: 'cleanGenetics', description: 'ADN sain sans porteur' });
  }

  if (rareGeneCount >= 2) {
    geneticScore += 1;
    bonuses.push({ key: 'rareGenes', description: 'Gènes rares/recherchés' });
  }

  if (affectedCount > 0) {
    geneticScore -= 10 * affectedCount;
    for (let i = 0; i < affectedCount; i++) {
      penalties.push({ key: 'affectedGenes', description: 'Affecté par maladie génétique' });
    }
  }

  if (carrierCount > 0) {
    geneticScore -= 4 * carrierCount;
    for (let i = 0; i < carrierCount; i++) {
      penalties.push({ key: 'carrierDisease', description: 'Porteur de maladie génétique' });
    }
  }

  breakdown.genetics = Math.max(0, Math.min(20, geneticScore));

  // E. Performances / Potentiel (15 points) - basé sur jumping, dressage, endurance, speed
  const performanceScore = Math.round(
    (horse.stats.jumping || 50) * 0.25 +
    (horse.stats.dressage || 50) * 0.25 +
    (horse.stats.endurance || 50) * 0.25 +
    (horse.stats.speed || 50) * 0.25
  );
  breakdown.performance = Math.min(15, Math.round((performanceScore / 100) * 15));

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

const APPROVAL_THRESHOLDS = {
  elite: { min: 90, status: 'elite', label: 'Elite', icon: '⭐' },
  premium: { min: 80, status: 'provisional', label: 'Premium', icon: '🌟' },
  approved: { min: 65, status: 'approved', label: 'Approuvé', icon: '✅' },
  restricted: { min: 50, status: 'approved_restricted', label: 'Candidat restreint', icon: '⚠️' },
  rejected: { min: 0, status: 'not_approved', label: 'Refusé', icon: '❌' }
};

export function getApprovalStatus(score) {
  if (score >= APPROVAL_THRESHOLDS.elite.min) return APPROVAL_THRESHOLDS.elite;
  if (score >= APPROVAL_THRESHOLDS.premium.min) return APPROVAL_THRESHOLDS.premium;
  if (score >= APPROVAL_THRESHOLDS.approved.min) return APPROVAL_THRESHOLDS.approved;
  if (score >= APPROVAL_THRESHOLDS.restricted.min) return APPROVAL_THRESHOLDS.restricted;
  return APPROVAL_THRESHOLDS.rejected;
}

export function getScoreColor(score) {
  if (score >= 90) return 'from-yellow-500 to-amber-500';
  if (score >= 80) return 'from-emerald-500 to-green-500';
  if (score >= 65) return 'from-blue-500 to-cyan-500';
  if (score >= 50) return 'from-orange-500 to-amber-500';
  return 'from-red-500 to-rose-500';
}

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
  return impacts[approvalStatus] || impacts.not_evaluated;
}

export { SCORING_CATEGORIES, APPROVAL_THRESHOLDS, SCORING_CATEGORIES as SCORING_CRITERIA };