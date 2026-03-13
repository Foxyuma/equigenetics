import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Trophy, Heart, Dna } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BREEDS } from '../components/genetics/GeneticsEngine';
import StatBar from '../components/horse/StatBar';

export default function Market() {
  const [search, setSearch] = useState('');
  const [filterBreed, setFilterBreed] = useState('all');

  const queryClient = useQueryClient();

  const { data: horses = [], isLoading } = useQuery({
    queryKey: ['market-horses'],
    queryFn: () => base44.entities.Horse.filter({ is_for_sale: true }, '-created_date', 100),
  });

  const buyMutation = useMutation({
    mutationFn: async (horse) => {
      await base44.entities.Horse.update(horse.id, { is_for_sale: false, price: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-horses'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
    }
  });

  const filtered = horses.filter(h => {
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBreed !== 'all' && h.breed !== filterBreed) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Marché</h1>
        <p className="text-stone-500 mt-1">Achetez des chevaux mis en vente</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/80" />
        </div>
        <Select value={filterBreed} onValueChange={setFilterBreed}>
          <SelectTrigger className="w-full sm:w-48 bg-white/80"><SelectValue placeholder="Race" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les races</SelectItem>
            {BREEDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-72 rounded-2xl bg-stone-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-12 h-12 mx-auto text-stone-300 mb-3" />
          <h3 className="text-lg font-semibold text-stone-600">Aucun cheval en vente</h3>
          <p className="text-stone-400 mt-1">Mettez vos chevaux en vente depuis leur fiche détaillée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(horse => {
            const avgStat = horse.stats ? Math.round(Object.values(horse.stats).reduce((a,b) => a+b, 0) / 7) : 0;
            return (
              <Card key={horse.id} className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-500">
                <div className="relative h-40 bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
                  {horse.image_url ? (
                    <img src={horse.image_url} alt={horse.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl opacity-20">🐴</span>
                  )}
                  <Badge className="absolute top-3 left-3 bg-emerald-500 text-white border-0 font-bold">
                    {horse.price || 0} pts
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-stone-800 text-lg">{horse.name}</h3>
                    <p className="text-sm text-stone-500">{horse.breed} — {horse.coat_color}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span className={horse.sex === 'male' ? 'text-blue-600' : 'text-pink-600'}>
                      {horse.sex === 'male' ? '♂' : '♀'}
                    </span>
                    <span>{horse.age || 0} ans</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{horse.competition_wins || 0}</span>
                    <span className="flex items-center gap-1"><Dna className="w-3 h-3" />Moy: {avgStat}</span>
                  </div>
                  {horse.stats && (
                    <div className="space-y-1">
                      {Object.entries(horse.stats).slice(0, 3).map(([s, v]) => (
                        <StatBar key={s} stat={s} value={v} />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Link to={`/HorseDetail?id=${horse.id}`} className="flex-1">
                      <Button variant="outline" className="w-full text-sm">Voir</Button>
                    </Link>
                    <Button onClick={() => buyMutation.mutate(horse)} className="flex-1 bg-stone-800 hover:bg-stone-900 text-sm">
                      Acheter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}