import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PedigreeTree({ horse, ancestors }) {
  const getAncestor = (id) => ancestors?.find(h => h.id === id);
  
  const father = getAncestor(horse?.father_id);
  const mother = getAncestor(horse?.mother_id);
  const paternalGrandfather = getAncestor(father?.father_id);
  const paternalGrandmother = getAncestor(father?.mother_id);
  const maternalGrandfather = getAncestor(mother?.father_id);
  const maternalGrandmother = getAncestor(mother?.mother_id);
  
  const paternalGreatGrandparents = [
    getAncestor(paternalGrandfather?.father_id),
    getAncestor(paternalGrandfather?.mother_id),
    getAncestor(paternalGrandmother?.father_id),
    getAncestor(paternalGrandmother?.mother_id),
  ];
  
  const maternalGreatGrandparents = [
    getAncestor(maternalGrandfather?.father_id),
    getAncestor(maternalGrandfather?.mother_id),
    getAncestor(maternalGrandmother?.father_id),
    getAncestor(maternalGrandmother?.mother_id),
  ];

  const HorseNode = ({ horse, generation, label }) => {
    if (!horse) {
      return (
        <div className="p-3 rounded-lg bg-stone-100 border-2 border-dashed border-stone-300 text-center">
          <p className="text-xs text-stone-400">Inconnu</p>
        </div>
      );
    }

    const bgColors = {
      0: "from-amber-50 to-yellow-50 border-amber-300",
      1: "from-blue-50 to-cyan-50 border-blue-300",
      2: "from-pink-50 to-rose-50 border-pink-300",
      3: "from-purple-50 to-violet-50 border-purple-300",
    };

    return (
      <Link to={`/HorseDetail?id=${horse.id}`}>
        <Card className={`border-2 bg-gradient-to-br ${bgColors[generation]} hover:shadow-lg transition-all duration-300 cursor-pointer h-full`}>
          <div className="p-3 space-y-2">
            {label && <p className="text-xs font-medium text-stone-500">{label}</p>}
            <div className="flex items-center gap-2">
              <span className="text-lg">{horse.sex === 'male' ? '♂️' : '♀️'}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-stone-800 text-sm truncate">{horse.name}</h4>
                <p className="text-xs text-stone-500 truncate">{horse.breed}</p>
              </div>
            </div>
            <Badge className="text-xs bg-white/80 text-stone-600 border-0">
              {horse.coat_color}
            </Badge>
            {horse.competition_wins > 0 && (
              <p className="text-xs text-amber-600 font-medium">🏆 {horse.competition_wins}</p>
            )}
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Subject Horse */}
      <div className="flex justify-center">
        <div className="w-full max-w-xs">
          <HorseNode horse={horse} generation={0} label="Sujet" />
        </div>
      </div>

      {/* Parents - Generation 1 */}
      {(father || mother) && (
        <div className="relative">
          <div className="absolute left-1/2 top-0 w-0.5 h-6 bg-stone-300 -translate-x-1/2" />
          <div className="absolute left-1/2 top-6 w-full h-0.5 bg-stone-300 -translate-x-1/2" />
          <div className="absolute left-1/4 top-6 w-0.5 h-6 bg-stone-300" />
          <div className="absolute right-1/4 top-6 w-0.5 h-6 bg-stone-300" />
          
          <div className="grid grid-cols-2 gap-6 pt-12">
            <HorseNode horse={father} generation={1} label="Père" />
            <HorseNode horse={mother} generation={1} label="Mère" />
          </div>
        </div>
      )}

      {/* Grandparents - Generation 2 */}
      {(paternalGrandfather || paternalGrandmother || maternalGrandfather || maternalGrandmother) && (
        <div className="relative">
          <div className="absolute left-1/4 top-0 w-0.5 h-6 bg-stone-300" />
          <div className="absolute right-1/4 top-0 w-0.5 h-6 bg-stone-300" />
          <div className="absolute left-1/4 top-6 w-1/4 h-0.5 bg-stone-300" />
          <div className="absolute right-1/4 top-6 w-1/4 h-0.5 bg-stone-300" />
          <div className="absolute left-1/8 top-6 w-0.5 h-6 bg-stone-300" />
          <div className="absolute left-3/8 top-6 w-0.5 h-6 bg-stone-300" />
          <div className="absolute right-3/8 top-6 w-0.5 h-6 bg-stone-300" />
          <div className="absolute right-1/8 top-6 w-0.5 h-6 bg-stone-300" />
          
          <div className="grid grid-cols-4 gap-4 pt-12">
            <HorseNode horse={paternalGrandfather} generation={2} label="Grand-père P" />
            <HorseNode horse={paternalGrandmother} generation={2} label="Grand-mère P" />
            <HorseNode horse={maternalGrandfather} generation={2} label="Grand-père M" />
            <HorseNode horse={maternalGrandmother} generation={2} label="Grand-mère M" />
          </div>
        </div>
      )}

      {/* Great-Grandparents - Generation 3 */}
      {([...paternalGreatGrandparents, ...maternalGreatGrandparents].some(h => h)) && (
        <div className="relative">
          <div className="absolute left-1/8 top-0 w-0.5 h-4 bg-stone-300" />
          <div className="absolute left-3/8 top-0 w-0.5 h-4 bg-stone-300" />
          <div className="absolute right-3/8 top-0 w-0.5 h-4 bg-stone-300" />
          <div className="absolute right-1/8 top-0 w-0.5 h-4 bg-stone-300" />
          
          <div className="grid grid-cols-8 gap-2 pt-6">
            {[...paternalGreatGrandparents, ...maternalGreatGrandparents].map((ggp, i) => (
              <div key={i} className="text-xs">
                {ggp ? (
                  <Link to={`/HorseDetail?id=${ggp.id}`}>
                    <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 hover:shadow-md transition-all cursor-pointer">
                      <p className="font-medium text-stone-700 truncate">{ggp.name}</p>
                      <p className="text-stone-400 text-xs truncate">{ggp.breed}</p>
                    </div>
                  </Link>
                ) : (
                  <div className="p-2 rounded-lg bg-stone-50 border border-dashed border-stone-200">
                    <p className="text-stone-300 text-xs">Inconnu</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 pt-6 border-t border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-300" />
          <span className="text-xs text-stone-600">Sujet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-300" />
          <span className="text-xs text-stone-600">Parents</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-300" />
          <span className="text-xs text-stone-600">Grands-parents</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-300" />
          <span className="text-xs text-stone-600">Arrière-grands-parents</span>
        </div>
      </div>
    </div>
  );
}