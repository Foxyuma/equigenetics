import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Baby, FlaskConical, Info, TrendingUp, Calendar, Clock, Gift, Sparkles, ChevronDown } from 'lucide-react';
import { calcFoalBirthRepGain, getTier } from '@/lib/breedingReputation';
import { breedGenotype, determineCoatColor, generateRandomStats, inheritDiseases, estimateHorseValue, checkFoalViability, determineFoalDeathAge, determineBreedFromParents, generateFoalTraits } from '../genetics/GeneticsEngine';

function calcDynamicPrice(stallion) {
  if (!stallion || stallion.is_own) return 0;
  const stats = stallion.stats || {};
  const keys = Object.keys(stats);
  const avg = keys.length > 0 ? keys.reduce((s, k) => s + (stats[k] || 0), 0) / keys.length : 50;
  let base = 1000 + Math.max(0, avg - 50) * 200;
  const rareGenes = ['champagne', 'silver'];
  const geno = stallion.genotype || {};
  const hasActiveKit = geno.kit && geno.kit !== 'toto' && !['toto'].includes(geno.kit || '');
  const rareCount = rareGenes.filter(g => geno[g] && geno[g] !== 'nn' && geno[g] !== 'zz').length + (hasActiveKit ? 1 : 0);
  // Non-dun 1 (marques primitives sans dilution) : modéré
  if (geno.dun && geno.dun !== 'nd2nd2') base += 500;
  base += rareCount * 1500;
  base += (stallion.competition_wins || 0) * 300;
  const mult = { elite_approved: 2.5, approved_for_sport_breeding: 1.8, approved_for_breeding: 1.4, not_evaluated: 1.0, rejected: 0.7 }[stallion.breeding_approval_status] || 1.0;
  return Math.max(800, Math.min(50000, Math.round(base * mult)));
}
import { getBreedingImpact } from '../breeding/InspectionScoring';
import StatBar from './StatBar';
import GeneticPanel from './GeneticPanel';
import { toast } from 'sonner';
import { addDays, format, isPast, parseISO, differenceInWeeks } from 'date-fns';
import { enGB } from 'date-fns/locale';

// 1 mois de jeu = 14 jours réels (2 semaines)
// Gestation = 11 mois + 4 jours = 11 × 14 + 4 = 158 jours réels
const GESTATION_DAYS = 158;

