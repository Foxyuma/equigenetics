import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useEffect } from 'react';

const DAYS_PER_MONTH = 14;
const MONTHS_PER_SEASON = 3; // 3 mois par saison
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

function getSeasonForMonth(month) {
  // month est 1-indexé, cycle de 12 mois
  const m = ((month - 1) % 12) + 1;
  if (m <= 3) return 'spring';
  if (m <= 6) return 'summer';
  if (m <= 9) return 'autumn';
  return 'winter';
}

// Retourne l'heure du prochain tick (3h AM aujourd'hui ou demain)
function getNext3AM() {
  const now = new Date();
  const tick = new Date(now);
  tick.setHours(3, 0, 0, 0);
  if (now >= tick) tick.setDate(tick.getDate() + 1);
  return tick;
}

// Est-ce que le dernier tick a eu lieu avant le dernier 3h AM ?
function needsTick(lastTickReal) {
  if (!lastTickReal) return true;
  const last = new Date(lastTickReal);
  const now = new Date();
  const todayTick = new Date(now);
  todayTick.setHours(3, 0, 0, 0);
  // Si maintenant > 3h aujourd'hui et dernier tick < 3h aujourd'hui → besoin de tick
  if (now >= todayTick && last < todayTick) return true;
  return false;
}

export function useGameClock() {
  const queryClient = useQueryClient();

  const { data: clocks = [] } = useQuery({
    queryKey: ['game-clock'],
    queryFn: () => base44.entities.GameClock.list(),
    staleTime: 30_000,
  });

  const clock = clocks[0];

  const { mutate: advanceDay } = useMutation({
    mutationFn: async () => {
      const current = clock || { day: 1, month: 1, year: 1, total_days: 0 };
      let newDay = (current.day || 1) + 1;
      let newMonth = current.month || 1;
      let newYear = current.year || 1;
      let totalDays = (current.total_days || 0) + 1;

      if (newDay > DAYS_PER_MONTH) {
        newDay = 1;
        newMonth += 1;
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game-clock'] }),
  });

  // Vérifie au chargement et initialise si besoin
  useEffect(() => {
    if (clocks === undefined) return;
    if (!clock) {
      // Initialiser l'horloge
      base44.entities.GameClock.create({
        day: 1, month: 1, year: 1, total_days: 0,
        last_tick_real: new Date().toISOString(),
        season: 'spring',
      }).then(() => queryClient.invalidateQueries({ queryKey: ['game-clock'] }));
      return;
    }
    if (needsTick(clock.last_tick_real)) {
      advanceDay();
    }
  }, [clock?.id, clocks.length]);

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