import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, Zap, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';
import PaddockCell from '../components/paddock/PaddockCell';
import { PADDOCK_TYPES } from '../components/paddock/PaddockConfig';

export default function Paddocks() {
  const [showCreate, setShowCreate] = useState(false);
  const [newPaddock, setNewPaddock] = useState({ name: '', type: 'pasture' });
  const queryClient = useQueryClient();

  const { data: paddocks = [], isLoading: paddocksLoading } = useQuery({
    queryKey: ['paddocks'],
    queryFn: () => base44.entities.Paddock.list('-created_date', 50),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const config = PADDOCK_TYPES[data.type];
      return base44.entities.Paddock.create({
        ...data,
        morale_bonus: config.morale_bonus,
        energy_recovery_rate: config.energy_recovery_rate,
        capacity: config.capacity,
        assigned_horses: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paddocks'] });
      setShowCreate(false);
      setNewPaddock({ name: '', type: 'pasture' });
      toast.success('Enclos créé !');
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ paddock, horse }) => {
      const updated = [...(paddock.assigned_horses || []), { horse_id: horse.id, horse_name: horse.name }];
      await base44.entities.Paddock.update(paddock.id, { assigned_horses: updated });
      // Apply energy recovery bonus to horse (store paddock_type on horse for reference)
      const config = PADDOCK_TYPES[paddock.type];
      await base44.entities.Horse.update(horse.id, {
        energy: Math.min(100, (horse.energy || 100) + config.energy_recovery_rate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paddocks'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('Cheval assigné !');
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ paddock, horseId }) => {
      const updated = (paddock.assigned_horses || []).filter(h => h.horse_id !== horseId);
      return base44.entities.Paddock.update(paddock.id, { assigned_horses: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paddocks'] });
      toast.success('Cheval retiré de l\'enclos.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Paddock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paddocks'] });
      toast.success('Enclos supprimé.');
    },
  });

  // Stats summary
  const totalAssigned = paddocks.reduce((acc, p) => acc + (p.assigned_horses?.length || 0), 0);
  const unassigned = horses.filter(h => !paddocks.some(p => p.assigned_horses?.some(a => a.horse_id === h.id)));
  const avgRecovery = paddocks.length > 0
    ? Math.round(paddocks.reduce((acc, p) => acc + (p.energy_recovery_rate || 10), 0) / paddocks.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Gestion des Paddocks</h1>
          <p className="text-stone-500 mt-1">Assignez vos chevaux à des enclos pour optimiser leur moral et récupération</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-stone-800 hover:bg-stone-900">
              <Plus className="w-4 h-4 mr-2" /> Nouvel enclos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Créer un enclos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Nom de l'enclos..."
                value={newPaddock.name}
                onChange={(e) => setNewPaddock({ ...newPaddock, name: e.target.value })}
              />
              <Select value={newPaddock.type} onValueChange={(v) => setNewPaddock({ ...newPaddock, type: v })}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PADDOCK_TYPES).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.icon} {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newPaddock.type && (
                <div className={`p-3 rounded-lg ${PADDOCK_TYPES[newPaddock.type].bg} text-sm text-stone-600`}>
                  <p>{PADDOCK_TYPES[newPaddock.type].description}</p>
                  <div className="flex gap-4 mt-2 text-xs font-medium">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" />+{PADDOCK_TYPES[newPaddock.type].energy_recovery_rate}/h</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-500" />Moral: {PADDOCK_TYPES[newPaddock.type].morale_bonus >= 0 ? '+' : ''}{PADDOCK_TYPES[newPaddock.type].morale_bonus}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 text-stone-500" />Max: {PADDOCK_TYPES[newPaddock.type].capacity}</span>
                  </div>
                </div>
              )}
              <Button onClick={() => createMutation.mutate(newPaddock)} disabled={!newPaddock.name} className="w-full bg-stone-800 hover:bg-stone-900">
                Créer l'enclos
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Enclos', value: paddocks.length, icon: LayoutGrid, color: 'text-stone-700' },
          { label: 'Assignés', value: totalAssigned, icon: Users, color: 'text-blue-600' },
          { label: 'Sans enclos', value: unassigned.length, icon: Users, color: 'text-orange-600' },
          { label: 'Récup. moy.', value: `+${avgRecovery}/h`, icon: Zap, color: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 bg-white/60">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-xl font-bold text-stone-800">{value}</p>
                <p className="text-xs text-stone-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paddock grid */}
      {paddocksLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-stone-100 animate-pulse" />)}
        </div>
      ) : paddocks.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">🏡</span>
          <h3 className="text-lg font-semibold text-stone-600">Aucun enclos créé</h3>
          <p className="text-stone-400 mt-1">Créez votre premier enclos pour organiser votre écurie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paddocks.map(paddock => (
            <div key={paddock.id} className="relative group">
              <PaddockCell
                paddock={paddock}
                allHorses={horses}
                onAssign={(p, h) => assignMutation.mutate({ paddock: p, horse: h })}
                onUnassign={(p, hId) => unassignMutation.mutate({ paddock: p, horseId: hId })}
              />
              <button
                onClick={() => deleteMutation.mutate(paddock.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Unassigned horses */}
      {unassigned.length > 0 && (
        <Card className="border-0 bg-white/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              Chevaux sans enclos ({unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassigned.map(h => (
                <Badge key={h.id} variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
                  🐴 {h.name}
                  <span className="text-stone-400">·</span>
                  <span className="text-amber-600">⚡{h.energy || 100}%</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}