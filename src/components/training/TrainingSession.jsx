import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Zap, TrendingUp, Award, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const STAT_OPTIONS = [
  { id: "speed", label: "Vitesse", icon: "⚡", color: "text-sky-600" },
  { id: "endurance", label: "Endurance", icon: "💪", color: "text-emerald-600" },
  { id: "agility", label: "Agilité", icon: "🌀", color: "text-violet-600" },
  { id: "strength", label: "Force", icon: "🔥", color: "text-red-600" },
  { id: "temperament", label: "Tempérament", icon: "🧘", color: "text-amber-600" },
  { id: "jumping", label: "Saut", icon: "🦘", color: "text-blue-600" },
  { id: "dressage", label: "Dressage", icon: "🎭", color: "text-pink-600" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Facile", energyCost: 10, baseSuccessRate: 90, statGain: [1, 2], color: "bg-green-100 text-green-700" },
  { id: "medium", label: "Moyen", energyCost: 20, baseSuccessRate: 70, statGain: [2, 4], color: "bg-blue-100 text-blue-700" },
  { id: "hard", label: "Difficile", energyCost: 30, baseSuccessRate: 50, statGain: [3, 6], color: "bg-orange-100 text-orange-700" },
  { id: "extreme", label: "Extrême", energyCost: 40, baseSuccessRate: 30, statGain: [5, 10], color: "bg-red-100 text-red-700" },
];

export default function TrainingSession({ horse, onTrainingComplete }) {
  const [selectedStat, setSelectedStat] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [isTraining, setIsTraining] = useState(false);
  const [result, setResult] = useState(null);

  const difficulty = DIFFICULTIES.find(d => d.id === selectedDifficulty);
  const statInfo = STAT_OPTIONS.find(s => s.id === selectedStat);
  const currentStatValue = horse?.stats?.[selectedStat] || 0;

  const calculateSuccess = () => {
    if (!horse || !difficulty) return false;
    
    const temperamentBonus = (horse.stats?.temperament || 50) / 10;
    const successRate = Math.min(95, difficulty.baseSuccessRate + temperamentBonus);
    
    return Math.random() * 100 < successRate;
  };

  const handleTrain = async () => {
    if (!selectedStat || !horse) return;

    setIsTraining(true);
    setResult(null);

    // Simulate training delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = calculateSuccess();
    const statGain = success 
      ? difficulty.statGain[0] + Math.floor(Math.random() * (difficulty.statGain[1] - difficulty.statGain[0] + 1))
      : 0;

    const trainingResult = {
      success,
      statGain,
      energyCost: difficulty.energyCost,
      stat: selectedStat,
      difficulty: selectedDifficulty,
    };

    setResult(trainingResult);
    setIsTraining(false);

    // Call parent callback
    if (onTrainingComplete) {
      onTrainingComplete(trainingResult);
    }
  };

  const canTrain = horse?.energy >= difficulty?.energyCost && selectedStat && !isTraining;
  const successRate = difficulty ? Math.min(95, difficulty.baseSuccessRate + ((horse?.stats?.temperament || 50) / 10)) : 0;

  return (
    <Card className="border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Séance d'Entraînement
        </CardTitle>
        <p className="text-sm text-stone-500 mt-1">
          Améliorez les compétences de {horse?.name}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stat Selection */}
        <div>
          <label className="text-sm font-medium text-stone-600 mb-2 block">Compétence à entraîner</label>
          <Select value={selectedStat} onValueChange={setSelectedStat}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Choisir une compétence..." />
            </SelectTrigger>
            <SelectContent>
              {STAT_OPTIONS.map(stat => (
                <SelectItem key={stat.id} value={stat.id}>
                  <span className="flex items-center gap-2">
                    <span>{stat.icon}</span>
                    <span>{stat.label}</span>
                    <span className="text-xs text-stone-400">
                      ({horse?.stats?.[stat.id] || 0}/100)
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStat && (
            <div className="mt-2">
              <Progress value={currentStatValue} className="h-2" />
            </div>
          )}
        </div>

        {/* Difficulty Selection */}
        <div>
          <label className="text-sm font-medium text-stone-600 mb-2 block">Difficulté</label>
          <div className="grid grid-cols-2 gap-2">
            {DIFFICULTIES.map(diff => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                disabled={horse?.energy < diff.energyCost}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedDifficulty === diff.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                } ${horse?.energy < diff.energyCost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <p className="font-semibold text-sm text-stone-800">{diff.label}</p>
                <p className="text-xs text-stone-500 mt-1">
                  <Zap className="w-3 h-3 inline mr-1" />-{diff.energyCost} énergie
                </p>
                <p className="text-xs text-indigo-600 font-medium mt-1">
                  +{diff.statGain[0]}-{diff.statGain[1]} pts
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Success Rate Preview */}
        {selectedStat && difficulty && (
          <div className="p-3 rounded-lg bg-white border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600">Taux de réussite</span>
              <Badge className="bg-indigo-100 text-indigo-700 border-0">
                {successRate.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={successRate} className="h-2 bg-indigo-100" />
            <p className="text-xs text-stone-500 mt-2">
              Bonus tempérament : +{((horse?.stats?.temperament || 50) / 10).toFixed(1)}%
            </p>
          </div>
        )}

        {/* Energy Warning */}
        {horse?.energy < difficulty?.energyCost && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              Énergie insuffisante. Votre cheval a besoin de repos ou de nourriture.
            </p>
          </div>
        )}

        {/* Train Button */}
        <Button
          onClick={handleTrain}
          disabled={!canTrain}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
        >
          {isTraining ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Entraînement en cours...
            </>
          ) : (
            <>
              <Award className="w-5 h-5 mr-2" />
              Commencer l'entraînement
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg border-2 ${
            result.success 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {result.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <h4 className={`font-bold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success ? 'Entraînement réussi !' : 'Entraînement échoué'}
                </h4>
                <p className="text-sm text-stone-600">
                  {result.success 
                    ? `${statInfo?.label} +${result.statGain} points`
                    : 'Aucun gain de compétence cette fois'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Zap className="w-4 h-4" />
              <span>Énergie consommée : {result.energyCost}</span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-stone-500 bg-white/50 p-3 rounded-lg">
          💡 <strong>Astuce :</strong> Un cheval avec un bon tempérament a plus de chances de réussir son entraînement. Les difficultés élevées offrent plus de gains mais ont un taux d'échec plus important.
        </div>
      </CardContent>
    </Card>
  );
}