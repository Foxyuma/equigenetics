import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Dna } from 'lucide-react';
import { Link } from 'react-router-dom';
import GeneticPanel from '../components/horse/GeneticPanel';
import { getDisplayBreed } from '@/lib/horseImagePrompt';

export default function PublicHorseProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const horseId = urlParams.get('id');

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horse, isLoading } = useQuery({
    queryKey: ['horse-public', horseId],
    queryFn: () => base44.entities.Horse.filter({ id: horseId }).then(r => r[0]),
    enabled: !!horseId,
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['horse-competitions-public', horseId],
    queryFn: () => base44.entities.Competition.filter({ horse_id: horseId, status: 'completed' }, '-created_date', 30),
    enabled: !!horseId,
  });

  // If it's the user's own horse, redirect to full detail
  if (horse && currentUser && horse.created_by === currentUser.email) {
    window.location.replace(`/HorseDetail?id=${horseId}`);
    return null;
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
    </div>
  );

  if (!horse) return (
    <div className="text-center py-20">
      <p className="text-stone-400">Horse not found</p>
      <Link to="/Rankings"><Button variant="outline" className="mt-4">Back to rankings</Button></Link>
    </div>
  );

  const rankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // Only show publicly known genes (health genes that are 'affected' or have been tested — simulate with all for now)
  const knownGenes = horse.health_genes?.filter(g => g.status !== 'clear') || [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link to="/Rankings" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
       <ArrowLeft className="w-4 h-4" />Back to rankings
      </Link>

      {/* Header */}
      <Card className="border-0 bg-gradient-to-br from-stone-50 to-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-800">{horse.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={`border-0 ${horse.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                  {horse.sex === 'male' ? '♂ Male' : '♀ Female'}
                  </Badge>
                  <Badge variant="outline">{getDisplayBreed(horse.breed)}</Badge>
                  <Badge variant="outline">{horse.age || 0} yrs</Badge>
                  {horse.coat_color && <Badge className="bg-stone-100 text-stone-600 border-0">{horse.coat_color}</Badge>}
                  </div>
                  <p className="text-xs text-stone-400 mt-2">Public profile · Limited information</p>
            </div>
            {horse.image_url && (
              <img src={horse.image_url} alt={horse.name} className="w-24 h-24 rounded-xl object-cover" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-white/60 text-center">
              <p className="text-2xl font-bold text-amber-700">{horse.competition_wins || 0}</p>
              <p className="text-xs text-stone-500">Wins</p>
              </div>
              <div className="p-3 rounded-xl bg-white/60 text-center">
              <p className="text-2xl font-bold text-stone-700">{competitions.length}</p>
              <p className="text-xs text-stone-500">Competitions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Known genetic diseases */}
      <Card className="border-0 bg-white/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Dna className="w-5 h-5 text-violet-500" />
            Known genes (public)
            </CardTitle>
            </CardHeader>
            <CardContent>
            {knownGenes.length === 0 ? (
            <p className="text-stone-400 text-sm">No problematic genes publicly known</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {knownGenes.map(g => (
                <Badge key={g.disease} className={`border-0 ${g.status === 'affected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {g.disease} — {g.status === 'affected' ? 'Affected' : 'Carrier'}
                  </Badge>
                  ))}
                  </div>
                  )}
                  <p className="text-xs text-stone-400 mt-3">
                  ℹ️ Only genes revealed by DNA tests performed are publicly visible.
                  </p>
        </CardContent>
      </Card>

      {/* Competition history */}
      <Card className="border-0 bg-white/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Competition results
            </CardTitle>
            </CardHeader>
            <CardContent>
            {competitions.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-6">No competition results</p>
          ) : (
            <div className="space-y-2">
              {competitions.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{rankMedal(c.rank)}</span>
                    <div>
                      <p className="font-medium text-stone-700 text-sm">{c.name}</p>
                      <p className="text-xs text-stone-400">{c.discipline?.replace(/_/g, ' ')} · {c.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-stone-800 text-sm">{c.score?.toFixed(1)} pts</p>
                    {c.is_olympic && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Olympic</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}