import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Zap, Star } from 'lucide-react';
import { getCompetitionScore } from '../components/genetics/GeneticsEngine';
import SeasonManager from '../components/season/SeasonManager';

const DISCIPLINES = [
  { id: "dressage", name: "Dressage", olympic: true, icon: "🎩" },
  { id: "show_jumping", name: "Saut d'obstacles", olympic: true, icon: "🏇" },
  { id: "cross_country", name: "Cross-Country", olympic: true, icon: "🌲" },
  { id: "eventing", name: "Concours complet", olympic: true, icon: "⭐" },
  { id: "endurance", name: "Endurance", olympic: false, icon: "🏔️" },
  { id: "reining", name: "Reining", olympic: false, icon: "🤠" },
  { id: "barrel_racing", name: "Barrel Racing", olympic: false, icon: "🛢️" },
  { id: "polo", name: "Polo", olympic: false, icon: "🏑" },
  { id: "vaulting", name: "Voltige", olympic: false, icon: "🤸" },
  { id: "driving", name: "Attelage", olympic: false, icon: "🐎" },
  { id: "trail", name: "Trail", olympic: false, icon: "🌄" },
  { id: "western_pleasure", name: "Western Pleasure", olympic: false, icon: "🌵" },
];

const LEVELS = [
  { id: "novice", name: "Novice", color: "bg-green-100 text-green-700" },
  { id: "intermediate", name: "Intermédiaire", color: "bg-blue-100 text-blue-700" },
  { id: "advanced", name: "Avancé", color: "bg-purple-100 text-purple-700" },
  { id: "elite", name: "Élite", color: "bg-amber-100 text-amber-700" },
  { id: "olympic", name: "Olympique", color: "bg-red-100 text-red-700" },
];