export default function ReproductionPanel({ mare }) {
  const [selectedStallion, setSelectedStallion] = useState(null);
  const [stallionSource, setStallionSource] = useState('own');
  const [foalPreview, setFoalPreview] = useState(null);
  const [breedingDateChoice, setBreedingDateChoice] = useState('immediate');
  const [birthingFoal, setBirthingFoal] = useState(null);
  const [foalName, setFoalName] = useState('');
  const [selectedAffixe, setSelectedAffixe] = useState(() => {
    const saved = localStorage.getItem('equigenesis_last_affixe');
    const affixes = JSON.parse(localStorage.getItem('equigenesis_my_affixes') || '[]');
    if (saved && affixes.length > 0) {
      const match = affixes.find(a => a.name === saved);
      if (match) return match;
    }
    return null;
  });
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: ownHorses = [] } = useQuery({
    queryKey: ['horses', currentUser?.email],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
  });
  const { data: stallionOffers = [] } = useQuery({ queryKey: ['stallion-offers'], queryFn: () => base44.entities.StallionOffer.list('-created_date', 200) });
  const { data: pendingBreedings = [] } = useQuery({
    queryKey: ['breeding-pending', mare.id],
    queryFn: () => base44.entities.BreedingRecord.filter({ mother_id: mare.id, status: 'pending' }, '-created_date', 20),
  });

  const [breedFilter, setBreedFilter] = useState('');
  const ownMales = ownHorses.filter(h => h.sex === 'male');
  const allStallions = stallionSource === 'own'
    ? ownMales.map(h => ({ ...h, stallion_name: h.name, price: 0, owner_name: 'My stable', is_own: true }))
    : stallionOffers;
  const stallionsToShow = breedFilter
    ? allStallions.filter(s => s.breed === breedFilter)
    : allStallions;
  const availableBreeds = [...new Set(allStallions.map(s => s.breed))].sort();
  // Pre-fill breed filter with mare's breed by default
  React.useEffect(() => { if (mare?.breed && !breedFilter) setBreedFilter(mare.breed); }, [mare?.breed]);

  const getBreedingDate = () => {
    const now = new Date();
    if (breedingDateChoice === 'scheduled') {
      const d = new Date(now);
      d.setDate(d.getDate() + 30);
      return d;
    }
    return now;
  };

  const simulateBreeding = () => {
    if (!selectedStallion) return;
    const childGenotype = breedGenotype(selectedStallion.genotype, mare.genotype);
    const childStats = generateRandomStats(selectedStallion.stats, mare.stats);
    const childHealth = inheritDiseases(selectedStallion.health_genes, mare.health_genes, mare.breed);
    const coatColor = determineCoatColor(childGenotype, 0);
    
    const viability = checkFoalViability(selectedStallion.health_genes, mare.health_genes, mare.breed);
    const deathAge = !viability.viable ? null : determineFoalDeathAge(childHealth);
    const breedResult = determineBreedFromParents(selectedStallion.breed, mare.breed, selectedStallion.breeding_approval_status);
    const foalTraits = generateFoalTraits(selectedStallion, mare, breedResult.breed);
    
    setFoalPreview({
      genotype: childGenotype,
      stats: childStats,
      health_genes: childHealth,
      coat_color: coatColor,
      sex: Math.random() > 0.5 ? 'male' : 'female',
      breed: breedResult.breed,
      isOC: breedResult.isOC,
      ocMessage: breedResult.message,
      viable: viability.viable,
      viability_cause: viability.cause,
      death_age: deathAge,
      ...foalTraits,
    });
    // Note: sex, stats and color are surprises — not revealed before birth
  };

  const confirmBreedingMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('Not logged in');
      const price = selectedStallion.is_own ? 0 : calcDynamicPrice(selectedStallion);
      if (price > 0) {
        const balance = currentUser.genesis_balance ?? 0;
        if (balance < price) throw new Error('Insufficient funds');
        await base44.auth.updateMe({ genesis_balance: balance - price });
        await base44.entities.Transaction.create({
          user_email: currentUser.email,
          currency: 'genesis',
          amount: -price,
          balance_after: balance - price,
          reason: `Breeding - ${selectedStallion.stallion_name} (${selectedStallion.breed})`,
        });
      }
      // Consumes 25 energy from the mare
      const newEnergy = Math.max(0, (mare.energy ?? 100) - 25);
      await base44.entities.Horse.update(mare.id, { energy: newEnergy });

      const breedingDate = getBreedingDate();
      const dueDate = addDays(breedingDate, GESTATION_DAYS);
      await base44.entities.BreedingRecord.create({
        father_id: selectedStallion.is_own ? selectedStallion.id : null,
        mother_id: mare.id,
        father_name: selectedStallion.stallion_name,
        mother_name: mare.name,
        breed: foalPreview.breed,
        status: 'pending',
        breeding_date: format(breedingDate, 'yyyy-MM-dd'),
        foal_due_date: format(dueDate, 'yyyy-MM-dd'),
        foal_genotype: foalPreview.genotype,
        foal_stats: foalPreview.stats,
        foal_health_genes: foalPreview.health_genes,
        foal_coat_color: foalPreview.coat_color,
        foal_sex: foalPreview.sex,
        foal_breed: foalPreview.breed,
        is_oc: foalPreview.isOC,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-pending', mare.id] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      const breedingDate = getBreedingDate();
      const dueDate = addDays(breedingDate, GESTATION_DAYS);
      const label = breedingDateChoice === 'immediate' ? 'immediately' : 'in 30 days';
      toast.success(`Breeding confirmed ${label}! Birth expected on ${format(dueDate, 'd MMMM yyyy', { locale: enGB })} 🐴`);
      setFoalPreview(null);
      setSelectedStallion(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const generateFoalName = async () => {
    if (!birthingFoal) return;
    setIsGeneratingName(true);
    try {
      const affixes = currentUser?.affixes ?? [];
      const affixInfo = selectedAffixe
        ? `The breeding affix is "${selectedAffixe.name}" (placed as ${selectedAffixe.position === 'prefix' ? 'prefix' : 'suffixe'}).`
        : affixes.length > 0
          ? `The breeder has affix "${affixes[0].name}" but has not selected it.`
          : 'No breeding affix.';
      const prompt = `You are an expert in naming purebred horses. Suggest 5 short elegant names for a ${birthingFoal.foal_breed} foal, ${birthingFoal.foal_coat_color} coat, born from sire ${birthingFoal.father_name} and dam ${mare.name}. ${affixInfo} The names should sound noble, poetic, and fitting for equestrian tradition. Return only the 5 names, one per line, no numbering or explanation.`;
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      const names = result.split('\n').map(n => n.trim()).filter(Boolean).slice(0, 5);
      if (names.length > 0) {
        // Appliquer l'affixe automatiquement si sélectionné
        const baseName = names[0];
        let finalName = baseName;
        if (selectedAffixe) {
          finalName = selectedAffixe.position === 'prefix'
            ? `${selectedAffixe.name} ${baseName}`
            : `${baseName} ${selectedAffixe.name}`;
        }
        setFoalName(finalName);
        // Stocker les suggestions pour pouvoir en choisir une autre
        setNameSuggestions(names);
      }
    } catch (e) {
      // silence
    }
    setIsGeneratingName(false);
  };

  const birthFoalMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !birthingFoal || !foalName) throw new Error('Missing data');
      const foalTraits = generateFoalTraits(
        birthingFoal.father_id ? { id: birthingFoal.father_id } : null,
        mare,
        birthingFoal.foal_breed
      );
      const foalData = {
        name: foalName,
        genotype: birthingFoal.foal_genotype,
        stats: birthingFoal.foal_stats,
        health_genes: birthingFoal.foal_health_genes,
        coat_color: birthingFoal.foal_coat_color,
        sex: birthingFoal.foal_sex,
        breed: birthingFoal.foal_breed,
        father_id: birthingFoal.father_id,
        mother_id: mare.id,
        age: 0,
        energy: 100,
        competition_wins: 0,
        is_for_sale: false,
        studbook_registered: false,
        character: foalTraits.character,
        mental_traits: foalTraits.mental_traits,
        morphology: foalTraits.morphology,
        genetic_potential: foalTraits.genetic_potential,
      };
      foalData.estimated_value = estimateHorseValue(foalData);
      const foal = await base44.entities.Horse.create(foalData);
      await base44.entities.BreedingRecord.update(birthingFoal.id, {
        status: 'born',
        foal_id: foal.id,
        foal_name: foalName,
      });
      const { gain: repGain } = calcFoalBirthRepGain(foalData.stats);
      await base44.auth.updateMe({ breeding_reputation: (currentUser.breeding_reputation ?? 0) + repGain });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-pending', mare.id] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`${foalName} is born! 🐴`);
      setBirthingFoal(null);
      setFoalName('');
      setSelectedAffixe(null);
      setNameSuggestions([]);
    },
    onError: (err) => toast.error(err.message),
  });

  const readyToBeborn = pendingBreedings.filter(b => isPast(parseISO(b.foal_due_date)));
  const waitingBreedings = pendingBreedings.filter(b => !isPast(parseISO(b.foal_due_date)));

  // Minimum age check for breeding
  if ((mare.age ?? 0) < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <span className="text-5xl">🌱</span>
        <h3 className="text-lg font-semibold text-stone-700">Too young to breed</h3>
        <p className="text-stone-500 text-sm max-w-sm">
          <strong>{mare.name}</strong> is {mare.age} year{mare.age > 1 ? 's' : ''} old. Mares must be at least <strong>3 years</strong> old to be bred.
        </p>
      </div>
    );
  }

  // Direct inbreeding check (parent × child)
  const isIncestPair = (stallion) => {
    if (!stallion || !mare) return false;
    // Foal × its dam
    if (stallion.mother_id && stallion.mother_id === mare.id) return true;
    // Filly × her sire
    if (mare.father_id && mare.father_id === stallion.id) return true;
    return false;
  };

  // Blocks the selected stallion if in an incestuous relationship
  const breedingBlocked = selectedStallion && isIncestPair(selectedStallion);

  return (
    <div className="space-y-6">
      {readyToBeborn.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-500" /> Births ready!
          </h3>
          {readyToBeborn.map(b => (
            <Card key={b.id} className="border-2 border-pink-200 bg-pink-50/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-stone-800">{b.father_name} × {b.mother_name}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs">{b.foal_breed}</Badge>
                      <Badge className="bg-stone-100 text-stone-600 border-0 text-xs">{b.foal_coat_color}</Badge>
                      <Badge className={`border-0 text-xs ${b.foal_sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {b.foal_sex === 'male' ? '♂' : '♀'}
                      </Badge>
                    </div>
                  </div>
                  <Baby className="w-6 h-6 text-pink-400" />
                </div>
                {birthingFoal?.id === b.id ? (
                  <div className="space-y-3">
                    {/* Sélection affixe */}
                    {(currentUser?.affixes ?? []).length > 0 && (
                      <div>
                        <p className="text-xs text-stone-500 font-medium mb-1.5">Breeding affix</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => { setSelectedAffixe(null); localStorage.removeItem('equigenesis_last_affixe'); }}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${!selectedAffixe ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-300 hover:border-stone-400'}`}
                          >
                            No affix
                          </button>
                          {(currentUser.affixes ?? []).map((a, i) => (
                            <button
                              key={i}
                              onClick={() => { setSelectedAffixe(a); localStorage.setItem('equigenesis_last_affixe', a.name); localStorage.setItem('equigenesis_my_affixes', JSON.stringify(currentUser.affixes)); }}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-all font-semibold ${selectedAffixe?.name === a.name ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-500'}`}
                            >
                              {a.position === 'prefix' ? `${a.name} …` : `… ${a.name}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nom */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Foal's name..."
                        value={foalName}
                        onChange={e => setFoalName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        variant="outline"
                        onClick={generateFoalName}
                        disabled={isGeneratingName}
                        className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                        title="Suggest a name via AI"
                      >
                        {isGeneratingName ? (
                          <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Suggestions IA */}
                    {nameSuggestions.length > 0 && (
                      <div>
                        <p className="text-xs text-stone-400 mb-1">Other suggestions:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {nameSuggestions.map((n, i) => {
                            const displayName = selectedAffixe
                              ? selectedAffixe.position === 'prefix' ? `${selectedAffixe.name} ${n}` : `${n} ${selectedAffixe.name}`
                              : n;
                            return (
                              <button
                                key={i}
                                onClick={() => setFoalName(displayName)}
                                className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-700 border border-stone-200 transition-all"
                              >
                                {displayName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => birthFoalMutation.mutate()}
                        disabled={!foalName || birthFoalMutation.isPending}
                        className="flex-1 bg-stone-800 hover:bg-stone-900"
                      >
                        {birthFoalMutation.isPending ? 'Birth in progress…' : 'Name & birth'}
                      </Button>
                      <Button variant="outline" onClick={() => { setBirthingFoal(null); setFoalName(''); setNameSuggestions([]); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => { setBirthingFoal(b); setFoalName(''); }}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                  >
                    <Baby className="w-4 h-4 mr-2" /> Birth this foal
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {waitingBreedings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" /> Ongoing pregnancies
          </h3>
          {waitingBreedings.map(b => {
            const weeksLeft = differenceInWeeks(parseISO(b.foal_due_date), new Date());
            const monthsLeft = Math.max(0, Math.ceil(weeksLeft / 3));
            return (
            <Card key={b.id} className="border border-amber-200 bg-amber-50/40">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-700">{b.father_name} × {b.mother_name}</p>
                  <p className="text-xs text-stone-400">{b.foal_breed} · {b.foal_coat_color}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-700 font-semibold">
                    {monthsLeft > 0 ? `${monthsLeft} month${monthsLeft > 1 ? 's' : ''} left` : 'Ready to birth'}
                  </p>
                  {b.is_oc && <p className="text-xs text-orange-600">OC</p>}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-stone-700">New breeding</h3>
        <Tabs value={stallionSource} onValueChange={(v) => { setStallionSource(v); setSelectedStallion(null); setFoalPreview(null); }}>
          <TabsList className="bg-stone-100/80">
            <TabsTrigger value="own">My stallions ({ownMales.length})</TabsTrigger>
            <TabsTrigger value="market">Stallion market ({stallionOffers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={stallionSource} className="mt-4">
            {availableBreeds.length > 1 && (
              <div className="mb-3">
                <p className="text-xs text-stone-500 font-medium mb-1.5">Filter by breed</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setBreedFilter('')}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${!breedFilter ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                  >
                    All
                  </button>
                  {availableBreeds.map(b => (
                    <button
                      key={b}
                      onClick={() => setBreedFilter(b)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${breedFilter === b ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {stallionsToShow.length === 0 ? (
              <p className="text-stone-400 text-sm py-6 text-center">No stallions available for this breed</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stallionsToShow.map(s => {
                  const isSelected = selectedStallion?.id === s.id && selectedStallion?.is_own === s.is_own;
                  const hasDiseases = s.health_genes?.some(g => g.status !== 'clear');
                  const approvalStatus = s.breeding_approval_status || 'not_evaluated';
                  const breedingImpact = getBreedingImpact(approvalStatus);
                  const incestBlocked = isIncestPair(s);
                  const approvalConfig = {
                    elite_approved: { label: '⭐ Elite ×2.5', color: 'bg-yellow-100 text-yellow-700', multLabel: '×2.5', mult: 2.5 },
                    approved_for_sport_breeding: { label: '🏆 Sport ×1.8', color: 'bg-green-100 text-green-700', multLabel: '×1.8', mult: 1.8 },
                    approved_for_breeding: { label: '✅ Approved ×1.4', color: 'bg-blue-100 text-blue-700', multLabel: '×1.4', mult: 1.4 },
                    not_evaluated: { label: '⏳ Pending ×1.0', color: 'bg-stone-100 text-stone-400', multLabel: '×1.0', mult: 1.0 },
                    rejected: { label: '❌ Rejected ×0.7', color: 'bg-red-100 text-red-700', multLabel: '×0.7', mult: 0.7 },
                    }[s.breeding_approval_status] || { label: '⏳ Pending ×1.0', color: 'bg-stone-100 text-stone-400', multLabel: '×1.0', mult: 1.0 };
                  return (
                   <Card
                      key={s.id}
                      onClick={() => { if (!incestBlocked) { setSelectedStallion(s); setFoalPreview(null); } }}
                      className={`transition-all border-2 ${incestBlocked ? 'opacity-50 cursor-not-allowed border-red-200 bg-red-50/30' : 'cursor-pointer hover:border-stone-300'} ${isSelected ? 'border-amber-400 bg-amber-50/50' : 'border-transparent bg-white/70'}`}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-stone-800 text-sm">{s.stallion_name}</p>
                            <p className="text-xs text-stone-400">{s.owner_name}</p>
                          </div>
                          {incestBlocked && (
                            <Badge className="bg-red-100 text-red-700 border-0 text-xs">🚫 Parent/child</Badge>
                            )}
                            {s.is_own
                             ? <span className="text-emerald-600 font-bold text-sm">Free</span>
                              : <div className="text-right">
                                  <p className="text-amber-700 font-bold text-sm">{calcDynamicPrice(s).toLocaleString('en-GB')} ₲</p>
                                  <Badge className={`border-0 text-[10px] ${approvalConfig.color}`} title={`Price multiplier: ${approvalConfig.multLabel}`}>
                                    {approvalConfig.label}
                                  </Badge>
                                </div>
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
                              Avg <strong>{Math.round(Object.values(s.stats).reduce((a, b) => a + b, 0) / Object.keys(s.stats).length)}</strong>
                            </span>
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
                         {/* Approval status — visible only if restriction or not evaluated */}
                         {(approvalStatus === 'not_evaluated' || breedingImpact.restrictions.length > 0) && (
                           <div className="text-xs text-stone-600 mt-1.5 p-2 rounded bg-stone-50">
                             <div className="flex items-center gap-2 mb-1">
                               <Badge className={`border-0 text-[10px] ${approvalConfig.color}`}>{approvalConfig.label}</Badge>
                             </div>
                             <p className="text-stone-500">{breedingImpact.description}</p>
                             {breedingImpact.restrictions.length > 0 && (
                               <ul className="space-y-0.5 mt-1">
                                 {breedingImpact.restrictions.map((r, i) => (
                                   <li key={i} className="text-stone-500 flex items-start gap-1">
                                     <span>•</span> {r}
                                   </li>
                                 ))}
                               </ul>
                             )}
                           </div>
                         )}
                          {incestBlocked && (
                            <p className="text-xs text-red-600 mt-1">This horse is the parent or offspring of {mare.name} — breeding not possible.</p>
                          )}
                        </CardContent>
                        </Card>
                        );
                        })}
              </div>
            )}

            {stallionsToShow.some(isIncestPair) && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  Some horses are greyed out because they are the <strong>parent or offspring</strong> of {mare.name}. Direct parent-offspring breeding is not allowed.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedStallion && !breedingBlocked && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-600">Breeding date</p>
            <div className="flex gap-3">
              <button
                onClick={() => setBreedingDateChoice('immediate')}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${breedingDateChoice === 'immediate' ? 'border-amber-400 bg-amber-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <div className="text-left">
                  <p className="font-semibold text-stone-800">Immediately</p>
                  <p className="text-xs text-stone-400">Birth in 11 months</p>
                </div>
              </button>
              <button
                onClick={() => setBreedingDateChoice('scheduled')}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${breedingDateChoice === 'scheduled' ? 'border-amber-400 bg-amber-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <p className="font-semibold text-stone-800">In 30 days</p>
                  <p className="text-xs text-stone-400">
                    Birth on {format(addDays(new Date(new Date().setDate(new Date().getDate() + 30)), GESTATION_DAYS), 'd MMM yyyy', { locale: enGB })}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {breedingBlocked && selectedStallion && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">🚫 Breeding impossible</p>
              <p className="text-xs">
                <strong>{selectedStallion.stallion_name}</strong> and <strong>{mare.name}</strong> are directly related as parent and child. This pairing is not allowed.
              </p>
            </div>
          </div>
        )}

        {selectedStallion && !foalPreview && !breedingBlocked && (
          <div className="space-y-3">
            {selectedStallion.breeding_approval_status && selectedStallion.breeding_approval_status !== 'approved' && selectedStallion.breeding_approval_status !== 'approved_restricted' && selectedStallion.breeding_approval_status !== 'provisional' && selectedStallion.breeding_approval_status !== 'elite' && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border-2 border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">⚠️ Breeding approval notice</p>
                  <p className="text-xs">If the stallion is not approved by the studbook, the foal will be registered as OC (Unknown Origins). Depending on studbook rules, the foal may be eligible for the dam's studbook.</p>
                </div>
              </div>
            )}
            <Button
              onClick={simulateBreeding}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Simulate breeding with {selectedStallion.stallion_name}
            </Button>
          </div>
        )}

        {foalPreview && (
          <Card className="border-0 bg-gradient-to-br from-amber-50/60 to-pink-50/60">
            <CardContent className="p-5 space-y-4">
              {/* Sire approval impact */}
              {selectedStallion && (() => {
                const impact = getBreedingImpact(selectedStallion.breeding_approval_status || 'not_evaluated');
                const statusColors = {
                  elite: 'from-yellow-400 to-amber-400',
                  provisional: 'from-emerald-400 to-green-400',
                  approved: 'from-blue-400 to-cyan-400',
                  approved_restricted: 'from-orange-400 to-amber-400',
                  not_approved: 'from-red-400 to-rose-400'
                };
                const color = statusColors[selectedStallion.breeding_approval_status || 'not_approved'] || statusColors.not_approved;
                return (
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${color} text-white`}>
                    <p className="font-semibold mb-2">📋 Sire approval impact</p>
                    <div className="space-y-1 text-xs">
                      <p><strong>Foal status:</strong> {impact.foalRegistration === 'oc' ? '❌ OC (Observed Origins)' : '✅ Full studbook'}</p>
                      <p><strong>Value multiplier:</strong> {impact.priceMultiplier}×</p>
                      <p><strong>Prestige bonus:</strong> {impact.prestigeBonus > 0 ? '+' : ''}{impact.prestigeBonus}</p>
                      {impact.restrictions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/30">
                          <p className="font-semibold mb-1">⚠️ Limitations:</p>
                          <ul className="space-y-0.5">
                            {impact.restrictions.map((r, i) => <li key={i}>• {r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <strong>Indicative forecast:</strong> skills, genotype and sex may vary at actual birth.
                </p>
              </div>
              
              {foalPreview.isOC && (
                <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-200">
                  <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Registration as OC
                  </p>
                  <p className="text-xs text-amber-700">{foalPreview.ocMessage}</p>
                </div>
              )}
              
              {!foalPreview.viable && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> ⚠️ Non-viable foal
                  </p>
                  <p className="text-xs text-red-600">{foalPreview.viability_cause}: The foal will be stillborn.</p>
                </div>
              )}
              
              {foalPreview.death_age !== null && foalPreview.death_age !== undefined && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                  <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> ⚠️ Reduced lifespan
                  </p>
                  <p className="text-xs text-orange-600">The foal will have a limited life expectancy ({Math.floor(foalPreview.death_age * 12)} months max).</p>
                </div>
              )}

              {/* Surprise: sex, stats and color are not revealed */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-amber-50 border-2 border-dashed border-amber-300 text-center">
                <p className="text-2xl mb-1">🎁</p>
                <p className="font-semibold text-amber-800">It's a surprise!</p>
                <p className="text-xs text-amber-600 mt-1">The sex, coat and skills of the foal will be revealed at birth.</p>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  <Badge variant="outline">{foalPreview.breed}</Badge>
                  <Badge className="bg-amber-100 text-amber-700 border-0">Coat: mystery 🎨</Badge>
                  <Badge className="bg-pink-100 text-pink-700 border-0">Sex: mystery ❓</Badge>
                </div>
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

              <div className="pt-2 border-t border-stone-200 flex gap-3">
                <Button
                  onClick={() => confirmBreedingMutation.mutate()}
                  disabled={confirmBreedingMutation.isPending}
                  className="flex-1 bg-stone-800 hover:bg-stone-900"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {(() => { const p = selectedStallion.is_own ? 0 : calcDynamicPrice(selectedStallion); return `Confirm breeding${p > 0 ? ` — ${p.toLocaleString('en-GB')} ₲` : ''}`; })()}
                </Button>
                <Button variant="outline" onClick={simulateBreeding}>🎲 Re-roll</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}