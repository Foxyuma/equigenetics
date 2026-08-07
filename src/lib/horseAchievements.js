// Computes elite-stat achievement badges earned by a horse based on its
// genetic potential (the inherited ceiling — the breeding outcome).

const STAT_KEYS = ['speed', 'endurance', 'agility', 'strength', 'temperament', 'jumping', 'dressage'];

const STAT_LABELS = {
  speed: 'Speed',
  endurance: 'Endurance',
  agility: 'Agility',
  strength: 'Strength',
  temperament: 'Temperament',
  jumping: 'Jumping',
  dressage: 'Dressage',
};

const STAT_ICONS = {
  speed: 'Wind',
  endurance: 'Zap',
  agility: 'Activity',
  strength: 'Dumbbell',
  temperament: 'Brain',
  jumping: 'TrendingUp',
  dressage: 'Sparkles',
};

function totalPotential(horse) {
  const gp = horse.genetic_potential || {};
  return STAT_KEYS.reduce((sum, k) => sum + (gp[k] || 0), 0);
}

function hasAffectedDisease(horse) {
  return (horse.health_genes || []).some(g => g.status === 'affected');
}

/**
 * Returns an array of earned achievement badges for a horse.
 * Each badge: { id, label, description, tier, icon }
 * tier: 'gold' | 'silver' | 'bronze'
 */
export function computeAchievements(horse) {
  if (!horse) return [];
  const gp = horse.genetic_potential || {};
  const badges = [];

  // Per-stat elite badges (potential >= 90)
  STAT_KEYS.forEach(key => {
    const v = gp[key] || 0;
    if (v >= 90) {
      badges.push({
        id: `elite_${key}`,
        label: `Elite ${STAT_LABELS[key]}`,
        description: `${STAT_LABELS[key]} potential of ${v} — top-tier genetics.`,
        tier: v >= 95 ? 'gold' : 'silver',
        icon: STAT_ICONS[key],
      });
    }
  });

  // Prodigy: any single stat >= 95
  const maxStat = Math.max(...STAT_KEYS.map(k => gp[k] || 0));
  if (maxStat >= 95) {
    const bestKey = STAT_KEYS.find(k => (gp[k] || 0) === maxStat);
    badges.push({
      id: 'prodigy',
      label: 'Genetic Prodigy',
      description: `A single stat reaching ${maxStat} (${STAT_LABELS[bestKey]}) — a once-in-a-generation prospect.`,
      tier: 'gold',
      icon: 'Crown',
    });
  }

  // Champion Lineage: all stats potential >= 70
  const allAbove70 = STAT_KEYS.every(k => (gp[k] || 0) >= 70);
  if (allAbove70) {
    badges.push({
      id: 'champion_lineage',
      label: 'Champion Lineage',
      description: 'Every discipline carries a potential of 70 or higher.',
      tier: 'silver',
      icon: 'Trophy',
    });
  }

  // Genetic Masterpiece: total potential >= 600
  const total = totalPotential(horse);
  if (total >= 600) {
    badges.push({
      id: 'masterpiece',
      label: 'Genetic Masterpiece',
      description: `Total potential of ${total} points — a truly exceptional specimen.`,
      tier: 'gold',
      icon: 'Dna',
    });
  }

  // Perfect Prospect: high total + clean health
  if (total >= 560 && !hasAffectedDisease(horse)) {
    badges.push({
      id: 'perfect_prospect',
      label: 'Perfect Prospect',
      description: 'Outstanding potential with no active genetic disease — the ideal breeding outcome.',
      tier: 'gold',
      icon: 'Sparkles',
    });
  }

  // Iron Constitution: clean of all disease carriers/affected
  const allClear = (horse.health_genes || []).length > 0 && (horse.health_genes || []).every(g => g.status === 'clear');
  if (allClear) {
    badges.push({
      id: 'iron_constitution',
      label: 'Iron Constitution',
      description: 'Tested clear on every known genetic disease.',
      tier: 'bronze',
      icon: 'Shield',
    });
  }

  return badges;
}