export default function Competitions() {
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('novice');
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('compete');

  const queryClient = useQueryClient();

  const { data: horses = [] } = useQuery({
    queryKey: ['horses', currentUser?.email],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
  });

  const { data: allCompetitions = [] } = useQuery({
    queryKey: ['all-competitions', currentUser?.email],
    queryFn: () => base44.entities.Competition.filter({ created_by: currentUser.email }, '-created_date', 50),
    enabled: !!currentUser?.email,
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons-comp'],
    queryFn: () => base44.entities.Season.list('-created_date', 1),
  });

  const currentSeason = seasons[0];
  const availableCompetitions = currentSeason?.available_competitions || DISCIPLINES.map(d => d.id);

  const selectedHorse = horses.find(h => h.id === selectedHorseId);
  const discipline = DISCIPLINES.find(d => d.id === selectedDiscipline);
  const level = LEVELS.find(l => l.id === selectedLevel);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const competeMutation = useMutation({
    mutationFn: async () => {
      const score = getCompetitionScore(selectedHorse, selectedDiscipline);
      
      // Generate NPC competitors
      const npcScores = Array.from({ length: 7 }, () => 
        Math.round((30 + Math.random() * 60 + (LEVELS.findIndex(l => l.id === selectedLevel) * 8)) * 10) / 10
      );
      
      const allScores = [score, ...npcScores].sort((a, b) => b - a);
      const rank = allScores.indexOf(score) + 1;
      const prize = rank === 1 ? 500 : rank === 2 ? 300 : rank === 3 ? 150 : 0;
      const isOlympic = discipline.olympic;
      
      const comp = await base44.entities.Competition.create({
        name: `${discipline.name} — ${level.name}`,
        discipline: selectedDiscipline,
        level: selectedLevel,
        is_olympic: isOlympic,
        horse_id: selectedHorse.id,
        horse_name: selectedHorse.name,
        score,
        rank,
        prize,
        status: 'completed',
      });

      // Update horse wins and energy
      if (rank <= 3) {
        await base44.entities.Horse.update(selectedHorse.id, {
          competition_wins: (selectedHorse.competition_wins || 0) + (rank === 1 ? 1 : 0),
          energy: Math.max(0, (selectedHorse.energy || 100) - 15),
        });
      } else {
        await base44.entities.Horse.update(selectedHorse.id, {
          energy: Math.max(0, (selectedHorse.energy || 100) - 10),
        });
      }

      // Réputation : victoire +10, championnat olympique +30
      let repGain = 0;
      if (rank === 1) repGain = isOlympic ? 30 : 10;
      if (repGain > 0 && currentUser) {
        await base44.auth.updateMe({ breeding_reputation: (currentUser.breeding_reputation ?? 0) + repGain });
      }

      return { ...comp, npcScores: allScores, rank, repGain };
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['all-competitions'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const rankMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Compétitions</h1>
        <p className="text-stone-500 mt-1">Engagez vos chevaux dans des épreuves olympiques et non-olympiques</p>
      </div>

      <SeasonManager compact />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="compete">Participer</TabsTrigger>
          <TabsTrigger value="history">Palmarès</TabsTrigger>
        </TabsList>

        <TabsContent value="compete" className="mt-4 space-y-6">
          {/* Discipline selection */}
          <div>
            <h3 className="font-semibold text-stone-700 mb-3">Choisissez une discipline</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {DISCIPLINES.map(d => {
                const isAvailable = availableCompetitions.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => isAvailable && setSelectedDiscipline(d.id)}
                    disabled={!isAvailable}
                    className={`p-4 rounded-xl text-left transition-all duration-300 border ${
                      selectedDiscipline === d.id
                        ? 'bg-stone-800 text-white border-stone-800 shadow-lg shadow-stone-300/30'
                        : isAvailable
                        ? 'bg-white/80 border-stone-200 hover:border-stone-300 hover:shadow-md'
                        : 'bg-stone-100/50 border-stone-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{d.icon}</span>
                    <span className="font-medium text-sm block">{d.name}</span>
                    {!isAvailable && (
                      <Badge className="mt-1 text-xs border-0 bg-stone-300 text-stone-600">
                        Hors saison
                      </Badge>
                    )}
                    {d.olympic && isAvailable && (
                      <Badge className={`mt-1 text-xs border-0 ${
                        selectedDiscipline === d.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        Olympique
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level & Horse */}
          {selectedDiscipline && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-600 mb-2 block">Niveau</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 mb-2 block">Cheval</label>
                <Select value={selectedHorseId} onValueChange={setSelectedHorseId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir un cheval..." /></SelectTrigger>
                  <SelectContent>
                    {horses.map(h => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name} — {h.breed} (⚡{h.energy || 100}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Horse preview */}
          {selectedHorse && selectedDiscipline && (
            <Card className="border-0 bg-white/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-stone-800">{selectedHorse.name}</h4>
                    <p className="text-sm text-stone-500">{selectedHorse.breed} — {selectedHorse.coat_color}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-500">Score estimé</p>
                    <p className="text-2xl font-bold text-stone-800">
                      {getCompetitionScore(selectedHorse, selectedDiscipline).toFixed(1)}
                    </p>
                  </div>
                </div>
                {selectedHorse.health_genes?.some(h => h.status === 'affected') && (
                  <div className="mt-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                    ⚠️ Ce cheval est atteint d'une maladie génétique — performances réduites
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compete button */}
          <div className="flex justify-center">
            <Button
              onClick={() => competeMutation.mutate()}
              disabled={!selectedHorse || !selectedDiscipline || competeMutation.isPending}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50 px-8"
            >
              {competeMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Trophy className="w-5 h-5 mr-2" />
              )}
              Lancer la compétition !
            </Button>
          </div>

          {/* Result */}
          {result && (
            <Card className={`border-0 ${result.rank <= 3 ? 'bg-gradient-to-br from-amber-50 to-yellow-50' : 'bg-white/60'}`}>
              <CardContent className="p-6 text-center">
                <span className="text-5xl block mb-3">{rankMedal(result.rank)}</span>
                <h3 className="text-2xl font-bold text-stone-800 mb-1">
                  {result.rank === 1 ? 'Victoire !' : result.rank <= 3 ? 'Podium !' : `${result.rank}ème place`}
                </h3>
                <p className="text-stone-500 mb-4">Score : <span className="font-bold text-stone-800">{result.score?.toFixed(1)}</span> pts</p>
                
                {/* Scoreboard */}
                <div className="max-w-sm mx-auto space-y-1">
                  {result.npcScores?.map((s, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                      s === result.score ? 'bg-amber-100 font-bold' : 'bg-stone-50'
                    }`}>
                      <span>{rankMedal(i + 1)}</span>
                      <span>{s === result.score ? selectedHorse.name : `Concurrent ${i + 1}`}</span>
                      <span>{s.toFixed(1)} pts</span>
                    </div>
                  ))}
                </div>

                {result.prize > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
                    <Star className="w-4 h-4" />
                    <span className="font-semibold">+{result.prize} pts de prestige</span>
                  </div>
                )}
                {result.repGain > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-violet-600">
                    <Trophy className="w-4 h-4" />
                    <span className="font-semibold">+{result.repGain} pts réputation {result.repGain >= 30 ? '🏆 Championnat olympique !' : ''}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="border-0 bg-white/60">
            <CardHeader>
              <CardTitle className="text-lg">Résultats récents</CardTitle>
            </CardHeader>
            <CardContent>
              {allCompetitions.length === 0 ? (
                <p className="text-center text-stone-400 py-8">Aucune compétition enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {allCompetitions.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{rankMedal(c.rank)}</span>
                        <div>
                          <p className="font-medium text-stone-700 text-sm">{c.name}</p>
                          <p className="text-xs text-stone-400">{c.horse_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-800">{c.score?.toFixed(1)} pts</p>
                        {c.is_olympic && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Olympique</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}