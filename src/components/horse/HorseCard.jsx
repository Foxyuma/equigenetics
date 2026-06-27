import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Trophy, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDisplayBreed } from '@/lib/horseImagePrompt';
import HorseVisualizer from '@/components/horse/HorseVisualizer';

const sexColors = { male: "bg-blue-100 text-blue-700", female: "bg-pink-100 text-pink-700" };
const sexLabels = { male: "♂ Mâle", female: "♀ Femelle" };

export default function HorseCard({ horse }) {
  const hasDisease = horse.health_genes?.some(h => h.status === "affected");
  const isCarrier = horse.health_genes?.some(h => h.status === "carrier");
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/HorseDetail?id=${horse.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer border-0 bg-white/80 backdrop-blur-sm">
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
          {horse.image_url && !imgError ? (
            <img src={horse.image_url} alt={horse.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={() => setImgError(true)} />
          ) : (
            <HorseVisualizer genotype={horse.genotype} coatColor={horse.coat_color} horseId={horse.id} breed={horse.breed} size={160} showGenotype={false} />
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className={`${sexColors[horse.sex]} border-0 text-xs font-medium`}>
              {sexLabels[horse.sex]}
            </Badge>
            {horse.competition_wins > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                <Trophy className="w-3 h-3 mr-1" />{horse.competition_wins}
              </Badge>
            )}
          </div>
          {hasDisease && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-100 text-red-700 border-0 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />Malade
              </Badge>
            </div>
          )}
          {!hasDisease && isCarrier && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                Porteur
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-stone-800 text-lg leading-tight">{horse.name}</h3>
          <p className="text-sm text-stone-500 mt-0.5">{getDisplayBreed(horse.breed)}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-stone-100 text-stone-600">
              {horse.coat_color || "Inconnu"}
            </span>
            <span className="text-xs text-stone-400">{horse.age || 0} ans</span>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${horse.energy || 100}%` }}
              />
            </div>
            <span className="text-xs text-stone-400 ml-1">{horse.energy || 100}%</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}