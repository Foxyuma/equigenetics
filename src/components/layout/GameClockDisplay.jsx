import React from 'react';
import { useGameClock } from '@/hooks/useGameClock';
import { CalendarDays } from 'lucide-react';

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

export default function GameClockDisplay() {
  const { day, month, year, season, daysPerMonth } = useGameClock();
  const daysLeft = daysPerMonth - day;

  return (
    <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-full px-3 py-1">
      <span className="text-sm">{SEASON_ICONS[season]}</span>
      <span className="text-stone-700 font-semibold text-sm tabular-nums">
        A{year} · {SEASON_LABELS[season]}
      </span>
      <span className="text-xs text-stone-400 tabular-nums">J{day} ({daysLeft}j restants)</span>
    </div>
  );
}