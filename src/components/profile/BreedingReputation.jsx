import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const TIERS = [
  { min: 0,    label: 'Novice',        color: 'text-stone-500',  bg: 'bg-stone-100',  border: 'border-stone-200', icon: '🌱' },
  { min: 100,  label: 'Amateur',       color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200', icon: '🌿' },
  { min: 500,  label: 'Confirmé',      color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',  icon: '🔵' },
  { min: 1500, label: 'Expert',        color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-200',icon: '💜' },
  { min: 4000, label: 'Maître',        color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200', icon: '⭐' },
  { min: 8000, label: 'Grand Maître',  color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200',icon: '🏅' },
  { min: 15000,label: 'Légendaire',    color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',   icon: '🔥' },
];

function getTier(points) {
  return [...TIERS].reverse().find(t => points >= t.min) || TIERS[0];
}

function getNextTier(points) {
  return TIERS.find(t => t.min > points) || null;
}

export default function BreedingReputation({ reputation = 0 }) {
  const tier = getTier(reputation);
  const next = getNextTier(reputation);
  const progress = next
    ? Math.min(100, Math.round(((reputation - getTier(reputation - 1 < 0 ? 0 : reputation).min) / (next.min - tier.min)) * 100))
    : 100;

  // recompute progress correctly
  const prevMin = tier.min;
  const nextMin = next ? next.min : tier.min + 1;
  const pct = next ? Math.min(100, Math.round(((reputation - prevMin) / (nextMin - prevMin)) * 100)) : 100;

  return (
    <Card className={`border ${tier.border} ${tier.bg}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tier.icon}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Réputation d'Élevage</p>
              <p className={`text-lg font-bold ${tier.color}`}>{tier.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${tier.color}`}>{reputation.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-stone-400">points</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-200 rounded-full h-2 mt-3">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${tier.color.replace('text-', 'bg-')}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {next ? (
          <p className="text-xs text-stone-400 mt-1.5">
            {(next.min - reputation).toLocaleString('fr-FR')} pts pour atteindre <span className="font-semibold">{next.label}</span>
          </p>
        ) : (
          <p className="text-xs text-stone-400 mt-1.5">Rang maximum atteint 🏆</p>
        )}

        {/* All tiers legend */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TIERS.map(t => (
            <span
              key={t.label}
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${t.min <= reputation ? `${t.bg} ${t.color} ${t.border}` : 'bg-stone-100 text-stone-400 border-stone-200'}`}
            >
              {t.icon} {t.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}