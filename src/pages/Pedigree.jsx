import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Dna, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const PedigreeNode = ({ horse, generation, side }) => {
  if (!horse) {
    return (
      <div className={`p-3 rounded-lg bg-stone-100 border-2 border-dashed border-stone-300 text-center ${
        generation === 0 ? 'min-w-[200px]' : generation === 1 ? 'min-w-[180px]' : 'min-w-[160px]'
      }`}>
        <p className="text-xs text-stone-400 italic">Inconnu</p>
      </div>
    );
  }

  const bgColor = side === 'father' ? 'from-blue-50 to-blue-100' : side === 'mother' ? 'from-pink-50 to-pink-100' : 'from-amber-50 to-amber-100';
  const borderColor = side === 'father' ? 'border-blue-300' : side === 'mother' ? 'border-pink-300' : 'border-amber-300';

  return (
    <Link to={`/HorseDetail?id=${horse.id}`}>
      <div className={`p-3 rounded-lg bg-gradient-to-br ${bgColor} border-2 ${borderColor} hover:shadow-lg transition-all cursor-pointer ${
        generation === 0 ? 'min-w-[200px]' : generation === 1 ? 'min-w-[180px]' : 'min-w-[160px]'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={generation === 0 ? 'text-2xl' : generation === 1 ? 'text-xl' : 'text-lg'}>
            {horse.sex === 'male' ? '♂' : '♀'}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-stone-800 truncate ${generation === 0 ? 'text-sm' : 'text-xs'}`}>
              {horse.name}
            </p>
            <p className="text-xs text-stone-500 truncate">{horse.breed}</p>
          </div>
        </div>
        <Badge className="text-xs border-0 bg-white/60 text-stone-600 w-full justify-center">
          {horse.coat_color}
        </Badge>
        {generation === 0 && horse.competition_wins > 0 && (
          <Badge className="mt-1 text-xs border-0 bg-amber-100 text-amber-700 w-full justify-center">
            🏆 {horse.competition_wins} victoires
          </Badge>
        )}
      </div>
    </Link>
  );
};

