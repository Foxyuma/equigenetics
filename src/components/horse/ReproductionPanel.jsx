import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Baby, FlaskConical, Info, TrendingUp } from 'lucide-react';
import { breedGenotype, determineCoatColor, generateRandomStats, inheritDiseases } from '../genetics/GeneticsEngine';
import StatBar from './StatBar';
import GeneticPanel from './GeneticPanel';
import { toast } from 'sonner';

export default function ReproductionPanel({ mare }) {
  const [selectedStallion, setSelectedStallion] = useState(null);
  const [stallionSource, setStallionSource] = useState('own'); // 'own' | 'market'
  const [foalPreview, setFoalPreview] = useState(null);
  const [foalName, setFoalName] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: ownHorses = [] } = useQuery({ queryKey: ['horses'], queryFn: () => base44.entities.Horse.list('-created_date', 200) });
  const { data: stallionOffers = [] } = useQuery({ queryKey: ['stallion-offers'], queryFn: () => base44.entities.StallionOffer.list('-created_date', 200) });

  const ownMales = ownHorses.filter(h => h.sex === 'male');

  const stallionsToShow = stallionSource === 'own'
    ? ownMales.map(h => ({ ...h, stallion_name: h.name, price: 0, owner_name: 'Mon écurie', is_own: true }))
    : stallionOffers;

  const simulateBreeding = () => {
    if (!selectedStallion) return;
    const childGenotype = breedGenotype(selectedStallion.genotype, mare.genotype);
    const childStats = generateRandomStats(selectedStallion.stats, mare.stats);
    const childHealth = inheritDiseases(selectedStallion.health_genes, mare.health_genes, mare.breed);
    const coatColor = determineCoatColor(childGenotype);
    setFoalPreview({
      genotype: childGenotype,
      stats: childStats,
      health_genes: childHealth,
      coat_color: coatColor,
      sex: Math.random() > 0.5 ? 'male' : 'female',
      breed: selectedStallion.breed === mare.breed ? selectedStallion.breed : `${selectedStallion.breed} x ${mare.breed}`,
    });
  };

  const birthMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('Non connecté');
      const price = selectedStallion.price ?? 0;
      if (price > 0) {
        const balance = currentUser.genesis_balance ?? 0;
        if (balance < price) throw new Error('Fonds insuffisants');
        await base44.auth.updateMe({ genesis_balance: balance - price });
        await base44.entities.Transaction.create({
          user_email: currentUser.email,
          currency: 'genesis',
          amount: -price,
          balance_after: balance - price,
          reason: `Saillie - ${selectedStallion.stallion_name} (${selectedStallion.breed})`,
        });
      }
      const foal = await base44.entities.Horse.create({
        name: foalName,
        ...foalPreview,
        father_id: selectedStallion.is_own ? selectedStallion.id : null,
        mother_id: mare.id,
        age: 0,
        energy: 100,
        competition_wins: 0,
        is_for_sale: false,
      });
      await base44.entities.BreedingRecord.create({
        father_id: selectedStallion.id,
        mother_id: mare.id,
        father_name: selectedStallion.stallion_name,
        mother_name: mare.name,
        foal_id: foal.id,
        foal_name: foalName,
        breed: foalPreview.breed,
      });
      // Réputation
      const avgStat = Math.round(Object.values(foalPreview.stats || {}).reduce((a, b) => a + b, 0) / 7);
      const isPure = selectedStallion.breed === mare.breed;
      const affectedCount = foalPreview?.health_genes?.filter(g => g.status === 'affected').length || 0;
      const carrierCount = foalPreview?.health_genes?.filter(g => g.status === 'carrier').length || 0;
      const repGain = 50 + (isPure ? 25 : 0) + (affectedCount === 0 ? 15 : 0)
        + Math.round((avgStat - 50) * 0.5) - (affectedCount * 40) - (carrierCount * 10);
      await base44.auth.updateMe({ breeding_reputation: (currentUser.breeding_reputation ?? 0) + repGain });
      return repGain;
    },
    onSuccess: (repGain) => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`Poulain né ! ${repGain >= 0 ? '+' : ''}${repGain} pts réputation 🐴`);
      setFoalPreview(null);
      setFoalName('');
      setSelectedStallion(null);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-5">
      {/* Source selector */}
      <Tabs value={stallionSource} onValueChange={(v) => { setStallionSource(v); setSelectedStallion(null); setFoalPreview(null); }}>
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="own">Mes étalons ({ownMales.length})</TabsTrigger>
          <TabsTrigger value="market">Marché des saillies ({stallionOffers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={stallionSource} className="mt-4">
          {stallionsToShow.length === 0 ? (
            <p className="text-stone-400 text-sm py-6 text-center">Aucun étalon disponible</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stallionsToShow.map(s => {
                const isSelected = selectedStallion?.id === s.id && selectedStallion?.is_own === s.is_own;
                const hasDiseases = s.health_genes?.some(g => g.status !== 'clear');
                return (
                  <Card
                    key={s.id}
                    onClick={() => { setSelectedStallion(s); setFoalPreview(null); }}
                    className={`cursor-pointer transition-all border-2 ${isSelected ? 'border-amber-400 bg-amber-50/50' : 'border-transparent bg-white/70 hover:border-stone-300'}`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-stone-800 text-sm">{s.stallion_name}</p>
                          <p className="text-xs text-stone-400">{s.owner_name}</p>
                        </div>
                        {s.price > 0
                          ? <span className="text-amber-700 font-bold text-sm">{s.price.toLocaleString('fr-FR')} ₲</span>
                          : <span className="text-emerald-600 font-bold text-sm">Gratuit</span>
                        }
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">{s.breed}</Badge>
                        <Badge className="bg-stone-100 text-stone-600 border-0 text-xs">{s.coat_color}</Badge>
                      </div>
                      {s.stats && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span className="text-xs text-stone-500">
                            Moy. <strong>{Math.round(Object.values(s.stats).reduce((a, b) => a + b, 0) / Object.keys(s.stats).length)}</strong>
                          </span>
                        </div>
                      )}
                      {s.genotype && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(s.genotype).slice(0, 4).map(([k, v]) => (
                            <span key={k} className="px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-mono">{v}</span>
                          ))}
                        </div>
                      )}
                      {hasDiseases && (
                        <div className="flex flex-wrap gap-1">
                          {s.health_genes.filter(g => g.status !== 'clear').map(g => (
                            <Badge key={g.disease} className={`text-xs border-0 ${g.status === 'affected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                              ⚠️ {g.disease}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Simulate button */}
      {selectedStallion && !foalPreview && (
        <Button
          onClick={simulateBreeding}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
        >
          <FlaskConical className="w-4 h-4 mr-2" />
          Simuler le croisement avec {selectedStallion.stallion_name}
        </Button>
      )}

      {/* Foal preview */}
      {foalPreview && (
        <Card className="border-0 bg-gradient-to-br from-amber-50/60 to-pink-50/60">
          <CardContent className="p-5 space-y-4">
            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>Prévision indicative :</strong> les compétences, le génotype et le sexe peuvent varier lors de la naissance réelle.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={`border-0 ${foalPreview.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                {foalPreview.sex === 'male' ? '♂ Mâle (estimé)' : '♀ Femelle (estimé)'}
              </Badge>
              <Badge variant="outline">{foalPreview.breed}</Badge>
              <Badge className="bg-stone-100 text-stone-600 border-0">{foalPreview.coat_color} (estimé)</Badge>
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Compétences estimées</p>
              <div className="space-y-1.5">
                {Object.entries(foalPreview.stats).map(([s, v]) => <StatBar key={s} stat={s} value={v} />)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Génotype estimé</p>
              <GeneticPanel genotype={foalPreview.genotype} />
            </div>

            {foalPreview.health_genes?.some(g => g.status !== 'clear') && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Risques génétiques détectés
                </p>
                <div className="flex flex-wrap gap-1">
                  {foalPreview.health_genes.filter(g => g.status !== 'clear').map(g => (
                    <Badge key={g.disease} className={`text-xs border-0 ${g.status === 'affected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {g.disease}: {g.status === 'carrier' ? 'Porteur' : 'Atteint'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-stone-200">
              <Input placeholder="Nom du poulain..." value={foalName} onChange={e => setFoalName(e.target.value)} className="flex-1" />
              <Button
                onClick={() => birthMutation.mutate()}
                disabled={!foalName || birthMutation.isPending}
                className="bg-stone-800 hover:bg-stone-900"
              >
                <Baby className="w-4 h-4 mr-2" />
                Faire naître{selectedStallion.price > 0 ? ` — ${selectedStallion.price.toLocaleString('fr-FR')} ₲` : ''}
              </Button>
              <Button variant="outline" onClick={simulateBreeding}>🎲 Relancer</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}