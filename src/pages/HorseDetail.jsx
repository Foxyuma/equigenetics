import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Heart, Dna, Activity, Trophy, ShoppingCart, Sparkles, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StatBar from '../components/horse/StatBar';
import TraitsPanel from '../components/horse/TraitsPanel';
import { estimateHorseValue } from '../components/genetics/GeneticsEngine';
import { buildHorseImagePrompt, extractMarkingsDescription, getDisplayBreed, getAgeStageLabel } from '../lib/horseImagePrompt';
import GeneticPanel from '../components/horse/GeneticPanel';
import HealthPanel from '../components/horse/HealthPanel';
import HorseVisualizer from '../components/horse/HorseVisualizer';
import CareerPanel from '../components/horse/CareerPanel';
import ReproductionPanel from '../components/horse/ReproductionPanel';
import ApprovalBenefits from '../components/breeding/ApprovalBenefits';
import StallionOfferPanel from '../components/horse/StallionOfferPanel';
import StudbookRegistration from '../components/horse/StudbookRegistration';
import VetHistoryPanel from '../components/horse/VetHistoryPanel';

export default function HorseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const horseId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);

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

  // Génère une image selon le stade d'âge actuel
  const generateStageImage = async (stage) => {
    if (!horse || generatingImage) return;
    setGeneratingImage(true);
    const markings = horse.markings_description || extractMarkingsDescription(horse.coat_color, horse.genotype);
    const age = horse.age || 0;
    const prompt = buildHorseImagePrompt({
      breed: horse.breed,
      coat_color: horse.coat_color,
      sex: horse.sex,
      age,
      markings,
      morphology: horse.morphology,
    });
    const { url: generatedUrl } = await base44.integrations.Core.GenerateImage({ prompt });
    const response = await fetch(generatedUrl);
    const blob = await response.blob();
    const file = new File([blob], `horse_${stage}_${horse.id}.jpg`, { type: 'image/jpeg' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const update = { image_url: file_url };
    if (stage === 'adult') update.adult_image_url = file_url;
    if (stage === 'foal') update.foal_image_url = file_url;
    await base44.entities.Horse.update(horse.id, update);
    queryClient.invalidateQueries({ queryKey: ['horse', horse.id] });
    setGeneratingImage(false);
  };

  // Auto-génère l'image adulte une seule fois quand l'âge atteint ≥ 3 ans
  useEffect(() => {
    if (!horse || generatingImage) return;
    const age = horse.age || 0;
    if (age >= 3 && !horse.adult_image_url) {
      generateStageImage('adult');
    }
  }, [horse?.id, horse?.age]);

  const { data: competitions = [] } = useQuery({
    queryKey: ['horse-competitions', horseId],
    queryFn: () => base44.entities.Competition.filter({ horse_id: horseId }, '-created_date', 20),
    enabled: !!horseId,
  });

  const toggleSaleMutation = useMutation({
    mutationFn: async (salePrice) => {
      const value = estimateHorseValue(horse);
      await base44.entities.Horse.update(horseId, {
        is_for_sale: !horse.is_for_sale,
        price: horse.is_for_sale ? 0 : salePrice,
        estimated_value: value,
      });
      if (!horse.is_for_sale && currentUser) {
        const affectedCount = horse.health_genes?.filter(g => g.status === 'affected').length || 0;
        const carrierCount = horse.health_genes?.filter(g => g.status === 'carrier').length || 0;
        const penalty = (affectedCount * 30) + (carrierCount * 5);
        if (penalty > 0) {
          const currentRep = currentUser.breeding_reputation ?? 0;
          await base44.auth.updateMe({ breeding_reputation: Math.max(0, currentRep - penalty) });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horse', horseId] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setShowSellDialog(false);
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

  const avgStat = horse.stats ? Math.round(Object.values(horse.stats).reduce((a, b) => a + b, 0) / 7) : 0;
  const isDopingRisk = horse.doping_risk_until && new Date(horse.doping_risk_until) > new Date();

  return (
    <div className="space-y-6">
      <Link to="/Stable" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />Retour à l'écurie
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-stone-100 overflow-hidden">
            <CardContent className="p-0 relative">
              {horse.image_url ? (
                <img
                  src={horse.image_url}
                  alt={horse.name}
                  className="w-full aspect-square object-cover rounded-xl"
                />
              ) : generatingImage ? (
                <div className="w-full aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 rounded-xl gap-3">
                  <div className="w-10 h-10 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
                  <p className="text-sm text-stone-400">Génération de l'image...</p>
                </div>
              ) : (
                <div className="w-full aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 rounded-xl gap-3">
                  <span className="text-6xl opacity-30">🐴</span>
                  <p className="text-sm text-stone-400">Image en attente</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/40 text-white text-xs backdrop-blur-sm">
                {getAgeStageLabel(horse.age || 0)}
              </div>
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
                <Badge variant="outline">{getDisplayBreed(horse.breed)}</Badge>
                <Badge variant="outline">{horse.age || 0} ans</Badge>
                <Badge className="bg-stone-100 text-stone-600 border-0">{horse.coat_color}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {horse.is_for_sale ? (
                <Button variant="outline" size="sm" onClick={() => toggleSaleMutation.mutate(0)}>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Retirer de la vente
                </Button>
              ) : currentUser && horse.created_by === currentUser.email ? (
                <Button variant="outline" size="sm" onClick={() => {
                  setCustomPrice(String(estimateHorseValue(horse)));
                  setShowSellDialog(true);
                }}>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Mettre en vente
                </Button>
              ) : null}
            </div>

            <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Mettre {horse.name} en vente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                    Valeur estimée : <strong>{estimateHorseValue(horse).toLocaleString('fr-FR')} ₲</strong>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-price">Prix de vente (₲ Genesis)</Label>
                    <Input
                      id="custom-price"
                      type="number"
                      min={1}
                      value={customPrice}
                      onChange={e => setCustomPrice(e.target.value)}
                      className="text-lg font-semibold"
                    />
                    {Number(customPrice) < estimateHorseValue(horse) && (
                      <p className="text-xs text-orange-500">⚠️ Prix inférieur à la valeur estimée</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSellDialog(false)}>Annuler</Button>
                  <Button
                    disabled={!customPrice || Number(customPrice) <= 0 || toggleSaleMutation.isPending}
                    onClick={() => toggleSaleMutation.mutate(Number(customPrice))}
                    className="bg-stone-800 hover:bg-stone-900"
                  >
                    Confirmer la vente
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isDopingRisk && (
            <Card className="border border-orange-300 bg-orange-50">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">⚠️ Substance détectable — Risque antidopage</p>
                  <p className="text-xs text-orange-600 mt-0.5">Ce cheval a reçu un traitement contenant des substances sous surveillance jusqu'au <strong>{new Date(horse.doping_risk_until).toLocaleDateString('fr-FR')}</strong>. Participer à une compétition avant cette date expose à un contrôle positif.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentUser && horse.created_by === currentUser.email && (
            <Card className="border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-0.5">Valeur estimée</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {estimateHorseValue(horse).toLocaleString('fr-FR')} <span className="text-base font-semibold">₲ Genesis</span>
                    </p>
                    <p className="text-xs text-amber-600/70 mt-1">Estimation basée sur la génétique, les performances, l'âge, la rareté et le potentiel en compétition.</p>
                  </div>
                  <div className="text-3xl opacity-30">₲</div>
                </div>
              </CardContent>
            </Card>
          )}

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

          <StudbookRegistration horse={horse} parents={parents} currentUser={currentUser} />
        </div>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="bg-stone-100/80 flex-wrap">
          <TabsTrigger value="stats">Compétences</TabsTrigger>
          <TabsTrigger value="traits">🧬 Traits</TabsTrigger>
          <TabsTrigger value="genetics">Génétique</TabsTrigger>
          <TabsTrigger value="health">Santé</TabsTrigger>
          <TabsTrigger value="career">Carrière</TabsTrigger>
          {horse.sex === 'female' && <TabsTrigger value="reproduction">Reproduction</TabsTrigger>}
          {horse.sex === 'male' && <TabsTrigger value="approval">Approbation</TabsTrigger>}
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
        <TabsContent value="traits" className="mt-4">
          <TraitsPanel
            horse={horse}
            isOwner={!!(currentUser && horse.created_by === currentUser.email)}
          />
        </TabsContent>
        <TabsContent value="genetics" className="mt-4">
          <Card className="border-0 bg-white/60">
            <CardHeader><CardTitle className="text-lg">Génotype</CardTitle></CardHeader>
            <CardContent>
              <GeneticPanel genotype={horse.genotype} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="health" className="mt-4 space-y-4">
          <Card className="border-0 bg-white/60">
            <CardHeader><CardTitle className="text-lg">Maladies Génétiques</CardTitle></CardHeader>
            <CardContent>
              <HealthPanel healthGenes={horse.health_genes} breed={horse.breed} />
            </CardContent>
          </Card>
          <VetHistoryPanel horseId={horseId} />
        </TabsContent>
        <TabsContent value="career" className="mt-4">
          <CareerPanel competitions={competitions} />
        </TabsContent>
        {horse.sex === 'female' && (
          <TabsContent value="reproduction" className="mt-4">
            <ReproductionPanel mare={horse} />
          </TabsContent>
        )}
        {horse.sex === 'male' && (
          <TabsContent value="approval" className="mt-4 space-y-4">
            <ApprovalBenefits status={horse.breeding_approval_status || 'not_evaluated'} />
            {currentUser && horse.created_by === currentUser.email && (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-6">
                  <StallionOfferPanel stallion={horse} currentUser={currentUser} />
                </CardContent>
              </Card>
            )}
            {horse.breeding_approval_date && (
              <Card className="border-0 bg-white/60">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-600 text-sm">Date d'approbation</span>
                    <span className="font-semibold text-stone-800">{new Date(horse.breeding_approval_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {horse.breeding_approval_breed && (
                    <div className="flex justify-between">
                      <span className="text-stone-600 text-sm">Race approuvée</span>
                      <span className="font-semibold text-stone-800">{horse.breeding_approval_breed}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}