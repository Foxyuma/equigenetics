import React from 'react';
import { useGameClock } from '@/hooks/useGameClock';

const SEASON_ICONS = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
};

const SEASON_LABELS = {
  spring: 'Printemps',
  summer: 'Été',
  autumn: 'Automne',
  winter: 'Hiver',
};

const MONTHS_PER_SEASON = 2;

export default function GameClockDisplay({ variant = 'default' }) {
  const { day, month, year, season, daysPerMonth } = useGameClock();
  const daysLeftMonth = daysPerMonth - day;

  // Saison = 2 mois consécutifs (8 mois/an, 4 saisons)
  const seasonMonthIndex = (month - 1) % MONTHS_PER_SEASON;
  const daysIntoSeason = seasonMonthIndex * daysPerMonth + day;
  const totalSeasonDays = MONTHS_PER_SEASON * daysPerMonth;
  const daysLeftSeason = totalSeasonDays - daysIntoSeason;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-full px-2.5 py-1">
        <span className="text-xs">{SEASON_ICONS[season]}</span>
        <span className="text-stone-700 font-semibold text-xs tabular-nums">A{year}</span>
        <span className="text-[10px] text-stone-500 tabular-nums leading-tight">
          {daysLeftMonth}j/mois<br />{daysLeftSeason}j/saison
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-full px-3 py-1">
      <span className="text-sm">{SEASON_ICONS[season]}</span>
      <span className="text-stone-700 font-semibold text-sm tabular-nums">
        {SEASON_LABELS[season]} A{year}
      </span>
      <span className="text-[10px] text-stone-400 tabular-nums hidden xl:inline">
        J{day} · {daysLeftMonth}j mois · {daysLeftSeason}j saison
      </span>
    </div>
  );
}