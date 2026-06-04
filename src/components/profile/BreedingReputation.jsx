import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { REPUTATION_TIERS, getTier, getNextTier, maxAffixesForLevel } from '@/lib/breedingReputation';

export default function BreedingReputation({ reputation = 0, affixes = [] }) {
  const tier = getTier(reputation);
  const next = getNextTier(reputation);
  const prevMin = tier.min;
  const nextMin = next ? next.min : tier.min + 1;
  const pct = next ? Math.min(100, Math.round(((reputation - prevMin) / (nextMin - prevMin)) * 100)) : 100;
  const maxAffixes = maxAffixesForLevel(tier.level);
  const nextAffixLevel = tier.level < 15 ? (Math.ceil(tier.level / 5) * 5) + 1 : null;

  return (
    <Card className={`border ${tier.border} ${tier.bg}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tier.icon}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Réputation d'Élevage</p>
              <p className={`text-lg font-bold ${tier.color}`}>{tier.title}</p>
              <p className="text-xs text-stone-400">Niveau {tier.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${tier.color}`}>{reputation.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-stone-400">points</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${tier.color.replace('text-', 'bg-')}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {next ? (
          <p className="text-xs text-stone-400">
            <span className="font-semibold">{(next.min - reputation).toLocaleString('fr-FR')} pts</span> pour atteindre <span className={`font-semibold ${next.color}`}>{next.icon} {next.title}</span>
          </p>
        ) : (
          <p className="text-xs text-stone-400">Rang maximum atteint 🏆</p>
        )}

        {/* Affixes */}
        <div className="pt-2 border-t border-stone-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-stone-600">🏷️ Affixes d'élevage</p>
            <p className="text-xs text-stone-400">{affixes.length} / {maxAffixes} slot{maxAffixes > 1 ? 's' : ''}</p>
          </div>
          {affixes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {affixes.map((a, i) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${tier.bg} ${tier.color} ${tier.border}`}>
                  {a.position === 'prefix' ? `${a.name} …` : `… ${a.name}`}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">Aucun affixe enregistré</p>
          )}
          {nextAffixLevel && tier.level % 5 !== 1 && (
            <p className="text-xs text-stone-400 mt-1">Prochain affixe au niveau {nextAffixLevel > 15 ? 'max' : nextAffixLevel}</p>
          )}
        </div>

        {/* Levels legend */}
        <div className="pt-2 border-t border-stone-200/80">
          <div className="flex flex-wrap gap-1">
            {REPUTATION_TIERS.map(t => (
              <span
                key={t.level}
                title={`${t.title} — ${t.min.toLocaleString('fr-FR')} pts`}
                className={`text-xs px-1.5 py-0.5 rounded border font-medium cursor-default ${t.min <= reputation ? `${t.bg} ${t.color} ${t.border}` : 'bg-stone-100 text-stone-400 border-stone-200'}`}
              >
                {t.icon} Niv.{t.level}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}