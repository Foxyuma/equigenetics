// Daily tick — runs at 3:30 UTC regardless of online status.
// Advances the shared game clock and processes pending events for all players.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCIPLINE_WEIGHTS = {
  dressage: { dressage: 0.4, temperament: 0.3, agility: 0.2, strength: 0.1 },
  show_jumping: { jumping: 0.4, agility: 0.25, speed: 0.2, strength: 0.15 },
  cross_country: { endurance: 0.3, jumping: 0.25, speed: 0.25, agility: 0.2 },
  endurance: { endurance: 0.5, speed: 0.2, strength: 0.2, temperament: 0.1 },
  reining: { agility: 0.35, temperament: 0.3, speed: 0.2, dressage: 0.15 },
  barrel_racing: { speed: 0.4, agility: 0.35, temperament: 0.15, endurance: 0.1 },
  polo: { speed: 0.3, agility: 0.3, temperament: 0.2, endurance: 0.2 },
  eventing: { jumping: 0.25, dressage: 0.25, endurance: 0.25, speed: 0.25 },
  vaulting: { temperament: 0.4, dressage: 0.3, strength: 0.2, agility: 0.1 },
  driving: { temperament: 0.3, endurance: 0.3, strength: 0.25, dressage: 0.15 },
  trail: { temperament: 0.35, endurance: 0.3, agility: 0.2, speed: 0.15 },
  western_pleasure: { temperament: 0.4, dressage: 0.3, agility: 0.2, speed: 0.1 },
  racing: { speed: 0.5, endurance: 0.3, agility: 0.2 },
};

