import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowUpCircle, ArrowDownCircle, History, RefreshCw, Sparkles, Coins } from 'lucide-react';
import { toast } from 'sonner';

const REASON_LABELS = {
  competition: '🏆 Competition',
  breeding: '🧬 Breeding',
  purchase: '🛒 Purchase',
  sale: '💰 Sale',
  gain: '🎁 Gain',
  salary: '👔 Staff salary',
  shop: '🏪 Shop',
  bet: '🎲 Bet',
  dépense: '📦 Expense',
  trade: '🔄 Trade',
};

function reasonLabel(reason) {
  if (!reason) return '—';
  for (const [key, label] of Object.entries(REASON_LABELS)) {
    if (reason.toLowerCase().includes(key)) return label;
  }
  return reason;
}

function TransactionRow({ tx }) {
  const isGain = tx.amount > 0;
  const isGenesis = tx.currency === 'genesis';
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isGain ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {isGain
            ? <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
            : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
        </div>
        <div>
          <p className="text-sm font-medium text-stone-700">{reasonLabel(tx.reason)}</p>
          <p className="text-xs text-stone-400">
            {new Date(tx.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm ${isGain ? 'text-emerald-600' : 'text-red-500'}`}>
          {isGain ? '+' : ''}{tx.amount.toLocaleString('en-GB')}
          <span className="ml-1 text-xs">{isGenesis ? '₲' : '✦'}</span>
        </p>
        {tx.balance_after != null && (
          <p className="text-xs text-stone-400">
            Balance: {tx.balance_after.toLocaleString('en-GB')} {isGenesis ? '₲' : '✦'}
          </p>
        )}
      </div>
    </div>
  );
}

const CONVERT_RATES = [
  { credits: 10, genesis: 5000, label: '10 ✦ → 5 000 ₲' },
  { credits: 25, genesis: 15000, label: '25 ✦ → 15 000 ₲' },
  { credits: 50, genesis: 35000, label: '50 ✦ → 35 000 ₲' },
  { credits: 100, genesis: 80000, label: '100 ✦ → 80 000 ₲' },
];

export default function Transactions() {
  const [tab, setTab] = useState('all');
  const [converting, setConverting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.email],
    queryFn: () => base44.entities.Transaction.filter({ user_email: user.email }, '-created_date', 200),
    enabled: !!user,
  });

  const filtered = tab === 'all' ? transactions
    : transactions.filter(tx => tx.currency === tab);

  const handleConvert = async (rate) => {
    if ((user?.credits_balance ?? 0) < rate.credits) {
      toast.error('Insufficient credits');
      return;
    }
    setConverting(true);
    const newCredits = (user.credits_balance ?? 0) - rate.credits;
    const newGenesis = (user.genesis_balance ?? 0) + rate.genesis;
    await base44.auth.updateMe({ credits_balance: newCredits, genesis_balance: newGenesis });
    await Promise.all([
      base44.entities.Transaction.create({
        user_email: user.email, currency: 'credits', amount: -rate.credits,
        balance_after: newCredits, reason: `Conversion en Genesis (${rate.label})`,
      }),
      base44.entities.Transaction.create({
        user_email: user.email, currency: 'genesis', amount: rate.genesis,
        balance_after: newGenesis, reason: `Conversion from Credits (${rate.label})`,
      }),
    ]);
    queryClient.invalidateQueries({ queryKey: ['me'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    toast.success(`+${rate.genesis.toLocaleString('en-GB')} ₲ added!`);
    setConverting(false);
  };

  const totalGenesis = transactions.filter(t => t.currency === 'genesis' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spentGenesis = transactions.filter(t => t.currency === 'genesis' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredits = transactions.filter(t => t.currency === 'credits' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spentCredits = transactions.filter(t => t.currency === 'credits' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <Link to="/Stable" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow">
          <History className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Transaction history</h1>
          <p className="text-stone-500 text-sm">View all your past earnings and expenses</p>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Genesis Balance</p>
            <p className="text-3xl font-extrabold text-amber-800">{(user?.genesis_balance ?? 0).toLocaleString('en-GB')} <span className="text-lg">₲</span></p>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4">
            <p className="text-xs text-violet-600 font-semibold uppercase tracking-wide mb-1">Credits Balance</p>
            <p className="text-3xl font-extrabold text-violet-800">{user?.credits_balance ?? 0} <span className="text-lg">✦</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion */}
      <Card className="border-0 bg-gradient-to-br from-amber-50 to-violet-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            Convert Credits → Genesis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CONVERT_RATES.map(rate => (
              <button
                key={rate.credits}
                onClick={() => handleConvert(rate)}
                disabled={converting || (user?.credits_balance ?? 0) < rate.credits}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
              >
                <span className="text-violet-600 font-bold">-{rate.credits} ✦</span>
                <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-amber-700 font-bold">+{rate.genesis.toLocaleString('en-GB')} ₲</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Genesis earned', value: totalGenesis, symbol: '₲', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Genesis spent', value: spentGenesis, symbol: '₲', color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
          { label: 'Credits earned', value: totalCredits, symbol: '✦', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
          { label: 'Credits spent', value: spentCredits, symbol: '✦', color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
            <p className="text-xs text-stone-500 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value.toLocaleString('en-GB')} <span className="text-sm">{c.symbol}</span></p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
          <TabsTrigger value="genesis">₲ Genesis</TabsTrigger>
          <TabsTrigger value="credits">✦ Credits</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-stone-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-2 py-1">
              {filtered.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}