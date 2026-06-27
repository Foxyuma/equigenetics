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
  const rareGenes = ['champagne', 'silver', 'mushroom'];
  const geno = stallion.genotype || {};
  // KIT locus actif (Tobiano, Sabino-1 ou Roan) = gène de robe recherché
  const hasActiveKit = geno.kit && geno.kit !== 'toto' && !['toto'].includes(geno.kit || '');
  let rareCount = rareGenes.filter(g => geno[g] && geno[g] !== 'nn' && geno[g] !== 'zz').length;
  if (hasActiveKit) rareCount += 1;
  // Perle : présent dans `cream` comme Crprl, nprl ou prlprl
  if (geno.cream && (geno.cream.includes('prl') && geno.cream !== 'nprl')) rareCount++;
  // Non-dun 1 (marques primitives sans dilution) : modéré mais prisé
  if (geno.dun && geno.dun !== 'nd2nd2') base += 500;
  base += rareCount * 1500;

  // Bonus victoires
  const wins = stallion.competition_wins || 0;
  base += wins * 300;

  // Multiplicateur d'approbation studbook
  const approvalMultipliers = {
    elite_approved: 2.5,
    approved_for_sport_breeding: 1.8,
    approved_for_breeding: 1.4,
    not_evaluated: 1.0,
    rejected: 0.7,
  };
  const mult = approvalMultipliers[stallion.breeding_approval_status] || 1.0;
  base = Math.round(base * mult);

  // Clamp: 800 → 50 000
  return Math.max(800, Math.min(50000, base));
}

const NPC_STALLION_NAMES = {
  "Arabian": ["Desert Prince", "Al Farid", "Regal Mirage", "Sahara Wind"],
  "Thoroughbred": ["Northern Dancer II", "Galileo's Legacy", "Frankel Star", "Sea The Stars Jr"],
  "Friesian": ["Nero van de Waard", "Tsjalle 454", "Jasper's Pride", "Friesian Night"],
  "Lipizzaner": ["Conversano Storno", "Neapolitano Favory", "Maestoso Alba", "Pluto Theodorosta"],
  "Anglo-Arabian": ["Fakir du Cadran", "Inshallah de Muze", "Jalil de Reve", "Kaïros de L'Isle"],
  "Haflinger": ["Hadrian von Seebach", "Landro vom Hohen Weg", "Mauro von Jerzens", "Norbert vom Alpenbach"],
  "Connemara": ["Finn MacCool", "Ballynahinch Grey", "Dun Na Ri", "Knockmore Hero"],
  "Selle Français": ["Baloubet du Rouet Jr", "Calvaro Z", "Diamant de Semilly II", "Espoir de la Loge"],
  "KWPN": ["Bustique", "Hickstead", "Verdades", "Totilas Z"],
  "Hanoverian": ["Weltmeyer II", "Sandro Hit Jr", "Blue Hors Don Schufro", "Donnerhall Jr"],
  "Holsteiner": ["Casall Jr", "Cador", "Calido I Jr", "Contefino"],
  "Oldenburg": ["Fürstenball", "Vitalis", "Belissimo M Jr", "Hochadel"],
  "Belgian Warmblood": ["Calvaro F.C.", "Querlybet Hero", "Griseldi", "Nonstop"],
  "Quarter Horse": ["Peppy San Badger Jr", "Hollywood Dun It", "Smart Like Juice", "Whiz's Echo"],
  "Paint Horse": ["Flashy Overo", "Tobiano King", "Color Me Bold", "Pinto Warrior"],
  "Appaloosa": ["Spotted Eagle", "Leopard Prince", "Snowflake Chief", "Pawnee Cloud"],
  "Shire": ["Black Knight", "Thunder", "Goliath", "Sampson"],
  "Shetland": ["Mini Thunder", "Tiny King", "Little Prince", "Pixie"],
};

