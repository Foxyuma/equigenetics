// Daily tick: resolves competitions and auto-births due mares
// Runs once per day at 3:30 UTC (triggered by useGameClock)
import { base44 } from '@/api/base44Client';
import {
  getCompetitionScore,
  estimateHorseValue,
  generateFoalTraits,
} from '@/components/genetics/GeneticsEngine';
import { calcFoalBirthRepGain } from '@/lib/breedingReputation';

const FOAL_NAMES_MALE = ['Tornado', 'Eclipse', 'Sultan', 'Orage', 'Apollo', 'Zéphyr', 'Atlas', 'Titan', 'Merlin', 'Sirius'];
const FOAL_NAMES_FEMALE = ['Luna', 'Aurore', 'Perle', 'Tempête', 'Étoile', 'Jade', 'Iris', 'Stella', 'Naya', 'Olympe'];

const DOPING_CHECK_PROBABILITY = { novice: 0.05, intermediate: 0.10, advanced: 0.20, elite: 0.35, olympic: 0.60 };
const OLYMPIC_DISCIPLINES = ['dressage', 'show_jumping', 'cross_country', 'eventing'];
const LEVEL_ORDER = ['novice', 'intermediate', 'advanced', 'elite', 'olympic'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Resolve all pending competitions whose date has passed
async function resolvePendingCompetitions(userEmail) {
  const pending = await base44.entities.Competition.filter(
    { created_by: userEmail, status: 'registered' },
    '-created_date',
    50
  );
  const today = todayStr();
  const toResolve = pending.filter(
    (c) => c.discipline !== 'modele_allures' && c.competition_date && c.competition_date <= today
  );

  let repDelta = 0;

  for (const comp of toResolve) {
    const horse = await base44.entities.Horse.filter({ id: comp.horse_id }).then((r) => r[0]);
    if (!horse) continue;

    // Doping control
    const prob = DOPING_CHECK_PROBABILITY[comp.level] || 0.10;
    if (Math.random() <= prob) {
      const isDopingRisk = horse.doping_risk_until && new Date(horse.doping_risk_until) > new Date();
      if (isDopingRisk) {
        await base44.entities.Competition.update(comp.id, {
          score: 0,
          rank: null,
          status: 'completed',
          disqualified: true,
          disqualification_reason: 'Contrôle antidopage positif',
        });
        const repPenalty =
          comp.level === 'olympic' ? 100 : comp.level === 'elite' ? 60 : comp.level === 'advanced' ? 40 : 20;
        repDelta -= repPenalty;
        await base44.entities.Horse.update(horse.id, { energy: Math.max(0, (horse.energy || 100) - 10) });
        continue;
      }
    }

    const score = getCompetitionScore(horse, comp.discipline);
    const isOlympic = OLYMPIC_DISCIPLINES.includes(comp.discipline);
    const levelIdx = LEVEL_ORDER.indexOf(comp.level);
    const npcScores = Array.from({ length: 7 }, () =>
      Math.round((30 + Math.random() * 60 + levelIdx * 8) * 10) / 10
    );
    const allScores = [score, ...npcScores].sort((a, b) => b - a);
    const rank = allScores.indexOf(score) + 1;
    await base44.entities.Competition.update(comp.id, {
      score,
      rank,
      status: 'completed',
      disqualified: false,
    });

    if (rank <= 3) {
      await base44.entities.Horse.update(horse.id, {
        competition_wins: (horse.competition_wins || 0) + (rank === 1 ? 1 : 0),
        energy: Math.max(0, (horse.energy || 100) - 15),
      });
    } else {
      await base44.entities.Horse.update(horse.id, { energy: Math.max(0, (horse.energy || 100) - 10) });
    }

    if (rank === 1) repDelta += isOlympic ? 30 : 10;
  }

  return repDelta;
}

// Auto-birth mares whose gestation (11 months + 4 days) is complete
async function autoBirthMares(userEmail) {
  const pending = await base44.entities.BreedingRecord.filter(
    { created_by: userEmail, status: 'pending' },
    '-created_date',
    50
  );
  const today = todayStr();
  const due = pending.filter((b) => b.foal_due_date && b.foal_due_date <= today);

  let repDelta = 0;

  for (const record of due) {
    const mare = await base44.entities.Horse.filter({ id: record.mother_id }).then((r) => r[0]);
    if (!mare) continue;

    const foalTraits = generateFoalTraits(
      record.father_id ? { id: record.father_id } : null,
      mare,
      record.foal_breed
    );

    const names = record.foal_sex === 'male' ? FOAL_NAMES_MALE : FOAL_NAMES_FEMALE;
    const foalName = names[Math.floor(Math.random() * names.length)];

    const foalData = {
      name: foalName,
      genotype: record.foal_genotype,
      stats: record.foal_stats,
      health_genes: record.foal_health_genes,
      coat_color: record.foal_coat_color,
      sex: record.foal_sex,
      breed: record.foal_breed,
      father_id: record.father_id || null,
      mother_id: record.mother_id,
      age: 0,
      energy: 100,
      competition_wins: 0,
      is_for_sale: false,
      studbook_registered: false,
      character: foalTraits.character,
      mental_traits: foalTraits.mental_traits,
      morphology: foalTraits.morphology,
      genetic_potential: foalTraits.genetic_potential,
    };
    foalData.estimated_value = estimateHorseValue(foalData);

    const foal = await base44.entities.Horse.create(foalData);
    await base44.entities.BreedingRecord.update(record.id, {
      status: 'born',
      foal_id: foal.id,
      foal_name: foalName,
    });

    const { gain } = calcFoalBirthRepGain(foalData.stats);
    repDelta += gain;
  }

  return repDelta;
}

export async function runDailyTick(userEmail) {
  if (!userEmail) return { ran: false };
  try {
    const user = await base44.auth.me();
    const compRep = await resolvePendingCompetitions(userEmail);
    const birthRep = await autoBirthMares(userEmail);
    const totalRep = compRep + birthRep;
    if (totalRep !== 0) {
      await base44.auth.updateMe({
        breeding_reputation: Math.max(0, (user.breeding_reputation ?? 0) + totalRep),
      });
    }
    return { ran: true };
  } catch (e) {
    console.error('Daily tick error:', e);
    return { ran: false };
  }
}