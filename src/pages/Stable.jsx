import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Filter } from 'lucide-react';
import HorseCard from '../components/horse/HorseCard';
import { BREEDS, generateStarterHorse } from '../components/genetics/GeneticsEngine';

const HORSE_NAMES_MALE = ["Tornado", "Eclipse", "Sultan", "Orage", "Apollo", "Zéphyr", "Atlas", "Titan", "Merlin", "Sirius"];
const HORSE_NAMES_FEMALE = ["Luna", "Aurore", "Perle", "Tempête", "Étoile", "Jade", "Iris", "Stella", "Naya", "Olympe"];

export default function Stable() {
  const [search, setSearch] = useState('');
  const [filterBreed, setFilterBreed] = useState('all');
  const [filterSex, setFilterSex] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newHorse, setNewHorse] = useState({ name: '', breed: BREEDS[0], sex: 'female' });
  
  const queryClient = useQueryClient();

  const { data: horses = [], isLoading } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Horse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      setShowCreate(false);
      setNewHorse({ name: '', breed: BREEDS[0], sex: 'female' });
    }
  });

  const handleCreate = () => {
    const starter = generateStarterHorse(newHorse.breed);
    createMutation.mutate({
      ...newHorse,
      ...starter,
      age: 1 + Math.floor(Math.random() * 8),
    });
  };

  const handleRandomHorse = () => {
    const breed = BREEDS[Math.floor(Math.random() * BREEDS.length)];
    const sex = Math.random() > 0.5 ? 'male' : 'female';
    const names = sex === 'male' ? HORSE_NAMES_MALE : HORSE_NAMES_FEMALE;
    const name = names[Math.floor(Math.random() * names.length)];
    const starter = generateStarterHorse(breed);
    createMutation.mutate({
      name, breed, sex,
      ...starter,
      age: 1 + Math.floor(Math.random() * 12),
    });
  };

  const filtered = horses.filter(h => {
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBreed !== 'all' && h.breed !== filterBreed) return false;
    if (filterSex !== 'all' && h.sex !== filterSex) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Mon Écurie</h1>
          <p className="text-stone-500 mt-1">{horses.length} chevaux</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRandomHorse} variant="outline" className="text-sm">
            🎲 Aléatoire
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-stone-800 hover:bg-stone-900 text-sm">
                <Plus className="w-4 h-4 mr-2" />Nouveau cheval
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un cheval</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input 
                  placeholder="Nom du cheval" 
                  value={newHorse.name}
                  onChange={(e) => setNewHorse({...newHorse, name: e.target.value})}
                />
                <Select value={newHorse.breed} onValueChange={(v) => setNewHorse({...newHorse, breed: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BREEDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newHorse.sex} onValueChange={(v) => setNewHorse({...newHorse, sex: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">♂ Mâle</SelectItem>
                    <SelectItem value="female">♀ Femelle</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate} disabled={!newHorse.name} className="w-full bg-stone-800 hover:bg-stone-900">
                  Créer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          <h3 className="text-lg font-semibold text-stone-600">Votre écurie est vide</h3>
          <p className="text-stone-400 mt-1">Créez votre premier cheval pour commencer l'aventure !</p>
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