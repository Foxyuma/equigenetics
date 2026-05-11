import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from 'lucide-react';
import HorseCard from '../components/horse/HorseCard';
import { BREEDS } from '../components/genetics/GeneticsEngine';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

const HORSE_NAMES_MALE = ["Tornado", "Eclipse", "Sultan", "Orage", "Apollo", "Zéphyr", "Atlas", "Titan", "Merlin", "Sirius"];
const HORSE_NAMES_FEMALE = ["Luna", "Aurore", "Perle", "Tempête", "Étoile", "Jade", "Iris", "Stella", "Naya", "Olympe"];

export default function Stable() {
  const [search, setSearch] = useState('');
  const [filterBreed, setFilterBreed] = useState('all');
  const [filterSex, setFilterSex] = useState('all');

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [], isLoading } = useQuery({
    queryKey: ['horses', currentUser?.email],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
  });

  const filtered = horses.filter(h => {
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBreed !== 'all' && h.breed !== filterBreed) return false;
    if (filterSex !== 'all' && h.sex !== filterSex) return false;
    return true;
  });

  // Show onboarding if no horses yet
  if (!isLoading && horses.length === 0 && currentUser) {
    return <OnboardingWizard />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Mon Écurie</h1>
          <p className="text-stone-500 mt-1">{horses.length} chevaux</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input 
            placeholder="Rechercher un cheval..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/80"
          />
        </div>
        <Select value={filterBreed} onValueChange={setFilterBreed}>
          <SelectTrigger className="w-full sm:w-48 bg-white/80">
            <Filter className="w-4 h-4 mr-2 text-stone-400" />
            <SelectValue placeholder="Race" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les races</SelectItem>
            {BREEDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSex} onValueChange={setFilterSex}>
          <SelectTrigger className="w-full sm:w-36 bg-white/80">
            <SelectValue placeholder="Sexe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="male">♂ Mâles</SelectItem>
            <SelectItem value="female">♀ Femelles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-72 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">🐴</span>
          <h3 className="text-lg font-semibold text-stone-600">{horses.length === 0 ? 'Votre écurie est vide' : 'Aucun résultat'}</h3>
          <p className="text-stone-400 mt-1">{horses.length === 0 ? 'Votre cheval de départ vous sera attribué lors de votre inscription.' : 'Essayez de modifier vos filtres.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(horse => (
            <HorseCard key={horse.id} horse={horse} />
          ))}
        </div>
      )}
    </div>
  );
}