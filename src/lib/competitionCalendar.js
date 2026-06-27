// Calendrier des concours saisonniers
// Le jeu compte 8 mois/an avec 2 cycles de saisons :
//   Mois 1,5 = printemps | 2,6 = été | 3,7 = automne | 4,8 = hiver

export const SEASON_LABELS = {
  spring: 'Printemps',
  summer: 'Été',
  autumn: 'Automne',
  winter: 'Hiver',
};

// Concours d'étalons : 1 en automne + 1 en hiver
export const STALLION_COMPETITION_SEASONS = ['autumn', 'winter'];

// Concours de poulains : en "septembre" (= automne dans le calendrier du jeu)
export const FOAL_COMPETITION_SEASON = 'autumn';

export function isStallionCompetitionOpen(season) {
  return STALLION_COMPETITION_SEASONS.includes(season);
}

export function isFoalCompetitionOpen(season) {
  return season === FOAL_COMPETITION_SEASON;
}

export function getStallionCompetitionName(season) {
  return season === 'autumn'
    ? "Concours d'Étalons d'Automne"
    : "Concours d'Étalons d'Hiver";
}

export function getNextStallionSeason(season) {
  if (season === 'autumn' || season === 'winter') return null;
  return 'autumn';
}