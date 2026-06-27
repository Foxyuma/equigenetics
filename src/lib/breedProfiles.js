/**
 * Profils de races : morphologie, restrictions de robe, prédispositions sportives
 * Utilisé par GeneticsEngine pour générer des chevaux réalistes
 */

export const BREED_PROFILES = {
  // === RACES DE COURSE ===
  "Arabian": {
    heightRange: [145, 160],
    type: "oriental",
    morphology: "tête fine et concave (profil camus), grands yeux, petites oreilles, encolure arquée, queue portée haute, silhouette élégante et sèche",
    greyFrequency: 0.20,
    statBonuses: { endurance: 12, temperament: 8, speed: 6 },
    statPenalties: { strength: -5, jumping: -3 },
    disciplines: ["endurance", "racing", "eventing"],
    disciplineBonus: { endurance: 18, cross_country: 8, racing: 20 },
  },

  "Thoroughbred": {
    heightRange: [160, 175],
    type: "racing",
    morphology: "grand cheval athlétique, corps long et fin, membres longs, poitrine profonde, musculature sèche, tête expressive",
    // Robes via coatValidation (bay fréquent, chestnut, black, grey rare)
    greyFrequency: 0.10,
    statBonuses: { speed: 15, endurance: 8 },
    statPenalties: { strength: -8, temperament: -5 },
    disciplines: ["racing", "eventing", "cross_country"],
    disciplineBonus: { racing: 25, cross_country: 12, eventing: 10 },
  },

  "Friesian": {
    heightRange: [155, 170],
    type: "baroque",
    morphology: "robe noire, longue crinière et queue abondantes, fanons aux membres, encolure puissante et arquée, allures relevées",
    forcedGenotype: { extension: "EE", agouti: "aa", grey: "gg", cream: "nn", champagne: "nn", dun: "dd", silver: "zz", tobiano: "nn", roan: "nn", sabino: "nn", splash: "nn", overo: "nn" },
    // Robe via coatValidation (noir uniquement)
    greyFrequency: 0,
    statBonuses: { dressage: 14, temperament: 10, strength: 8 },
    statPenalties: { speed: -8, endurance: -4 },
    disciplines: ["dressage", "driving", "vaulting"],
    disciplineBonus: { dressage: 18, driving: 15, vaulting: 12 },
  },

  "Haflinger": {
    heightRange: [138, 155],
    type: "mountain_pony",
    morphology: "petite taille, robe alezane avec crins lavés (blonds), corps compact, poitrine large, membres solides, expression douce",
    // Robe via coatValidation (alezan crins lavés)
    greyFrequency: 0,
    statBonuses: { strength: 10, endurance: 8, temperament: 8 },
    statPenalties: { speed: -6, jumping: -4 },
    disciplines: ["trail", "driving", "vaulting"],
    disciplineBonus: { trail: 12, driving: 10, vaulting: 8 },
  },

  "Quarter Horse": {
    heightRange: [145, 165],
    type: "western",
    morphology: "corps compact et très musclé, arrière-main extrêmement développée, poitrine large, tête courte, membres solides",
    // Robes via coatValidation (très varié : bai, alezan, palomino, isabelle, dun, souris, etc.)
    greyFrequency: 0.05,
    statBonuses: { speed: 8, agility: 12, strength: 10 },
    statPenalties: { dressage: -5, endurance: -4 },
    disciplines: ["reining", "barrel_racing", "western_pleasure"],
    disciplineBonus: { reining: 20, barrel_racing: 18, western_pleasure: 12 },
  },

  "Paint Horse": {
    heightRange: [145, 165],
    type: "western",
    morphology: "morphologie proche du Quarter Horse, musculature importante, robe pie (grandes taches blanches et colorées), silhouette compacte",
    // Paint = tobiano ou overo obligatoire
    forcedGenotype: { tobiano: "TOn" },
    greyFrequency: 0.03,
    statBonuses: { agility: 8, strength: 8, speed: 6 },
    statPenalties: { dressage: -4, endurance: -3 },
    disciplines: ["barrel_racing", "western_pleasure", "reining"],
    disciplineBonus: { barrel_racing: 14, western_pleasure: 10, reining: 12 },
  },

  "Appaloosa": {
    heightRange: [145, 165],
    type: "western",
    morphology: "robe tachetée caractéristique, peau marbrée, sclère blanche visible autour de l'œil, sabots souvent rayés, corps athlétique",
    // Appaloosa = pattern LP obligatoire (simulé par roan/tobiano)
    forcedGenotype: { roan: "RNn" },
    greyFrequency: 0.02,
    statBonuses: { endurance: 10, agility: 8 },
    statPenalties: { dressage: -5 },
    disciplines: ["trail", "western_pleasure", "barrel_racing"],
    disciplineBonus: { trail: 14, western_pleasure: 10, endurance: 8 },
  },

  "Selle Français": {
    heightRange: [158, 172],
    type: "warmblood_sport",
    morphology: "grand cheval sportif, silhouette harmonieuse, épaules inclinées, arrière-main puissante, membres solides, tête expressive",
    greyFrequency: 0.12,
    statBonuses: { jumping: 14, speed: 8, agility: 8 },
    statPenalties: { temperament: -4 },
    disciplines: ["show_jumping", "eventing", "cross_country"],
    disciplineBonus: { show_jumping: 18, eventing: 14, cross_country: 12 },
  },

  "KWPN": {
    heightRange: [160, 175],
    type: "warmblood_sport",
    morphology: "grand cheval moderne, silhouette élancée, longues jambes, dos solide, encolure bien attachée, musculature développée",
    greyFrequency: 0.15,
    statBonuses: { jumping: 12, dressage: 10, agility: 8 },
    statPenalties: {},
    disciplines: ["show_jumping", "dressage"],
    disciplineBonus: { show_jumping: 16, dressage: 14 },
  },

  "Hanoverian": {
    heightRange: [160, 175],
    type: "warmblood_sport",
    morphology: "cheval imposant, poitrine profonde, encolure puissante, dos solide, arrière-main très musclée, membres robustes",
    greyFrequency: 0.15,
    statBonuses: { dressage: 14, jumping: 10, temperament: 6 },
    statPenalties: { speed: -4 },
    disciplines: ["dressage", "show_jumping"],
    disciplineBonus: { dressage: 18, show_jumping: 12 },
  },

  "Holsteiner": {
    heightRange: [160, 173],
    type: "warmblood_sport",
    morphology: "grand cheval athlétique, épaules inclinées, dos relativement court, membres longs et puissants, poitrine profonde",
    greyFrequency: 0.12,
    statBonuses: { jumping: 16, strength: 8, agility: 6 },
    statPenalties: { endurance: -4 },
    disciplines: ["show_jumping"],
    disciplineBonus: { show_jumping: 20, eventing: 10 },
  },

  "Oldenburg": {
    heightRange: [162, 175],
    type: "warmblood_sport",
    morphology: "grande taille, corps massif mais élégant, encolure longue, arrière-main puissante, excellente musculature",
    greyFrequency: 0.14,
    statBonuses: { dressage: 12, jumping: 10, strength: 8 },
    statPenalties: { speed: -5 },
    disciplines: ["dressage", "show_jumping"],
    disciplineBonus: { dressage: 16, show_jumping: 14 },
  },

  "Belgian Warmblood": {
    heightRange: [158, 172],
    type: "warmblood_sport",
    morphology: "cheval sportif, silhouette équilibrée, dos solide, membres puissants, tête expressive, épaules bien inclinées",
    greyFrequency: 0.12,
    statBonuses: { jumping: 12, agility: 8, strength: 8 },
    statPenalties: {},
    disciplines: ["show_jumping", "eventing"],
    disciplineBonus: { show_jumping: 16, eventing: 12 },
  },

  "Anglo-Arabian": {
    heightRange: [155, 168],
    type: "sport",
    morphology: "morphologie intermédiaire entre Pur-sang et Arabe : élégant, sportif, tête raffinée, membres fins mais solides, poitrine développée",
    greyFrequency: 0.18,
    statBonuses: { speed: 10, endurance: 8, jumping: 6 },
    statPenalties: {},
    disciplines: ["eventing", "show_jumping", "endurance"],
    disciplineBonus: { eventing: 16, show_jumping: 10, endurance: 12 },
  },

  "Connemara": {
    heightRange: [130, 150],
    type: "pony_sport",
    morphology: "poney robuste et harmonieux, tête expressive, grands yeux, encolure musclée, poitrine profonde, membres solides avec articulations marquées, pieds très résistants",
    // Robes via coatValidation (gris, bai, isabelle, dun, souris, rouan)
    greyFrequency: 0.40,
    statBonuses: { jumping: 10, agility: 8, temperament: 10 },
    statPenalties: { speed: -4, strength: -6 },
    disciplines: ["show_jumping", "eventing"],
    disciplineBonus: { show_jumping: 12, eventing: 10 },
  },

  "Shire": {
    heightRange: [170, 195],
    type: "draft",
    morphology: "très grande taille, corps massif, fanons abondants aux jambes, encolure puissante, poitrine très large, membres imposants",
    // Robes via coatValidation (noir majoritaire, bai, gris rare)
    greyFrequency: 0.20,
    statBonuses: { strength: 20, endurance: 8 },
    statPenalties: { speed: -15, agility: -10, jumping: -12 },
    disciplines: ["driving"],
    disciplineBonus: { driving: 20 },
  },

  "Shetland": {
    heightRange: [80, 107],
    type: "miniature_pony",
    morphology: "très petit poney, corps trapu, encolure courte, poitrine large, membres courts et solides, crinière et queue épaisses",
    greyFrequency: 0.10,
    statBonuses: { temperament: 8, endurance: 6 },
    statPenalties: { speed: -8, jumping: -6, strength: -8 },
    disciplines: ["vaulting", "driving"],
    disciplineBonus: { vaulting: 8, driving: 6 },
  },

  "Lipizzaner": {
    heightRange: [148, 162],
    type: "baroque",
    morphology: "robe grise devenant blanche avec l'âge, tête noble, encolure musclée, dos court, arrière-main puissante, silhouette compacte",
    forcedGenotype: { grey: "Gg" }, // Quasi tous gris
    greyFrequency: 0.80,
    statBonuses: { dressage: 18, temperament: 12, strength: 6 },
    statPenalties: { speed: -8, endurance: -4 },
    disciplines: ["dressage", "vaulting"],
    disciplineBonus: { dressage: 22, vaulting: 14 },
  },
};

