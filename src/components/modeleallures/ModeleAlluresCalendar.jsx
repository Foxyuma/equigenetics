import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { AGE_CLASSES, getAgeClassLabel } from '@/lib/modeleAllures';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const SEASONS = {
  spring: { label: 'Printemps', icon: '🌸', color: 'bg-green-50 text-green-700 border-green-200' },
  summer: { label: 'Été', icon: '☀️', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  autumn: { label: 'Automne', icon: '🍂', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  winter: { label: 'Hiver', icon: '❄️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

function getSeason(month) {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export default function ModeleAlluresCalendar({ competitions, gameYear, breeds: availableBreeds }) {
  const [filterBreed, setFilterBreed] = useState('all');
  const [filterAge, setFilterAge] = useState('all');

  const allBreeds = useMemo(() => {
    const breedSet = new Set(availableBreeds || []);
    competitions.forEach((c) => c.breed && breedSet.add(c.breed));
    return [...breedSet].sort();
  }, [competitions, availableBreeds]);

  const filteredComps = useMemo(() => {
    return competitions.filter((c) => {
      if (filterBreed !== 'all' && c.breed !== filterBreed) return false;
      if (filterAge !== 'all' && (c.age_class ?? 0) !== parseInt(filterAge, 10)) return false;
      return true;
    });
  }, [competitions, filterBreed, filterAge]);

  const compsByMonth = useMemo(() => {
    const map = {};
    for (let m = 0; m < 12; m++) map[m] = [];
    filteredComps.forEach((c) => {
      if (!c.competition_date) return;
      const month = new Date(c.competition_date).getMonth();
      if (!isNaN(month)) map[month].push(c);
    });
    return map;
  }, [filteredComps]);

  return (
    <Card className="border-0 bg-white/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-500" />
            Calendrier des concours — Année {gameYear}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={filterBreed}
              onChange={(e) => setFilterBreed(e.target.value)}
              className="text-xs rounded-md border border-stone-200 bg-white px-2 py-1 text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="all">Toutes races</option>
              {allBreeds.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              className="text-xs rounded-md border border-stone-200 bg-white px-2 py-1 text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="all">Tous âges</option>
              {AGE_CLASSES.map((ac) => (
                <option key={ac.age} value={ac.age}>
                  {ac.icon} {ac.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredComps.length === 0 ? (
          <p className="text-center text-stone-400 py-8 text-sm">
            Aucun concours prévu avec ces filtres.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MONTHS.map((monthName, m) => {
              const monthComps = compsByMonth[m] || [];
              if (monthComps.length === 0) return null;
              const season = SEASONS[getSeason(m)];
              return (
                <div
                  key={m}
                  className="rounded-xl border border-stone-200 bg-stone-50/60 overflow-hidden"
                >
                  <div className={`flex items-center gap-2 px-3 py-2 border-b ${season.color}`}>
                    <span>{season.icon}</span>
                    <span className="font-semibold text-sm">{monthName}</span>
                    <Badge variant="outline" className="ml-auto border-0 bg-white/60 text-xs">
                      {monthComps.length}
                    </Badge>
                  </div>
                  <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
                    {monthComps.map((c) => {
                      const day = c.competition_date
                        ? new Date(c.competition_date).getDate()
                        : '?';
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white border border-stone-100 text-xs"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex flex-col items-center justify-center">
                            <span className="font-bold text-amber-700 leading-none">{day}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-stone-700 truncate">{c.horse_name}</p>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <span className="text-stone-500">{c.breed}</span>
                              <span className="text-stone-400">·</span>
                              <span className="text-stone-500">{getAgeClassLabel(c.age_class ?? 0)}</span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs border-0 flex-shrink-0 ${
                              c.status === 'completed'
                                ? c.disqualified
                                  ? 'bg-red-50 text-red-600'
                                  : c.rank === 1
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-emerald-50 text-emerald-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {c.status === 'completed'
                              ? c.disqualified
                                ? 'DQ'
                                : `#${c.rank}`
                              : '⏳'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Légende */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100 text-xs text-stone-400 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-50 border border-blue-200"></span>En attente</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-50 border border-emerald-200"></span>Terminé</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-50 border border-amber-200"></span>1er place</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-50 border border-red-200"></span>Disqualifié</span>
        </div>
      </CardContent>
    </Card>
  );
}