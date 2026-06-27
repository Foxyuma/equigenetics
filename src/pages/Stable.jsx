import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from 'lucide-react';
import HorseCard from '../components/horse/HorseCard';
import { BREEDS, estimateHorseValue } from '../components/genetics/GeneticsEngine';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';

const HORSE_NAMES_MALE = ["Tornado", "Eclipse", "Sultan", "Orage", "Apollo", "Zéphyr", "Atlas", "Titan", "Merlin", "Sirius"];
const HORSE_NAMES_FEMALE = ["Luna", "Aurore", "Perle", "Tempête", "Étoile", "Jade", "Iris", "Stella", "Naya", "Olympe"];

export default function Stable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterBreed, setFilterBreed] = useState('all');
  const [filterSex, setFilterSex] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [filterValue, setFilterValue] = useState('all');

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Tous les chevaux où l'utilisateur est le owner_email (achetés ou créés)
  const { data: horses = [], isLoading } = useQuery({
    queryKey: ['horses', currentUser?.email],
    queryFn: () => base44.entities.Horse.filter({ owner_email: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
  });

  const filtered = horses.filter(h => {
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBreed !== 'all' && h.breed !== filterBreed) return false;
    if (filterSex !== 'all' && h.sex !== filterSex) return false;
    if (filterAge !== 'all' && h.age !== parseInt(filterAge, 10)) return false;
    if (filterValue !== 'all') {
      const val = estimateHorseValue(h);
      if (filterValue === 'lt5k' && !(val < 5000)) return false;
      if (filterValue === '5to15k' && !(val >= 5000 && val < 15000)) return false;
      if (filterValue === '15to50k' && !(val >= 15000 && val < 50000)) return false;
      if (filterValue === '50to100k' && !(val >= 50000 && val < 100000)) return false;
      if (filterValue === 'gt100k' && !(val >= 100000)) return false;
    }
    return true;
  });

  const availableAges = [...new Set(horses.map(h => h.age || 0))].sort((a, b) => a - b);

  // Onboarding pour les nouveaux joueurs — aucun cheval = premier cheval à créer
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (!isLoading && horses.length === 0 && currentUser && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [isLoading, horses.length, currentUser]);

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => {
      setShowOnboarding(false);
      navigate('/Guide');
    }} />;
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
        <Select value={filterAge} onValueChange={setFilterAge}>
          <SelectTrigger className="w-full sm:w-36 bg-white/80">
            <SelectValue placeholder="Âge" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous âges</SelectItem>
            {availableAges.map(a => <SelectItem key={a} value={String(a)}>{a} an{a > 1 ? 's' : ''}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full sm:w-40 bg-white/80">
            <SelectValue placeholder="Valeur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes valeurs</SelectItem>
            <SelectItem value="lt5k">&lt; 5 000 ₲</SelectItem>
            <SelectItem value="5to15k">5 000 – 15 000 ₲</SelectItem>
            <SelectItem value="15to50k">15 000 – 50 000 ₲</SelectItem>
            <SelectItem value="50to100k">50 000 – 100 000 ₲</SelectItem>
            <SelectItem value="gt100k">&gt; 100 000 ₲</SelectItem>
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
          <p className="text-stone-400 mt-1">{horses.length === 0 ? 'Vous n\'avez pas encore de cheval dans votre écurie.' : 'Essayez de modifier vos filtres.'}</p>
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