// Tiers de qualité pour les étalons NPC
const QUALITY_TIERS = {
  medium: {
    label: 'Medium',
    statBoostRange: [0, 8],
    approvalStatus: 'approved_for_breeding',
    badgeClass: 'bg-blue-100 text-blue-700',
    badgeLabel: '✅ Approved',
    diseaseProb: 0.4,
    ageRange: [5, 15],
  },
  good: {
    label: 'Good',
    statBoostRange: [10, 20],
    approvalStatus: 'approved_for_sport_breeding',
    badgeClass: 'bg-green-100 text-green-700',
    badgeLabel: '🏆 Sport',
    diseaseProb: 0.25,
    ageRange: [6, 14],
  },
  excellent: {
    label: 'Very Good',
    statBoostRange: [22, 35],
    approvalStatus: 'elite_approved',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    badgeLabel: '⭐ Elite',
    diseaseProb: 0.12,
    ageRange: [5, 12],
  },
};

function generateSingleStallion(breed, name, tier) {
  const starter = generateStarterHorse(breed);
  const [minBoost, maxBoost] = tier.statBoostRange;
  const boostedStats = {};
  Object.entries(starter.stats || {}).forEach(([k, v]) => {
    boostedStats[k] = Math.min(100, v + minBoost + Math.floor(Math.random() * (maxBoost - minBoost + 1)));
  });

  // Maladie : les étalons approuvés sont généralement sains, mais un portage silencieux possible
  let health_genes = starter.health_genes || [];
  if (Math.random() > tier.diseaseProb) {
    health_genes = health_genes.map(g => {
      if (Math.random() > 0.8) return { ...g, status: 'carrier' };
      return g;
    });
  }

  const [ageMin, ageMax] = tier.ageRange;
  const stats = boostedStats;
  const adultAge = ageMin + Math.floor(Math.random() * (ageMax - ageMin + 1));
  // NPC stallions are adults → show adult coat (Gris if grey, not the birth colour)
  const adultCoat = determineCoatColor(starter.genotype, adultAge);

  const stallionObj = {
    stallion_name: name,
    breed,
    coat_color: adultCoat,
    age: adultAge,
    genotype: starter.genotype,
    stats,
    health_genes,
    owner_name: "Haras Nationaux",
    owner_email: "haras@national.equigenesis",
    is_npc: true,
    breeding_approval_status: tier.approvalStatus,
    description: `${tier.label.toLowerCase()} ${breed} stallion approved by the National Stud for studbook production.`,
  };
  stallionObj.price = calculateStallionPrice(stallionObj);
  return stallionObj;
}