function getCompetitionScore(horse, discipline) {
  if (!horse?.stats) return 0;
  const w = DISCIPLINE_WEIGHTS[discipline] || DISCIPLINE_WEIGHTS.dressage;
  let score = 0;
  for (const [stat, weight] of Object.entries(w)) {
    score += (horse.stats[stat] || 20) * weight;
  }
  const affected = (horse.health_genes || []).filter((h) => h.status === 'affected').length;
  score -= affected * 8;
  score += (Math.random() - 0.5) * 12;
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ---- Read & advance the shared GameClock ----
    const clocks = await base44.asServiceRole.entities.GameClock.list();
    let clock = clocks?.[0];
    const DAYS_PER_MONTH = 14;
    const MONTHS_PER_YEAR = 8;

    function getSeason(month) {
      const m = ((month - 1) % 4) + 1;
      return m <= 1 ? 'spring' : m <= 2 ? 'summer' : m <= 3 ? 'autumn' : 'winter';
    }

    const now = new Date();
    const todayThreshold = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3, 30, 0));
    if (now.getTime() < todayThreshold.getTime()) {
      todayThreshold.setUTCDate(todayThreshold.getUTCDate() - 1);
    }

    let daysToAdvance = 1;
    if (clock?.last_tick_real) {
      const last = new Date(clock.last_tick_real);
      if (last.getTime() >= todayThreshold.getTime()) {
        return new Response(JSON.stringify({ ok: true, ran: false, reason: 'already_advanced_today' }), { status: 200 });
      }
      const lastThreshold = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate(), 3, 30, 0));
      if (last.getTime() < lastThreshold.getTime()) {
        lastThreshold.setUTCDate(lastThreshold.getUTCDate() - 1);
      }
      daysToAdvance = Math.max(1, Math.round((todayThreshold.getTime() - lastThreshold.getTime()) / (24 * 60 * 60 * 1000)));
    }

    let newDay = clock?.day ?? 1;
    let newMonth = clock?.month ?? 1;
    let newYear = clock?.year ?? 1;
    let totalDays = clock?.total_days ?? 0;

    for (let i = 0; i < daysToAdvance; i++) {
      newDay += 1;
      totalDays += 1;
      if (newDay > DAYS_PER_MONTH) {
        newDay = 1;
        newMonth += 1;
        if (newMonth > MONTHS_PER_YEAR) {
          newMonth = 1;
          newYear += 1;
        }
      }
    }

    const nextSeason = getSeason(newMonth);
    const clockPayload = {
      day: newDay,
      month: newMonth,
      year: newYear,
      total_days: totalDays,
      last_tick_real: now.toISOString(),
      season: nextSeason,
    };

    if (clock?.id) {
      await base44.asServiceRole.entities.GameClock.update(clock.id, clockPayload);
    } else {
      await base44.asServiceRole.entities.GameClock.create(clockPayload);
    }

    // ---- Collect all active players ----
    const players = await base44.asServiceRole.entities.User.list('email', 200);
    let ticked = 0;

    for (const player of players || []) {
      const email = player.email;
      if (!email) continue;
      const user = player;
      let dayRepDelta = 0;

      // Resolve pending competitions
      const pending = await base44.asServiceRole.entities.Competition.filter(
        { created_by: email, status: 'registered' },
        '-created_date',
        50
      );
      const today = now.toISOString().split('T')[0];
      const levels = ['novice', 'intermediate', 'advanced', 'elite', 'olympic'];
      const olympicD = ['dressage', 'show_jumping', 'cross_country', 'eventing'];
      const dopingProb = { novice: 0.05, intermediate: 0.10, advanced: 0.20, elite: 0.35, olympic: 0.60 };

      for (const comp of pending || []) {
        if (comp.discipline === 'modele_allures' || !comp.competition_date || comp.competition_date > today) continue;
        const horse = (await base44.asServiceRole.entities.Horse.filter({ id: comp.horse_id }))?.[0];
        if (!horse) continue;

        // Doping
        const prob = dopingProb[comp.level] || 0.10;
        if (Math.random() <= prob && horse.doping_risk_until && new Date(horse.doping_risk_until) > now) {
          await base44.asServiceRole.entities.Competition.update(comp.id, {
            score: 0,
            rank: null,
            status: 'completed',
            disqualified: true,
            disqualification_reason: 'Contrôle antidopage positif',
          });
          const pn = comp.level === 'olympic' ? 100 : comp.level === 'elite' ? 60 : comp.level === 'advanced' ? 40 : 20;
          dayRepDelta -= pn;
          await base44.asServiceRole.entities.Horse.update(horse.id, { energy: Math.max(0, (horse.energy || 100) - 10) });
          continue;
        }

        // Score & rank
        const score = getCompetitionScore(horse, comp.discipline);
        const levelIdx = levels.indexOf(comp.level);
        const npc = Array.from({ length: 7 }, () => Math.round((30 + Math.random() * 60 + levelIdx * 8) * 10) / 10);
        const allScores = [score, ...npc].sort((a, b) => b - a);
        const rank = allScores.indexOf(score) + 1;
        await base44.asServiceRole.entities.Competition.update(comp.id, { score, rank, status: 'completed', disqualified: false });

        if (rank <= 3) {
          await base44.asServiceRole.entities.Horse.update(horse.id, {
            competition_wins: (horse.competition_wins || 0) + (rank === 1 ? 1 : 0),
            energy: Math.max(0, (horse.energy || 100) - 15),
          });
        } else {
          await base44.asServiceRole.entities.Horse.update(horse.id, { energy: Math.max(0, (horse.energy || 100) - 10) });
        }
        if (rank === 1) dayRepDelta += olympicD.includes(comp.discipline) ? 30 : 10;
      }

      // Auto-birth mares
      const pendingBirths = await base44.asServiceRole.entities.BreedingRecord.filter(
        { created_by: email, status: 'pending' },
        '-created_date',
        50
      );
      for (const rec of pendingBirths || []) {
        if (!rec.foal_due_date || rec.foal_due_date > today) continue;
        const mare = (await base44.asServiceRole.entities.Horse.filter({ id: rec.mother_id }))?.[0];
        if (!mare) continue;

        const names = rec.foal_sex === 'male' ? ['Tornado', 'Eclipse', 'Sultan', 'Orage', 'Apollo', 'Zéphyr', 'Atlas', 'Titan', 'Merlin', 'Sirius']
          : ['Luna', 'Aurore', 'Perle', 'Tempête', 'Étoile', 'Jade', 'Iris', 'Stella', 'Naya', 'Olympe'];
        const foalName = names[Math.floor(Math.random() * names.length)];

        const foal = await base44.asServiceRole.entities.Horse.create({
          name: foalName,
          genotype: rec.foal_genotype,
          stats: rec.foal_stats,
          health_genes: rec.foal_health_genes,
          coat_color: rec.foal_coat_color,
          sex: rec.foal_sex,
          breed: rec.foal_breed,
          father_id: rec.father_id || null,
          mother_id: rec.mother_id,
          age: 0,
          energy: 100,
          competition_wins: 0,
          is_for_sale: false,
          studbook_registered: false,
        });

        await base44.asServiceRole.entities.BreedingRecord.update(rec.id, { status: 'born', foal_id: foal.id, foal_name: foalName });
        dayRepDelta += 5;
      }

      // Age horses
      const agH = await base44.asServiceRole.entities.Horse.filter(
        { owner_email: email },
        '-created_date',
        250
      );
      for (const horse of agH || []) {
        const lastM = horse.last_age_update_month;
        if (lastM == null) {
          await base44.asServiceRole.entities.Horse.update(horse.id, { last_age_update_month: newMonth });
          continue;
        }
        let monthsElapsed = newMonth - lastM;
        if (monthsElapsed <= 0) continue;
        if (monthsElapsed < 0) monthsElapsed += MONTHS_PER_YEAR;
        const newAge = Math.min(35, (horse.age || 0) + monthsElapsed);
        if (newAge !== (horse.age || 0)) {
          await base44.asServiceRole.entities.Horse.update(horse.id, { age: newAge, last_age_update_month: newMonth });
        } else {
          await base44.asServiceRole.entities.Horse.update(horse.id, { last_age_update_month: newMonth });
        }
      }

      if (dayRepDelta !== 0) {
        await base44.asServiceRole.entities.User.update(player.id, {
          breeding_reputation: Math.max(0, (user.breeding_reputation ?? 0) + dayRepDelta),
        });
      }
      ticked++;
    }

    return new Response(JSON.stringify({ ok: true, ran: true, daysAdvanced: daysToAdvance, playersTicked: ticked, clock: clockPayload }), { status: 200 });
  } catch (e) {
    console.error('dailyTickServer error:', e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
});