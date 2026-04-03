import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Dna, AlertTriangle, Baby, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { breedGenotype, determineCoatColor, generateRandomStats, inheritDiseases } from '../components/genetics/GeneticsEngine';
import StatBar from '../components/horse/StatBar';
import GeneticPanel from '../components/horse/GeneticPanel';
import HealthPanel from '../components/horse/HealthPanel';
import SeasonManager from '../components/season/SeasonManager';
import { toast } from 'sonner';

export default function Breeding() {
  const [fatherId, setFatherId] = useState('');
  const [motherId, setMotherId] = useState('');
  const [foalName, setFoalName] = useState('');
  const [foalPreview, setFoalPreview] = useState(null);
  const [breeding, setBreeding] = useState(false);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 200),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['breeding-records'],
    queryFn: () => base44.entities.BreedingRecord.list('-created_date', 20),
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => base44.entities.Season.list('-created_date', 1),
  });

  const currentSeason = seasons[0];
  const fertilityModifier = currentSeason?.fertility_modifier || 100;

  const males = horses.filter(h => h.sex === 'male');
  const females = horses.filter(h => h.sex === 'female');
  const father = males.find(h => h.id === fatherId);
  const mother = females.find(h => h.id === motherId);

  const simulateBreeding = () => {
    if (!father || !mother) return;
    
    // Check fertility based on season
    const successChance = fertilityModifier / 100;
    if (Math.random() > successChance) {
      toast.error(`Échec de la reproduction ! (Fertilité: ${fertilityModifier}%)`);
      setFoalPreview(null);
      return;
    }
    
    const childGenotype = breedGenotype(father.genotype, mother.genotype);
    const childStats = generateRandomStats(father.stats, mother.stats);
    const childHealth = inheritDiseases(father.health_genes, mother.health_genes, mother.breed);
    const coatColor = determineCoatColor(childGenotype);
    
    setFoalPreview({
      genotype: childGenotype,
      stats: childStats,
      health_genes: childHealth,
      coat_color: coatColor,
      sex: Math.random() > 0.5 ? 'male' : 'female',
      breed: father.breed === mother.breed ? father.breed : `${father.breed} x ${mother.breed}`,
    });
    toast.success('Croisement réussi !');
  };

  const createFoalMutation = useMutation({
    mutationFn: async () => {
      const foal = await base44.entities.Horse.create({
        name: foalName || `Poulain de ${father.name}`,
        ...foalPreview,
        father_id: father.id,
        mother_id: mother.id,
        age: 0,
        energy: 100,
        competition_wins: 0,
        is_for_sale: false,
      });
      await base44.entities.BreedingRecord.create({
        father_id: father.id,
        mother_id: mother.id,
        father_name: father.name,
        mother_name: mother.name,
        foal_id: foal.id,
        foal_name: foalName || `Poulain de ${father.name}`,
        breed: foalPreview.breed,
      });
      // Calcul de la réputation gagnée
      const avgStat = foalPreview ? Math.round(Object.values(foalPreview.stats || {}).reduce((a,b)=>a+b,0) / 7) : 50;
      const isPure = father.breed === mother.breed;
      const affectedCount = foalPreview?.health_genes?.filter(g => g.status === 'affected').length || 0;
      const carrierCount = foalPreview?.health_genes?.filter(g => g.status === 'carrier').length || 0;
      const noDisease = affectedCount === 0;
      // Bonus de base + pureté + stats, malus pour maladies
      const repGain = 50
        + (isPure ? 25 : 0)
        + (noDisease ? 15 : 0)
        + Math.round((avgStat - 50) * 0.5)
        - (affectedCount * 40)   // -40 par gène atteint
        - (carrierCount * 10);   // -10 par gène porteur

      if (currentUser) {
        const currentRep = currentUser.breeding_reputation ?? 0;
        await base44.auth.updateMe({ breeding_reputation: currentRep + repGain });
      }

      return { foal, repGain };
    },
    onSuccess: ({ repGain }) => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-records'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      const repLabel = repGain >= 0
        ? `+${repGain} pts de réputation 🌟`
        : `${repGain} pts de réputation ⚠️ (poulain malade)`;
      toast[repGain >= 0 ? 'success' : 'warning'](`Poulain enregistré ! ${repLabel}`);
      setFoalPreview(null);
      setFoalName('');
      setFatherId('');
      setMotherId('');
      setBreeding(false);
    }
  });

  const warningDiseases = () => {
    if (!father || !mother) return [];
    const warnings = [];
    const fatherCarried = father.health_genes?.filter(h => h.status !== 'clear') || [];
    const motherCarried = mother.health_genes?.filter(h => h.status !== 'clear') || [];
    
    fatherCarried.forEach(fg => {
      const match = motherCarried.find(mg => mg.disease === fg.disease);
      if (match) {
        warnings.push(`Les deux parents portent le gène ${fg.disease} — risque de poulain atteint !`);
      }
    });
    return warnings;
  };

  const warnings = warningDiseases();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Élevage</h1>
        <p className="text-stone-500 mt-1">Croisez vos chevaux et découvrez les résultats génétiques</p>
      </div>

      <SeasonManager compact />

      {/* Parent Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Father */}
        <Card className="border-0 bg-white/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">♂</span>
              Étalon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={fatherId} onValueChange={setFatherId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir un étalon..." /></SelectTrigger>
              <SelectContent>
                {males.map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} — {h.breed} ({h.coat_color})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {father && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{father.breed}</Badge>
                  <Badge className="bg-stone-100 text-stone-600 border-0">{father.coat_color}</Badge>
                </div>
                <div className="space-y-1.5">
                  {father.stats && Object.entries(father.stats).slice(0, 4).map(([s, v]) => (
                    <StatBar key={s} stat={s} value={v} />
                  ))}
                </div>
                {father.health_genes?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {father.health_genes.map(g => (
                      <Badge key={g.disease} className={`text-xs border-0 ${g.status === 'carrier' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {g.disease}: {g.status === 'carrier' ? 'Porteur' : 'Atteint'}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mother */}
        <Card className="border-0 bg-white/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">♀</span>
              Jument
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={motherId} onValueChange={setMotherId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir une jument..." /></SelectTrigger>
              <SelectContent>
                {females.map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} — {h.breed} ({h.coat_color})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mother && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{mother.breed}</Badge>
                  <Badge className="bg-stone-100 text-stone-600 border-0">{mother.coat_color}</Badge>
                </div>
                <div className="space-y-1.5">
                  {mother.stats && Object.entries(mother.stats).slice(0, 4).map(([s, v]) => (
                    <StatBar key={s} stat={s} value={v} />
                  ))}
                </div>
                {mother.health_genes?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mother.health_genes.map(g => (
                      <Badge key={g.disease} className={`text-xs border-0 ${g.status === 'carrier' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {g.disease}: {g.status === 'carrier' ? 'Porteur' : 'Atteint'}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Breed button */}
      <div className="flex justify-center">
        <Button 
          onClick={simulateBreeding}
          disabled={!father || !mother}
          size="lg"
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-200/50 px-8"
        >
          <Heart className="w-5 h-5 mr-2" />
          Simuler le croisement
        </Button>
      </div>

      {/* Foal Preview */}
      {foalPreview && (
        <Card className="border-0 bg-gradient-to-br from-amber-50/50 to-pink-50/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Baby className="w-5 h-5 text-pink-500" />
              Résultat du croisement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`border-0 ${foalPreview.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                {foalPreview.sex === 'male' ? '♂ Mâle' : '♀ Femelle'}
              </Badge>
              <Badge variant="outline">{foalPreview.breed}</Badge>
              <Badge className="bg-stone-100 text-stone-600 border-0">{foalPreview.coat_color}</Badge>
            </div>

            {/* Stats */}
            <div>
              <h4 className="font-semibold text-stone-700 mb-3">Compétences</h4>
              <div className="space-y-2">
                {Object.entries(foalPreview.stats).map(([s, v]) => (
                  <StatBar key={s} stat={s} value={v} />
                ))}
              </div>
            </div>

            {/* Genotype */}
            <div>
              <h4 className="font-semibold text-stone-700 mb-3">Génotype</h4>
              <GeneticPanel genotype={foalPreview.genotype} />
            </div>

            {/* Health */}
            {foalPreview.health_genes?.length > 0 && (
              <div>
                <h4 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Alertes Santé
                </h4>
                <div className="space-y-1">
                  {foalPreview.health_genes.map(g => (
                    <div key={g.disease} className={`flex items-center justify-between p-3 rounded-lg ${g.status === 'affected' ? 'bg-red-50' : 'bg-orange-50'}`}>
                      <span className="font-medium text-sm">{g.disease}</span>
                      <Badge className={`border-0 ${g.status === 'affected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {g.status === 'carrier' ? 'Porteur' : 'Atteint'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save foal */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
              <Input 
                placeholder="Nom du poulain..." 
                value={foalName}
                onChange={(e) => setFoalName(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => createFoalMutation.mutate()}
                disabled={!foalName}
                className="bg-stone-800 hover:bg-stone-900"
              >
                <Baby className="w-4 h-4 mr-2" />
                Enregistrer le poulain
              </Button>
              <Button variant="outline" onClick={simulateBreeding}>
                🎲 Relancer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breeding History */}
      {records.length > 0 && (
        <Card className="border-0 bg-white/60">
          <CardHeader>
            <CardTitle className="text-lg">Historique des croisements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {records.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 text-sm">
                  <span className="font-medium text-blue-600">{r.father_name}</span>
                  <ArrowRight className="w-4 h-4 text-stone-300" />
                  <span className="font-medium text-pink-600">{r.mother_name}</span>
                  <ArrowRight className="w-4 h-4 text-stone-300" />
                  <Link to={`/HorseDetail?id=${r.foal_id}`} className="font-semibold text-stone-800 hover:text-amber-600 transition-colors">
                    {r.foal_name}
                  </Link>
                  <Badge variant="outline" className="ml-auto text-xs">{r.breed}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}