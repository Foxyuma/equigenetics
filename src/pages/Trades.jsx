import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRightLeft, Send, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Trades() {
  const [newTradeOpen, setNewTradeOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [offeredHorses, setOfferedHorses] = useState([]);
  const [offeredItems, setOfferedItems] = useState([]);
  const [requestedHorses, setRequestedHorses] = useState([]);
  const [requestedItems, setRequestedItems] = useState([]);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: myHorses = [] } = useQuery({
    queryKey: ['my-horses'],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: myInventory = [] } = useQuery({
    queryKey: ['my-inventory'],
    queryFn: () => base44.entities.Inventory.filter({ created_by: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: recipientHorses = [] } = useQuery({
    queryKey: ['recipient-horses', selectedRecipient],
    queryFn: () => base44.entities.Horse.filter({ created_by: selectedRecipient }),
    enabled: !!selectedRecipient,
  });

  const { data: recipientInventory = [] } = useQuery({
    queryKey: ['recipient-inventory', selectedRecipient],
    queryFn: () => base44.entities.Inventory.filter({ created_by: selectedRecipient }),
    enabled: !!selectedRecipient,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.TradeOffer.list('-created_date', 50),
  });

  const createTradeMutation = useMutation({
    mutationFn: async () => {
      const recipient = users.find(u => u.email === selectedRecipient);
      return base44.entities.TradeOffer.create({
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        recipient_email: selectedRecipient,
        recipient_name: recipient?.full_name || selectedRecipient,
        offered_horses: offeredHorses.map(h => ({ horse_id: h.id, horse_name: h.name })),
        offered_items: offeredItems.map(i => ({ item_id: i.item_id, item_name: i.item_name, quantity: i.quantity })),
        requested_horses: requestedHorses.map(h => ({ horse_id: h.id, horse_name: h.name })),
        requested_items: requestedItems.map(i => ({ item_id: i.item_id, item_name: i.item_name, quantity: i.quantity })),
        status: 'pending',
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setNewTradeOpen(false);
      resetForm();
      toast.success('Trade offer sent!');
    },
  });

  const acceptTradeMutation = useMutation({
    mutationFn: async (trade) => {
      // Transfer horses
      for (const h of trade.offered_horses || []) {
        await base44.entities.Horse.update(h.horse_id, { created_by: trade.recipient_email });
      }
      for (const h of trade.requested_horses || []) {
        await base44.entities.Horse.update(h.horse_id, { created_by: trade.sender_email });
      }
      
      // Transfer items (simplified - in reality would need inventory management)
      // Update status
      await base44.entities.TradeOffer.update(trade.id, { status: 'accepted' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['my-horses'] });
      queryClient.invalidateQueries({ queryKey: ['my-inventory'] });
      toast.success('Trade accepted!');
    },
  });

  const rejectTradeMutation = useMutation({
    mutationFn: (id) => base44.entities.TradeOffer.update(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade declined');
    },
  });

  const resetForm = () => {
    setSelectedRecipient('');
    setOfferedHorses([]);
    setOfferedItems([]);
    setRequestedHorses([]);
    setRequestedItems([]);
    setMessage('');
  };

  const receivedTrades = trades.filter(t => t.recipient_email === currentUser?.email && t.status === 'pending');
  const sentTrades = trades.filter(t => t.sender_email === currentUser?.email);
  
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  const TradeCard = ({ trade, type }) => {
    const config = statusConfig[trade.status];
    const Icon = config.icon;
    const isReceived = type === 'received';

    return (
      <Card className="border-0 bg-stone-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-stone-800 text-sm">
                {isReceived ? trade.sender_name : trade.recipient_name}
              </p>
              <p className="text-xs text-stone-400">
                {format(new Date(trade.created_date), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
            <Badge className={`${config.color} border-0 flex items-center gap-1`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>

          {trade.message && (
            <p className="text-xs text-stone-600 italic mb-3 p-2 bg-white rounded">"{trade.message}"</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-stone-600 mb-1">
                {isReceived ? 'You receive:' : 'You offer:'}
              </p>
              <div className="space-y-1">
                {(isReceived ? trade.offered_horses : trade.requested_horses)?.map(h => (
                  <div key={h.horse_id} className="text-stone-500">🐴 {h.horse_name}</div>
                ))}
                {(isReceived ? trade.offered_items : trade.requested_items)?.map(i => (
                  <div key={i.item_id} className="text-stone-500">📦 {i.item_name} ×{i.quantity}</div>
                ))}
                {((isReceived ? trade.offered_horses : trade.requested_horses)?.length === 0) &&
                 ((isReceived ? trade.offered_items : trade.requested_items)?.length === 0) && (
                  <div className="text-stone-400">Nothing</div>
                  )}
                  </div>
                  </div>

                  <div>
                  <p className="font-semibold text-stone-600 mb-1">
                  {isReceived ? 'You give:' : 'You request:'}
              </p>
              <div className="space-y-1">
                {(isReceived ? trade.requested_horses : trade.offered_horses)?.map(h => (
                  <div key={h.horse_id} className="text-stone-500">🐴 {h.horse_name}</div>
                ))}
                {(isReceived ? trade.requested_items : trade.offered_items)?.map(i => (
                  <div key={i.item_id} className="text-stone-500">📦 {i.item_name} ×{i.quantity}</div>
                ))}
                {((isReceived ? trade.requested_horses : trade.offered_horses)?.length === 0) &&
                 ((isReceived ? trade.requested_items : trade.offered_items)?.length === 0) && (
                  <div className="text-stone-400">Nothing</div>
                 )}
              </div>
            </div>
          </div>

          {isReceived && trade.status === 'pending' && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => acceptTradeMutation.mutate(trade)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                size="sm"
              >
                <CheckCircle className="w-3 h-3 mr-1" />Accept
              </Button>
              <Button
                onClick={() => rejectTradeMutation.mutate(trade.id)}
                variant="outline"
                className="flex-1 text-red-500 text-sm"
                size="sm"
              >
                <XCircle className="w-3 h-3 mr-1" />Decline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Trades</h1>
          <p className="text-stone-500 mt-1">Trade horses and items with other players</p>
        </div>
        <Dialog open={newTradeOpen} onOpenChange={setNewTradeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4 mr-2" />
              Propose a Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Trade Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-600 mb-2 block">Player</label>
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-stone-200 text-sm"
                >
                  <option value="">Select a player...</option>
                  {users.filter(u => u.email !== currentUser?.email).map(u => (
                    <option key={u.id} value={u.email}>{u.full_name}</option>
                  ))}
                </select>
              </div>

              {selectedRecipient && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-stone-700">You offer</h3>
                      <div>
                        <label className="text-xs font-medium text-stone-600 mb-1 block">Horses</label>
                        <div className="space-y-1 max-h-40 overflow-y-auto border border-stone-200 rounded p-2">
                          {myHorses.map(h => (
                            <label key={h.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-stone-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={offeredHorses.some(oh => oh.id === h.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setOfferedHorses([...offeredHorses, h]);
                                  } else {
                                    setOfferedHorses(offeredHorses.filter(oh => oh.id !== h.id));
                                  }
                                }}
                              />
                              {h.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-stone-700">You request</h3>
                      <div>
                        <label className="text-xs font-medium text-stone-600 mb-1 block">Horses</label>
                        <div className="space-y-1 max-h-40 overflow-y-auto border border-stone-200 rounded p-2">
                          {recipientHorses.map(h => (
                            <label key={h.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-stone-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={requestedHorses.some(rh => rh.id === h.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRequestedHorses([...requestedHorses, h]);
                                  } else {
                                    setRequestedHorses(requestedHorses.filter(rh => rh.id !== h.id));
                                  }
                                }}
                              />
                              {h.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-600 mb-2 block">Message (optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a message to your offer..."
                      className="w-full px-3 py-2 rounded-md border border-stone-200 text-sm"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => createTradeMutation.mutate()}
                    disabled={offeredHorses.length === 0 && requestedHorses.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Offer
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 bg-amber-50">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-amber-600 mb-2" />
            <p className="text-2xl font-bold text-amber-800">{receivedTrades.length}</p>
            <p className="text-xs text-amber-600">Received offers</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Send className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-800">{sentTrades.length}</p>
            <p className="text-xs text-blue-600">Sent offers</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-800">
              {trades.filter(t => t.status === 'accepted').length}
            </p>
            <p className="text-xs text-green-600">Successful trades</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="received">
            Received Offers ({receivedTrades.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent Offers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          <div className="grid gap-4">
            {receivedTrades.length === 0 ? (
              <Card className="border-0 bg-stone-50">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-400">No offers received</p>
                </CardContent>
              </Card>
            ) : (
              receivedTrades.map(trade => <TradeCard key={trade.id} trade={trade} type="received" />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <div className="grid gap-4">
            {sentTrades.length === 0 ? (
              <Card className="border-0 bg-stone-50">
                <CardContent className="p-12 text-center">
                  <Send className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-400">No offers sent</p>
                </CardContent>
              </Card>
            ) : (
              sentTrades.map(trade => <TradeCard key={trade.id} trade={trade} type="sent" />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}