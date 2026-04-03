import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Heart, Dna, Activity, Trophy, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StatBar from '../components/horse/StatBar';
import GeneticPanel from '../components/horse/GeneticPanel';
import HealthPanel from '../components/horse/HealthPanel';
import HorseVisualizer from '../components/horse/HorseVisualizer';
import CareerPanel from '../components/horse/CareerPanel';

export default function HorseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const horseId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: horse, isLoading } = useQuery({
    queryKey: ['horse', horseId],
    queryFn: () => base44.entities.Horse.filter({ id: horseId }).then(r => r[0]),
    enabled: !!horseId,
  });

  const { data: parents } = useQuery({
    queryKey: ['parents', horse?.father_id, horse?.mother_id],
    queryFn: async () => {
      const results = {};
      if (horse?.father_id) {
        const f = await base44.entities.Horse.filter({ id: horse.father_id });
        if (f[0]) results.father = f[0];
      }
      if (horse?.mother_id) {
        const m = await base44.entities.Horse.filter({ id: horse.mother_id });
        if (m[0]) results.mother = m[0];
      }
      return results;
    },
    enabled: !!(horse?.father_id || horse?.mother_id),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['horse-competitions', horseId],
    queryFn: () => base44.entities.Competition.filter({ horse_id: horseId }, '-created_date', 20),
    enabled: !!horseId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Horse.delete(horseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      navigate('/Stable');
    },
  });

  const toggleSaleMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Horse.update(horseId, { 
        is_for_sale: !horse.is_for_sale, 
        price: horse.is_for_sale ? 0 : Math.round((Object.values(horse.stats || {}).reduce((a,b) => a+b, 0) / 7) * 50)
      });
      // Mise en vente d'un cheval malade = malus réputation
      if (!horse.is_for_sale && currentUser) {
        const affectedCount = horse.health_genes?.filter(g => g.status === 'affected').length || 0;
        const carrierCount = horse.health_genes?.filter(g => g.status === 'carrier').length || 0;
        const penalty = (affectedCount * 30) + (carrierCount * 5);
        if (penalty > 0) {
          const currentRep = currentUser.breeding_reputation ?? 0;
          await base44.auth.updateMe({ breeding_reputation: Math.max(0, currentRep - penalty) });
          toast.warning(`⚠️ Cheval malade mis en vente : -${penalty} pts de réputation`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse', horseId] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
    </div>
  );

  if (!horse) return (
    <div className="text-center py-20">
      <p className="text-stone-400">Cheval introuvable</p>
      <Link to="/Stable"><Button variant="outline" className="mt-4">Retour à l'écurie</Button></Link>
    </div>
  );

  const avgStat = horse.stats ? Math.round(Object.values(horse.stats).reduce((a,b) => a+b, 0) / 7) : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/Stable" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />Retour à l'écurie
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-stone-100 overflow-hidden">
            <CardContent className="p-6">
              <HorseVisualizer 
                genotype={horse.genotype} 
                coatColor={horse.coat_color}
                size={400}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-2/3 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-800">{horse.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={`border-0 ${horse.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                  {horse.sex === 'male' ? '♂ Mâle' : '♀ Femelle'}
                </Badge>
                <Badge variant="outline">{horse.breed}</Badge>
                <Badge variant="outline">{horse.age || 0} ans</Badge>
                <Badge className="bg-stone-100 text-stone-600 border-0">{horse.coat_color}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleSaleMutation.mutate()}>
                <ShoppingCart className="w-4 h-4 mr-1" />
                {horse.is_for_sale ? 'Retirer' : 'Vendre'}
              </Button>
              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteMutation.mutate()}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Estimated Value — owner only */}
          {currentUser && horse.created_by === currentUser.email && horse.estimated_value > 0 && (
            <Card className="border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-0.5">Valeur estimée</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {horse.estimated_value.toLocaleString('fr-FR')} <span className="text-base font-semibold">₲ Genesis</span>
                    </p>
                    <p className="text-xs text-amber-600/70 mt-1">Estimation basée sur la génétique, les performances, l'âge, la rareté et le potentiel en compétition.</p>
                  </div>
                  <div className="text-3xl opacity-30">₲</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-0 bg-white/60">
              <CardContent className="p-4 text-center">
                <Activity className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                <p className="text-2xl font-bold text-stone-800">{avgStat}</p>
                <p className="text-xs text-stone-500">Moy. Stats</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/60">
              <CardContent className="p-4 text-center">
                <Trophy className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <p className="text-2xl font-bold text-stone-800">{horse.competition_wins || 0}</p>
                <p className="text-xs text-stone-500">Victoires</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/60">
              <CardContent className="p-4 text-center">
                <Heart className="w-5 h-5 mx-auto text-rose-500 mb-1" />
                <p className="text-2xl font-bold text-stone-800">{horse.energy || 100}%</p>
                <p className="text-xs text-stone-500">Énergie</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/60">
              <CardContent className="p-4 text-center">
                <Dna className="w-5 h-5 mx-auto text-violet-500 mb-1" />
                <p className="text-2xl font-bold text-stone-800">{horse.health_genes?.filter(h => h.status !== 'clear').length || 0}</p>
                <p className="text-xs text-stone-500">Gènes santé</p>
              </CardContent>
            </Card>
          </div>

          {/* Parents */}
          {(parents?.father || parents?.mother) && (
            <div className="flex gap-3">
              {parents?.father && (
                <Link to={`/HorseDetail?id=${parents.father.id}`} className="flex-1">
                  <Card className="border-0 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
                    <CardContent className="p-3">
                      <p className="text-xs text-blue-400 font-medium">Père</p>
                      <p className="font-semibold text-stone-800">{parents.father.name}</p>
                      <p className="text-xs text-stone-500">{parents.father.breed}</p>
                    </CardContent>
                  </Card>
                </Link>
              )}
              {parents?.mother && (
                <Link to={`/HorseDetail?id=${parents.mother.id}`} className="flex-1">
                  <Card className="border-0 bg-pink-50/50 hover:bg-pink-50 transition-colors cursor-pointer">
                    <CardContent className="p-3">
                      <p className="text-xs text-pink-400 font-medium">Mère</p>
                      <p className="font-semibold text-stone-800">{parents.mother.name}</p>
                      <p className="text-xs text-stone-500">{parents.mother.breed}</p>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="stats">Compétences</TabsTrigger>
          <TabsTrigger value="genetics">Génétique</TabsTrigger>
          <TabsTrigger value="health">Santé</TabsTrigger>
          <TabsTrigger value="career">Carrière</TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="mt-4">
          <Card className="border-0 bg-white/60">
            <CardContent className="p-6 space-y-3">
              {horse.stats && Object.entries(horse.stats).map(([stat, value]) => (
                <StatBar key={stat} stat={stat} value={value} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="genetics" className="mt-4">
          <Card className="border-0 bg-white/60">
            <CardHeader><CardTitle className="text-lg">Génotype</CardTitle></CardHeader>
            <CardContent>
              <GeneticPanel genotype={horse.genotype} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          <Card className="border-0 bg-white/60">
            <CardHeader><CardTitle className="text-lg">Maladies Génétiques</CardTitle></CardHeader>
            <CardContent>
              <HealthPanel healthGenes={horse.health_genes} breed={horse.breed} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="career" className="mt-4">
          <CareerPanel competitions={competitions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}