export function generateNPCStallions() {
  const stallions = [];
  const tiers = [QUALITY_TIERS.medium, QUALITY_TIERS.good, QUALITY_TIERS.excellent];
  // Par race : 1 étalon de chaque tier si assez de noms, sinon répartir
  BREEDS.forEach(breed => {
    const names = NPC_STALLION_NAMES[breed] || [`${breed} Elite`, `${breed} Star`, `${breed} Stud`];
    const useNames = names.slice(0, 3);
    // Mélanger les noms et assigner un tier à chacun
    const shuffledNames = [...useNames].sort(() => Math.random() - 0.5);
    shuffledNames.forEach((name, i) => {
      const tier = tiers[i % tiers.length];
      stallions.push(generateSingleStallion(breed, name, tier));
    });
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

  // Génération automatique d'étalons NPC aux 3 tiers de qualité, tous approuvés
  useEffect(() => {
    if (!isLoading && stallions.length === 0) {
      const npcs = generateNPCStallions();
      Promise.all(npcs.map(s => base44.entities.StallionOffer.create(s)))
        .then(() => queryClient.invalidateQueries({ queryKey: ['stallion-offers'] }));
    }
  }, [isLoading, stallions.length]);

  // La régénération quotidienne des étalons NPC est gérée par DailyMarketRefresh
  // via le tick quotidien (3h30 UTC).

  const mares = horses.filter(h => h.sex === 'female' && h.created_by_id === currentUser?.id);
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
  const APPROVAL_CONFIG = {
    elite_approved: { label: '⭐ Elite', color: 'bg-yellow-100 text-yellow-700', multLabel: '×2.5' },
    approved_for_sport_breeding: { label: '🏆 Sport', color: 'bg-green-100 text-green-700', multLabel: '×1.8' },
    approved_for_breeding: { label: '✅ Approved', color: 'bg-blue-100 text-blue-700', multLabel: '×1.4' },
    not_evaluated: { label: '⏳ Pending', color: 'bg-stone-100 text-stone-500', multLabel: '×1.0' },
    rejected: { label: '❌ Rejected', color: 'bg-red-100 text-red-700', multLabel: '×0.7' },
  };

  const stallionsWithDynamicPrices = filteredStallions.map(s => ({
    ...s,
    dynamicPrice: s.price || calculateStallionPrice(s),
    approvalConfig: APPROVAL_CONFIG[s.breeding_approval_status] || null,
  }));

  const simulateBreeding = () => {
    if (!selectedStallion || !selectedMare) return;
    const childGenotype = breedGenotype(selectedStallion.genotype, selectedMare.genotype);
    const childStats = generateRandomStats(selectedStallion.stats, selectedMare.stats);
    const childHealth = inheritDiseases(selectedStallion.health_genes, selectedMare.health_genes, selectedMare.breed);
    const coatColor = determineCoatColor(childGenotype, 0);
    setFoalPreview({
      genotype: childGenotype,
      stats: childStats,
      health_genes: childHealth,
      coat_color: coatColor,
      sex: Math.random() > 0.5 ? 'male' : 'female',
      breed: selectedStallion.breed === selectedMare.breed ? selectedStallion.breed : `${selectedStallion.breed} x ${selectedMare.breed}`,
    });
    toast.success('Breeding simulation generated!');
  };

  const createFoalMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('Not logged in');
       const balance = currentUser.genesis_balance ?? 0;
       const actualPrice = selectedStallion.dynamicPrice || selectedStallion.price;
       if (balance < actualPrice) throw new Error('Insufficient funds');
       const foalData = { name: foalName, ...foalPreview, age: 0, energy: 100, competition_wins: 0, is_for_sale: false };
       foalData.estimated_value = estimateHorseValue(foalData);
       const foal = await base44.entities.Horse.create(foalData);
       await base44.auth.updateMe({ genesis_balance: balance - actualPrice });
       await base44.entities.Transaction.create({
         user_email: currentUser.email,
         currency: 'genesis',
         amount: -actualPrice,
         balance_after: balance - actualPrice,
         reason: `Breeding - ${selectedStallion.stallion_name} (${selectedStallion.breed})`,
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
      toast.success(`Foal registered! ${repGain >= 0 ? '+' : ''}${repGain} rep pts`);
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
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Stallion Market</h1>
        <p className="text-stone-500 mt-1">Choose a stallion to breed with your mare</p>
      </div>

      {/* Info qualité */}
      <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200 p-3 rounded-xl">
        <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span>Stallions are ranked by approval level — the breeding fee is <strong>multiplied</strong> by their status.</span>
        <div className="flex flex-wrap gap-1">
          <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px]">⭐ Elite : ×2.5</Badge>
          <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">🏆 Sport : ×1.8</Badge>
          <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">✅ Approved : ×1.4</Badge>
          <Badge className="bg-stone-100 text-stone-400 border-0 text-[10px]">⏳ Pending : ×1.0</Badge>
          <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">❌ Rejected : ×0.7</Badge>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterBreed} onValueChange={setFilterBreed}>
          <SelectTrigger className="w-52 bg-white/80"><SelectValue placeholder="All breeds" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All breeds</SelectItem>
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
          ✓ Approved only
        </button>
        <Badge className="bg-stone-100 text-stone-600 border-0 self-center">{stallionsWithDynamicPrices.length} stallions available</Badge>
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
                        <span className="text-xs text-stone-400 line-through block">{s.price.toLocaleString('en-GB')} ₲</span>
                      )}
                      <span className="text-amber-700 font-bold text-base">{s.dynamicPrice.toLocaleString('en-GB')} ₲</span>
                      {s.approvalConfig && s.approvalConfig.multLabel !== '×1.0' && (
                        <span className="text-[10px] text-amber-500 block">{s.approvalConfig.multLabel}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{s.breed}</Badge>
                    <Badge className="bg-stone-100 text-stone-600 border-0 text-xs">{s.coat_color}</Badge>
                    <Badge className="bg-blue-50 text-blue-600 border-0 text-xs">{s.age} yr(s)</Badge>
                    {s.approvalConfig && (
                      <Badge className={`border-0 text-xs ${s.approvalConfig.color}`} title={`Multiplicateur de prix : ${s.approvalConfig.multLabel}`}>
                        {s.approvalConfig.label}
                      </Badge>
                    )}
                  </div>
                  {/* Avg stat */}
                  {s.stats && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-stone-500">
                        Avg stats: <strong className="text-stone-700">{Math.round(Object.values(s.stats).reduce((a, b) => a + b, 0) / Object.keys(s.stats).length)}</strong>
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
              Breeding with {selectedStallion.stallion_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedMareId} onValueChange={(v) => { setSelectedMareId(v); setFoalPreview(null); }}>
                <SelectTrigger className="bg-white flex-1"><SelectValue placeholder="Choose your mare..." /></SelectTrigger>
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
                Simulate breeding
              </Button>
            </div>

            {/* Foal preview */}
            {foalPreview && (
              <div className="space-y-4 border-t border-stone-200 pt-4">
                {/* Forecast disclaimer */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    <strong>Indicative forecast:</strong> the foal's skills, genotype and sex may vary at actual birth. This simulation gives a probabilistic estimate based on both parents' genes.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`border-0 ${foalPreview.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {foalPreview.sex === 'male' ? '♂ Male (est.)' : '♀ Female (est.)'}
                  </Badge>
                  <Badge variant="outline">{foalPreview.breed}</Badge>
                  <Badge className="bg-stone-100 text-stone-600 border-0">{foalPreview.coat_color} (est.)</Badge>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-600 mb-2 flex items-center gap-1">
                    Estimated skills <span className="text-xs font-normal text-stone-400">(may vary)</span>
                  </h4>
                  <div className="space-y-1.5">
                    {Object.entries(foalPreview.stats).map(([s, v]) => <StatBar key={s} stat={s} value={v} />)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-stone-600 mb-2 flex items-center gap-1">
                    Estimated genotype <span className="text-xs font-normal text-stone-400">(may vary)</span>
                  </h4>
                  <GeneticPanel genotype={foalPreview.genotype} />
                </div>

                {foalPreview.health_genes?.some(g => g.status !== 'clear') && (
                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Genetic risks detected
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {foalPreview.health_genes.filter(g => g.status !== 'clear').map(g => (
                        <Badge key={g.disease} className={`text-xs border-0 ${g.status === 'affected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {g.disease}: {g.status === 'carrier' ? 'Carrier' : 'Affected'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-stone-200">
                  <                   Input placeholder="Foal's name..." value={foalName} onChange={e => setFoalName(e.target.value)} className="flex-1" />
                  <Button
                   onClick={() => createFoalMutation.mutate()}
                   disabled={!foalName || createFoalMutation.isPending}
                   className="bg-stone-800 hover:bg-stone-900"
                  >
                   <Baby className="w-4 h-4 mr-2" />
                   Confirm — {selectedStallion.dynamicPrice?.toLocaleString('en-GB') || selectedStallion.price?.toLocaleString('en-GB')} ₲
                  </Button>
                  <Button variant="outline" onClick={simulateBreeding}>🎲 Re-roll</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}