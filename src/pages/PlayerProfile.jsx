import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Dna, Star, Send, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import BreedingReputation from '../components/profile/BreedingReputation';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PlayerProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const player = users.find(u => u.id === playerId);

  const { data: horses = [] } = useQuery({
    queryKey: ['player-horses', player?.email],
    queryFn: () => base44.entities.Horse.filter({ created_by: player.email }, '-created_date', 100),
    enabled: !!player?.email,
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['player-competitions', player?.email],
    queryFn: () => base44.entities.Competition.filter({ created_by: player.email, status: 'completed' }, '-created_date', 50),
    enabled: !!player?.email,
  });

  const sendMutation = useMutation({
    mutationFn: () => base44.entities.Message.create({
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      recipient_email: player.email,
      recipient_name: player.full_name,
      subject: subject || 'No subject',
      content,
      is_read: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSubject('');
      setContent('');
      toast.success('Message sent!');
    },
    onError: () => toast.error('Error sending message'),
  });

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-stone-400">Loading profile...</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.email === player.email;

  const totalWins = horses.reduce((sum, h) => sum + (h.competition_wins || 0), 0);
  const avgStats = horses.length > 0
    ? Math.round(horses.reduce((sum, h) => {
        const vals = Object.values(h.stats || {}).filter(v => typeof v === 'number');
        return sum + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
      }, 0) / horses.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-200/50 text-white text-2xl font-bold">
          {player.full_name?.charAt(0)?.toUpperCase() || player.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{player.full_name || 'Breeder'}</h1>
          <p className="text-stone-500 text-sm">{player.email}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-xs capitalize">{player.role || 'user'}</Badge>
            {isOwnProfile && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Your profile</Badge>}
          </div>
        </div>
      </div>

      <BreedingReputation reputation={player.breeding_reputation ?? 0} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Horses', value: horses.length, icon: Dna, color: 'text-amber-600 bg-amber-50' },
          { label: 'Wins', value: totalWins, icon: Trophy, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Competitions', value: competitions.length, icon: Star, color: 'text-indigo-600 bg-indigo-50' },
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

      <Tabs defaultValue="horses">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="horses">Horses</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          {!isOwnProfile && <TabsTrigger value="message">Message</TabsTrigger>}
        </TabsList>

        {/* Horses tab */}
        <TabsContent value="horses" className="mt-4">
          {horses.length === 0 ? (
            <Card className="border-dashed border-2 border-stone-200">
              <CardContent className="p-8 text-center text-stone-400">No horses</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {horses.map(horse => {
                const vals = Object.values(horse.stats || {}).filter(v => typeof v === 'number');
                const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                const link = isOwnProfile ? `/HorseDetail?id=${horse.id}` : `/PublicHorseProfile?id=${horse.id}`;
                return (
                  <Link key={horse.id} to={link}>
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
                            <p className="text-xs text-stone-400 truncate">{horse.coat_color || '—'}</p>
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
        </TabsContent>

        {/* Competitions tab */}
        <TabsContent value="competitions" className="mt-4">
          <Card className="border-0 bg-white/60">
            <CardHeader>
              <CardTitle className="text-lg">{player.full_name}'s record</CardTitle>
            </CardHeader>
            <CardContent>
              {competitions.length === 0 ? (
                <p className="text-center text-stone-400 py-8">No competitions</p>
              ) : (
                <div className="space-y-2">
                  {competitions.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                      <div>
                        <p className="font-semibold text-stone-700 text-sm">{c.name}</p>
                        <p className="text-xs text-stone-400">{c.horse_name}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-bold text-stone-800 text-sm">{c.score?.toFixed(1)} pts</p>
                          <Badge variant="outline" className="text-xs">#{c.rank}</Badge>
                        </div>
                        {c.rank === 1 && <span className="text-lg">🥇</span>}
                        {c.rank === 2 && <span className="text-lg">🥈</span>}
                        {c.rank === 3 && <span className="text-lg">🥉</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message tab (only to another player) */}
        {!isOwnProfile && (
          <TabsContent value="message" className="mt-4">
            <Card className="border-0 bg-white/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  Send a message to {player.full_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-stone-600 mb-2 block">Subject</label>
                  <Input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Message subject..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-600 mb-2 block">Message</label>
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Your message..."
                    rows={5}
                  />
                </div>
                <Button
                  onClick={() => sendMutation.mutate()}
                  disabled={!content || sendMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}