import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Baby, Dna, FlaskConical, Info, TrendingUp } from 'lucide-react';
import { breedGenotype, determineCoatColor, generateRandomStats, inheritDiseases, estimateHorseValue, BREEDS, generateStarterHorse } from '../components/genetics/GeneticsEngine';
import StatBar from '../components/horse/StatBar';
import GeneticPanel from '../components/horse/GeneticPanel';
import { toast } from 'sonner';

/**
 * Calcule le prix de saillie dynamique en fonction :
 * - de la moyenne des stats (qualité sportive)
 * - du nombre de gènes rares (champagne, silver, dun, roan)
 * - du statut d'approbation studbook
 * - des victoires en compétition (si connues)
 */
function calculateStallionPrice(stallion) {
  const stats = stallion.stats || {};
  const statKeys = Object.keys(stats);
  const avgStat = statKeys.length > 0
    ? Math.round(statKeys.reduce((sum, k) => sum + (stats[k] || 0), 0) / statKeys.length)
    : 50;

  // Base: 1 000 + 200 pts par point de stat au-dessus de 50
  const statBonus = Math.max(0, avgStat - 50) * 200;
  let base = 1000 + statBonus;

  // Bonus gènes rares
  const rareGenes = ['champagne', 'silver', 'dun', 'roan'];
  const geno = stallion.genotype || {};
  const rareCount = rareGenes.filter(g => geno[g] && geno[g] !== 'nn' && geno[g] !== 'dd' && geno[g] !== 'zz').length;
  base += rareCount * 1500;

  // Bonus victoires
  const wins = stallion.competition_wins || 0;
  base += wins * 300;

  // Multiplicateur d'approbation studbook
  const approvalMultipliers = {
    elite_approved: 2.0,
    approved_for_sport_breeding: 1.6,
    approved_for_breeding: 1.3,
    not_evaluated: 1.0,
    rejected: 0.7,
  };
  const mult = approvalMultipliers[stallion.breeding_approval_status] || 1.0;
  base = Math.round(base * mult);

  // Clamp: 800 → 50 000
  return Math.max(800, Math.min(50000, base));
}

const NPC_STALLION_NAMES = {
  "Thoroughbred": ["Northern Dancer II", "Galileo's Legacy", "Frankel Star", "Sea The Stars Jr"],
  "Arabian": ["Desert Prince", "Al Farid", "Regal Mirage", "Sahara Wind"],
  "Warmblood": ["Hanoverian King", "Westphalian Gold", "Dutch Master", "KWPN Royale"],
  "Quarter Horse": ["Peppy San Badger Jr", "Hollywood Dun It", "Smart Like Juice", "Whiz's Echo"],
  "Appaloosa": ["Spotted Eagle", "Leopard Prince", "Snowflake Chief", "Pawnee Cloud"],
  "Paint": ["Flashy Overo", "Tobiano King", "Color Me Bold", "Pinto Warrior"],
  "Friesian": ["Nero van de Waard", "Tsjalle 454", "Jasper's Pride", "Friesian Night"],
  "Andalusian": ["Fuego de Espana", "Lusitano Rey", "Don Pablo", "Maestro Real"],
  "Morgan": ["Figure's Line", "Ethan Allen III", "Justin Morgan Jr", "Vermont Pride"],
  "Tennessee Walker": ["Midnight Sun Jr", "Pride of Morning", "Walking Tall", "Southern Grace"],
};

