import { getBreedProfile } from './breedProfiles';

export const POSITIVE_MORPHO = [
  'epaules_inclinees', 'dos_court', 'jarrets_puissants',
  'encolure_arquee', 'poitrine_large', 'aplombs_parfaits',
];
export const NEGATIVE_MORPHO = [
  'epaules_droites', 'dos_long', 'jarrets_droits',
  'encolure_ewe', 'poitrine_etroite', 'aplombs_defectueux',
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

export function getQualification(score) {
  if (score >= 70) return { label: 'Qualifié Excellent', badgeClass: 'bg-emerald-50 text-emerald-700' };
  if (score >= 60) return { label: 'Qualifié Bon', badgeClass: 'bg-blue-50 text-blue-700' };
  if (score >= 50) return { label: 'Qualifié', badgeClass: 'bg-amber-50 text-amber-700' };
  return { label: 'Ajourné', badgeClass: 'bg-red-50 text-red-700' };
}

// ─── Selle Français 2023 ──────────────────────────────────────────────────
export const BREED_GRIDS = {
  "Selle Français": {
    title: "Grille de Jugement — Selle Français 2023",
    noteMax: 20,
    sections: [
      {
        name: "Construction",
        categories: [
          {
            name: "Attache de tête - Encolure",
            weight: 0.10,
            criteria: ["Orientation", "Longueur", "Attaches"],
            scoring: { type: "morpho", positive: "encolure_arquee", negative: "encolure_ewe" },
          },
          {
            name: "Profil Avant: Épaule - Avant bras",
            weight: 0.10,
            criteria: ["Longueur de l'épaule", "Orientation de l'épaule", "Tombe juste"],
            scoring: { type: "morpho", positive: "epaules_inclinees", negative: "epaules_droites" },
          },
          {
            name: "Garrot - Dos - Rein",
            weight: 0.10,
            criteria: ["Longueur du garrot", "Tension du dos", "Attache du rein"],
            scoring: { type: "morpho", positive: "dos_court", negative: "dos_long" },
          },
          {
            name: "Croupe - Bassin - Cuisses",
            weight: 0.10,
            criteria: ["Longueurs", "Orientation", "Largeur"],
            scoring: { type: "morpho", positive: "poitrine_large", negative: "poitrine_etroite" },
          },
        ],
      },
      {
        name: "Membres et Aplombs",
        categories: [
          {
            name: "Membres",
            weight: 0.10,
            criteria: ["Suivi des membres", "Articulations", "Pieds"],
            scoring: { type: "morpho", positive: "aplombs_parfaits", negative: "aplombs_defectueux" },
          },
          {
            name: "Aplombs - Antérieurs",
            weight: 0.10,
            criteria: ["Rectitude", "Piste", "Fonctionnement"],
            scoring: { type: "morpho", positive: "aplombs_parfaits", negative: "aplombs_defectueux" },
          },
          {
            name: "Aplombs - Postérieurs",
            weight: 0.10,
            criteria: ["Rectitude", "Piste", "Fonctionnement"],
            scoring: { type: "morpho", positive: "jarrets_puissants", negative: "jarrets_droits" },
          },
        ],
      },
      {
        name: "Impression d'Ensemble",
        categories: [
          {
            name: "Impression d'Ensemble",
            weight: 0.20,
            criteria: ["Orientation générale", "Musculature", "Type Sport"],
            scoring: { type: "impression" },
          },
        ],
      },
      {
        name: "Chic",
        categories: [
          {
            name: "Chic",
            weight: 0.10,
            criteria: ["Présence - Expression", "Tissus", "Tête"],
            scoring: { type: "chic" },
          },
        ],
      },
    ],
  },
};

export function getBreedGrid(breed) {
  return BREED_GRIDS[breed] || null;
}

// ─── Scoring ───────────────────────────────────────────────────────────
function scoreCriterion(scoring, horse, noteMax) {
  const morphology = horse.morphology || [];
  const stats = horse.stats || {};
  const potential = horse.genetic_potential || {};
  let score;

  switch (scoring.type) {
    case 'morpho': {
      score = noteMax * 0.55;
      if (morphology.includes(scoring.positive)) score += noteMax * 0.28;
      else if (morphology.includes(scoring.negative)) score -= noteMax * 0.28;
      break;
    }
    case 'stat': {
      const val = stats[scoring.stat] ?? 30;
      score = noteMax * 0.2 + (val / 100) * noteMax * 0.72;
      break;
    }
    case 'impression': {
      score = noteMax * 0.5;
      const profile = getBreedProfile(horse.breed);
      if (profile?.forbiddenCoats) {
        const coatLower = (horse.coat_color || '').toLowerCase();
        if (profile.forbiddenCoats.some(fc => coatLower.includes(fc.toLowerCase()))) {
          score -= noteMax * 0.15;
        }
      }
      score += getCoatBonus(horse.coat_color) * 0.3;
      const allStats = Object.values(stats).filter(v => typeof v === 'number');
      const avg = allStats.length ? allStats.reduce((a, b) => a + b, 0) / allStats.length : 40;
      score += (avg - 40) * 0.06;
      break;
    }
    case 'chic': {
      score = noteMax * 0.45;
      score += (stats.temperament ?? 30) * 0.04;
      score += getCoatBonus(horse.coat_color) * 0.4;
      score += ((horse.energy ?? 100) - 50) * 0.03;
      break;
    }
    default:
      score = noteMax * 0.5;
  }

  score += (Math.random() - 0.5) * (noteMax * 0.15);
  return Math.max(1, Math.min(noteMax, Math.round(score * 10) / 10));
}

export function scoreBreedGrid(horse, grid) {
  if (!horse || !grid) return null;
  const noteMax = grid.noteMax || 20;

  const sections = grid.sections.map(section => {
    const categories = section.categories.map(cat => {
      const criteriaScores = cat.criteria.map(criterion => ({
        name: criterion,
        score: scoreCriterion(cat.scoring, horse, noteMax),
      }));
      const avgScore = criteriaScores.reduce((sum, c) => sum + c.score, 0) / criteriaScores.length;
      return {
        name: cat.name,
        weight: cat.weight,
        criteria: criteriaScores,
        score: Math.round(avgScore * 10) / 10,
      };
    });
    return { name: section.name, categories };
  });

  let total = 0;
  sections.forEach(section => {
    section.categories.forEach(cat => {
      total += (cat.score / noteMax) * 100 * cat.weight;
    });
  });

  const affected = horse.health_genes?.filter(h => h.status === 'affected') || [];
  total -= affected.length * 4;
  if (horse.doping_risk_until && new Date(horse.doping_risk_until) > new Date()) {
    total -= 3;
  }

  total = Math.max(0, Math.min(100, Math.round(total * 10) / 10));

  return {
    type: 'breed_grid',
    grid,
    sections,
    noteMax,
    total,
    qualification: getQualification(total),
  };
}