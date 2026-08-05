import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dna, Crown, Zap, Wind, Activity, Dumbbell, Brain, Heart, Sparkles, Trophy, Coins, TrendingUp } from 'lucide-react';
import HorseVisualizer from '@/components/horse/HorseVisualizer';

const STAT_DEFS = [
  { key: 'speed', label: 'Speed', icon: Wind, color: 'from-sky-500 to-blue-600' },
  { key: 'endurance', label: 'Endurance', icon: Zap, color: 'from-emerald-500 to-green-600' },
  { key: 'agility', label: 'Agility', icon: Activity, color: 'from-violet-500 to-purple-600' },
  { key: 'strength', label: 'Strength', icon: Dumbbell, color: 'from-orange-500 to-red-600' },
  { key: 'temperament', label: 'Temperament', icon: Brain, color: 'from-pink-500 to-rose-600' },
  { key: 'jumping', label: 'Jumping', icon: TrendingUp, color: 'from-amber-500 to-yellow-600' },
  { key: 'dressage', label: 'Dressage', icon: Sparkles, color: 'from-indigo-500 to-blue-700' },
];

const STAT_KEYS = STAT_DEFS.map(s => s.key);

function totalPotential(h) {
  const gp = h.genetic_potential || {};
  return STAT_KEYS.reduce((sum, k) => sum + (gp[k] || 0), 0);
}

function AchievementCard({ record, icon: Icon, color, valueLabel, subtitle }) {
  if (!record || !record.horse) return null;
  const horse = record.horse;
  return (
    <Card className="group overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-500">
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-stone-800 leading-none">{record.value}</div>
            <div className="text-xs text-stone-400 mt-1">{valueLabel}</div>
          </div>
        </div>

        <Link to={`/HorseDetail?id=${horse.id}`} className="block">
          <div className="relative h-36 rounded-lg overflow-hidden mb-3 bg-stone-100 flex items-center justify-center">
            {horse.image_url ? (
              <img src={horse.image_url} alt={horse.name} className="w-full h-full object-cover" />
            ) : (
              <HorseVisualizer genotype={horse.genotype} coatColor={horse.coat_color} horseId={horse.id} breed={horse.breed} age={horse.age} fill showGenotype={false} />
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">{horse.name}</p>
              <p className="text-xs text-stone-400">{horse.breed} · {horse.age} yrs</p>
            </div>
            {subtitle && <Badge variant="outline" className="text-xs">{subtitle}</Badge>}
          </div>
        </Link>
      </div>
    </Card>
  );
}

export default function GeneticAchievements() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [], isLoading } = useQuery({
    queryKey: ['achievements-horses', currentUser?.email],
    queryFn: () => base44.entities.Horse.filter({ owner_email: currentUser.email }, '-created_date', 500),
    enabled: !!currentUser?.email,
  });

  const records = useMemo(() => {
    // Only horses that were actually bred by the player (have both parents)
    const bred = horses.filter(h => h.father_id && h.mother_id);
    if (bred.length === 0) return null;

    const records = {};

    // Highest overall genetic potential
    const bestPotential = bred
      .map(h => ({ horse: h, value: totalPotential(h) }))
      .sort((a, b) => b.value - a.value)[0];
    records.totalPotential = { ...bestPotential, display: `${bestPotential.value} pts` };

    // Best per-stat (genetic potential)
    STAT_DEFS.forEach(stat => {
      const best = bred
        .map(h => ({ horse: h, value: (h.genetic_potential?.[stat.key] || 0) }))
        .sort((a, b) => b.value - a.value)[0];
      if (best.value > 0) records[stat.key] = best;
    });

    // Best current stat achieved (training) — highest single stat
    const bestTrained = bred
      .map(h => ({ horse: h, value: Math.max(...STAT_KEYS.map(k => h.stats?.[k] || 0)) }))
      .sort((a, b) => b.value - a.value)[0];
    records.bestTrained = bestTrained;

    // Most competition wins
    const bestWinner = bred
      .filter(h => (h.competition_wins || 0) > 0)
      .map(h => ({ horse: h, value: h.competition_wins }))
      .sort((a, b) => b.value - a.value)[0];
    records.wins = bestWinner;

    // Highest estimated value among bred horses
    const bestValue = bred
      .map(h => ({ horse: h, value: h.estimated_value || 0 }))
      .sort((a, b) => b.value - a.value)[0];
    records.value = bestValue;

    records.count = bred.length;
    return records;
  }, [horses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-200/50">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">Genetic Achievements</h1>
          <p className="text-sm text-stone-500">The finest horses bred in your stable</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : !records ? (
        <Card className="p-12 text-center border-0 bg-white/70 backdrop-blur-sm">
          <Dna className="w-14 h-14 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">No bred horses yet</p>
          <p className="text-sm text-stone-400 mt-1">Breed your first foal to start building your genetic legacy.</p>
          <Link to="/Breeding" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition-colors">
            <Heart className="w-4 h-4" /> Go to Breeding
          </Link>
        </Card>
      ) : (
        <>
          {/* Summary banner */}
          <Card className="p-5 border-0 bg-gradient-to-r from-amber-50 to-stone-50">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-stone-600">
                <span className="font-bold text-stone-800">{records.count}</span> horses bred in your stable — here are your genetic champions.
              </p>
            </div>
          </Card>

          {/* Overall potential */}
          <div>
            <h2 className="text-lg font-semibold text-stone-700 mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" /> Hall of Fame
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AchievementCard record={records.totalPotential} icon={Dna} color="from-amber-500 to-amber-700" valueLabel="Total potential" subtitle="Overall" />
              <AchievementCard record={records.bestTrained} icon={TrendingUp} color="from-stone-700 to-stone-900" valueLabel="Best stat" subtitle="Trained" />
              {records.wins && <AchievementCard record={records.wins} icon={Trophy} color="from-yellow-500 to-amber-600" valueLabel="Wins" subtitle="Competition" />}
              {records.value && records.value.value > 0 && (
                <AchievementCard record={records.value} icon={Coins} color="from-emerald-500 to-green-600" valueLabel={(records.value.value).toLocaleString('en-GB') + ' pts'} subtitle="Value" />
              )}
            </div>
          </div>

          {/* Per-stat records */}
          <div>
            <h2 className="text-lg font-semibold text-stone-700 mb-3 flex items-center gap-2">
              <Dna className="w-5 h-5 text-stone-600" /> Records by Discipline
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STAT_DEFS.map(stat => {
                const rec = records[stat.key];
                if (!rec) return null;
                return (
                  <AchievementCard
                    key={stat.key}
                    record={rec}
                    icon={stat.icon}
                    color={stat.color}
                    valueLabel={`${stat.label} potential`}
                    subtitle={stat.label}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}