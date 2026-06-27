import { getBreedProfile } from './breedProfiles';
import {
  POSITIVE_MORPHO,
  NEGATIVE_MORPHO,
  getQualification,
  getBreedGrid,
  scoreBreedGrid,
} from './breedGrids';

export { POSITIVE_MORPHO, NEGATIVE_MORPHO, getQualification };

export const AGE_CLASSES = [
  { age: 0, label: "De l'année", icon: '🍼' },
  { age: 1, label: '1 an', icon: '🐎' },
  { age: 2, label: '2 ans', icon: '🏇' },
  { age: 3, label: '3 ans', icon: '👑' },
  { age: 4, label: '4 ans', icon: '⭐' },
];

export const PRIZE_TABLE = [
  { rank: 1, prize: 2000, rep: 15 },
  { rank: 2, prize: 1000, rep: 10 },
  { rank: 3, prize: 500, rep: 5 },
];

const COAT_BONUS_TABLE = [
  { keywords: ['palomino', 'isabelle', 'buckskin', 'dun', 'smoky'], bonus: 5 },
  { keywords: ['roan', 'silver'], bonus: 6 },
  { keywords: ['champagne', 'cremello', 'perlino'], bonus: 7 },
  { keywords: ['tobiano', 'overo', 'pie'], bonus: 6 },
  { keywords: ['noir', 'gris', 'grey'], bonus: 3 },
];

function getCoatBonus(coatColor) {
  if (!coatColor) return 0;
  const lower = coatColor.toLowerCase();
  for (const c of COAT_BONUS_TABLE) {
    if (c.keywords.some(k => lower.includes(k))) return c.bonus;
  }
  return 0;
}

function clampScore(v) {
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

// ─── FCT generic grid (fallback for breeds without a specific grid) ────
function scoreMorphoCriterion(morphology, positiveTrait, negativeTrait) {
  let score = 5.5;
  if (morphology.includes(positiveTrait)) score += 2.5;
  else if (morphology.includes(negativeTrait)) score -= 2.5;
  score += (Math.random() - 0.5) * 1.5;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

function scoreStatCriterion(value) {
  const v = value ?? 30;
  let score = 3 + (v / 100) * 6;
  score += (Math.random() - 0.5) * 1.5;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

function getImpressionScore(horse) {
  const profile = getBreedProfile(horse.breed);
  let score = 6.5;
  if (profile?.forbiddenCoats) {
    const coatLower = (horse.coat_color || '').toLowerCase();
    if (profile.forbiddenCoats.some(fc => coatLower.includes(fc.toLowerCase()))) {
      score -= 2;
    }
  }
  score += getCoatBonus(horse.coat_color) * 0.2;
  score += (Math.random() - 0.5) * 1.5;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

function clampCriterion(v) {
  const score = v + (Math.random() - 0.5) * 1.5;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

function getAdultGridScore(horse) {
  const morphology = horse.morphology || [];
  const potential = horse.genetic_potential || {};
  const stats = horse.stats || {};

  const criteria = {
    'Tête': scoreStatCriterion(stats.temperament),
    'Encolure': scoreMorphoCriterion(morphology, 'encolure_arquee', 'encolure_ewe'),
    'Membres antérieurs': scoreMorphoCriterion(morphology, 'epaules_inclinees', 'epaules_droites'),
    'Corps': scoreMorphoCriterion(morphology, 'dos_court', 'dos_long'),
    'Rein': scoreMorphoCriterion(morphology, 'poitrine_large', 'poitrine_etroite'),
    'Membres postérieurs': scoreMorphoCriterion(morphology, 'jarrets_puissants', 'jarrets_droits'),
    'Aplombs': scoreMorphoCriterion(morphology, 'aplombs_parfaits', 'aplombs_defectueux'),
    'Action (Pas)': scoreStatCriterion(potential.dressage || stats.dressage),
    'Épaisseur': scoreStatCriterion(stats.strength),
    'Impression générale & Type': getImpressionScore(horse),
  };

  const total = Object.values(criteria).reduce((sum, v) => sum + v, 0);
  return { criteria, total: clampScore(total) };
}

function getFoalGridScore(horse) {
  const morphology = horse.morphology || [];
  const potential = horse.genetic_potential || {};

  const positives = morphology.filter(t => POSITIVE_MORPHO.includes(t)).length;
  const negatives = morphology.filter(t => NEGATIVE_MORPHO.includes(t)).length;

  const criteria = {
    'Type dans la race': getImpressionScore(horse),
    'Harmonie générale': clampCriterion(5.5 + positives * 0.7 - negatives * 0.7),
    'Développement': scoreStatCriterion(
      Object.values(potential).length
        ? Object.values(potential).reduce((a, b) => a + b, 0) / Object.values(potential).length
        : 50
    ),
    'Aplombs': scoreMorphoCriterion(morphology, 'aplombs_parfaits', 'aplombs_defectueux'),
  };

  const total = (Object.values(criteria).reduce((sum, v) => sum + v, 0) / 40) * 100;
  return { criteria, total: clampScore(total) };
}

function getPresentationScore(horse) {
  const energy = horse.energy ?? 100;
  const cheval = Math.min(10, 5 + (energy / 100) * 4 + getCoatBonus(horse.coat_color) * 0.2);
  const presentateur = 6 + Math.random() * 2;
  const total = Math.min(20, cheval + presentateur);
  return {
    cheval: Math.round(cheval * 10) / 10,
    presentateur: Math.round(presentateur * 10) / 10,
    total: Math.round(total * 10) / 10,
  };
}

export function getModeleAlluresBreakdown(horse) {
  if (!horse) return null;

  // Breed-specific grid (e.g. Selle Français 2023)
  const breedGrid = getBreedGrid(horse.breed);
  if (breedGrid) {
    return scoreBreedGrid(horse, breedGrid);
  }

  // FCT generic grid (Camargue-style)
  const adult = getAdultGridScore(horse);
  const foal = getFoalGridScore(horse);
  const presentation = getPresentationScore(horse);

  const adultContribution = adult.total * 0.60;
  const foalContribution = foal.total * 0.40;
  const presentationBonus = (presentation.total / 20) * 5;

  let total = adultContribution + foalContribution + presentationBonus;

  const affected = horse.health_genes?.filter(h => h.status === 'affected') || [];
  total -= affected.length * 4;
  if (horse.doping_risk_until && new Date(horse.doping_risk_until) > new Date()) {
    total -= 3;
  }

  return {
    type: 'fct',
    adult,
    foal,
    presentation,
    adultContribution: clampScore(adultContribution),
    foalContribution: clampScore(foalContribution),
    presentationBonus: Math.round(presentationBonus * 10) / 10,
    total: clampScore(total),
    qualification: getQualification(clampScore(total)),
  };
}

export function getModeleAlluresScore(horse) {
  const breakdown = getModeleAlluresBreakdown(horse);
  return breakdown ? breakdown.total : 0;
}

export function isEligibleForModeleAllures(horse) {
  if (!horse) return false;
  const age = horse.age || 0;
  if (age > 4) return false;
  if (horse.studbook_registered === true) return true;
  if (horse.father_id && horse.mother_id) return true;
  return false;
}

export function getAgeClassLabel(age) {
  return AGE_CLASSES.find(a => a.age === age)?.label || `${age} ans`;
}