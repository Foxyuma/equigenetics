import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, Heart } from 'lucide-react';
import ItemCard from '../components/inventory/ItemCard';
import { toast } from 'sonner';

export default function Shop() {
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['shop-items'],
    queryFn: () => base44.entities.Item.list('-rarity', 100),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list('-created_date', 200),
  });

  const buyMutation = useMutation({
    mutationFn: async ({ item, currency }) => {
      // Vérification solde
      if (currency === 'genesis') {
        const balance = currentUser?.genesis_balance ?? 0;
        if (balance < item.price) throw new Error('Solde Genesis insuffisant');
        await base44.auth.updateMe({ genesis_balance: balance - item.price });
      } else {
        const balance = currentUser?.credits_balance ?? 0;
        if (balance < item.price) throw new Error('Crédits insuffisants');
        await base44.auth.updateMe({ credits_balance: balance - item.price });
      }

      const existing = inventory.find(inv => inv.item_id === item.id);
      if (existing) {
        await base44.entities.Inventory.update(existing.id, { quantity: existing.quantity + 1 });
      } else {
        await base44.entities.Inventory.create({
          item_id: item.id,
          item_name: item.name,
          item_type: item.type,
          item_icon: item.icon,
          quantity: 1,
          effect: item.effect,
        });
      }
    },
    onSuccess: (_, { item }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`${item.name} acheté !`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const filtered = filterType === 'all' ? items : items.filter(i => i.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Boutique</h1>
          <p className="text-stone-500 mt-1">Achetez des consommables pour vos chevaux</p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-0 text-lg px-4 py-2">
          <Package className="w-4 h-4 mr-2" />
          {inventory.reduce((sum, inv) => sum + inv.quantity, 0)} objets
        </Badge>
      </div>

      <Tabs value={filterType} onValueChange={setFilterType}>
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="food">🌾 Nourriture</TabsTrigger>
          <TabsTrigger value="medicine">💊 Médicaments</TabsTrigger>
          <TabsTrigger value="care">🧴 Soins</TabsTrigger>
          <TabsTrigger value="supplement">💪 Suppléments</TabsTrigger>
        </TabsList>

        <TabsContent value={filterType} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-xl bg-stone-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="text-stone-400">Aucun article dans cette catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onBuy={(currency) => buyMutation.mutate({ item, currency })}
                  isBuying={buyMutation.isPending}
                  isInventory={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}