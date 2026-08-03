import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, X, Zap, Heart } from 'lucide-react';
import { PADDOCK_TYPES } from './PaddockConfig';

export default function PaddockCell({ paddock, allHorses, onAssign, onUnassign }) {
  const [open, setOpen] = useState(false);
  const config = PADDOCK_TYPES[paddock.type] || PADDOCK_TYPES.pasture;
  const assignedCount = paddock.assigned_horses?.length || 0;
  const isFull = assignedCount >= (paddock.capacity || config.capacity);

  const assignedHorseIds = new Set(paddock.assigned_horses?.map(h => h.horse_id) || []);
  const availableHorses = allHorses.filter(h => !assignedHorseIds.has(h.id));

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-4 flex flex-col gap-3 min-h-[200px] relative`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <p className="font-bold text-stone-800 text-sm">{paddock.name}</p>
              <Badge className={`text-xs border-0 ${config.bg} ${config.textColor} mt-0.5`}>{config.label}</Badge>
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-stone-500">
          <div className="flex items-center gap-1 justify-end"><Zap className="w-3 h-3 text-amber-500" />+{config.energy_recovery_rate}/h</div>
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <Heart className="w-3 h-3 text-pink-500" />
            {config.morale_bonus >= 0 ? '+' : ''}{config.morale_bonus}
          </div>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all`}
            style={{ width: `${(assignedCount / (paddock.capacity || config.capacity)) * 100}%` }}
          />
        </div>
        <span className="text-xs text-stone-500 font-medium">{assignedCount}/{paddock.capacity || config.capacity}</span>
      </div>

      {/* Horses */}
      <div className="flex-1 flex flex-wrap gap-2">
        {paddock.assigned_horses?.map(h => (
          <div key={h.horse_id} className="flex items-center gap-1 bg-white/70 rounded-lg px-2 py-1 text-xs font-medium text-stone-700 group">
            <span>🐴</span>
            <span className="max-w-[80px] truncate">{h.horse_name}</span>
            <button onClick={() => onUnassign(paddock, h.horse_id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-red-400 hover:text-red-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {assignedCount === 0 && (
          <p className="text-xs text-stone-400 italic">No horse</p>
        )}
      </div>

      {/* Add horse */}
      {!isFull && availableHorses.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full border border-dashed border-stone-300 text-stone-500 hover:text-stone-700 hover:border-stone-400 text-xs h-8">
              <Plus className="w-3 h-3 mr-1" /> Assign a horse
              </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
              <DialogHeader>
              <DialogTitle>Assign to {paddock.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableHorses.map(horse => (
                <button
                  key={horse.id}
                  onClick={() => { onAssign(paddock, horse); setOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-left transition-colors"
                >
                  <span className="text-xl">🐴</span>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">{horse.name}</p>
                    <p className="text-xs text-stone-500">{horse.breed} — ⚡{horse.energy || 100}%</p>
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}