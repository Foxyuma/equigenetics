import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gavel, Clock, Trophy, Dna, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatBar from '../horse/StatBar';

function useCountdown(endsAt) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt) - new Date();
      if (diff <= 0) {
        setTimeLeft('Ended');
        setIsExpired(true);
        return;
        }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return { timeLeft, isExpired };
}

export default function AuctionCard({ auction, currentUser, onBid, isBidding }) {
  const [bidAmount, setBidAmount] = useState('');
  const [open, setOpen] = useState(false);
  const { timeLeft, isExpired } = useCountdown(auction.ends_at);

  const minBid = (auction.current_bid || auction.starting_price) + 10;
  const isOwner = currentUser?.email === auction.seller_email;
  const isLeading = currentUser?.email === auction.current_bidder_email;
  const avgStat = auction.horse_stats
    ? Math.round(Object.values(auction.horse_stats).reduce((a, b) => a + b, 0) / 7)
    : 0;

  const handleBid = () => {
    onBid(auction, Number(bidAmount));
    setBidAmount('');
    setOpen(false);
  };

  return (
    <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <div className="relative h-40 bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        {auction.horse_image_url ? (
          <img src={auction.horse_image_url} alt={auction.horse_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl opacity-20">🐴</span>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isExpired ? (
            <Badge className="bg-stone-500 text-white border-0">Ended</Badge>
          ) : (
            <Badge className="bg-amber-500 text-white border-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeLeft}
            </Badge>
          )}
          {isLeading && !isExpired && (
            <Badge className="bg-green-500 text-white border-0">You're leading!</Badge>
          )}
        </div>
        <Badge className="absolute top-3 right-3 bg-white text-stone-800 border border-stone-200 font-bold">
          {auction.current_bid > 0 ? auction.current_bid : auction.starting_price} pts
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-stone-800 text-lg">{auction.horse_name}</h3>
          <p className="text-sm text-stone-500">{auction.horse_breed} — {auction.horse_coat_color}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1"><Gavel className="w-3 h-3" />{auction.bid_count || 0} bid(s)</span>
          <span className="flex items-center gap-1"><Dna className="w-3 h-3" />Avg: {avgStat}</span>
        </div>

        {auction.current_bidder_name && (
          <p className="text-xs text-stone-500">
            Top bid: <span className="font-semibold text-stone-700">{auction.current_bidder_name}</span>
          </p>
        )}



        <div className="flex gap-2 pt-2">
          <Link to={`/HorseDetail?id=${auction.horse_id}`} className="flex-1">
            <Button variant="outline" className="w-full text-sm">View</Button>
          </Link>
          {!isOwner && !isExpired && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm">
                  <Gavel className="w-4 h-4 mr-1" /> Bid
                </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-amber-600" />
                   Bid on {auction.horse_name}
                 </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                 <div className="p-3 bg-amber-50 rounded-lg">
                   <p className="text-sm text-stone-600">Current bid: <span className="font-bold text-amber-700">{auction.current_bid || auction.starting_price} pts</span></p>
                   <p className="text-xs text-stone-500 mt-1">Minimum bid: <span className="font-semibold">{minBid} pts</span></p>
                  </div>
                  <Input
                    type="number"
                    placeholder={`Min ${minBid} pts`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={minBid}
                    className="bg-white"
                  />
                  {Number(bidAmount) > 0 && Number(bidAmount) < minBid && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Bid too low
                    </p>
                  )}
                  <Button
                    onClick={handleBid}
                    disabled={!bidAmount || Number(bidAmount) < minBid || isBidding}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isBidding ? 'Bidding...' : `Place ${bidAmount || '?'} pts`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {isOwner && (
            <Badge variant="outline" className="flex items-center gap-1 px-3">
              Your sale
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}