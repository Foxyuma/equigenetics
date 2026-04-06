import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function CurrencyDisplay() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const genesis = user?.genesis_balance ?? 0;
  const credits = user?.credits_balance ?? 0;

  const fmt = (n) => n.toLocaleString('fr-FR');

  return (
    <div className="flex items-center gap-2">
      {/* Genesis */}
      <Link to="/Transactions" className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 hover:bg-amber-100 transition-colors">
        <span className="text-amber-600 font-bold text-sm leading-none">₲</span>
        <span className="text-amber-800 font-semibold text-sm tabular-nums">{fmt(genesis)}</span>
      </Link>
      {/* Credits - link to buy */}
      <Link to="/BuyCredits" className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-full px-3 py-1 hover:bg-violet-100 transition-colors">
        <span className="text-violet-600 font-bold text-sm leading-none">✦</span>
        <span className="text-violet-800 font-semibold text-sm tabular-nums">{credits}</span>
      </Link>
    </div>
  );
}