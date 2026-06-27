import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MENTAL_TRAITS,
  MORPHOLOGY_TRAITS,
  BREED_AFFINITY,
  POSITIVE_TRAITS,
} from '@/lib/horseTraits';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Brain, Dna, Sparkles, Stethoscope, Dumbbell } from 'lucide-react';

const DISCIPLINE_LABELS = {
  dressage: 'Dressage', show_jumping: 'CSO', cross_country: 'Cross',
  endurance: 'Endurance', racing: 'Course', reining: 'Reining',
  barrel_racing: 'Barrel Racing', eventing: 'Concours Complet',
  vaulting: 'Voltige', driving: 'Attelage', trail: 'Trail',
  western_pleasure: 'Western Pleasure', polo: 'Polo',
};

const STAT_LABELS = {
  speed: 'Vitesse', endurance: 'Endurance', agility: 'Agilité',
  strength: 'Force', temperament: 'Tempérament', jumping: 'Saut', dressage: 'Dressage',
};

// ─── Potentiel individuel ────────────────────────────────────────────────────
function PotentialSection({ stats, potential }) {
  if (!potential) return null;
  return (
    <div className="space-y-2">
      {Object.entries(potential).map(([stat, ceiling]) => {
        const current = stats?.[stat] || 0;
        const pct = Math.round((current / ceiling) * 100);
        const isNearCeiling = pct >= 85;
        return (
          <div key={stat} className="grid grid-cols-[100px_1fr_60px] items-center gap-2">
            <span className="text-xs text-stone-600">{STAT_LABELS[stat]}</span>
            <div className="relative h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isNearCeiling ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${(current / 100) * 100}%` }}
              />
              {/* Marqueur plafond */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-stone-400 opacity-60"
                style={{ left: `${ceiling}%` }}
              />
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold text-stone-700">{current}</span>
              <span className="text-stone-400">/{ceiling}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Affinité raciale ────────────────────────────────────────────────────────
function AffinitySection({ breed }) {
  const affinity = BREED_AFFINITY[breed];
  if (!affinity) return <p className="text-xs text-stone-400">Aucune affinité définie pour cette race.</p>;

  const positive = Object.entries(affinity).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const negative = Object.entries(affinity).filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]);

  return (
    <div className="space-y-3">
      {positive.length > 0 && (
        <div>
          <p className="text-xs font-medium text-emerald-700 mb-1.5">Prédispositions ✅</p>
          <div className="flex flex-wrap gap-1.5">
            {positive.map(([disc, val]) => (
              <Badge key={disc} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-normal">
                {DISCIPLINE_LABELS[disc] || disc} <span className="font-semibold ml-1">+{val}%</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
      {negative.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-600 mb-1.5">Désavantages ⚠️</p>
          <div className="flex flex-wrap gap-1.5">
            {negative.map(([disc, val]) => (
              <Badge key={disc} className="bg-red-50 text-red-600 border border-red-200 text-xs font-normal">
                {DISCIPLINE_LABELS[disc] || disc} <span className="font-semibold ml-1">{val}%</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Traits mentaux ──────────────────────────────────────────────────────────
function MentalTraitsSection({ traits, isOwner }) {
  const navigate = useNavigate();
  if (!traits || traits.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-stone-400">Traits mentaux non révélés — effectuez un test comportemental.</p>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => navigate('/Training')} className="text-xs border-sky-200 text-sky-700 hover:bg-sky-50">
            <Dumbbell className="w-3.5 h-3.5 mr-1.5" /> S'entraîner pour révéler
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {traits.map(trait => {
        const info = MENTAL_TRAITS[trait];
        if (!info) return null;
        const isPositive = POSITIVE_TRAITS.includes(trait);
        return (
          <div key={trait} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
            isPositive ? 'bg-sky-50 border border-sky-200' : 'bg-orange-50 border border-orange-200'
          }`}>
            <span className="text-base leading-none mt-0.5">{info.icon}</span>
            <div>
              <p className={`font-semibold ${isPositive ? 'text-sky-800' : 'text-orange-800'}`}>{info.label}</p>
              <p className={`mt-0.5 ${isPositive ? 'text-sky-600' : 'text-orange-600'}`}>{info.impact}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Morphologie cachée ──────────────────────────────────────────────────────
function MorphologySection({ morphology, revealed, isOwner }) {
  const navigate = useNavigate();
  if (!morphology || morphology.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-stone-400">Morphologie non évaluée — consultez un vétérinaire.</p>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => navigate('/VetClinic')} className="text-xs border-teal-200 text-teal-700 hover:bg-teal-50">
            <Stethoscope className="w-3.5 h-3.5 mr-1.5" /> Consulter le vétérinaire
          </Button>
        )}
      </div>
    );
  }

  if (!revealed) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-100 border border-stone-200">
        <EyeOff className="w-4 h-4 text-stone-400" />
        <p className="text-xs text-stone-500">Morphologie cachée — traits révélés au vétérinaire ou à l'inspection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {morphology.map(trait => {
        const info = MORPHOLOGY_TRAITS[trait];
        if (!info) return null;
        const isGood = !info.icon.includes('⚠️');
        return (
          <div key={trait} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
            isGood ? 'bg-teal-50 border border-teal-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <span className="text-base leading-none mt-0.5">{info.icon}</span>
            <div>
              <p className={`font-semibold ${isGood ? 'text-teal-800' : 'text-amber-800'}`}>{info.label}</p>
              <p className={`mt-0.5 ${isGood ? 'text-teal-600' : 'text-amber-600'}`}>{info.impact}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function TraitsPanel({ horse, isOwner }) {
  const [morphRevealed, setMorphRevealed] = useState(false);

  const hasMorpho = horse.morphology?.length > 0;
  const hasMental = horse.mental_traits?.length > 0;
  const hasPotential = horse.genetic_potential && Object.keys(horse.genetic_potential).length > 0;

  return (
    <div className="space-y-4">

      {/* Affinité raciale */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2 text-stone-700">
            <Dna className="w-4 h-4 text-amber-600" />
            Affinité raciale — {horse.breed}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <AffinitySection breed={horse.breed} />
        </CardContent>
      </Card>

      {/* Potentiel génétique individuel */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2 text-stone-700">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Potentiel génétique individuel
          </CardTitle>
          <p className="text-xs text-stone-400">La barre indique les stats actuelles. Le trait vertical = plafond génétique.</p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {hasPotential
            ? <PotentialSection stats={horse.stats} potential={horse.genetic_potential} />
            : <p className="text-xs text-stone-400">Potentiel non calculé pour ce cheval.</p>
          }
        </CardContent>
      </Card>

      {/* Traits mentaux */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2 text-stone-700">
            <Brain className="w-4 h-4 text-sky-500" />
            Traits mentaux
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <MentalTraitsSection traits={horse.mental_traits} isOwner={isOwner} />
        </CardContent>
      </Card>

      {/* Morphologie cachée */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2 text-stone-700">
            <Eye className="w-4 h-4 text-teal-500" />
            Morphologie cachée
            {hasMorpho && isOwner && (
              <button
                onClick={() => setMorphRevealed(v => !v)}
                className="ml-auto text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors flex items-center gap-1"
              >
                {morphRevealed ? <><EyeOff className="w-3 h-3" /> Masquer</> : <><Eye className="w-3 h-3" /> Révéler</>}
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <MorphologySection morphology={horse.morphology} revealed={morphRevealed || !isOwner === false} isOwner={isOwner} />
        </CardContent>
      </Card>

    </div>
  );
}