import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Zap, Award, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Rankings() {
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses-rankings'],
    queryFn: () => base44.entities.Horse.list('-competition_wins', 100),
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions-all'],
    queryFn: () => base44.entities.Competition.list('-created_date', 200),
  });

  // Calculate rankings
  const topByWins = [...horses]
    .filter(h => (h.competition_wins || 0) > 0)
    .sort((a, b) => (b.competition_wins || 0) - (a.competition_wins || 0))
    .slice(0, 20);

  const topByStats = [...horses]
    .map(h => ({
      ...h,
      avgStats: h.stats ? Object.values(h.stats).reduce((a, b) => a + b, 0) / 7 : 0
    }))
    .sort((a, b) => b.avgStats - a.avgStats)
    .slice(0, 20);

  const topByEnergy = [...horses]
    .sort((a, b) => (b.energy || 0) - (a.energy || 0))
    .slice(0, 20);

  // Recent competitions
  const recentCompetitions = [...competitions]
    .filter(c => c.status === 'completed')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 15);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-bold text-stone-400">#{rank}</span>;
  };

  const RankingCard = ({ horses, title, icon: Icon, statKey, suffix = "" }) => (
    <Card className="border-0 bg-white/60">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-amber-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {horses.map((h, idx) => (
            <Link key={h.id} to={h.created_by === currentUser?.email ? `/HorseDetail?id=${h.id}` : `/PublicHorseProfile?id=${h.id}`}>
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 flex items-center justify-center">
                    {getRankBadge(idx + 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{h.name}</p>
                    <p className="text-xs text-stone-500">{h.breed}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-800">
                    {typeof h[statKey] === 'number' 
                      ? h[statKey].toFixed(statKey === 'avgStats' ? 1 : 0)
                      : h[statKey]
                    }
                    {suffix}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {horses.length === 0 && (
            <p className="text-center text-stone-400 py-8 text-sm">Aucune donnée disponible</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Classement Général</h1>
        <p className="text-stone-500 mt-1">Les meilleurs chevaux et performances d'EquiGenes</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-yellow-800">{topByWins[0]?.competition_wins || 0}</p>
            <p className="text-xs text-yellow-600">Record de victoires</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-800">
              {topByStats[0]?.avgStats?.toFixed(1) || 0}
            </p>
            <p className="text-xs text-blue-600">Meilleure moyenne</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-800">{horses.length}</p>
            <p className="text-xs text-green-600">Chevaux enregistrés</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wins" className="w-full">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="wins">
            <Trophy className="w-4 h-4 mr-2" />
            Par Victoires
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-2" />
            Par Stats
          </TabsTrigger>
          <TabsTrigger value="energy">
            <Zap className="w-4 h-4 mr-2" />
            Par Énergie
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Award className="w-4 h-4 mr-2" />
            Compétitions Récentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wins" className="mt-6">
          <RankingCard 
            horses={topByWins}
            title="Top 20 - Victoires"
            icon={Trophy}
            statKey="competition_wins"
            suffix=" 🏆"
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <RankingCard 
            horses={topByStats}
            title="Top 20 - Moyenne des Stats"
            icon={TrendingUp}
            statKey="avgStats"
            suffix="/100"
          />
        </TabsContent>

        <TabsContent value="energy" className="mt-6">
          <RankingCard 
            horses={topByEnergy}
            title="Top 20 - Énergie"
            icon={Zap}
            statKey="energy"
            suffix="%"
          />
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <Card className="border-0 bg-white/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                Dernières Compétitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentCompetitions.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800 text-sm">{c.name}</p>
                      <p className="text-xs text-stone-500">
                        {c.horse_name} — {c.discipline?.replace(/_/g, ' ')} ({c.level})
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-bold text-stone-800 text-sm">{c.score?.toFixed(1)} pts</p>
                        <Badge variant="outline" className="text-xs">#{c.rank}</Badge>
                      </div>
                      {c.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                      {c.rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                      {c.rank === 3 && <Medal className="w-5 h-5 text-amber-700" />}
                    </div>
                  </div>
                ))}
                {recentCompetitions.length === 0 && (
                  <p className="text-center text-stone-400 py-8 text-sm">Aucune compétition récente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}