function generateNPCStallions() {
  const stallions = [];
  const usedBreeds = [...BREEDS];
  // 2-3 per breed
  usedBreeds.forEach(breed => {
    const count = 2 + Math.floor(Math.random() * 2);
    const names = NPC_STALLION_NAMES[breed] || [`${breed} Champion`, `${breed} Elite`, `${breed} Noble`];
    for (let i = 0; i < count && i < names.length; i++) {
      const starter = generateStarterHorse(breed);
      // Boost NPC stats a bit (they're supposed to be good stallions)
      const boostedStats = {};
      Object.entries(starter.stats || {}).forEach(([k, v]) => {
        boostedStats[k] = Math.min(100, v + 5 + Math.floor(Math.random() * 15));
      });
      const diseaseChance = Math.random();
      let health_genes = starter.health_genes || [];
      // ~30% chance of having a disease gene
      if (diseaseChance > 0.7) {
        health_genes = health_genes.map(g => {
          if (Math.random() > 0.7) return { ...g, status: 'carrier' };
          return g;
        });
      }
      // Statut d'approbation aléatoire pour les NPC (majorité approuvés car sélectionnés)
      const approvalRoll = Math.random();
      let breeding_approval_status;
      if (approvalRoll < 0.15) breeding_approval_status = 'elite_approved';
      else if (approvalRoll < 0.45) breeding_approval_status = 'approved_for_sport_breeding';
      else if (approvalRoll < 0.80) breeding_approval_status = 'approved_for_breeding';
      else breeding_approval_status = 'not_evaluated';

      const stallionObj = {
        stallion_name: names[i],
        breed,
        coat_color: starter.coat_color,
        age: 5 + Math.floor(Math.random() * 10),
        genotype: starter.genotype,
        stats: boostedStats,
        health_genes,
        owner_name: "Haras Nationaux",
        owner_email: "haras@national.equigenesis",
        is_npc: true,
        breeding_approval_status,
        description: `Étalon de race ${breed} sélectionné par les Haras Nationaux pour ses qualités génétiques.`,
      };
      // Prix calculé dynamiquement
      stallionObj.price = calculateStallionPrice(stallionObj);
      stallions.push(stallionObj);
    }
  });
  return stallions;
}

