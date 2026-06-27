// Définition de tous les types d'entraînements avec leurs effets multi-compétences

export const FOAL_TRAININGS = [
  {
    id: 'manipulation',
    label: 'Handling',
    icon: '🤲',
    description: 'Accustom the foal to human contact',
    energyCost: 20,
    mentalCost: 10,
    foalSkill: 'manipulation',
    statGains: { temperament: [2, 5] },
    sideEffects: [],
  },
  {
    id: 'desensibilisation',
    label: 'Desensitization',
    icon: '🎭',
    description: 'Accustom the foal to external stimuli',
    energyCost: 20,
    mentalCost: 15,
    foalSkill: 'desensibilisation',
    statGains: { temperament: [2, 4], agility: [1, 3] },
    sideEffects: ['légère nervosité'],
  },
  {
    id: 'embarquement',
    label: 'Trailer loading',
    icon: '🚛',
    description: 'Learning the trailer and stall',
    energyCost: 20,
    mentalCost: 20,
    foalSkill: 'embarquement',
    statGains: { temperament: [2, 5] },
    sideEffects: ['stress possible'],
  },
];

export const ADULT_TRAININGS = [
  {
    id: 'longe',
    label: 'Lunge work',
    icon: '🔄',
    description: 'Muscle building, dressage, trot',
    energyCost: 20,
    mentalCost: 10,
    statGains: { strength: [2, 6], dressage: [2, 5], speed: [1, 4] },
    synergies: ['dressage'],
    sideEffects: ['fatigue musculaire légère'],
  },
  {
    id: 'liberte',
    label: 'Liberty work',
    icon: '🌿',
    description: 'Confidence, obedience, mental',
    energyCost: 15,
    mentalCost: 5,
    statGains: { temperament: [3, 7], agility: [2, 5] },
    synergies: [],
    sideEffects: [],
  },
  {
    id: 'desensibilisation_adulte',
    label: 'Désensibilisation',
    icon: '🎭',
    description: 'Mental, confiance, gestion du stress',
    energyCost: 10,
    mentalCost: 5,
    statGains: { temperament: [3, 8], agility: [1, 3] },
    synergies: [],
    sideEffects: [],
  },
  {
    id: 'dressage',
    label: 'Dressage',
    icon: '🎪',
    description: 'Dressage, flexibility, endurance',
    energyCost: 25,
    mentalCost: 20,
    statGains: { dressage: [3, 8], agility: [2, 5], endurance: [1, 4] },
    synergies: ['longe'],
    sideEffects: ['concentration intensive'],
  },
  {
    id: 'barres_sol',
    label: 'Ground poles',
    icon: '➖',
    description: 'Trot, balance, jumping basics',
    energyCost: 20,
    mentalCost: 10,
    statGains: { speed: [2, 6], agility: [2, 5], jumping: [1, 4] },
    synergies: ['dressage', 'gym_obstacle'],
    sideEffects: [],
  },
  {
    id: 'gym_obstacle',
    label: 'Jump gymnastics',
    icon: '🏗️',
    description: 'Jumping, coordination, dressage',
    energyCost: 30,
    mentalCost: 15,
    statGains: { jumping: [3, 8], agility: [2, 6], dressage: [1, 4] },
    synergies: ['barres_sol'],
    sideEffects: ['risque blessure légère'],
  },
  {
    id: 'balade',
    label: 'Active trail',
    icon: '🌄',
    description: 'Morale, endurance, stress reduction',
    energyCost: 15,
    mentalCost: -15,
    statGains: { temperament: [2, 5], endurance: [2, 6] },
    synergies: [],
    sideEffects: [],
  },
  {
    id: 'trotting',
    label: 'Trotting',
    icon: '🏃',
    description: 'Endurance, trot, muscle building',
    energyCost: 25,
    mentalCost: 10,
    statGains: { endurance: [3, 7], speed: [2, 5], strength: [1, 4] },
    synergies: ['cross'],
    sideEffects: ['fatigue physique'],
  },
  {
    id: 'galop_terrain',
    label: 'Varied terrain gallop',
    icon: '⛰️',
    description: 'Gallop, breath, balance',
    energyCost: 35,
    mentalCost: 15,
    statGains: { speed: [3, 8], endurance: [2, 6], agility: [2, 5] },
    synergies: [],
    sideEffects: ['fatigue élevée'],
  },
  {
    id: 'parcours_obstacles',
    label: 'Obstacle course',
    icon: '🏇',
    description: 'Jumping, reactivity, competition mental',
    energyCost: 30,
    mentalCost: 25,
    statGains: { jumping: [3, 8], agility: [2, 6], temperament: [1, 4] },
    synergies: ['gym_obstacle'],
    sideEffects: ['stress compétitif'],
  },
  {
    id: 'cross',
    label: 'Cross-country',
    icon: '🌲',
    description: 'Endurance, courage, gallop — high fatigue',
    energyCost: 40,
    mentalCost: 20,
    statGains: { endurance: [4, 8], speed: [3, 7], temperament: [1, 4] },
    synergies: ['trotting'],
    sideEffects: ['fatigue élevée', 'risque blessure'],
  },
  {
    id: 'marche_main',
    label: 'Hand walking',
    icon: '🦶',
    description: 'Recovery, confidence, stress reduction',
    energyCost: 5,
    mentalCost: -10,
    statGains: { temperament: [2, 5] },
    synergies: [],
    sideEffects: [],
  },
  {
    id: 'spa',
    label: 'Spa / Recovery',
    icon: '🛁',
    description: 'Physical recovery, injury prevention',
    energyCost: -20,
    mentalCost: -20,
    statGains: {},
    isRecovery: true,
    synergies: [],
    sideEffects: [],
  },
];

