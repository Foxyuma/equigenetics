import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Calendar, Dna, BarChart2 } from 'lucide-react';
import StatBar from '../components/horse/StatBar';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';

const STAT_LABELS = {
  speed: 'Speed', endurance: 'Endurance', agility: 'Agility',
  strength: 'Strength', temperament: 'Temperament', jumping: 'Jumping', dressage: 'Dressage',
};

export default function BreedingBook() {
  const [search, setSearch] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['breeding-records-book', currentUser?.email],
    queryFn: () => base44.entities.BreedingRecord.filter({ created_by: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
  });

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return (
      r.foal_name?.toLowerCase().includes(q) ||
      r.father_name?.toLowerCase().includes(q) ||
      r.mother_name?.toLowerCase().includes(q) ||
      r.breed?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-amber-600" />
            Breeding Book
          </h1>
          <p className="text-stone-500 mt-1">Complete history of all your crosses and births</p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 border-0 text-sm px-3 py-1.5 self-start sm:self-center">
          {records.length} breeding{records.length !== 1 ? 's' : ''} recorded
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Search by foal name, parents or breed..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-white border-stone-200"
        />
      </div>

      {/* Records */}
      {isLoading ? (
        <div className="text-center py-12 text-stone-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 bg-white/60">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">
              {search ? 'No results for this search.' : 'No breedings recorded yet.'}
            </p>
            {!search && (
              <p className="text-stone-400 text-sm mt-1">
                Start by doing a cross from the <Link to="/Breeding" className="text-amber-600 hover:underline">Breeding</Link> page.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(record => (
            <Card key={record.id} className="border-0 bg-white/70 hover:bg-white transition-colors">
              <CardContent className="p-0">
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-2 px-5 pt-5 pb-3 border-b border-stone-100">
                  {/* Parents */}
                  <span className="font-semibold text-blue-600">{record.father_name || '—'}</span>
                  <span className="text-stone-300">♂</span>
                  <ArrowRight className="w-4 h-4 text-stone-300" />
                  <span className="font-semibold text-pink-600">{record.mother_name || '—'}</span>
                  <span className="text-stone-300">♀</span>
                  <ArrowRight className="w-4 h-4 text-stone-300" />

                  {/* Foal */}
                  {record.foal_id ? (
                    <Link
                      to={`/HorseDetail?id=${record.foal_id}`}
                      className="font-bold text-stone-800 hover:text-amber-600 transition-colors text-lg"
                    >
                      {record.foal_name}
                    </Link>
                  ) : (
                    <span className="font-bold text-stone-800 text-lg">{record.foal_name || 'Unknown foal'}</span>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 ml-auto">
                    {record.foal_sex && (
                      <Badge className={`border-0 text-xs ${record.foal_sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {record.foal_sex === 'male' ? '♂ Male' : '♀ Female'}
                      </Badge>
                    )}
                    {(record.foal_breed || record.breed) && (
                      <Badge variant="outline" className="text-xs">{record.foal_breed || record.breed}</Badge>
                    )}
                    {record.foal_coat_color && (
                      <Badge className="bg-stone-100 text-stone-600 border-0 text-xs">{record.foal_coat_color}</Badge>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date info */}
                  <div className="space-y-2">
                    {record.breeding_date && (
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
                        <span>Breeding: <span className="font-medium text-stone-700">
                          {format(new Date(record.breeding_date), 'd MMMM yyyy', { locale: enGB })}
                        </span></span>
                      </div>
                    )}
                    {record.foal_due_date && (
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>Expected birth: <span className="font-medium text-stone-700">
                          {format(new Date(record.foal_due_date), 'd MMMM yyyy', { locale: enGB })}
                        </span></span>
                      </div>
                    )}
                    {record.created_date && !record.breeding_date && (
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
                        <span>Recorded on: <span className="font-medium text-stone-700">
                          {format(new Date(record.created_date), 'd MMMM yyyy', { locale: enGB })}
                        </span></span>
                      </div>
                    )}
                    {record.foal_health_genes?.filter(g => g.status !== 'clear').length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-stone-400 w-full">Health:</span>
                        {record.foal_health_genes.filter(g => g.status !== 'clear').map(g => (
                          <Badge key={g.disease} className={`text-xs border-0 ${g.status === 'carrier' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                            {g.disease}: {g.status === 'carrier' ? 'Carrier' : 'Affected'}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {record.notes && (
                      <p className="text-xs text-stone-400 italic mt-1">{record.notes}</p>
                    )}
                  </div>

                  {/* Stats */}
                  {record.foal_stats && Object.keys(record.foal_stats).length > 0 ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                        <BarChart2 className="w-3.5 h-3.5" />
                        Starting stats
                      </div>
                      <div className="space-y-1.5">
                        {Object.entries(record.foal_stats).map(([s, v]) => (
                          <StatBar key={s} stat={s} value={v} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-stone-400">
                      <Dna className="w-4 h-4" />
                      No stats recorded for this foal
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}