export default function StallionMarket() {
  const [selectedStallion, setSelectedStallion] = useState(null);
  const [selectedMareId, setSelectedMareId] = useState('');
  const [foalPreview, setFoalPreview] = useState(null);
  const [foalName, setFoalName] = useState('');
  const [filterBreed, setFilterBreed] = useState('all');
  const [filterApprovedOnly, setFilterApprovedOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: horses = [] } = useQuery({ queryKey: ['horses'], queryFn: () => base44.entities.Horse.list('-created_date', 200) });
  const { data: stallions = [], isLoading } = useQuery({
    queryKey: ['stallion-offers'],
    queryFn: () => base44.entities.StallionOffer.list('-created_date', 200),
  });

  // Auto-generate NPC stallions if none
  useEffect(() => {
    if (!isLoading && stallions.length === 0) {
      const npcs = generateNPCStallions();
      Promise.all(npcs.map(s => base44.entities.StallionOffer.create(s)))
        .then(() => queryClient.invalidateQueries({ queryKey: ['stallion-offers'] }));
    }
  }, [isLoading, stallions.length]);

  const mares = horses.filter(h => h.sex === 'female');
  const selectedMare = mares.find(h => h.id === selectedMareId);

  let filteredStallions = filterBreed === 'all' ? stallions : stallions.filter(s => s.breed === filterBreed);
  if (filterApprovedOnly) {
    filteredStallions = filteredStallions.filter(s => 
      s.breeding_approval_status && 
      s.breeding_approval_status !== 'not_evaluated' && 
      s.breeding_approval_status !== 'rejected'
    );
  }

  // Le prix stocké est déjà dynamique ; on l'expose tel quel
  const stallionsWithDynamicPrices = filteredStallions.map(s => ({
    ...s,
    dynamicPrice: s.price || calculateStallionPrice(s),
  }));

  const simulateBreeding = () => {
    if (!selectedStallion || !selectedMare) return;
    const childGenotype = breedGenotype(selectedStallion.genotype, selectedMare.genotype);
    const childStats = generateRandomStats(selectedStallion.stats, selectedMare.stats);
    const childHealth = inheritDiseases(selectedStallion.health_genes, selectedMare.health_genes, selectedMare.breed);
    const coatColor = determineCoatColor(childGenotype);
    setFoalPreview({
      genotype: childGenotype,
      stats: childStats,
      health_genes: childHealth,
      coat_color: coatColor,
      sex: Math.random() > 0.5 ? 'male' : 'female',
      breed: selectedStallion.breed === selectedMare.breed ? selectedStallion.breed : `${selectedStallion.breed} x ${selectedMare.breed}`,
    });
    toast.success('Simulation de croisement générée !');
  };

  const createFoalMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('Non connecté');
       const balance = currentUser.genesis_balance ?? 0;
       const actualPrice = selectedStallion.dynamicPrice || selectedStallion.price;
       if (balance < actualPrice) throw new Error('Fonds insuffisants');
       const foalData = { name: foalName, ...foalPreview, age: 0, energy: 100, competition_wins: 0, is_for_sale: false };
       foalData.estimated_value = estimateHorseValue(foalData);
       const foal = await base44.entities.Horse.create(foalData);
       await base44.auth.updateMe({ genesis_balance: balance - actualPrice });
       await base44.entities.Transaction.create({
         user_email: currentUser.email,
         currency: 'genesis',
         amount: -actualPrice,
         balance_after: balance - actualPrice,
         reason: `Saillie - ${selectedStallion.stallion_name} (${selectedStallion.breed})`,
       });
      await base44.entities.BreedingRecord.create({
        father_id: selectedStallion.id,
        mother_id: selectedMare.id,
        father_name: selectedStallion.stallion_name,
        mother_name: selectedMare.name,
        foal_id: foal.id,
        foal_name: foalName,
        breed: foalPreview.breed,
      });
      const avgStat = Math.round(Object.values(foalPreview.stats || {}).reduce((a, b) => a + b, 0) / 7);
      const isPure = selectedStallion.breed === selectedMare.breed;
      const affectedCount = foalPreview?.health_genes?.filter(g => g.status === 'affected').length || 0;
      const carrierCount = foalPreview?.health_genes?.filter(g => g.status === 'carrier').length || 0;
      const repGain = 50 + (isPure ? 25 : 0) + (affectedCount === 0 ? 15 : 0) + Math.round((avgStat - 50) * 0.5) - (affectedCount * 40) - (carrierCount * 10);
      const currentRep = currentUser.breeding_reputation ?? 0;
      await base44.auth.updateMe({ breeding_reputation: currentRep + repGain });
      return repGain;
    },
    onSuccess: (repGain) => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`Poulain enregistré ! ${repGain >= 0 ? '+' : ''}${repGain} pts réputation`);
      setFoalPreview(null);
      setFoalName('');
      setSelectedStallion(null);
      setSelectedMareId('');
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Marché des Saillies</h1>
        <p className="text-stone-500 mt-1">Choisissez un étalon pour reproduire avec votre jument</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterBreed} onValueChange={setFilterBreed}>
          <SelectTrigger className="w-52 bg-white/80"><SelectValue placeholder="Toutes les races" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les races</SelectItem>
            {BREEDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          onClick={() => setFilterApprovedOnly(!filterApprovedOnly)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filterApprovedOnly
              ? 'bg-green-600 text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          ✓ Approuvés uniquement
        </button>
        <Badge className="bg-stone-100 text-stone-600 border-0 self-center">{stallionsWithDynamicPrices.length} étalons disponibles</Badge>
      </div>

      {/* Stallions grid */}
      {isLoading || stallionsWithDynamicPrices.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 rounded-2xl bg-stone-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stallionsWithDynamicPrices.map(s => {
            const hasDiseases = s.health_genes?.some(g => g.status !== 'clear');
            const isSelected = selectedStallion?.id === s.id;
            return (
              <Card
                key={s.id}
                onClick={() => { setSelectedStallion(s); setFoalPreview(null); }}
                className={`cursor-pointer transition-all border-2 ${isSelected ? 'border-amber-400 bg-amber-50/50' : 'border-transparent bg-white/60 hover:border-stone-300'}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-stone-800">{s.stallion_name}</p>
                      <p className="text-xs text-stone-500">{s.owner_name}</p>
                    </div>
                    <div className="text-right">
                      {s.dynamicPrice !== s.price && (
                        <span className="text-xs text-stone-400 line-through block">{s.price.toLocaleString('fr-FR')} ₲</span>
                      )}
                      <span className="text-amber-700 font-bold text-sm">{s.dynamicPrice.toLocaleString('fr-FR')} ₲</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{s.breed}</Badge>
                    <Badge className="bg-stone-100 text-stone-600 border-0 text-xs">{s.coat_color}</Badge>
                    <Badge className="bg-blue-50 text-blue-600 border-0 text-xs">{s.age} ans</Badge>
                    {s.breeding_approval_status === 'elite_approved' && <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">⭐ Élite</Badge>}
                    {s.breeding_approval_status === 'approved_for_sport_breeding' && <Badge className="bg-green-100 text-green-700 border-0 text-xs">🏆 Sport</Badge>}
                    {s.breeding_approval_status === 'approved_for_breeding' && <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">✅ Approuvé</Badge>}
                    {s.breeding_approval_status === 'not_evaluated' && <Badge className="bg-stone-100 text-stone-500 border-0 text-xs">— Non évalué</Badge>}
                    {s.breeding_approval_status === 'rejected' && <Badge className="bg-red-100 text-red-700 border-0 text-xs">❌ Rejeté</Badge>}
                  </div>
                  {/* Avg stat */}
                  {s.stats && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-stone-500">
                        Moy. stats: <strong className="text-stone-700">{Math.round(Object.values(s.stats).reduce((a, b) => a + b, 0) / Object.keys(s.stats).length)}</strong>
                      </span>
                    </div>
                  )}
                  {/* Genes */}
                  {s.genotype && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(s.genotype).slice(0, 5).map(([k, v]) => (
                        <span key={k} className="px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-mono">{v}</span>
                      ))}
                    </div>
                  )}
                  {/* Disease warning */}
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

      {/* Breeding panel */}
      {selectedStallion && (
        <Card className="border-0 bg-gradient-to-br from-blue-50/50 to-pink-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dna className="w-5 h-5 text-violet-500" />
              Reproduction avec {selectedStallion.stallion_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedMareId} onValueChange={(v) => { setSelectedMareId(v); setFoalPreview(null); }}>
                <SelectTrigger className="bg-white flex-1"><SelectValue placeholder="Choisir votre jument..." /></SelectTrigger>
                <SelectContent>
                  {mares.map(h => <SelectItem key={h.id} value={h.id}>{h.name} — {h.breed}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                onClick={simulateBreeding}
                disabled={!selectedMareId}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                Simuler le croisement
              </Button>
            </div>

            {/* Foal preview */}
            {foalPreview && (
              <div className="space-y-4 border-t border-stone-200 pt-4">
                {/* Forecast disclaimer */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    <strong>Prévision indicative :</strong> les compétences, le génotype et le sexe du poulain peuvent varier lors de la naissance réelle. Cette simulation donne une estimation probabiliste basée sur les gènes des deux parents.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`border-0 ${foalPreview.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {foalPreview.sex === 'male' ? '♂ Mâle (estimé)' : '♀ Femelle (estimé)'}
                  </Badge>
                  <Badge variant="outline">{foalPreview.breed}</Badge>
                  <Badge className="bg-stone-100 text-stone-600 border-0">{foalPreview.coat_color} (estimé)</Badge>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-600 mb-2 flex items-center gap-1">
                    Compétences estimées <span className="text-xs font-normal text-stone-400">(peuvent varier)</span>
                  </h4>
                  <div className="space-y-1.5">
                    {Object.entries(foalPreview.stats).map(([s, v]) => <StatBar key={s} stat={s} value={v} />)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-600 mb-2 flex items-center gap-1">
                    Génotype estimé <span className="text-xs font-normal text-stone-400">(peut varier)</span>
                  </h4>
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
                   onClick={() => createFoalMutation.mutate()}
                   disabled={!foalName || createFoalMutation.isPending}
                   className="bg-stone-800 hover:bg-stone-900"
                  >
                   <Baby className="w-4 h-4 mr-2" />
                   Confirmer — {selectedStallion.dynamicPrice?.toLocaleString('fr-FR') || selectedStallion.price?.toLocaleString('fr-FR')} ₲
                  </Button>
                  <Button variant="outline" onClick={simulateBreeding}>🎲 Relancer</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}