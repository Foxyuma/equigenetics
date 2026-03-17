// Staff system configuration — roles, levels, bonuses, salaries

export const ROLE_CONFIG = {
  groom: {
    label: "Palefrenier",
    icon: "🧹",
    color: "from-green-400 to-emerald-500",
    bg: "bg-green-50",
    border: "border-green-200",
    textColor: "text-green-700",
    description: "S'occupe du bien-être quotidien des chevaux. Améliore la récupération d'énergie.",
    bonusDescription: "Récupération d'énergie +%",
  },
  vet: {
    label: "Vétérinaire",
    icon: "🩺",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    textColor: "text-blue-700",
    description: "Surveille la santé des chevaux. Réduit les risques de maladie.",
    bonusDescription: "Risque maladie -%",
  },
  trainer: {
    label: "Entraîneur",
    icon: "🏋️",
    color: "from-purple-400 to-violet-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    textColor: "text-purple-700",
    description: "Optimise les sessions d'entraînement. Améliore les gains de stats.",
    bonusDescription: "Succès entraînement +%",
  },
  manager: {
    label: "Manager",
    icon: "📋",
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    textColor: "text-amber-700",
    description: "Gère les opérations de l'écurie. Améliore les performances en compétition.",
    bonusDescription: "Score compétition +%",
  },
};

export const LEVEL_CONFIG = {
  junior: { label: "Junior", multiplier: 1, salaryBase: 200, stars: 1 },
  senior: { label: "Senior", multiplier: 1.5, salaryBase: 400, stars: 2 },
  expert: { label: "Expert", multiplier: 2.5, salaryBase: 700, stars: 3 },
};

export const SPECIALITIES = {
  groom: [
    { id: "energy_master", label: "Maître récupération", bonus: { energy_recovery_bonus: 8 } },
    { id: "morale_boost", label: "Booste moral", bonus: { energy_recovery_bonus: 4 } },
    { id: "foal_care", label: "Spécialiste poulains", bonus: { breeding_success_bonus: 5 } },
  ],
  vet: [
    { id: "disease_prevention", label: "Prévention maladies", bonus: { illness_risk_reduction: 20 } },
    { id: "genetic_specialist", label: "Spécialiste génétique", bonus: { illness_risk_reduction: 10, breeding_success_bonus: 8 } },
    { id: "emergency_care", label: "Soins urgents", bonus: { illness_risk_reduction: 15 } },
  ],
  trainer: [
    { id: "speed_coach", label: "Coach vitesse", bonus: { training_success_bonus: 15, competition_score_bonus: 3 } },
    { id: "endurance_coach", label: "Coach endurance", bonus: { training_success_bonus: 10 } },
    { id: "competition_prep", label: "Prép. compétition", bonus: { competition_score_bonus: 7 } },
  ],
  manager: [
    { id: "race_strategist", label: "Stratège course", bonus: { competition_score_bonus: 10 } },
    { id: "talent_scout", label: "Talent scout", bonus: { breeding_success_bonus: 10, competition_score_bonus: 5 } },
    { id: "wellness_director", label: "Directeur bien-être", bonus: { energy_recovery_bonus: 5, illness_risk_reduction: 10 } },
  ],
};

export function getStaffBonuses(staffList) {
  const totals = {
    energy_recovery_bonus: 0,
    illness_risk_reduction: 0,
    training_success_bonus: 0,
    breeding_success_bonus: 0,
    competition_score_bonus: 0,
  };
  (staffList || []).filter(s => s.is_active).forEach(s => {
    if (!s.bonuses) return;
    Object.keys(totals).forEach(key => {
      totals[key] += s.bonuses[key] || 0;
    });
  });
  return totals;
}

export function buildStaffMember(role, level, specialityId) {
  const levelCfg = LEVEL_CONFIG[level];
  const spec = SPECIALITIES[role]?.find(s => s.id === specialityId) || SPECIALITIES[role]?.[0];
  const baseBonus = { energy_recovery_bonus: 0, illness_risk_reduction: 0, training_success_bonus: 0, breeding_success_bonus: 0, competition_score_bonus: 0 };
  const bonus = { ...baseBonus, ...spec?.bonus };

  // Scale bonus by level
  Object.keys(bonus).forEach(k => { bonus[k] = Math.round(bonus[k] * levelCfg.multiplier); });

  return {
    bonuses: bonus,
    speciality: spec?.id || '',
    salary: levelCfg.salaryBase,
    hired_at: new Date().toISOString(),
    last_paid_at: new Date().toISOString(),
    is_active: true,
    morale: 100,
    level,
    role,
  };
}