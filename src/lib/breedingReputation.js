// Système de réputation d'élevage centralisé

export const REPUTATION_TIERS = [
  { level: 1,  min: 0,       title: 'Inconnu',               color: 'text-stone-500',   bg: 'bg-stone-100',   border: 'border-stone-200',   icon: '🌱' },
  { level: 2,  min: 100,     title: 'Apprenti Éleveur',      color: 'text-green-600',   bg: 'bg-green-50',    border: 'border-green-200',   icon: '🌿' },
  { level: 3,  min: 300,     title: 'Éleveur Passionné',     color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: '🍀' },
  { level: 4,  min: 700,     title: 'Éleveur Confirmé',      color: 'text-teal-600',    bg: 'bg-teal-50',     border: 'border-teal-200',    icon: '🏡' },
  { level: 5,  min: 1500,    title: 'Éleveur Respecté',      color: 'text-cyan-600',    bg: 'bg-cyan-50',     border: 'border-cyan-200',    icon: '⭐' },
  { level: 6,  min: 3000,    title: 'Éleveur Réputé',        color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200',    icon: '🔵' },
  { level: 7,  min: 5500,    title: 'Éleveur Influent',      color: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-200',  icon: '💎' },
  { level: 8,  min: 9000,    title: 'Haras Renommé',         color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200',  icon: '🏆' },
  { level: 9,  min: 14000,   title: 'Haras Prestigieux',     color: 'text-purple-600',  bg: 'bg-purple-50',   border: 'border-purple-200',  icon: '👑' },
  { level: 10, min: 21000,   title: 'Maître Éleveur',        color: 'text-fuchsia-600', bg: 'bg-fuchsia-50',  border: 'border-fuchsia-200', icon: '🌟' },
  { level: 11, min: 30000,   title: 'Icône Régionale',       color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-200',    icon: '🌹' },
  { level: 12, min: 42000,   title: 'Icône Nationale',       color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     icon: '🎖️' },
  { level: 13, min: 58000,   title: 'Icône Internationale',  color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200',  icon: '🌍' },
  { level: 14, min: 80000,   title: 'Légende Vivante',       color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   icon: '🔥' },
  { level: 15, min: 110000,  title: 'Empire Équestre',       color: 'text-yellow-600',  bg: 'bg-yellow-50',   border: 'border-yellow-200',  icon: '⚜️' },
];

export function getTier(points) {
  return [...REPUTATION_TIERS].reverse().find(t => points >= t.min) || REPUTATION_TIERS[0];
}

export function getNextTier(points) {
  return REPUTATION_TIERS.find(t => t.min > points) || null;
}

// Niveau requis pour obtenir un nouvel affixe (niveau 1 = gratuit à la création)
// Puis tous les 5 niveaux (6, 11)
export function canUnlockNewAffixe(level, affixesCount) {
  // 1er affixe au niveau 1 (création du compte)
  // Ensuite : niveau 6, 11 = +1 à chaque fois
  const slots = 1 + Math.floor((level - 1) / 5);
  return affixesCount < slots;
}

export function maxAffixesForLevel(level) {
  return 1 + Math.floor((level - 1) / 5);
}

// Gains de réputation
export const REP_GAINS = {
  // Élevage
  FOAL_BORN: 5,
  FOAL_SUPERIOR_GENETICS: 15,   // génétique supérieure à la moyenne
  FOAL_STATS_67: 25,             // stats > 67
  FOAL_STATS_75: 75,             // stats > 75

  // Compétition
  COMPETITION_PARTICIPATION: 2,
  VICTORY_LOCAL: 10,
  VICTORY_REGIONAL: 25,
  VICTORY_NATIONAL: 50,
  VICTORY_INTERNATIONAL: 100,

  // Commerce
  HORSE_SOLD: 5,
  HORSE_SOLD_PREMIUM: 20,        // vente premium
  AUCTION_EXCEPTIONAL: 50,

  // Prestations
  BOARDING_MONTHLY: 1,
  TRANSPORT_SATISFIED: 2,
  BREEDING_CONTRACT: 10,

  // Bonus
  ANNIVERSARY_1_YEAR: 50,
  SPECIAL_SUCCESS_MIN: 25,
  SPECIAL_SUCCESS_MAX: 500,
  CHAMPION_BRED: 100,
};

/**
 * Calcule les gains de réputation à la naissance d'un poulain
 */
export function calcFoalBirthRepGain(foalStats) {
  let gain = REP_GAINS.FOAL_BORN;
  const avgStat = foalStats
    ? Math.round(Object.values(foalStats).reduce((a, b) => a + b, 0) / Object.keys(foalStats).length)
    : 0;

  if (avgStat > 75) {
    gain += REP_GAINS.FOAL_STATS_75;
  } else if (avgStat > 67) {
    gain += REP_GAINS.FOAL_STATS_67;
  } else if (avgStat > 50) {
    gain += REP_GAINS.FOAL_SUPERIOR_GENETICS;
  }

  return { gain, avgStat };
}