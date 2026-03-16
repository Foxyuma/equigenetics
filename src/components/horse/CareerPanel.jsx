import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Star, Award, Target, Zap } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DISCIPLINE_LABELS = {
  dressage: 'Dressage', show_jumping: 'Saut', cross_country: 'Cross', endurance: 'Endurance',
  reining: 'Reining', barrel_racing: 'Barrel', polo: 'Polo', eventing: 'Eventing',
  vaulting: 'Voltige', driving: 'Attelage', trail: 'Trail', western_pleasure: 'Western'
};

const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

const TROPHIES = [
  { id: 'first_win', label: 'Première Victoire', icon: '🏆', condition: (comps) => comps.some(c => c.rank === 1) },
  { id: 'hat_trick', label: 'Hat-Trick', icon: '🎩', condition: (comps) => comps.filter(c => c.rank === 1).length >= 3 },
  { id: 'podium_5', label: '5 Podiums', icon: '🎖️', condition: (comps) => comps.filter(c => c.rank <= 3).length >= 5 },
  { id: 'champion', label: 'Champion', icon: '👑', condition: (comps) => comps.filter(c => c.rank === 1).length >= 10 },
  { id: 'veteran', label: 'Vétéran', icon: '⭐', condition: (comps) => comps.length >= 20 },
  { id: 'versatile', label: 'Polyvalent', icon: '🌟', condition: (comps) => new Set(comps.map(c => c.discipline)).size >= 5 },
  { id: 'elite', label: 'Élite', icon: '💎', condition: (comps) => comps.some(c => c.level === 'elite' && c.rank === 1) },
  { id: 'olympic', label: 'Olympique', icon: '🏅', condition: (comps) => comps.some(c => c.is_olympic && c.rank <= 3) },
];

export default function CareerPanel({ competitions = [] }) {
  const sorted = [...competitions].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  // Cumulative scores over time
  const progressData = sorted.map((c, i) => {
    const prev = i > 0 ? sorted.slice(0, i).reduce((acc, x) => acc + (x.prize || 0), 0) : 0;
    return {
      index: i + 1,
      label: format(new Date(c.created_date), 'dd MMM', { locale: fr }),
      score: Math.round(c.score || 0),
      cumulativePrize: prev + (c.prize || 0),
      rank: c.rank,
    };
  });

  // Score by discipline
  const disciplineStats = Object.entries(
    competitions.reduce((acc, c) => {
      const key = c.discipline || 'unknown';
      if (!acc[key]) acc[key] = { count: 0, totalScore: 0, wins: 0 };
      acc[key].count++;
      acc[key].totalScore += c.score || 0;
      if (c.rank === 1) acc[key].wins++;
      return acc;
    }, {})
  ).map(([disc, stats]) => ({
    discipline: DISCIPLINE_LABELS[disc] || disc,
    avgScore: Math.round(stats.totalScore / stats.count),
    wins: stats.wins,
    count: stats.count,
  })).sort((a, b) => b.avgScore - a.avgScore);

  // Summary stats
  const totalPrize = competitions.reduce((acc, c) => acc + (c.prize || 0), 0);
  const wins = competitions.filter(c => c.rank === 1).length;
  const podiums = competitions.filter(c => c.rank <= 3).length;
  const bestScore = competitions.length ? Math.max(...competitions.map(c => c.score || 0)) : 0;
  const avgScore = competitions.length ? Math.round(competitions.reduce((a, c) => a + (c.score || 0), 0) / competitions.length) : 0;
  const earnedTrophies = TROPHIES.filter(t => t.condition(competitions));

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 mx-auto text-stone-200 mb-3" />
        <h3 className="text-stone-500 font-medium">Aucune compétition</h3>
        <p className="text-stone-400 text-sm mt-1">La carrière de ce cheval n'a pas encore commencé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Compétitions', value: competitions.length, icon: Target, color: 'text-stone-600' },
          { label: 'Victoires', value: wins, icon: Trophy, color: 'text-amber-500' },
          { label: 'Podiums', value: podiums, icon: Award, color: 'text-indigo-500' },
          { label: 'Meilleur Score', value: bestScore.toFixed(1), icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Gains totaux', value: `${totalPrize} pts`, icon: Star, color: 'text-rose-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 bg-white/70">
            <CardContent className="p-4 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
              <p className="text-xl font-bold text-stone-800">{value}</p>
              <p className="text-xs text-stone-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trophies */}
      <Card className="border-0 bg-white/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Trophées
            <Badge className="bg-amber-100 text-amber-700 border-0 ml-1">{earnedTrophies.length}/{TROPHIES.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TROPHIES.map(trophy => {
              const earned = earnedTrophies.find(t => t.id === trophy.id);
              return (
                <div
                  key={trophy.id}
                  title={trophy.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    earned
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-stone-100 border-stone-200 text-stone-400 opacity-50'
                  }`}
                >
                  <span>{trophy.icon}</span>
                  <span>{trophy.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Score progression chart */}
      {progressData.length >= 2 && (
        <Card className="border-0 bg-white/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Progression des scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v} pts`, 'Score']}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cumulative gains chart */}
      {progressData.length >= 2 && totalPrize > 0 && (
        <Card className="border-0 bg-white/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Gains cumulés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="prizeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v} pts`, 'Gains cumulés']}
                />
                <Area type="monotone" dataKey="cumulativePrize" stroke="#f59e0b" fill="url(#prizeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance by discipline */}
      {disciplineStats.length > 1 && (
        <Card className="border-0 bg-white/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Score moyen par discipline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={disciplineStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#78716c' }} domain={[0, 100]} />
                <YAxis dataKey="discipline" type="category" tick={{ fontSize: 11, fill: '#78716c' }} width={70} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n, p) => [`${v} pts (${p.payload.count} courses, ${p.payload.wins} victoires)`, 'Score moyen']}
                />
                <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Competition history */}
      <Card className="border-0 bg-white/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique complet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...competitions].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(c => (
              <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl text-sm ${c.rank === 1 ? 'bg-amber-50 border border-amber-100' : 'bg-stone-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{RANK_MEDAL[c.rank] || `#${c.rank}`}</span>
                  <div>
                    <p className="font-medium text-stone-700">{c.name}</p>
                    <p className="text-xs text-stone-400">
                      {DISCIPLINE_LABELS[c.discipline] || c.discipline} · {c.level}
                      {c.is_olympic && <span className="ml-1 text-amber-500">· Olympique</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-stone-800">{c.score?.toFixed(1)} pts</p>
                  {c.prize > 0 && <p className="text-xs text-amber-600 font-medium">+{c.prize} pts</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}