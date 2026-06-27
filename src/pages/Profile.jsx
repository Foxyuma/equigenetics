import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Dna, Zap, Star, Calendar, Plus, Tag } from 'lucide-react';
import BreedingReputation from '../components/profile/BreedingReputation';
import { getTier, maxAffixesForLevel } from '@/lib/breedingReputation';

export default function Profile() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['my-horses', user?.email],
    queryFn: () => base44.entities.Horse.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['my-competitions', user?.email],
    queryFn: () => base44.entities.Competition.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const totalWins = horses.reduce((sum, h) => sum + (h.competition_wins || 0), 0);
  const avgStats = horses.length > 0
    ? Math.round(horses.reduce((sum, h) => {
        const vals = Object.values(h.stats || {}).filter(v => typeof v === 'number');
        return sum + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
      }, 0) / horses.length)
    : 0;

  const genesis = user?.genesis_balance ?? 0;
  const credits = user?.credits_balance ?? 0;
  const fmtG = (n) => n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1_000 ? (n/1_000).toFixed(0)+'k' : String(n);

  const breedCounts = horses.reduce((acc, h) => { acc[h.breed] = (acc[h.breed] || 0) + 1; return acc; }, {});
  const topBreed = Object.entries(breedCounts).sort((a, b) => b[1] - a[1])[0];

  const queryClient = useQueryClient();
  const [newAffixeName, setNewAffixeName] = useState('');
  const [newAffixePos, setNewAffixePos] = useState('prefix');
  const [showAffixeForm, setShowAffixeForm] = useState(false);

  const tier = getTier(user?.breeding_reputation ?? 0);
  const maxAffixes = maxAffixesForLevel(tier.level);
  const currentAffixes = user?.affixes ?? [];
  const canAddAffixe = currentAffixes.length < maxAffixes;

  const addAffixeMutation = useMutation({
    mutationFn: async () => {
      if (!newAffixeName.trim() || newAffixeName.trim().length < 2) throw new Error('Nom trop court');
      const updated = [...currentAffixes, { name: newAffixeName.trim(), position: newAffixePos, created_at: new Date().toISOString() }];
      await base44.auth.updateMe({ affixes: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setNewAffixeName('');
      setShowAffixeForm(false);
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-200/50 text-white text-2xl font-bold">
            {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-800">{user?.full_name || 'Breeder'}</h1>
            <p className="text-stone-500 text-sm">{user?.email}</p>
            <Badge variant="outline" className="mt-1 text-xs capitalize">{user?.role || 'user'}</Badge>
          </div>
        </div>

      </div>

      {/* Breeding reputation */}
      <BreedingReputation reputation={user?.breeding_reputation ?? 0} affixes={user?.affixes ?? []} />

      {/* Gestion affixes */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-stone-800">Breeding affixes</h3>
              <Badge variant="outline" className="text-xs">{currentAffixes.length} / {maxAffixes}</Badge>
            </div>
            {canAddAffixe && !showAffixeForm && (
              <Button size="sm" variant="outline" onClick={() => setShowAffixeForm(true)} className="text-amber-700 border-amber-300 hover:bg-amber-50">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            )}
          </div>

          {currentAffixes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentAffixes.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                  <span className="text-sm font-semibold text-amber-800">{a.position === 'prefix' ? `${a.name} …` : `… ${a.name}`}</span>
                  <span className="text-xs text-amber-500">{a.position === 'prefix' ? 'prefix' : 'suffix'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic">No affixes. Add one to personalize your foals' names!</p>
          )}

          {!canAddAffixe && (
            <p className="text-xs text-stone-400">Next affix available at level {Math.ceil(tier.level / 5) * 5 + 1}</p>
          )}

          {showAffixeForm && (
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <Input
                value={newAffixeName}
                onChange={e => setNewAffixeName(e.target.value)}
                placeholder="Affix name…"
                maxLength={30}
                className="bg-stone-50"
              />
              <div className="flex gap-2">
                <button onClick={() => setNewAffixePos('prefix')} className={`flex-1 text-sm py-2 rounded-lg border-2 transition-all ${newAffixePos === 'prefix' ? 'border-amber-400 bg-amber-50 text-amber-800 font-semibold' : 'border-stone-200 text-stone-500'}`}>
                  {newAffixeName || 'Affix'} … (prefix)
                </button>
                <button onClick={() => setNewAffixePos('suffix')} className={`flex-1 text-sm py-2 rounded-lg border-2 transition-all ${newAffixePos === 'suffix' ? 'border-amber-400 bg-amber-50 text-amber-800 font-semibold' : 'border-stone-200 text-stone-500'}`}>
                  … {newAffixeName || 'Affix'} (suffix)
                </button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addAffixeMutation.mutate()} disabled={newAffixeName.trim().length < 2 || addAffixeMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                  Save affix
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAffixeForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monnaies */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 text-xl font-bold">₲</div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{fmtG(genesis)}</p>
              <p className="text-xs text-amber-600">Genesis</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-violet-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 text-xl font-bold">✦</div>
            <div>
              <p className="text-2xl font-bold text-violet-700">{credits}</p>
              <p className="text-xs text-violet-600">Premium credits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Horses', value: horses.length, icon: Dna, color: 'text-amber-600 bg-amber-50' },
          { label: 'Wins', value: totalWins, icon: Trophy, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Competitions', value: competitions.length, icon: Star, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Avg stats', value: avgStats, icon: Zap, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{value}</p>
                <p className="text-xs text-stone-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breeding info */}
      {(topBreed || user?.created_date) && (
        <Card className="border-0 shadow-sm bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700">
              <Calendar className="w-5 h-5" />
            </div>
            {topBreed && (
              <div>
                <p className="text-sm font-semibold text-stone-700">Favorite breed</p>
                <p className="text-xs text-stone-500">{topBreed[0]} — {topBreed[1]} horse{topBreed[1] > 1 ? 's' : ''}</p>
              </div>
            )}
            <div className="ml-auto text-xs text-stone-400">
              Member since {user?.created_date ? new Date(user.created_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mes chevaux */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-stone-800">My horses</h2>
          <Link to="/Stable">
            <Button variant="outline" size="sm">View stable</Button>
          </Link>
        </div>

        {horses.length === 0 ? (
          <Card className="border-dashed border-2 border-stone-200">
            <CardContent className="p-8 text-center">
              <p className="text-stone-400 text-sm">No horses yet.</p>
              <Link to="/Stable">
                <Button className="mt-3 bg-amber-600 hover:bg-amber-700">Create my first horse</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {horses.slice(0, 9).map(horse => {
              const vals = Object.values(horse.stats || {}).filter(v => typeof v === 'number');
              const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
              return (
                <Link key={horse.id} to={`/HorseDetail?id=${horse.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {horse.image_url ? (
                          <img src={horse.image_url} alt={horse.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl">🐎</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-800 truncate">{horse.name}</p>
                          <p className="text-xs text-stone-500 truncate">{horse.breed} · {horse.sex === 'male' ? '♂' : '♀'} · {horse.age} yrs</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-stone-400">{horse.coat_color || '—'}</span>
                            {horse.competition_wins > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs px-1.5 py-0">
                                🏆 {horse.competition_wins}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-600">{avg}</p>
                          <p className="text-xs text-stone-400">avg</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}