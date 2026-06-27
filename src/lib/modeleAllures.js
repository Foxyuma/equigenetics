import { getBreedProfile } from './breedProfiles';

export const POSITIVE_MORPHO = [
  'epaules_inclinees', 'dos_court', 'jarrets_puissants',
  'encolure_arquee', 'poitrine_large', 'aplombs_parfaits',
];
export const NEGATIVE_MORPHO = [
  'epaules_droites', 'dos_long', 'jarrets_droits',
  'encolure_ewe', 'poitrine_etroite', 'aplombs_defectueux',
];

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

export function getModeleAlluresScore(horse) {
  if (!horse) return 0;
  const morphology = horse.morphology || [];
  const potential = horse.genetic_potential || {};
  const stats = horse.stats || {};

  // 1. Model (40%) — morphology traits
  let modelScore = 50;
  morphology.forEach((trait) => {
    if (POSITIVE_MORPHO.includes(trait)) modelScore += 8;
    else if (NEGATIVE_MORPHO.includes(trait)) modelScore -= 6;
  });
  modelScore = Math.max(0, Math.min(100, modelScore));

  // 2. Allures (30%) — genetic potential (inherent quality, not training)
  const dressagePot = potential.dressage || stats.dressage || 30;
  const temperamentPot = potential.temperament || stats.temperament || 30;
  const alluresScore = dressagePot * 0.5 + temperamentPot * 0.5;

  // 3. Breed type/conformity (20%)
  let conformityScore = 65;
  const profile = getBreedProfile(horse.breed);
  if (profile?.forbiddenCoats) {
    const coatLower = (horse.coat_color || '').toLowerCase();
    if (profile.forbiddenCoats.some((fc) => coatLower.includes(fc.toLowerCase()))) {
      conformityScore -= 15;
    }
  }
  conformityScore = Math.max(0, Math.min(100, conformityScore));

  // 4. Presentation (10%) — coat rarity
  const presentationScore = Math.min(100, 50 + getCoatBonus(horse.coat_color));

  let score =
    modelScore * 0.40 +
    alluresScore * 0.30 +
    conformityScore * 0.20 +
    presentationScore * 0.10;

  // Penalties
  const affected = horse.health_genes?.filter((h) => h.status === 'affected') || [];
  score -= affected.length * 5;
  if (horse.doping_risk_until && new Date(horse.doping_risk_until) > new Date()) {
    score -= 3;
  }

  // Small random variance (judged competition)
  score += (Math.random() - 0.5) * 6;

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
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
  return AGE_CLASSES.find((a) => a.age === age)?.label || `${age} ans`;
}