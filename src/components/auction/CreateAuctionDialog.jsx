import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Gavel } from 'lucide-react';

const DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
];

export default function CreateAuctionDialog({ myHorses, onCreate, isCreating }) {
  const [open, setOpen] = useState(false);
  const [horseId, setHorseId] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [durationHours, setDurationHours] = useState('24');

  const selectedHorse = myHorses.find(h => h.id === horseId);

  const handleCreate = () => {
    onCreate({ horseId, startingPrice: Number(startingPrice), durationHours: Number(durationHours), horse: selectedHorse });
    setOpen(false);
    setHorseId('');
    setStartingPrice('');
    setDurationHours('24');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Create auction
          </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-600" />
           Put a horse up for auction
          </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
          <div>
           <label className="text-sm font-medium text-stone-700 mb-1.5 block">Horse to sell</label>
           <Select value={horseId} onValueChange={setHorseId}>
             <SelectTrigger className="bg-white"><SelectValue placeholder="Choose a horse..." /></SelectTrigger>
              <SelectContent>
                {myHorses.map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} — {h.breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedHorse && (
              <div className="mt-2 p-2 bg-stone-50 rounded-lg flex items-center gap-2">
                <Badge variant="outline">{selectedHorse.coat_color}</Badge>
                <Badge className={selectedHorse.sex === 'male' ? 'bg-blue-100 text-blue-700 border-0' : 'bg-pink-100 text-pink-700 border-0'}>
                  {selectedHorse.sex === 'male' ? '♂ Male' : '♀ Female'}
                </Badge>
                <span className="text-xs text-stone-500">{selectedHorse.age} yrs</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Starting price (pts)</label>
            <Input
             type="number"
             placeholder="e.g. 500"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              className="bg-white"
              min={1}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 mb-1.5 block">Auction duration</label>
            <Select value={durationHours} onValueChange={setDurationHours}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATIONS.map(d => (
                  <SelectItem key={d.hours} value={String(d.hours)}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!horseId || !startingPrice || isCreating}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isCreating ? 'Creating...' : 'Launch auction'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}