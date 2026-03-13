import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, History, Trophy, Calendar } from 'lucide-react';
import TrainingSession from '../components/training/TrainingSession';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Training() {
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const queryClient = useQueryClient();

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 200),
  });

  const { data: trainingHistory = [] } = useQuery({
    queryKey: ['training-history'],
    queryFn: () => base44.entities.Training.list('-created_date', 50),
  });

  const selectedHorse = horses.find(h => h.id === selectedHorseId);

  // Check if horse trained today
  const today = new Date().toISOString().split('T')[0];
  const hasTrainedToday = trainingHistory.some(
    t => t.horse_id === selectedHorseId && t.training_date === today
  );

  const trainMutation = useMutation({
    mutationFn: async ({ horse, result }) => {
      // Update horse stats and energy
      const newStats = { ...horse.stats };
      if (result.success) {
        newStats[result.stat] = Math.min(100, (newStats[result.stat] || 0) + result.statGain);
      }

      await base44.entities.Horse.update(horse.id, {
        stats: newStats,
        energy: Math.max(0, (horse.energy || 100) - result.energyCost),
      });

      // Record training session
      await base44.entities.Training.create({
        horse_id: horse.id,
        horse_name: horse.name,
        stat_trained: result.stat,
        difficulty: result.difficulty,
        energy_cost: result.energyCost,
        success: result.success,
        stat_gain: result.statGain,
        training_date: today,
      });
    },
    onSuccess: (_, { result }) => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['training-history'] });
      toast.success(result.success 
        ? `Entraînement réussi ! +${result.statGain} points` 
        : 'Entraînement échoué, réessayez demain'
      );
    },
  });

  const handleTrainingComplete = (result) => {
    if (selectedHorse) {
      trainMutation.mutate({ horse: selectedHorse, result });
    }
  };

  const todayTrainings = trainingHistory.filter(t => t.training_date === today);
  const successRate = trainingHistory.length > 0
    ? (trainingHistory.filter(t => t.success).length / trainingHistory.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Entraînement</h1>
        <p className="text-stone-500 mt-1">Améliorez les compétences de vos chevaux avec des séances quotidiennes</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-800">{todayTrainings.length}</p>
            <p className="text-xs text-blue-600">Entraînements aujourd'hui</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4 text-center">
            <Trophy className="w-5 h-5 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-800">{successRate.toFixed(0)}%</p>
            <p className="text-xs text-green-600">Taux de réussite global</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-4 text-center">
            <History className="w-5 h-5 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-800">{trainingHistory.length}</p>
            <p className="text-xs text-purple-600">Total séances</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="train" className="w-full">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="train">
            <TrendingUp className="w-4 h-4 mr-2" />
            S'entraîner
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="train" className="mt-6 space-y-6">
          {/* Horse Selection */}
          <Card className="border-0 bg-white/60">
            <CardHeader>
              <CardTitle className="text-lg">Sélectionner un cheval</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedHorseId} onValueChange={setSelectedHorseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un cheval à entraîner..." />
                </SelectTrigger>
                <SelectContent>
                  {horses.map(h => {
                    const trainedToday = trainingHistory.some(
                      t => t.horse_id === h.id && t.training_date === today
                    );
                    return (
                      <SelectItem key={h.id} value={h.id} disabled={trainedToday}>
                        {h.sex === 'male' ? '♂' : '♀'} {h.name} — {h.breed} (⚡{h.energy || 0}%)
                        {trainedToday && ' — Déjà entraîné aujourd\'hui'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Training Session */}
          {selectedHorse ? (
            hasTrainedToday ? (
              <Card className="border-0 bg-amber-50">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-amber-400 mb-3" />
                  <h3 className="text-lg font-semibold text-stone-700 mb-2">
                    {selectedHorse.name} s'est déjà entraîné aujourd'hui
                  </h3>
                  <p className="text-stone-500">
                    Revenez demain pour une nouvelle séance d'entraînement !
                  </p>
                </CardContent>
              </Card>
            ) : (
              <TrainingSession 
                horse={selectedHorse} 
                onTrainingComplete={handleTrainingComplete}
              />
            )
          ) : (
            <Card className="border-0 bg-gradient-to-br from-stone-50 to-indigo-50">
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-semibold text-stone-600 mb-2">Aucun cheval sélectionné</h3>
                <p className="text-stone-400">Choisissez un cheval ci-dessus pour commencer l'entraînement</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="border-0 bg-white/60">
            <CardHeader>
              <CardTitle className="text-lg">Historique des entraînements</CardTitle>
            </CardHeader>
            <CardContent>
              {trainingHistory.length === 0 ? (
                <p className="text-center text-stone-400 py-8">Aucun entraînement enregistré</p>
              ) : (
                <div className="space-y-2">
                  {trainingHistory.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${t.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium text-stone-700 text-sm">{t.horse_name}</p>
                          <p className="text-xs text-stone-500">
                            {t.stat_trained} • {t.difficulty} • {format(new Date(t.training_date || t.created_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`border-0 ${
                          t.success 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {t.success ? `+${t.stat_gain} pts` : 'Échec'}
                        </Badge>
                        <p className="text-xs text-stone-400 mt-1">-{t.energy_cost} énergie</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}