const PedigreeTree = ({ horse, ancestors }) => {
  const father = ancestors.father;
  const mother = ancestors.mother;
  const paternalGrandfather = ancestors.paternalGrandfather;
  const paternalGrandmother = ancestors.paternalGrandmother;
  const maternalGrandfather = ancestors.maternalGrandfather;
  const maternalGrandmother = ancestors.maternalGrandmother;
  const paternalGreatGrandparents = ancestors.paternalGreatGrandparents || {};
  const maternalGreatGrandparents = ancestors.maternalGreatGrandparents || {};

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex items-start gap-4 min-w-max">
        {/* Generation 0 - Subject */}
        <div className="flex items-center">
          <PedigreeNode horse={horse} generation={0} side="subject" />
        </div>

        <ChevronRight className="w-6 h-6 text-stone-300 flex-shrink-0 mt-8" />

        {/* Generation 1 - Parents */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <PedigreeNode horse={father} generation={1} side="father" />
            <ChevronRight className="w-5 h-5 text-stone-300 flex-shrink-0" />
            {/* Generation 2 - Paternal Grandparents */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <PedigreeNode horse={paternalGrandfather} generation={2} side="father" />
                <ChevronRight className="w-4 h-4 text-stone-200 flex-shrink-0" />
                {/* Generation 3 - Paternal Great-Grandparents */}
                <div className="flex flex-col gap-2">
                  <PedigreeNode horse={paternalGreatGrandparents.ff} generation={3} side="father" />
                  <PedigreeNode horse={paternalGreatGrandparents.fm} generation={3} side="mother" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PedigreeNode horse={paternalGrandmother} generation={2} side="mother" />
                <ChevronRight className="w-4 h-4 text-stone-200 flex-shrink-0" />
                <div className="flex flex-col gap-2">
                  <PedigreeNode horse={paternalGreatGrandparents.mf} generation={3} side="father" />
                  <PedigreeNode horse={paternalGreatGrandparents.mm} generation={3} side="mother" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PedigreeNode horse={mother} generation={1} side="mother" />
            <ChevronRight className="w-5 h-5 text-stone-300 flex-shrink-0" />
            {/* Generation 2 - Maternal Grandparents */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <PedigreeNode horse={maternalGrandfather} generation={2} side="father" />
                <ChevronRight className="w-4 h-4 text-stone-200 flex-shrink-0" />
                <div className="flex flex-col gap-2">
                  <PedigreeNode horse={maternalGreatGrandparents.ff} generation={3} side="father" />
                  <PedigreeNode horse={maternalGreatGrandparents.fm} generation={3} side="mother" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PedigreeNode horse={maternalGrandmother} generation={2} side="mother" />
                <ChevronRight className="w-4 h-4 text-stone-200 flex-shrink-0" />
                <div className="flex flex-col gap-2">
                  <PedigreeNode horse={maternalGreatGrandparents.mf} generation={3} side="father" />
                  <PedigreeNode horse={maternalGreatGrandparents.mm} generation={3} side="mother" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Pedigree() {
  const [selectedHorseId, setSelectedHorseId] = useState('');

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 200),
  });

  const { data: selectedHorse } = useQuery({
    queryKey: ['horse', selectedHorseId],
    queryFn: () => base44.entities.Horse.filter({ id: selectedHorseId }).then(r => r[0]),
    enabled: !!selectedHorseId,
  });

  const { data: ancestors = {} } = useQuery({
    queryKey: ['ancestors', selectedHorseId],
    queryFn: async () => {
      if (!selectedHorse) return {};

      const result = {};

      // Parents
      if (selectedHorse.father_id) {
        const f = await base44.entities.Horse.filter({ id: selectedHorse.father_id });
        result.father = f[0];

        // Paternal Grandparents
        if (result.father?.father_id) {
          const pgf = await base44.entities.Horse.filter({ id: result.father.father_id });
          result.paternalGrandfather = pgf[0];

          // Paternal Great-Grandparents (father's side)
          result.paternalGreatGrandparents = {};
          if (result.paternalGrandfather?.father_id) {
            const pggf = await base44.entities.Horse.filter({ id: result.paternalGrandfather.father_id });
            result.paternalGreatGrandparents.ff = pggf[0];
          }
          if (result.paternalGrandfather?.mother_id) {
            const pggm = await base44.entities.Horse.filter({ id: result.paternalGrandfather.mother_id });
            result.paternalGreatGrandparents.fm = pggm[0];
          }
        }
        if (result.father?.mother_id) {
          const pgm = await base44.entities.Horse.filter({ id: result.father.mother_id });
          result.paternalGrandmother = pgm[0];

          // Paternal Great-Grandparents (mother's side)
          if (!result.paternalGreatGrandparents) result.paternalGreatGrandparents = {};
          if (result.paternalGrandmother?.father_id) {
            const pggf = await base44.entities.Horse.filter({ id: result.paternalGrandmother.father_id });
            result.paternalGreatGrandparents.mf = pggf[0];
          }
          if (result.paternalGrandmother?.mother_id) {
            const pggm = await base44.entities.Horse.filter({ id: result.paternalGrandmother.mother_id });
            result.paternalGreatGrandparents.mm = pggm[0];
          }
        }
      }

      if (selectedHorse.mother_id) {
        const m = await base44.entities.Horse.filter({ id: selectedHorse.mother_id });
        result.mother = m[0];

        // Maternal Grandparents
        if (result.mother?.father_id) {
          const mgf = await base44.entities.Horse.filter({ id: result.mother.father_id });
          result.maternalGrandfather = mgf[0];

          // Maternal Great-Grandparents (father's side)
          result.maternalGreatGrandparents = {};
          if (result.maternalGrandfather?.father_id) {
            const mggf = await base44.entities.Horse.filter({ id: result.maternalGrandfather.father_id });
            result.maternalGreatGrandparents.ff = mggf[0];
          }
          if (result.maternalGrandfather?.mother_id) {
            const mggm = await base44.entities.Horse.filter({ id: result.maternalGrandfather.mother_id });
            result.maternalGreatGrandparents.fm = mggm[0];
          }
        }
        if (result.mother?.mother_id) {
          const mgm = await base44.entities.Horse.filter({ id: result.mother.mother_id });
          result.maternalGrandmother = mgm[0];

          // Maternal Great-Grandparents (mother's side)
          if (!result.maternalGreatGrandparents) result.maternalGreatGrandparents = {};
          if (result.maternalGrandmother?.father_id) {
            const mggf = await base44.entities.Horse.filter({ id: result.maternalGrandmother.father_id });
            result.maternalGreatGrandparents.mf = mggf[0];
          }
          if (result.maternalGrandmother?.mother_id) {
            const mggm = await base44.entities.Horse.filter({ id: result.maternalGrandmother.mother_id });
            result.maternalGreatGrandparents.mm = mggm[0];
          }
        }
      }

      return result;
    },
    enabled: !!selectedHorse,
  });

  const getGenerationCount = () => {
    let count = 0;
    if (ancestors.father || ancestors.mother) count = 1;
    if (ancestors.paternalGrandfather || ancestors.paternalGrandmother || ancestors.maternalGrandfather || ancestors.maternalGrandmother) count = 2;
    if (ancestors.paternalGreatGrandparents || ancestors.maternalGreatGrandparents) count = 3;
    return count;
  };

  const getTotalAncestors = () => {
    let total = 0;
    if (ancestors.father) total++;
    if (ancestors.mother) total++;
    if (ancestors.paternalGrandfather) total++;
    if (ancestors.paternalGrandmother) total++;
    if (ancestors.maternalGrandfather) total++;
    if (ancestors.maternalGrandmother) total++;
    if (ancestors.paternalGreatGrandparents) {
      Object.values(ancestors.paternalGreatGrandparents).forEach(a => { if (a) total++; });
    }
    if (ancestors.maternalGreatGrandparents) {
      Object.values(ancestors.maternalGreatGrandparents).forEach(a => { if (a) total++; });
    }
    return total;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Pedigree & Lignées</h1>
        <p className="text-stone-500 mt-1">Explorez l'arbre généalogique de vos chevaux</p>
      </div>

      <Card className="border-0 bg-white/60">
        <CardContent className="p-4">
          <label className="text-sm font-medium text-stone-600 mb-2 block">Sélectionner un cheval</label>
          <Select value={selectedHorseId} onValueChange={setSelectedHorseId}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Choisir un cheval..." />
            </SelectTrigger>
            <SelectContent>
              {horses.map(h => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name} — {h.breed} ({h.sex === 'male' ? '♂' : '♀'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedHorse && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-900">{getTotalAncestors()}</p>
                <p className="text-xs text-blue-600">Ancêtres connus</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4 text-center">
                <Dna className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-900">{getGenerationCount()}</p>
                <p className="text-xs text-purple-600">Générations</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                <p className="text-2xl font-bold text-amber-900">
                  {selectedHorse.stats ? Math.round(Object.values(selectedHorse.stats).reduce((a,b) => a+b, 0) / 7) : 0}
                </p>
                <p className="text-xs text-amber-600">Moyenne stats</p>
              </CardContent>
            </Card>
          </div>

          {/* Pedigree Tree */}
          <Card className="border-0 bg-white/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-stone-600" />
                Arbre Généalogique
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!ancestors.father && !ancestors.mother ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500">Aucun parent connu pour ce cheval</p>
                  <p className="text-xs text-stone-400 mt-1">Les chevaux créés ou achetés n'ont pas d'historique familial</p>
                </div>
              ) : (
                <PedigreeTree horse={selectedHorse} ancestors={ancestors} />
              )}
            </CardContent>
          </Card>

          {/* Inbreeding Warning */}
          {ancestors.father && ancestors.mother && (
            <Card className="border-0 bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-sm text-amber-700">
                  <strong>Info:</strong> Vérifiez toujours qu'il n'y a pas de consanguinité dans votre lignée. 
                  Les croisements entre chevaux apparentés peuvent augmenter le risque de maladies génétiques.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}