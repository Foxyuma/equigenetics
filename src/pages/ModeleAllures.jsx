import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GridBreakdownDialog from '@/components/modeleallures/GridBreakdownDialog';
import ModeleAlluresCalendar from '@/components/modeleallures/ModeleAlluresCalendar';
import { Sparkles, Trophy, ShieldAlert, Info, Calendar, ClipboardList } from 'lucide-react';
import {
  getModeleAlluresScore,
  getQualification,
  isEligibleForModeleAllures,
  getAgeClassLabel,
  AGE_CLASSES,
  PRIZE_TABLE,
} from '../lib/modeleAllures';

const DOPING_CHECK_PROB = 0.10;

function rankMedal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default function ModeleAllures() {
  const [tab, setTab] = useState('calendrier');
  const [breakdownHorse, setBreakdownHorse] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses-modele', currentUser?.email],
    queryFn: () => base44.entities.Horse.filter({ owner_email: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
  });

  const { data: clocks = [] } = useQuery({
    queryKey: ['game-clock-modele'],
    queryFn: () => base44.entities.GameClock.list('-created_date', 1),
  });
  const gameYear = clocks[0]?.year || 1;

  const { data: allModeleComps = [] } = useQuery({
    queryKey: ['modele-allures-comps', currentUser?.email],
    queryFn: () =>
      base44.entities.Competition.filter(
        { created_by: currentUser.email, discipline: 'modele_allures' },
        '-created_date',
        200,
      ),
    enabled: !!currentUser?.email,
  });

  const pendingComps = allModeleComps.filter((c) => c.status === 'registered');
  const completedComps = allModeleComps.filter((c) => c.status === 'completed');

  const eligibleHorses = horses.filter(isEligibleForModeleAllures);
  const breeds = [...new Set(eligibleHorses.map((h) => h.breed))].sort();

  const isAlreadyRegistered = (horseId) =>
    allModeleComps.some((c) => c.horse_id === horseId && c.game_year === gameYear);

  const registerMutation = useMutation({
    mutationFn: async (horse) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const competitionDate = tomorrow.toISOString().split('T')[0];

      await base44.entities.Competition.create({
        name: `Modèles & Allures — ${horse.breed} (${getAgeClassLabel(horse.age || 0)})`,
        discipline: 'modele_allures',
        level: 'novice',
        is_olympic: false,
        horse_id: horse.id,
        horse_name: horse.name,
        score: null,
        rank: null,
        prize: null,
        status: 'registered',
        competition_date: competitionDate,
        breed: horse.breed,
        age_class: horse.age || 0,
        game_year: gameYear,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modele-allures-comps', currentUser?.email] });
      toast.success('Inscription confirmée ! Résultats demain à minuit 🌙');
    },
    onError: (err) => toast.error(err.message),
  });

  const resolveMutation = useMutation({
    mutationFn: async (comp) => {
      const horse = await base44.entities.Horse.filter({ id: comp.horse_id }).then((r) => r[0]);
      if (!horse) return;

      // Doping check
      if (Math.random() < DOPING_CHECK_PROB) {
        const isDopingRisk = horse.doping_risk_until && new Date(horse.doping_risk_until) > new Date();
        if (isDopingRisk) {
          await base44.entities.Competition.update(comp.id, {
            score: 0, rank: null, status: 'completed',
            disqualified: true, disqualification_reason: 'Contrôle antidopage positif',
          });
          if (currentUser) {
            await base44.auth.updateMe({
              breeding_reputation: Math.max(0, (currentUser.breeding_reputation ?? 0) - 20),
            });
          }
          await base44.entities.Horse.update(horse.id, { energy: Math.max(0, (horse.energy || 100) - 5) });
          return { disqualified: true, horseName: horse.name, breed: comp.breed };
        }
      }

      const score = getModeleAlluresScore(horse);
      const npcScores = Array.from({ length: 7 }, () =>
        Math.round((35 + Math.random() * 50) * 10) / 10,
      );
      const allScores = [score, ...npcScores].sort((a, b) => b - a);
      const rank = allScores.indexOf(score) + 1;

      const prizeEntry = PRIZE_TABLE.find((p) => p.rank === rank);
      const prize = prizeEntry?.prize || 0;
      const repGain = prizeEntry?.rep || 0;

      await base44.entities.Competition.update(comp.id, {
        score, rank, status: 'completed', disqualified: false, prize,
      });

      if (repGain > 0 && currentUser) {
        const newRep = (currentUser.breeding_reputation ?? 0) + repGain;
        const newBalance = (currentUser.genesis_balance ?? 200000) + prize;
        await base44.auth.updateMe({ breeding_reputation: newRep, genesis_balance: newBalance });
        await base44.entities.Transaction.create({
          user_email: currentUser.email,
          currency: 'genesis',
          amount: prize,
          balance_after: newBalance,
          reason: 'prix_modele_allures',
          reference_id: comp.id,
        });
      }

      await base44.entities.Horse.update(horse.id, {
        energy: Math.max(0, (horse.energy || 100) - 5),
        competition_wins: (horse.competition_wins || 0) + (rank === 1 ? 1 : 0),
      });

      return { rank, horseName: horse.name, breed: comp.breed, ageClass: comp.age_class, prize };
    },
    onSuccess: (result) => {
      if (result?.disqualified) {
        toast.error(`🚨 ${result.horseName} disqualifié(e) du concours ${result.breed} ! Contrôle antidopage positif.`);
      } else if (result?.rank === 1) {
        toast.success(`🏆 ${result.horseName} remporte le championnat ${result.breed} (${getAgeClassLabel(result.ageClass)}) ! +${result.prize} ₲`);
      } else if (result?.rank <= 3) {
        toast.success(`${rankMedal(result.rank)} ${result.horseName} — championnat ${result.breed} ! +${result.prize} ₲`);
      }
      queryClient.invalidateQueries({ queryKey: ['modele-allures-comps', currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['horses-modele', currentUser?.email] });
    },
  });

  // Auto-resolve past-due competitions
  useEffect(() => {
    if (!pendingComps.length || !currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const toResolve = pendingComps.filter((c) => c.competition_date && c.competition_date <= today);
    if (toResolve.length === 0) return;
    toResolve.forEach((c) => resolveMutation.mutate(c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingComps.length, currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-amber-500" />
          Concours Modèles et Allures
        </h1>
        <p className="text-stone-500 mt-1">
          Championnats de race par classe d'âge — réservés aux jeunes chevaux (0-4 ans) inscrits au studbook ou OC
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-stone-600 space-y-1">
            <p>• <strong>1 concours par race et par an</strong> — chaque cheval ne peut participer qu'une fois par an dans sa race.</p>
            <p>• <strong>Classes d'âge</strong> : de l'année (0), 1 an, 2 ans, 3 ans, 4 ans.</p>
            <p>• <strong>Éligibilité</strong> : le cheval doit être inscrit au studbook ou avoir des origines connues (OC).</p>
            <p>• <strong>Notation</strong> : modèle (morphologie), allures (potentiel génétique), type de race, présentation.</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
          <TabsTrigger value="inscriptions">Inscriptions</TabsTrigger>
          <TabsTrigger value="resultats">Résultats</TabsTrigger>
        </TabsList>

        {/* Calendrier */}
        <TabsContent value="calendrier" className="mt-4">
          <ModeleAlluresCalendar
            competitions={allModeleComps}
            gameYear={gameYear}
            breeds={breeds}
          />
        </TabsContent>

        {/* Inscriptions */}
        <TabsContent value="inscriptions" className="mt-4 space-y-4">
          {eligibleHorses.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun cheval éligible.</p>
              <p className="text-sm mt-1">Vos chevaux doivent avoir 0-4 ans et être inscrits au studbook ou OC.</p>
            </div>
          ) : (
            breeds.map((breed) => {
              const breedHorses = eligibleHorses.filter((h) => h.breed === breed);
              const ageClassesPresent = AGE_CLASSES.filter((ac) =>
                breedHorses.some((h) => (h.age || 0) === ac.age),
              );
              return (
                <Card key={breed} className="border-0 bg-white/70">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        {breed}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Année {gameYear} · {breedHorses.length} cheval(x)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {ageClassesPresent.map((ac) => {
                      const horsesInClass = breedHorses.filter((h) => (h.age || 0) === ac.age);
                      return (
                        <div key={ac.age} className="border-t border-stone-100 pt-3 first:border-0 first:pt-0">
                          <p className="text-sm font-semibold text-stone-600 mb-2">
                            {ac.icon} {ac.label}
                          </p>
                          <div className="space-y-2">
                            {horsesInClass.map((horse) => {
                              const alreadyReg = isAlreadyRegistered(horse.id);
                              const estScore = getModeleAlluresScore(horse);
                              return (
                                <div
                                  key={horse.id}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="min-w-0">
                                      <p className="font-medium text-stone-800 text-sm truncate">{horse.name}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <Badge
                                          variant="outline"
                                          className={`text-xs border-0 ${
                                            horse.studbook_registered
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-blue-50 text-blue-700'
                                          }`}
                                        >
                                          {horse.studbook_registered ? 'Studbook' : 'OC'}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs border-0 bg-stone-100 text-stone-600">
                                          {horse.coat_color || '—'}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs border-0 bg-amber-50 text-amber-700">
                                          ~{estScore.toFixed(1)} pts
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className={`text-xs border-0 ${getQualification(estScore).badgeClass}`}
                                        >
                                          {getQualification(estScore).label}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setBreakdownHorse(horse)}
                                      className="border-stone-200 text-stone-600 hover:bg-stone-50"
                                    >
                                      <ClipboardList className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => registerMutation.mutate(horse)}
                                      disabled={alreadyReg || registerMutation.isPending}
                                      className="bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                      {alreadyReg ? '✓ Inscrit' : 'Inscrire'}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Pending registrations */}
          {pendingComps.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/60">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Inscriptions en attente (résultats à minuit)
                </p>
                <div className="space-y-2">
                  {pendingComps.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-sm text-blue-700 bg-white/60 rounded-lg p-2"
                    >
                      <span>{c.horse_name} — {c.breed} ({getAgeClassLabel(c.age_class)})</span>
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Le {c.competition_date}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Résultats */}
        <TabsContent value="resultats" className="mt-4">
          <Card className="border-0 bg-white/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Palmarès des championnats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedComps.length === 0 ? (
                <p className="text-center text-stone-400 py-8">Aucun résultat pour le moment</p>
              ) : (
                <div className="space-y-2">
                  {completedComps.map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        c.disqualified ? 'bg-red-50 hover:bg-red-100' : 'bg-stone-50 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{c.disqualified ? '🚫' : rankMedal(c.rank)}</span>
                        <div>
                          <p className="font-medium text-stone-700 text-sm">{c.horse_name}</p>
                          <p className="text-xs text-stone-400">
                            {c.breed} · {getAgeClassLabel(c.age_class)} · Année {c.game_year}
                          </p>
                          {c.disqualified && (
                            <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                              <ShieldAlert className="w-3 h-3" />
                              {c.disqualification_reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {c.disqualified ? (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs">Disqualifié</Badge>
                        ) : (
                          <>
                            <p className="font-bold text-stone-800">{c.score?.toFixed(1)} pts</p>
                            {c.prize > 0 && (
                              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs mt-0.5">+{c.prize} ₲</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogue grille FCT */}
      <GridBreakdownDialog horse={breakdownHorse} onClose={() => setBreakdownHorse(null)} />
    </div>
  );
}