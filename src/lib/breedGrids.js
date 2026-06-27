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

// ─── Helpers pour construire les grilles ─────────────────────────────────
function cat(name, weight, criteria, scoring) {
  return { name, weight, criteria, scoring };
}
const morpho = (positive, negative) => ({ type: 'morpho', positive, negative });
const IMPRESSION = { type: 'impression' };
const CHIC = { type: 'chic' };

function grid(title, sections) {
  return { title, noteMax: 20, sections };
}

// ─── Configuration par race ─────────────────────────────────────────────
const BREED_GRID_CONFIG = {
  "Selle Français":     { type: 'warmblood_sport', typeLabel: 'Type Sport' },
  "KWPN":               { type: 'warmblood_sport', typeLabel: 'Type Sport' },
  "Hanoverian":         { type: 'warmblood_sport', typeLabel: 'Type Sport' },
  "Holsteiner":         { type: 'warmblood_sport', typeLabel: 'Type Sport' },
  "Oldenburg":         { type: 'warmblood_sport', typeLabel: 'Type Sport' },
  "Belgian Warmblood":  { type: 'warmblood_sport', typeLabel: 'Type Sport' },
  "Anglo-Arabian":      { type: 'warmblood_sport', typeLabel: 'Type Sport Polyvalent' },
  "Friesian":           { type: 'baroque',         typeLabel: 'Type Baroque' },
  "Lipizzaner":         { type: 'baroque',         typeLabel: 'Type Baroque' },
  "Quarter Horse":      { type: 'western',         typeLabel: 'Type Western' },
  "Paint Horse":        { type: 'western',         typeLabel: 'Type Western' },
  "Appaloosa":          { type: 'western',         typeLabel: 'Type Western' },
  "Thoroughbred":       { type: 'racing',          typeLabel: 'Type Course' },
  "Arabian":            { type: 'oriental',        typeLabel: 'Type Oriental' },
  "Connemara":          { type: 'pony_sport',      typeLabel: 'Type Poney Sport' },
  "Haflinger":          { type: 'mountain_pony',   typeLabel: 'Type Poney de Montagne' },
  "Shire":              { type: 'draft',            typeLabel: 'Type Trait' },
  "Shetland":           { type: 'miniature',        typeLabel: 'Type Poney Miniature' },
};

