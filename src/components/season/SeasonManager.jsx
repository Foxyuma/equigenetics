import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Sun, CloudRain, Snowflake, Calendar, TrendingUp, Activity, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const SEASON_CONFIG = {
  spring: {
    label: "Printemps",
    icon: Leaf,
    color: "from-green-400 to-emerald-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    fertility: 120,
    illness: 12,
    competitions: ["dressage", "show_jumping", "eventing", "trail"],
    weather: "sunny",
    description: "Saison idéale pour la reproduction"
  },
  summer: {
    label: "Été",
    icon: Sun,
    color: "from-yellow-400 to-orange-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    fertility: 100,
    illness: 20,
    competitions: ["endurance", "barrel_racing", "polo", "western_pleasure"],
    weather: "sunny",
    description: "Attention aux coups de chaleur"
  },
  autumn: {
    label: "Automne",
    icon: CloudRain,
    color: "from-orange-400 to-red-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    fertility: 90,
    illness: 18,
    competitions: ["cross_country", "reining", "driving", "vaulting"],
    weather: "rainy",
    description: "Saison des compétitions d'extérieur"
  },
  winter: {
    label: "Hiver",
    icon: Snowflake,
    color: "from-blue-400 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    fertility: 70,
    illness: 25,
    competitions: ["dressage", "show_jumping", "vaulting", "driving"],
    weather: "snowy",
    description: "Risque accru de maladies respiratoires"
  }
};

export default function SeasonManager({ compact = false }) {
  const queryClient = useQueryClient();

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => base44.entities.Season.list('-created_date', 1),
  });

  const currentSeason = seasons[0] || {
    current_season: 'spring',
    season_number: 1,
    fertility_modifier: 120,
    illness_probability: 12,
    available_competitions: SEASON_CONFIG.spring.competitions
  };

  const config = SEASON_CONFIG[currentSeason.current_season] || SEASON_CONFIG.spring;
  const Icon = config.icon;

  const { data: currentUser } = useQuery({
    queryKey: ['me-season'],
    queryFn: () => base44.auth.me(),
  });

  const advanceSeasonMutation = useMutation({
    mutationFn: async () => {
      const seasonOrder = ['spring', 'summer', 'autumn', 'winter'];
      const currentIndex = seasonOrder.indexOf(currentSeason.current_season);
      const nextSeason = seasonOrder[(currentIndex + 1) % 4];
      const nextConfig = SEASON_CONFIG[nextSeason];

      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const data = {
        current_season: nextSeason,
        season_number: (currentSeason.season_number || 1) + 1,
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        weather: nextConfig.weather,
        fertility_modifier: nextConfig.fertility,
        illness_probability: nextConfig.illness,
        available_competitions: nextConfig.competitions,
      };

      // +1 réputation par saison d'activité
      if (currentUser) {
        await base44.auth.updateMe({ breeding_reputation: (currentUser.breeding_reputation ?? 0) + 1 });
      }

      if (currentSeason.id) {
        return base44.entities.Season.update(currentSeason.id, data);
      } else {
        return base44.entities.Season.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['me-season'] });
      toast.success('Nouvelle saison commencée ! +1 pt réputation 🌿');
    },
  });

  if (compact) {
    return (
      <Card className={`border-0 ${config.bgColor}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800 text-sm">{config.label}</span>
                <Badge variant="outline" className="text-xs">Saison {currentSeason.season_number}</Badge>
              </div>
              <p className="text-xs text-stone-500">{config.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 ${config.bgColor}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-xl`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800">{config.label}</h2>
              <p className="text-sm text-stone-500">Saison #{currentSeason.season_number}</p>
            </div>
          </div>
          <Button
            onClick={() => advanceSeasonMutation.mutate()}
            variant="outline"
            size="sm"
            className="bg-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Saison Suivante
          </Button>
        </div>

        <p className="text-sm text-stone-600 mb-4 italic">{config.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-stone-600">Fertilité</span>
            </div>
            <p className="text-xl font-bold text-green-600">{currentSeason.fertility_modifier}%</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-stone-600">Risque Maladie</span>
            </div>
            <p className="text-xl font-bold text-red-600">{currentSeason.illness_probability}%</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-stone-600">Compétitions</span>
            </div>
            <p className="text-xl font-bold text-indigo-600">{currentSeason.available_competitions?.length || 0}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-2">Disciplines disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {currentSeason.available_competitions?.map(comp => (
              <Badge key={comp} className={`${config.bgColor} ${config.textColor} border-0`}>
                {comp.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { SEASON_CONFIG };