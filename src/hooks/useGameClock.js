import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useEffect } from 'react';
import { runDailyTick } from '@/lib/dailyTick';

const DAYS_PER_MONTH = 14; // 14 jours = 2 semaines réelles = 1 mois de jeu
const MONTHS_PER_YEAR = 8; // 8 mois par an → 2 cycles de 4 saisons

function getSeasonForMonth(month) {
  const m = ((month - 1) % 4) + 1;
  if (m <= 1) return 'spring';
  if (m <= 2) return 'summer';
  if (m <= 3) return 'autumn';
  return 'winter';
}

// Le jour change à 3h30 UTC.
// Si on n'a pas encore atteint 3h30 UTC aujourd'hui, le dernier seuil
// applicable était celui d'hier — on ne doit pas ticker avant 3h30.
function getTodayTickThreshold() {
  const now = new Date();
  const todayThreshold = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 3, 30, 0));
  if (now.getTime() < todayThreshold.getTime()) {
    todayThreshold.setUTCDate(todayThreshold.getUTCDate() - 1);
  }
  return todayThreshold;
}

// Nombre de jours à avancer (rattrapage si l'utilisateur était hors ligne)
function getDaysToAdvance(lastTickReal) {
  const threshold = getTodayTickThreshold();
  if (!lastTickReal) return 1;
  const last = new Date(lastTickReal);
  if (last.getTime() >= threshold.getTime()) return 0; // déjà tické aujourd'hui

  // Seuil du jour du dernier tick
  const lastThreshold = new Date(
    Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate(), 3, 30, 0)
  );
  // Si le dernier tick était avant 3h30 ce jour-là, il appartenait au jour précédent
  if (last.getTime() < lastThreshold.getTime()) {
    lastThreshold.setUTCDate(lastThreshold.getUTCDate() - 1);
  }
  const diffMs = threshold.getTime() - lastThreshold.getTime();
  return Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)));
}

export function useGameClock() {
  const queryClient = useQueryClient();

  const { data: clocks = [] } = useQuery({
    queryKey: ['game-clock'],
    queryFn: () => base44.entities.GameClock.list(),
    staleTime: 30_000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me-clock'],
    queryFn: () => base44.auth.me(),
  });

  const clock = clocks[0];

  const { mutate: advanceDay } = useMutation({
    mutationFn: async ({ daysToAdvance, userEmail, currentMonth }) => {
      const current = clock || { day: 1, month: 1, year: 1, total_days: 0 };
      let newDay = current.day || 1;
      let newMonth = currentMonth || current.month || 1;
      let newYear = current.year || 1;
      let totalDays = current.total_days || 0;

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

      const newSeason = getSeasonForMonth(newMonth);
      const payload = {
        day: newDay,
        month: newMonth,
        year: newYear,
        total_days: totalDays,
        last_tick_real: new Date().toISOString(),
        season: newSeason,
      };

      if (clock?.id) {
        return base44.entities.GameClock.update(clock.id, payload);
      } else {
        return base44.entities.GameClock.create(payload);
      }
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game-clock'] });
      // Exécuter le tick quotidien : résoudre les compétitions, faire naître les poulains
      if (variables?.userEmail) {
        await runDailyTick(variables.userEmail, variables.currentMonth);
        queryClient.invalidateQueries();
      }
    },
  });

  // Vérifie au chargement et initialise / tick si besoin
  useEffect(() => {
    if (clocks === undefined) return;
    if (!clock) {
      base44.entities.GameClock.create({
        day: 1,
        month: 1,
        year: 1,
        total_days: 0,
        last_tick_real: new Date(0).toISOString(),
        season: 'spring',
      }).then(() => queryClient.invalidateQueries({ queryKey: ['game-clock'] }));
      return;
    }
    const daysToAdvance = getDaysToAdvance(clock.last_tick_real);
    if (daysToAdvance > 0) {
      advanceDay({ daysToAdvance, userEmail: currentUser?.email, currentMonth: clock?.month });
    }
  }, [clock?.id, clocks.length, currentUser?.email]);

  // Re-vérifier toutes les 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['game-clock'] });
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    clock,
    day: clock?.day ?? 1,
    month: clock?.month ?? 1,
    year: clock?.year ?? 1,
    totalDays: clock?.total_days ?? 0,
    season: clock?.season ?? 'spring',
    daysPerMonth: DAYS_PER_MONTH,
  };
}