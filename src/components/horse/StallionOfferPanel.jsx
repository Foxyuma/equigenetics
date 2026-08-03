import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { Plus, Trash2, Globe, Lock } from 'lucide-react';

export default function StallionOfferPanel({ stallion, currentUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [price, setPrice] = useState('5000');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [reservedEmail, setReservedEmail] = useState('');
  const [reservedName, setReservedName] = useState('');

  const { data: myOffers = [] } = useQuery({
    queryKey: ['stallion-offers-mine', stallion.id],
    queryFn: () => base44.entities.StallionOffer.filter({ stallion_id: stallion.id }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!price || Number(price) < 0) throw new Error('Invalid price');
      await base44.entities.StallionOffer.create({
        stallion_id: stallion.id,
        stallion_name: stallion.name,
        breed: stallion.breed,
        coat_color: stallion.coat_color,
        age: stallion.age || 0,
        genotype: stallion.genotype,
        stats: stallion.stats,
        health_genes: stallion.health_genes,
        price: Number(price),
        owner_name: currentUser?.full_name || 'Player',
        owner_email: currentUser?.email,
        is_npc: false,
        description,
        is_open: isOpen,
        reserved_for_email: isOpen ? null : reservedEmail,
        reserved_for_name: isOpen ? null : reservedName,
        breeding_approval_status: stallion.breeding_approval_status,
        competition_wins: stallion.competition_wins || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stallion-offers-mine'] });
      queryClient.invalidateQueries({ queryKey: ['stallion-offers'] });
      toast.success('Stud service offer published!');
      setShowForm(false);
      setPrice('5000'); setDescription(''); setIsOpen(true); setReservedEmail(''); setReservedName('');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StallionOffer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stallion-offers-mine'] });
      queryClient.invalidateQueries({ queryKey: ['stallion-offers'] });
      toast.success('Offer removed');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-stone-700">Stud service offers</h3>
          <p className="text-xs text-stone-400">Offer {stallion.name} as a breeding stallion</p>
        </div>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-stone-800 hover:bg-stone-900"
          >
            <Plus className="w-4 h-4 mr-1" /> New offer
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Stud fee (₲ Genesis)</Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input
               placeholder="e.g. Champion bloodline, jumping specialist..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200">
              <div className="flex items-center gap-2">
                {isOpen ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                <div>
                  <p className="text-sm font-semibold text-stone-700">
                    {isOpen ? 'Open sale' : 'Reserved for a player'}
                    </p>
                    <p className="text-xs text-stone-400">
                    {isOpen ? 'Available to all players' : 'Only for the designated player'}
                    </p>
                </div>
              </div>
              <Switch checked={!isOpen} onCheckedChange={v => setIsOpen(!v)} />
            </div>

            {!isOpen && (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label>Reserved player email</Label>
                  <Input
                   placeholder="player@example.com"
                    value={reservedEmail}
                    onChange={e => setReservedEmail(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Player name (optional)</Label>
                  <Input
                   placeholder="Player name..."
                    value={reservedName}
                    onChange={e => setReservedName(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Publish offer
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {myOffers.length > 0 ? (
        <div className="space-y-2">
          {myOffers.map(offer => (
            <Card key={offer.id} className="border border-stone-200">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-800">{offer.price.toLocaleString('en-GB')} ₲</p>
                    <Badge className={`text-xs border-0 ${offer.is_open ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {offer.is_open ? <><Globe className="w-3 h-3 mr-1" />Open sale</> : <><Lock className="w-3 h-3 mr-1" />Reserved</>}
                    </Badge>
                  </div>
                  {!offer.is_open && offer.reserved_for_email && (
                    <p className="text-xs text-stone-500">→ {offer.reserved_for_name || offer.reserved_for_email}</p>
                  )}
                  {offer.description && <p className="text-xs text-stone-400">{offer.description}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(offer.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm text-stone-400 text-center py-4">
            No offers published for {stallion.name}
          </p>
        )
      )}
    </div>
  );
}