/**
 * Disciplines et leurs races prédisposées avec bonus de score
 */
export const DISCIPLINE_BREED_BONUSES = {
  racing:         { Arabian: 20, Thoroughbred: 25, "Anglo-Arabian": 12 },
  endurance:      { Arabian: 18, "Anglo-Arabian": 12, Thoroughbred: 8, Connemara: 6 },
  dressage:       { Friesian: 18, Hanoverian: 18, Lipizzaner: 22, KWPN: 14, Oldenburg: 16, "Belgian Warmblood": 10 },
  show_jumping:   { "Selle Français": 18, KWPN: 16, Holsteiner: 20, "Belgian Warmblood": 16, Oldenburg: 14, Connemara: 12 },
  cross_country:  { "Selle Français": 12, "Anglo-Arabian": 12, Thoroughbred: 12, Hanoverian: 8 },
  eventing:       { "Selle Français": 14, "Anglo-Arabian": 16, Thoroughbred: 10, KWPN: 10, Holsteiner: 8 },
  reining:        { "Quarter Horse": 20, "Paint Horse": 12 },
  barrel_racing:  { "Quarter Horse": 18, "Paint Horse": 14 },
  western_pleasure: { "Quarter Horse": 12, "Paint Horse": 10, Appaloosa: 10 },
  driving:        { Friesian: 15, Shire: 20, Haflinger: 10 },
  trail:          { Appaloosa: 14, Haflinger: 12, Arabian: 6 },
  vaulting:       { Lipizzaner: 14, Friesian: 12, Connemara: 8, Shetland: 8 },
  polo:           { Arabian: 8, Thoroughbred: 8, "Anglo-Arabian": 10 },
};

/**
 * Retourne le profil d'une race (ou un profil par défaut)
 */
export function getBreedProfile(breed) {
  return BREED_PROFILES[breed] || {
    heightRange: [148, 168],
    type: "generic",
    greyFrequency: 0.10,
    statBonuses: {},
    statPenalties: {},
    disciplines: [],
    disciplineBonus: {},
  };
}

/**
 * Applique les bonus/malus de stats d'une race à un objet stats
 */
export function applyBreedStatModifiers(stats, breed) {
  const profile = getBreedProfile(breed);
  const modified = { ...stats };
  Object.entries(profile.statBonuses || {}).forEach(([stat, bonus]) => {
    modified[stat] = Math.min(100, (modified[stat] || 0) + bonus);
  });
  Object.entries(profile.statPenalties || {}).forEach(([stat, penalty]) => {
    modified[stat] = Math.max(5, (modified[stat] || 0) + penalty);
  });
  return modified;
}

/**
 * Retourne le bonus de race pour une discipline donnée
 */
export function getBreedDisciplineBonus(breed, discipline) {
  return DISCIPLINE_BREED_BONUSES[discipline]?.[breed] || 0;
}