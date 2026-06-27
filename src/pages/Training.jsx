import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import NewTrainingSession from '../components/training/NewTrainingSession';

export default function Training() {
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const userEmail = currentUser?.email;
  const { data: myHorses = [] } = useQuery({
    queryKey: ['horses', userEmail],
    queryFn: () => base44.entities.Horse.filter({ owner_email: userEmail }, '-created_date', 100),
    enabled: !!userEmail,
  });
  const { data: recentTrainings = [] } = useQuery({
    queryKey: ['recent-trainings', selectedHorseId],
    queryFn: () => selectedHorseId
      ? base44.entities.Training.filter({ horse_id: selectedHorseId }, '-training_date', 10)
      : [],
    enabled: !!selectedHorseId,
  });
  const selectedHorse = myHorses.find(h => h.id === selectedHorseId);
  const recentTypes = recentTrainings.map(t => t.training_type);

  const todayStr = new Date().toISOString().split('T')[0];
  const isFoal = (selectedHorse?.age || 0) < 3;
  const foalTrainedToday = isFoal && recentTrainings.some(t => t.is_foal_session && t.training_date === todayStr);

  const saveTrainingMutation = useMutation({
    mutationFn: async ({ training, result }) => {
      const newStats = { ...(selectedHorse.stats || {}) };
      Object.entries(result.statsGained || {}).forEach(([stat, gain]) => {
        newStats[stat] = Math.min(100, (newStats[stat] || 0) + gain);
      });

      const newFoalTraining = result.foalSkill
        ? {
            ...(selectedHorse.foal_training_completed || {}),
            [training.id]: Math.min(50, (selectedHorse.foal_training_completed?.[training.id] || 0) + result.foalSkillGain),
          }
        : selectedHorse.foal_training_completed;

      await base44.entities.Horse.update(selectedHorse.id, {
        stats: newStats,
        energy: Math.max(0, (selectedHorse.energy ?? 100) - result.physCost),
        mental_energy: Math.max(0, (selectedHorse.mental_energy ?? 100) - result.mentalCost),
        ...(newFoalTraining ? { foal_training_completed: newFoalTraining } : {}),
      });

      await base44.entities.Training.create({
        horse_id: selectedHorse.id,
        horse_name: selectedHorse.name,
        training_type: training.id,
        stats_gained: result.statsGained || {},
        stat_gain: Object.values(result.statsGained || {}).reduce((a, b) => a + b, 0),
        energy_cost: result.physCost,
        mental_energy_cost: result.mentalCost,
        side_effects: result.sideEffects || [],
        success: true,
        is_foal_session: (selectedHorse.age || 0) < 3,
        training_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['recent-trainings', selectedHorseId] });
      toast.success('Session saved!');
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Training</h1>
        <p className="text-stone-500 mt-1">Train your horses to improve their skills</p>
      </div>

      {/* Horse selection */}
      <Card className="border-0 bg-white/70">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Dumbbell className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <Select value={selectedHorseId} onValueChange={setSelectedHorseId}>
              <SelectTrigger className="flex-1 bg-white">
                <SelectValue placeholder="Choose a horse to train..." />
              </SelectTrigger>
              <SelectContent>
                {myHorses.map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} — {h.breed} ({h.age || 0} yrs)
                    {(h.age || 0) < 3 ? ' 🐴 Foal' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedHorse && (
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{selectedHorse.breed}</Badge>
                <Badge className="bg-stone-100 text-stone-600 border-0">{selectedHorse.age || 0} yrs</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training session */}
      {selectedHorse ? (
        <NewTrainingSession
          horse={selectedHorse}
          recentTrainingTypes={recentTypes}
          foalTrainedToday={foalTrainedToday}
          onTrainingComplete={({ training, result }) => saveTrainingMutation.mutate({ training, result })}
        />
      ) : (
        <div className="text-center py-16 text-stone-400">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a horse to start a session</p>
        </div>
      )}
    </div>
  );
}