// ─── Templates par type morphologique ───────────────────────────────────
const TEMPLATES = {
  // Warmbloods de sport (SF, KWPN, Hanoverian, etc.) — grille type concours d'élevage
  warmblood_sport: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Attache de tête - Encolure", 0.10, ["Orientation", "Longueur", "Attaches"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Profil Avant: Épaule - Avant bras", 0.10, ["Longueur de l'épaule", "Orientation de l'épaule", "Tombe juste"], morpho('epaules_inclinees', 'epaules_droites')),
      cat("Garrot - Dos - Rein", 0.10, ["Longueur du garrot", "Tension du dos", "Attache du rein"], morpho('dos_court', 'dos_long')),
      cat("Croupe - Bassin - Cuisses", 0.10, ["Longueurs", "Orientation", "Largeur"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres", 0.10, ["Suivi des membres", "Articulations", "Pieds"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Antérieurs", 0.10, ["Rectitude", "Piste", "Fonctionnement"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Postérieurs", 0.10, ["Rectitude", "Piste", "Fonctionnement"], morpho('jarrets_puissants', 'jarrets_droits')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.20, ["Orientation générale", "Musculature", typeLabel], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic", 0.10, ["Présence - Expression", "Tissus", "Tête"], CHIC),
    ]},
  ]),

  // Baroques (Friesian, Lipizzaner) — présence, type, encolure, allures
  baroque: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Encolure - Attache de tête", 0.10, ["Encolure arquée", "Port de tête", "Attaches"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Garrot - Dos - Rein", 0.10, ["Tension du dos", "Ligne de dessus", "Attache du rein"], morpho('dos_court', 'dos_long')),
      cat("Croupe - Bassin - Cuisses", 0.10, ["Rondité", "Orientation", "Puissance"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres", 0.10, ["Articulations", "Tissus", "Pieds"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs", 0.10, ["Rectitude", "Piste", "Fonctionnement"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.35, ["Type Baroque", "Majesté", "Robe", "Allures"], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic & Présence", 0.15, ["Présence", "Expression", "Tête noble"], CHIC),
    ]},
  ]),

  // Western (Quarter Horse, Paint, Appaloosa) — arrière-main, musculature, cow sense
  western: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Encolure - Épaule", 0.05, ["Encolure", "Épaule", "Attache"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Garrot - Dos - Rein", 0.10, ["Dos court", "Rein puissant", "Ligne de dessus"], morpho('dos_court', 'dos_long')),
      cat("Arrière-main - Cuisse - Croupe", 0.20, ["Masse musculaire", "Largeur", "Proportion"], morpho('poitrine_large', 'poitrine_etroite')),
      cat("Poitrine - Côtés", 0.10, ["Largeur", "Profondeur", "Coffre"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres", 0.10, ["Suivi", "Articulations", "Pieds"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs", 0.10, ["Rectitude", "Piste", "Fonctionnement"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.25, ["Type Western", "Musculature", "Cow sense"], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic", 0.10, ["Présence", "Tissus", "Tête"], CHIC),
    ]},
  ]),

  // Course (Thoroughbred) — athlétique, sec, léger
  racing: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Attache de tête - Encolure", 0.10, ["Encolure longue", "Attache", "Gorge"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Épaule - Avant bras", 0.10, ["Épaule longue", "Inclinaison", "Bras"], morpho('epaules_inclinees', 'epaules_droites')),
      cat("Garrot - Dos - Rein", 0.10, ["Garrot sorti", "Dos tendu", "Rein"], morpho('dos_court', 'dos_long')),
      cat("Croupe - Cuisses", 0.10, ["Longueur", "Puissance", "Orientation"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres", 0.10, ["Sécheresse", "Articulations", "Tendons"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Antérieurs", 0.10, ["Rectitude", "Piste", "Action"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Postérieurs", 0.10, ["Rectitude", "Piste", "Action"], morpho('jarrets_puissants', 'jarrets_droits')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.20, ["Type Course", "Athlétisme", "Légèreté"], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic", 0.10, ["Présence", "Tissus", "Tête"], CHIC),
    ]},
  ]),

  // Oriental (Arabian) — tête, raffinement, endurance
  oriental: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Tête - Profil", 0.10, ["Profil concave", "Front large", "Naseaux"], CHIC),
      cat("Encolure - Attache", 0.05, ["Encolure longue", "Port haut", "Attache fine"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Garrot - Dos - Rein", 0.05, ["Garrot", "Dos", "Rein"], morpho('dos_court', 'dos_long')),
      cat("Croupe - Queue", 0.10, ["Croupe horizontale", "Port de queue", "Proportion"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres", 0.10, ["Sécheresse", "Tissus", "Pieds"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Antérieurs", 0.075, ["Rectitude", "Piste", "Action"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Postérieurs", 0.075, ["Rectitude", "Piste", "Action"], morpho('jarrets_puissants', 'jarrets_droits')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.25, ["Type Oriental", "Raffinement", "Endurance"], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic & Raffinement", 0.20, ["Tête (profil concave)", "Expression", "Robe"], CHIC),
    ]},
  ]),

  // Poney de sport (Connemara) — type poney, bone, caractère
  pony_sport: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Attache de tête - Encolure", 0.10, ["Encolure", "Attache", "Gorge"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Épaule - Poitrine", 0.10, ["Épaule", "Poitrine", "Profondeur"], morpho('epaules_inclinees', 'epaules_droites')),
      cat("Garrot - Dos - Rein", 0.10, ["Dos", "Rein", "Ligne"], morpho('dos_court', 'dos_long')),
      cat("Croupe - Cuisses", 0.10, ["Croupe", "Puissance", "Orientation"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres", 0.10, ["Bone", "Articulations", "Pieds"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Antérieurs", 0.075, ["Rectitude", "Piste", "Action"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Postérieurs", 0.075, ["Rectitude", "Piste", "Action"], morpho('jarrets_puissants', 'jarrets_droits')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.25, ["Type Poney", "Caractère", "Bone"], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic", 0.10, ["Présence", "Tissus", "Tête"], CHIC),
    ]},
  ]),

  // Poney de montagne (Haflinger) — robustesse, robe alezan crins lavés
  mountain_pony: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Encolure - Attache", 0.10, ["Encolure", "Port", "Attache"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Poitrine - Côtés", 0.10, ["Largeur", "Profondeur", "Coffre"], morpho('poitrine_large', 'poitrine_etroite')),
      cat("Garrot - Dos - Rein", 0.10, ["Dos solide", "Rein", "Ligne"], morpho('dos_court', 'dos_long')),
      cat("Croupe - Cuisses", 0.10, ["Croupe", "Puissance", "Proportion"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres", 0.10, ["Bone", "Articulations", "Pieds"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Antérieurs", 0.075, ["Rectitude", "Piste", "Action"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs - Postérieurs", 0.075, ["Rectitude", "Piste", "Action"], morpho('jarrets_puissants', 'jarrets_droits')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.25, ["Type Montagne", "Robe (alezan crins lavés)", "Solidité"], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic", 0.10, ["Présence", "Crins", "Tête"], CHIC),
    ]},
  ]),

  // Trait (Shire) — masse, puissance, fanons
  draft: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Encolure - Attache", 0.05, ["Encolure massive", "Port", "Attache"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Poitrine - Côtés", 0.15, ["Largeur", "Profondeur", "Coffre"], morpho('poitrine_large', 'poitrine_etroite')),
      cat("Garrot - Dos - Rein", 0.10, ["Dos solide", "Rein large", "Ligne"], morpho('dos_court', 'dos_long')),
      cat("Croupe - Cuisses", 0.15, ["Masse", "Largeur", "Puissance"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres & Fanons", 0.10, ["Bone", "Fanons", "Pieds"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs", 0.10, ["Rectitude", "Base large", "Fonctionnement"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.25, ["Type Trait", "Masse", "Puissance"], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic", 0.10, ["Présence", "Tissus", "Tête"], CHIC),
    ]},
  ]),

  // Poney miniature (Shetland) — proportions, caractère, type
  miniature: (breed, typeLabel) => grid(`Grille de Jugement — ${breed} 2023`, [
    { name: "Construction", categories: [
      cat("Tête - Expression", 0.10, ["Tête", "Expression", "Proportions"], CHIC),
      cat("Encolure - Corps", 0.10, ["Encolure", "Corps", "Attache"], morpho('encolure_arquee', 'encolure_ewe')),
      cat("Dos - Rein", 0.10, ["Dos", "Rein", "Ligne"], morpho('dos_court', 'dos_long')),
      cat("Croupe - Cuisses", 0.05, ["Croupe", "Proportion", "Puissance"], morpho('poitrine_large', 'poitrine_etroite')),
    ]},
    { name: "Membres et Aplombs", categories: [
      cat("Membres", 0.10, ["Bone", "Articulations", "Pieds"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
      cat("Aplombs", 0.10, ["Rectitude", "Piste", "Fonctionnement"], morpho('aplombs_parfaits', 'aplombs_defectueux')),
    ]},
    { name: "Impression d'Ensemble", categories: [
      cat("Impression d'Ensemble", 0.30, ["Type Poney Miniature", "Proportions", "Caractère"], IMPRESSION),
    ]},
    { name: "Chic", categories: [
      cat("Chic & Caractère", 0.15, ["Présence", "Expression", "Tête"], CHIC),
    ]},
  ]),
};

export function getBreedGrid(breed) {
  const config = BREED_GRID_CONFIG[breed];
  if (!config) return null;
  const template = TEMPLATES[config.type];
  return template ? template(breed, config.typeLabel) : null;
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