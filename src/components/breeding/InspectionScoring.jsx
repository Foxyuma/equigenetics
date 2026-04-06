// Système de scoring pour les inspections de studbook
// Critères conformes aux règles européennes réelles

const SCORING_CRITERIA = {
  conformation: {
    name: 'Conformation',
    description: 'Morphologie générale et structure osseuse',
    maxScore: 20,
    statWeights: { strength: 0.5, agility: 0.3, temperament: 0.2 }
  },
  locomotion: {
    name: 'Locomotion',
    description: 'Qualité des allures et efficacité des mouvements',
    maxScore: 20,
    statWeights: { agility: 0.4, speed: 0.3, endurance: 0.3 }
  },
  typeRacial: {
    name: 'Type racial',
    description: 'Respect du standard génétique de la race',
    maxScore: 20,
    statWeights: { temperament: 0.4, agility: 0.3, strength: 0.3 }
  },
  potentielSportif: {
    name: 'Potentiel sportif',
    description: 'Capacités compétitives selon la discipline',
    maxScore: 20,
    statWeights: { jumping: 0.3, dressage: 0.3, endurance: 0.2, speed: 0.2 }
  },
  genetique: {
    name: 'Génétique',
    description: 'Santé génétique et qualité des lignées',
    maxScore: 20,
    healthBonus: true
  }
};

const GENETIC_BONUSES = {
  cleanGenetics: { bonus: 3, description: 'ADN sain sans porteur' },
  parentChampions: { bonus: 2, description: 'Parents avec record compétitif' },
  rareGenes: { bonus: 1, description: 'Gènes rares/recherchés' },
  carrierDisease: { penalty: -5, description: 'Porteur de maladie génétique' },
  affectedGenes: { penalty: -10, description: 'Affecté par maladie génétique' }
};

const APPROVAL_THRESHOLDS = {
  elite: { min: 90, status: 'elite', label: 'Elite', icon: '⭐' },
  premium: { min: 80, status: 'provisional', label: 'Premium', icon: '🌟' },
  approved: { min: 65, status: 'approved', label: 'Approuvé', icon: '✅' },
  restricted: { min: 50, status: 'approved_restricted', label: 'Approuvé avec Restrictions', icon: '⚠️' },
  rejected: { min: 0, status: 'not_approved', label: 'Non Approuvé', icon: '❌' }
};

export function calculateInspectionScore(horse, parentScores = {}) {
  if (!horse || !horse.stats) return { total: 0, breakdown: {}, bonuses: [], penalties: [] };

  const breakdown = {};
  const bonuses = [];
  const penalties = [];
  let totalScore = 0;

  // 1. Conformation (25% des stats requises)
  const conformationScore = Math.round(
    (horse.stats.strength || 50) * 0.5 +
    (horse.stats.agility || 50) * 0.3 +
    (horse.stats.temperament || 50) * 0.2
  );
  breakdown.conformation = Math.min(20, Math.round((conformationScore / 100) * 20));

  // 2. Locomotion (25% des stats requises)
  const locomotionScore = Math.round(
    (horse.stats.agility || 50) * 0.4 +
    (horse.stats.speed || 50) * 0.3 +
    (horse.stats.endurance || 50) * 0.3
  );
  breakdown.locomotion = Math.min(20, Math.round((locomotionScore / 100) * 20));

  // 3. Type racial (dépend des gènes rares)
  const rareGeneCount = horse.genotype
    ? Object.entries(horse.genotype).filter(([k, v]) => {
        return !['nn', 'gg', 'zz', 'dd', 'ee', 'aa'].includes(v) && v;
      }).length
    : 0;
  breakdown.typeRacial = Math.min(20, 10 + (rareGeneCount * 2));

  // 4. Potentiel sportif (moyenne des stats liées au sport)
  const sportScore = Math.round(
    (horse.stats.jumping || 50) * 0.3 +
    (horse.stats.dressage || 50) * 0.3 +
    (horse.stats.endurance || 50) * 0.2 +
    (horse.stats.speed || 50) * 0.2
  );
  breakdown.potentielSportif = Math.min(20, Math.round((sportScore / 100) * 20));

  // 5. Génétique (santé et lignées)
  let geneticScore = 10; // Base
  const affectedCount = horse.health_genes?.filter(h => h.status === 'affected').length || 0;
  const carrierCount = horse.health_genes?.filter(h => h.status === 'carrier').length || 0;
  const clearCount = horse.health_genes?.filter(h => h.status === 'clear').length || 0;

  if (affectedCount === 0 && carrierCount === 0) {
    geneticScore += 7;
    bonuses.push({ key: 'cleanGenetics', ...GENETIC_BONUSES.cleanGenetics });
  }

  if (rareGeneCount >= 2) {
    geneticScore += 1;
    bonuses.push({ key: 'rareGenes', ...GENETIC_BONUSES.rareGenes });
  }

  if (affectedCount > 0) {
    geneticScore -= 10 * affectedCount;
    for (let i = 0; i < affectedCount; i++) {
      penalties.push({ key: 'affectedGenes', ...GENETIC_BONUSES.affectedGenes });
    }
  }

  if (carrierCount > 0) {
    geneticScore -= 5 * carrierCount;
    for (let i = 0; i < carrierCount; i++) {
      penalties.push({ key: 'carrierDisease', ...GENETIC_BONUSES.carrierDisease });
    }
  }

  breakdown.genetique = Math.max(0, Math.min(20, geneticScore));

  // Calcul du total
  totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Ajouter variation aléatoire mineure (±5)
  const variation = (Math.random() - 0.5) * 10;
  totalScore = Math.max(0, Math.min(100, totalScore + variation));

  return {
    total: Math.round(totalScore),
    breakdown,
    bonuses: bonuses.filter((b, i, arr) => arr.findIndex(x => x.key === b.key) === i),
    penalties: penalties.filter((b, i, arr) => arr.findIndex(x => x.key === b.key) === i)
  };
}

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

export { SCORING_CRITERIA, GENETIC_BONUSES, APPROVAL_THRESHOLDS };