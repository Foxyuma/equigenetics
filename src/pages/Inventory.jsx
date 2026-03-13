import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Zap } from 'lucide-react';
import ItemCard from '../components/inventory/ItemCard';
import { toast } from 'sonner';

export default function Inventory() {
  const [showUseDialog, setShowUseDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.Inventory.list('-created_date', 200),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 200),
  });

  const useMutation = useMutation({
    mutationFn: async ({ item, horseId }) => {
      const horse = horses.find(h => h.id === horseId);
      if (!horse) throw new Error("Cheval introuvable");

      const effect = item.effect || {};
      const updates = {};

      // Energy boost
      if (effect.energy_boost) {
        updates.energy = Math.min(100, (horse.energy || 0) + effect.energy_boost);
      }

      // Stat boost (temporary - we just apply it directly for simplicity)
      if (effect.stat_boost && effect.boost_amount && horse.stats) {
        const newStats = { ...horse.stats };
        newStats[effect.stat_boost] = Math.min(100, (newStats[effect.stat_boost] || 0) + effect.boost_amount);
        updates.stats = newStats;
      }

      // Apply updates to horse
      if (Object.keys(updates).length > 0) {
        await base44.entities.Horse.update(horseId, updates);
      }

      // Record usage
      const expiresAt = effect.duration_days 
        ? new Date(Date.now() + effect.duration_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await base44.entities.ItemUsage.create({
        horse_id: horseId,
        horse_name: horse.name,
        item_id: item.item_id,
        item_name: item.item_name,
        item_type: item.item_type,
        effect_applied: effect,
        expires_at: expiresAt,
      });

      // Decrease inventory quantity
      const invItem = inventory.find(inv => inv.item_id === item.item_id);
      if (invItem) {
        if (invItem.quantity <= 1) {
          await base44.entities.Inventory.delete(invItem.id);
        } else {
          await base44.entities.Inventory.update(invItem.id, {
            quantity: invItem.quantity - 1
          });
        }
      }
    },
    onSuccess: (_, { item }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      queryClient.invalidateQueries({ queryKey: ['item-usage'] });
      toast.success(`${item.item_name} utilisé !`);
      setShowUseDialog(false);
      setSelectedItem(null);
      setSelectedHorseId('');
    },
  });

  const handleUseItem = (item) => {
    setSelectedItem(item);
    setShowUseDialog(true);
  };

  const confirmUse = () => {
    if (selectedItem && selectedHorseId) {
      useMutation.mutate({ item: selectedItem, horseId: selectedHorseId });
    }
  };

  const availableItems = inventory.filter(inv => inv.quantity > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Inventaire</h1>
        <p className="text-stone-500 mt-1">Gérez vos consommables</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-xl bg-stone-100 animate-pulse" />)}
        </div>
      ) : availableItems.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
          <h3 className="text-lg font-semibold text-stone-600">Inventaire vide</h3>
          <p className="text-stone-400 mt-1">Achetez des objets dans la boutique !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableItems.map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              quantity={item.quantity}
              showQuantity={true}
              onUse={handleUseItem}
              isInventory={true}
            />
          ))}
        </div>
      )}

      {/* Use Item Dialog */}
      <Dialog open={showUseDialog} onOpenChange={setShowUseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Utiliser {selectedItem?.item_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-stone-500">Sur quel cheval souhaitez-vous utiliser cet objet ?</p>
            <Select value={selectedHorseId} onValueChange={setSelectedHorseId}>
              <SelectTrigger><SelectValue placeholder="Choisir un cheval..." /></SelectTrigger>
              <SelectContent>
                {horses.map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} — {h.breed} (⚡{h.energy || 0}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={confirmUse} 
              disabled={!selectedHorseId || useMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Zap className="w-4 h-4 mr-2" />Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}