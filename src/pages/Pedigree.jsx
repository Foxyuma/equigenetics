import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Sparkles, Search } from 'lucide-react';
import PedigreeTree from '../components/pedigree/PedigreeTree';
import GeneticPredictor from '../components/pedigree/GeneticPredictor';
import { Input } from "@/components/ui/input";

export default function Pedigree() {
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [predictorFatherId, setPredictorFatherId] = useState('');
  const [predictorMotherId, setPredictorMotherId] = useState('');
  const [search, setSearch] = useState('');

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 300),
  });

  const selectedHorse = horses.find(h => h.id === selectedHorseId);
  const predictorFather = horses.find(h => h.id === predictorFatherId);
  const predictorMother = horses.find(h => h.id === predictorMotherId);

  // Get all ancestors for the selected horse
  const getAncestors = (horse) => {
    if (!horse) return [];
    const ancestorIds = new Set();
    const collect = (h) => {
      if (!h) return;
      if (h.father_id) ancestorIds.add(h.father_id);
      if (h.mother_id) ancestorIds.add(h.mother_id);
      if (h.father_id) collect(horses.find(x => x.id === h.father_id));
      if (h.mother_id) collect(horses.find(x => x.id === h.mother_id));
    };
    collect(horse);
    return horses.filter(h => ancestorIds.has(h.id));
  };

  const ancestors = getAncestors(selectedHorse);
  const males = horses.filter(h => h.sex === 'male');
  const females = horses.filter(h => h.sex === 'female');

  const filteredHorses = search 
    ? horses.filter(h => h.name?.toLowerCase().includes(search.toLowerCase()))
    : horses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Lignées & Prédictions</h1>
        <p className="text-stone-500 mt-1">Explorez les arbres généalogiques et prédisez les résultats de croisements</p>
      </div>

      <Tabs defaultValue="pedigree" className="w-full">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="pedigree">
            <GitBranch className="w-4 h-4 mr-2" />
            Arbre Généalogique
          </TabsTrigger>
          <TabsTrigger value="predictor">
            <Sparkles className="w-4 h-4 mr-2" />
            Prédicteur Génétique
          </TabsTrigger>
        </TabsList>

        {/* Pedigree Tab */}
        <TabsContent value="pedigree" className="mt-6 space-y-6">
          <Card className="border-0 bg-white/60">
            <CardHeader>
              <CardTitle className="text-lg">Sélectionner un cheval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Rechercher un cheval..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedHorseId} onValueChange={setSelectedHorseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un cheval pour voir son pedigree..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredHorses.map(h => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.sex === 'male' ? '♂' : '♀'} {h.name} — {h.breed} ({h.coat_color})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedHorse ? (
            <Card className="border-0 bg-white/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-amber-600" />
                  Pedigree de {selectedHorse.name}
                </CardTitle>
                <p className="text-sm text-stone-500">
                  {selectedHorse.breed} — {selectedHorse.coat_color}
                </p>
              </CardHeader>
              <CardContent>
                <PedigreeTree horse={selectedHorse} ancestors={ancestors} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 bg-gradient-to-br from-stone-50 to-amber-50">
              <CardContent className="p-12 text-center">
                <GitBranch className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-semibold text-stone-600 mb-2">Aucun cheval sélectionné</h3>
                <p className="text-stone-400">Choisissez un cheval ci-dessus pour visualiser son arbre généalogique</p>
              </CardContent>
            </Card>
          )}

          {/* Pedigree stats */}
          {selectedHorse && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-0 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-blue-600 mb-1">Ancêtres connus</p>
                  <p className="text-3xl font-bold text-blue-800">{ancestors.length}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-green-600 mb-1">Génération max</p>
                  <p className="text-3xl font-bold text-green-800">
                    {ancestors.length === 0 ? 0 : Math.ceil(Math.log2(ancestors.length + 1))}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-purple-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-purple-600 mb-1">Races dans le pedigree</p>
                  <p className="text-3xl font-bold text-purple-800">
                    {new Set([selectedHorse.breed, ...ancestors.map(a => a.breed)]).size}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Genetic Predictor Tab */}
        <TabsContent value="predictor" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Father Selection */}
            <Card className="border-0 bg-white/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">♂</span>
                  Étalon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={predictorFatherId} onValueChange={setPredictorFatherId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choisir un étalon..." />
                  </SelectTrigger>
                  <SelectContent>
                    {males.map(h => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name} — {h.breed} ({h.coat_color})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {predictorFather && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 space-y-2">
                    <p className="text-sm font-semibold text-stone-700">{predictorFather.name}</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-white px-2 py-1 rounded">{predictorFather.breed}</span>
                      <span className="text-xs bg-white px-2 py-1 rounded">{predictorFather.coat_color}</span>
                      {predictorFather.competition_wins > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          🏆 {predictorFather.competition_wins}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mother Selection */}
            <Card className="border-0 bg-white/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">♀</span>
                  Jument
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={predictorMotherId} onValueChange={setPredictorMotherId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choisir une jument..." />
                  </SelectTrigger>
                  <SelectContent>
                    {females.map(h => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name} — {h.breed} ({h.coat_color})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {predictorMother && (
                  <div className="mt-4 p-3 rounded-lg bg-pink-50 space-y-2">
                    <p className="text-sm font-semibold text-stone-700">{predictorMother.name}</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-white px-2 py-1 rounded">{predictorMother.breed}</span>
                      <span className="text-xs bg-white px-2 py-1 rounded">{predictorMother.coat_color}</span>
                      {predictorMother.competition_wins > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          🏆 {predictorMother.competition_wins}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Predictions */}
          <GeneticPredictor father={predictorFather} mother={predictorMother} />

          {/* Info Card */}
          <Card className="border-0 bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Comment fonctionne le prédicteur ?
              </h3>
              <div className="space-y-2 text-sm text-stone-600">
                <p>
                  Le prédicteur génétique simule tous les croisements possibles entre les génotypes des deux parents en utilisant les <strong>lois de Mendel</strong>.
                </p>
                <p>
                  Il analyse 9 loci génétiques différents (Extension, Agouti, Crème, Gris, Tobiano, Roan, Dun, Champagne, Silver) pour calculer toutes les combinaisons de couleurs de robe possibles chez les descendants.
                </p>
                <p className="pt-2 border-t border-indigo-200">
                  💡 <strong>Astuce :</strong> Les prédictions sont particulièrement utiles pour planifier des croisements visant une couleur de robe spécifique ou pour éviter certaines combinaisons génétiques.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}