import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingCart, Gavel, Trophy, Dna } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BREEDS } from '../components/genetics/GeneticsEngine';
import StatBar from '../components/horse/StatBar';
import AuctionCard from '../components/auction/AuctionCard';
import CreateAuctionDialog from '../components/auction/CreateAuctionDialog';
import { toast } from 'sonner';

export default function Market() {
  const [search, setSearch] = useState('');
  const [filterBreed, setFilterBreed] = useState('all');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [], isLoading: horsesLoading } = useQuery({
    queryKey: ['market-horses'],
    queryFn: () => base44.entities.Horse.filter({ is_for_sale: true }, '-created_date', 100),
  });

  const { data: allAuctions = [], isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: () => base44.entities.Auction.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const { data: myHorses = [] } = useQuery({
    queryKey: ['my-horses-market'],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser?.email }, '-created_date', 200),
    enabled: !!currentUser,
  });

  const activeAuctions = allAuctions.filter(a => a.status === 'active' && new Date(a.ends_at) > new Date());
  const endedAuctions = allAuctions.filter(a => a.status === 'ended' || new Date(a.ends_at) <= new Date());

  // Subscribe to real-time auction changes
  React.useEffect(() => {
    const unsub = base44.entities.Auction.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    });
    return unsub;
  }, [queryClient]);

  const buyMutation = useMutation({
    mutationFn: async (horse) => {
      if (!currentUser) throw new Error('Non connecté');
      const price = horse.price || 0;
      const balance = currentUser.genesis_balance ?? 0;
      if (price > 0 && balance < price) throw new Error('Fonds insuffisants');

      // Débiter l'acheteur
      if (price > 0) {
        await base44.auth.updateMe({ genesis_balance: balance - price });
        await base44.entities.Transaction.create({
          user_email: currentUser.email,
          currency: 'genesis',
          amount: -price,
          balance_after: balance - price,
          reason: `Achat cheval — ${horse.name}`,
          reference_id: horse.id,
        });
      }

      // Transférer le cheval : retirer de la vente (on ne peut pas changer created_by, mais on marque propriétaire)
      await base44.entities.Horse.update(horse.id, {
        is_for_sale: false,
        price: 0,
        new_owner_email: currentUser.email,
      });
    },
    onSuccess: (_, horse) => {
      queryClient.invalidateQueries({ queryKey: ['market-horses'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['my-horses-market'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success(`${horse.name} rejoint votre écurie !`);
    },
    onError: (err) => toast.error(err.message),
  });

  const createAuctionMutation = useMutation({
    mutationFn: async ({ horseId, startingPrice, durationHours, horse }) => {
      const endsAt = new Date(Date.now() + durationHours * 3600000).toISOString();
      await base44.entities.Auction.create({
        horse_id: horseId,
        horse_name: horse.name,
        horse_breed: horse.breed,
        horse_coat_color: horse.coat_color,
        horse_stats: horse.stats,
        horse_image_url: horse.image_url || null,
        seller_email: currentUser.email,
        seller_name: currentUser.full_name,
        starting_price: startingPrice,
        current_bid: 0,
        bid_count: 0,
        ends_at: endsAt,
        status: 'active',
      });
      await base44.entities.Horse.update(horseId, { is_for_sale: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['my-horses-market'] });
      toast.success('Enchère créée !');
    }
  });

  const bidMutation = useMutation({
    mutationFn: async ({ auction, amount }) => {
      const prevBidderEmail = auction.current_bidder_email;
      const prevBidderName = auction.current_bidder_name;
      const prevBid = auction.current_bid || auction.starting_price;

      await base44.entities.Auction.update(auction.id, {
        current_bid: amount,
        current_bidder_email: currentUser.email,
        current_bidder_name: currentUser.full_name,
        bid_count: (auction.bid_count || 0) + 1,
      });

      // Notify previous bidder if they exist
      if (prevBidderEmail && prevBidderEmail !== currentUser.email) {
        await base44.entities.Message.create({
          sender_email: 'system@equigenes.com',
          sender_name: 'EquiGenes',
          recipient_email: prevBidderEmail,
          recipient_name: prevBidderName || '',
          subject: `Surenchère sur ${auction.horse_name}`,
          content: `Votre mise de ${prevBid} pts sur "${auction.horse_name}" a été dépassée par une offre de ${amount} pts. Enchérissez à nouveau pour reprendre la tête !`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      toast.success('Enchère placée !');
    }
  });

  const filtered = horses.filter(h => {
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBreed !== 'all' && h.breed !== filterBreed) return false;
    return true;
  });

  const SearchBar = () => (
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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Marché & Enchères</h1>
          <p className="text-stone-500 mt-1">Achetez, vendez et enchérissez en temps réel</p>
        </div>
        {currentUser && (
          <CreateAuctionDialog
            myHorses={myHorses.filter(h => !allAuctions.some(a => a.horse_id === h.id && a.status === 'active'))}
            onCreate={(data) => createAuctionMutation.mutate(data)}
            isCreating={createAuctionMutation.isPending}
          />
        )}
      </div>

      <Tabs defaultValue="auctions">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="auctions" className="flex items-center gap-2">
            <Gavel className="w-4 h-4" /> Enchères
            {activeAuctions.length > 0 && (
              <Badge className="bg-amber-500 text-white border-0 text-xs ml-1">{activeAuctions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Vente directe
          </TabsTrigger>
          <TabsTrigger value="ended">Terminées</TabsTrigger>
        </TabsList>

        {/* Enchères actives */}
        <TabsContent value="auctions" className="mt-4 space-y-4">
          {auctionsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <div key={i} className="h-72 rounded-2xl bg-stone-100 animate-pulse" />)}
            </div>
          ) : activeAuctions.length === 0 ? (
            <div className="text-center py-20">
              <Gavel className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <h3 className="text-lg font-semibold text-stone-600">Aucune enchère active</h3>
              <p className="text-stone-400 mt-1">Créez une enchère pour mettre votre cheval en vente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeAuctions.map(auction => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  currentUser={currentUser}
                  onBid={(auction, amount) => bidMutation.mutate({ auction, amount })}
                  isBidding={bidMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vente directe */}
        <TabsContent value="market" className="mt-4 space-y-4">
          <SearchBar />
          {horsesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <div key={i} className="h-72 rounded-2xl bg-stone-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <h3 className="text-lg font-semibold text-stone-600">Aucun cheval en vente directe</h3>
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
                        <span className={horse.sex === 'male' ? 'text-blue-600' : 'text-pink-600'}>{horse.sex === 'male' ? '♂' : '♀'}</span>
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
        </TabsContent>

        {/* Enchères terminées */}
        <TabsContent value="ended" className="mt-4">
          {endedAuctions.length === 0 ? (
            <div className="text-center py-16 text-stone-400">Aucune enchère terminée</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {endedAuctions.map(auction => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  currentUser={currentUser}
                  onBid={() => {}}
                  isBidding={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}