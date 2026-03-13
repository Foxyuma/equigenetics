import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Zap, Heart, TrendingUp, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";

const rarityColors = {
  common: "border-stone-300 bg-stone-50",
  uncommon: "border-green-300 bg-green-50",
  rare: "border-blue-300 bg-blue-50",
  legendary: "border-purple-300 bg-purple-50",
};

const rarityBadges = {
  common: "bg-stone-100 text-stone-600",
  uncommon: "bg-green-100 text-green-700",
  rare: "bg-blue-100 text-blue-700",
  legendary: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
};

const typeIcons = {
  food: "🌾",
  medicine: "💊",
  care: "🧴",
  supplement: "💪",
};

export default function ItemCard({ item, onBuy, showQuantity, quantity, onUse, isInventory }) {
  const getEffectDescription = (effect) => {
    if (!effect) return "";
    const parts = [];
    if (effect.energy_boost) parts.push(`+${effect.energy_boost} énergie`);
    if (effect.heals_disease) parts.push("Soigne maladie");
    if (effect.stat_boost && effect.boost_amount) parts.push(`+${effect.boost_amount} ${effect.stat_boost}`);
    if (effect.duration_days) parts.push(`(${effect.duration_days}j)`);
    return parts.join(" • ");
  };

  return (
    <Card className={`border-2 ${rarityColors[item.rarity || 'common']} hover:shadow-lg transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{item.icon || typeIcons[item.type] || "📦"}</span>
            {showQuantity && quantity > 0 && (
              <Badge className="bg-stone-800 text-white border-0 font-bold px-2">×{quantity}</Badge>
            )}
          </div>
          <Badge className={`${rarityBadges[item.rarity || 'common']} border-0 text-xs`}>
            {item.rarity || 'common'}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-stone-800 mb-1">{item.name}</h3>
        <p className="text-xs text-stone-500 mb-3 line-clamp-2">{item.description}</p>
        
        <div className="text-xs text-stone-600 mb-3 font-medium">
          {getEffectDescription(item.effect)}
        </div>
        
        {isInventory ? (
          <Button 
            onClick={() => onUse?.(item)} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm"
            disabled={!quantity || quantity === 0}
          >
            <Zap className="w-3 h-3 mr-1" />Utiliser
          </Button>
        ) : (
          <Button 
            onClick={() => onBuy?.(item)} 
            className="w-full bg-stone-800 hover:bg-stone-900 text-sm"
          >
            <ShoppingCart className="w-3 h-3 mr-1" />{item.price} pts
          </Button>
        )}
      </CardContent>
    </Card>
  );
}