// Synergies bonus : si le cheval a été entraîné avec ces deux types récemment
export const SYNERGY_BONUSES = {
  'barres_sol+dressage': { stat: 'agility', bonus: 2,   label: 'Poles + Dressage = improved balance' },
  'trotting+cross': { stat: 'endurance', bonus: 3,   label: 'Trotting + Cross = endurance bonus' },
  'gym_obstacle+barres_sol': { stat: 'jumping', bonus: 2,   label: 'Gym + Poles = better jumping' },
};

// Modificateurs selon le caractère du cheval
export const CHARACTER_MODIFIERS = {
  energique: { energyCostMult: 0.9, mentalCostMult: 0.8, statBonusMult: 1.1, label: '⚡ Energetic' },
  anxieux: { energyCostMult: 1.0, mentalCostMult: 1.3, statBonusMult: 0.9, label: '😰 Anxious' },
  intelligent: { energyCostMult: 0.95, mentalCostMult: 0.85, statBonusMult: 1.15, label: '🧠 Intelligent' },
  paresseux: { energyCostMult: 1.1, mentalCostMult: 1.0, statBonusMult: 0.85, label: '😴 Lazy' },
  courageux: { energyCostMult: 1.0, mentalCostMult: 0.9, statBonusMult: 1.1, label: '🦁 Courageous' },
  docile: { energyCostMult: 0.95, mentalCostMult: 0.95, statBonusMult: 1.0, label: '🕊️ Docile' },
};

// Calcule les gains réels en tenant compte du caractère et des synergies
export function computeTrainingResult(training, horse, recentTrainingTypes = []) {
  const charMod = CHARACTER_MODIFIERS[horse.character] || { energyCostMult: 1, mentalCostMult: 1, statBonusMult: 1 };
  
  const physCost = Math.max(0, Math.round((training.energyCost || 0) * charMod.energyCostMult));
  const mentalCost = Math.round((training.mentalCost || 0) * charMod.mentalCostMult);
  
  // Calcul des gains par stat — entre min et max, modulé par le caractère
  const statsGained = {};
  let totalGain = 0;
  
  for (const [stat, range] of Object.entries(training.statGains || {})) {
    if (!range || range.length < 2) continue;
    const [min, max] = range;
    const base = min + Math.floor(Math.random() * (max - min + 1));
    const gain = Math.max(2, Math.round(base * charMod.statBonusMult));
    const current = horse.stats?.[stat] || 0;
    if (current < 100) {
      statsGained[stat] = Math.min(gain, 100 - current);
      totalGain += statsGained[stat];
    }
  }

  // Bonus synergie
  let synergyBonus = null;
  for (const [key, bonus] of Object.entries(SYNERGY_BONUSES)) {
    const parts = key.split('+');
    if (parts.includes(training.id) && parts.some(p => recentTrainingTypes.includes(p))) {
      if (statsGained[bonus.stat] !== undefined) {
        statsGained[bonus.stat] += bonus.bonus;
        totalGain += bonus.bonus;
      }
      synergyBonus = bonus.label;
    }
  }

  // Effets secondaires aléatoires
  const sideEffects = [];
  for (const effect of training.sideEffects || []) {
    if (Math.random() < 0.3) sideEffects.push(effect);
  }

  return {
    statsGained,
    totalGain,
    physCost,
    mentalCost,
    sideEffects,
    synergyBonus,
    success: true,
  };
}

// Calcule les gains pour une séance poulain
export function computeFoalTrainingResult(training, horse) {
  const skill = training.foalSkill;
  const current = horse.foal_training_completed?.[skill] || 0;
  const maxFoalSkill = 50;
  
  const statsGained = {};
  for (const [stat, range] of Object.entries(training.statGains || {})) {
    const [min, max] = range;
    const gain = min + Math.floor(Math.random() * (max - min + 1));
    const current = horse.stats?.[stat] || 0;
    if (current < 100) statsGained[stat] = Math.min(gain, 100 - current);
  }

  // Gain sur la compétence poulain (0-50)
  const foalSkillGain = 5 + Math.floor(Math.random() * 6); // 5 à 10 points
  const newSkillValue = Math.min(maxFoalSkill, current + foalSkillGain);

  return {
    statsGained,
    totalGain: Object.values(statsGained).reduce((a, b) => a + b, 0),
    physCost: training.energyCost,
    mentalCost: training.mentalCost || 0,
    foalSkillGain,
    foalSkill: skill,
    newSkillValue,
    sideEffects: training.sideEffects || [],
    success: true,
  };
}