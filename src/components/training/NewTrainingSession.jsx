import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Brain, TrendingUp, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ADULT_TRAININGS, FOAL_TRAININGS, CHARACTER_MODIFIERS, computeTrainingResult, computeFoalTrainingResult } from './TrainingTypes';

const STAT_LABELS = {
  speed: 'Vitesse', endurance: 'Endurance', agility: 'Agilité',
  strength: 'Force', temperament: 'Tempérament', jumping: 'Saut', dressage: 'Dressage',
};

function EnergyBar({ label, icon: IconComp, value, color }) {
  const Icon = IconComp;
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      <span className="text-xs text-stone-500 w-24">{label}</span>
      <div className="flex-1">
        <Progress value={value} className="h-2" />
      </div>
      <span className="text-xs font-semibold text-stone-700 w-8 text-right">{value}%</span>
    </div>
  );
}

export default function NewTrainingSession({ horse, recentTrainingTypes = [], onTrainingComplete }) {
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [result, setResult] = useState(null);

  const isFoal = (horse?.age || 0) < 3;
  const trainings = isFoal ? FOAL_TRAININGS : ADULT_TRAININGS;
  const charMod = CHARACTER_MODIFIERS[horse?.character] || null;

  const physEnergy = horse?.energy ?? 100;
  const mentalEnergy = horse?.mental_energy ?? 100;

  const handleTrain = async () => {
    if (!selectedTraining || !horse) return;
    setIsTraining(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1200));

    const res = isFoal
      ? computeFoalTrainingResult(selectedTraining, horse)
      : computeTrainingResult(selectedTraining, horse, recentTrainingTypes);

    setResult(res);
    setIsTraining(false);
    if (onTrainingComplete) onTrainingComplete({ training: selectedTraining, result: res });
  };

  const canAfford = selectedTraining
    ? physEnergy >= Math.max(0, selectedTraining.energyCost || 0) &&
      mentalEnergy >= Math.max(0, selectedTraining.mentalCost || 0)
    : false;

  return (
    <div className="space-y-4">
      {/* Énergie du cheval */}
      <Card className="border-0 bg-white/70">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
            État de {horse?.name}
            {charMod && <span className="ml-2 font-normal normal-case text-stone-400">{charMod.label}</span>}
          </p>
          <EnergyBar label="Énergie physique" icon={Zap} value={physEnergy} color="text-amber-500" />
          <EnergyBar label="Énergie mentale" icon={Brain} value={mentalEnergy} color="text-violet-500" />
          {isFoal && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 mb-2">Compétences poulain</p>
              <div className="grid grid-cols-3 gap-2">
                {[['manipulation', '🤲 Manipulation'], ['desensibilisation', '🎭 Désensib.'], ['embarquement', '🚛 Embarquement']].map(([k, label]) => {
                  const val = horse?.foal_training_completed?.[k] || 0;
                  return (
                    <div key={k} className="text-center">
                      <p className="text-xs text-stone-500">{label}</p>
                      <Progress value={(val / 50) * 100} className="h-1.5 mt-1" />
                      <p className="text-xs font-bold text-stone-700">{val}/50</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sélection entraînement */}
      <div>
        <p className="text-sm font-semibold text-stone-600 mb-2">
          {isFoal ? '🐴 Séance poulain (1 par jour)' : 'Choisir un entraînement'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {trainings.map(t => {
            const physCost = Math.max(0, t.energyCost || 0);
            const mentCost = Math.max(0, t.mentalCost || 0);
            const notEnoughPhys = physEnergy < physCost;
            const notEnoughMent = mentalEnergy < mentCost;
            const disabled = notEnoughPhys || notEnoughMent;
            const isSelected = selectedTraining?.id === t.id;

            return (
              <button
                key={t.id}
                disabled={disabled}
                onClick={() => { setSelectedTraining(t); setResult(null); }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-indigo-500 bg-indigo-50' :
                  disabled ? 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed' :
                  'border-stone-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-stone-800">{t.icon} {t.label}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{t.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {physCost > 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${notEnoughPhys ? 'text-red-500' : 'text-amber-600'}`}>
                      <Zap className="w-3 h-3" />-{physCost}
                    </span>
                  )}
                  {mentCost > 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${notEnoughMent ? 'text-red-500' : 'text-violet-600'}`}>
                      <Brain className="w-3 h-3" />-{mentCost}
                    </span>
                  )}
                  {t.energyCost < 0 && (
                    <span className="text-xs text-green-600 flex items-center gap-0.5">
                      <Zap className="w-3 h-3" />+{Math.abs(t.energyCost)} récup.
                    </span>
                  )}
                  {t.mentalCost < 0 && (
                    <span className="text-xs text-green-600 flex items-center gap-0.5">
                      <Brain className="w-3 h-3" />+{Math.abs(t.mentalCost)} récup.
                    </span>
                  )}
                </div>
                {/* Stat gains preview */}
                {Object.keys(t.statGains || {}).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(t.statGains).map(([stat, [min, max]]) => (
                      <span key={stat} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                        {STAT_LABELS[stat] || stat} +{min}-{max}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bouton lancer */}
      {selectedTraining && (
        <Button
          onClick={handleTrain}
          disabled={!canAfford || isTraining}
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-5 text-base"
        >
          {isTraining ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Entraînement en cours...</>
          ) : (
            <><TrendingUp className="w-4 h-4 mr-2" />Lancer : {selectedTraining.icon} {selectedTraining.label}</>
          )}
        </Button>
      )}

      {/* Résultat */}
      {result && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-bold text-green-700">Séance terminée !</h4>
            </div>

            {/* Stats gagnées */}
            {Object.keys(result.statsGained || {}).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-500 mb-1.5">Gains de compétences :</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.statsGained).map(([stat, gain]) => (
                    <Badge key={stat} className="bg-emerald-100 text-emerald-700 border-0">
                      {STAT_LABELS[stat] || stat} +{gain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Compétence poulain */}
            {result.foalSkill && (
              <div className="text-xs text-violet-700 bg-violet-50 p-2 rounded-lg">
                🐴 <strong>{selectedTraining.label}</strong> : +{result.foalSkillGain} pts ({result.newSkillValue}/50)
              </div>
            )}

            {/* Synergie */}
            {result.synergyBonus && (
              <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synergie : {result.synergyBonus}</span>
              </div>
            )}

            {/* Effets secondaires */}
            {result.sideEffects?.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Effets secondaires : {result.sideEffects.join(', ')}</span>
              </div>
            )}

            {/* Coûts */}
            <div className="flex gap-3 text-xs text-stone-500 pt-1 border-t border-green-200">
              {result.physCost > 0 && <span><Zap className="w-3 h-3 inline" /> -{result.physCost} énergie physique</span>}
              {result.mentalCost > 0 && <span><Brain className="w-3 h-3 inline" /> -{result.mentalCost} énergie mentale</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}