import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';

const REASON_LABELS = {
  competition: '🏆 Compétition',
  breeding: '🧬 Élevage',
  purchase: '🛒 Achat',
  sale: '💰 Vente',
  gain: '🎁 Gain',
  salary: '👔 Salaire personnel',
  shop: '🏪 Boutique',
  bet: '🎲 Pari',
  dépense: '📦 Dépense',
  trade: '🔄 Échange',
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
            {new Date(tx.created_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm ${isGain ? 'text-emerald-600' : 'text-red-500'}`}>
          {isGain ? '+' : ''}{tx.amount.toLocaleString('fr-FR')}
          <span className="ml-1 text-xs">{isGenesis ? '₲' : '✦'}</span>
        </p>
        {tx.balance_after != null && (
          <p className="text-xs text-stone-400">
            Solde : {tx.balance_after.toLocaleString('fr-FR')} {isGenesis ? '₲' : '✦'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Transactions() {
  const [tab, setTab] = useState('all');

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

  const totalGenesis = transactions.filter(t => t.currency === 'genesis' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spentGenesis = transactions.filter(t => t.currency === 'genesis' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredits = transactions.filter(t => t.currency === 'credits' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spentCredits = transactions.filter(t => t.currency === 'credits' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow">
          <History className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Historique des transactions</h1>
          <p className="text-stone-500 text-sm">Consultez tous vos gains et dépenses passés</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Genesis gagnés', value: totalGenesis, symbol: '₲', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Genesis dépensés', value: spentGenesis, symbol: '₲', color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
          { label: 'Crédits gagnés', value: totalCredits, symbol: '✦', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
          { label: 'Crédits dépensés', value: spentCredits, symbol: '✦', color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
            <p className="text-xs text-stone-500 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value.toLocaleString('fr-FR')} <span className="text-sm">{c.symbol}</span></p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="all">Toutes ({transactions.length})</TabsTrigger>
          <TabsTrigger value="genesis">₲ Genesis</TabsTrigger>
          <TabsTrigger value="credits">✦ Crédits</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-stone-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction pour le moment</p>
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