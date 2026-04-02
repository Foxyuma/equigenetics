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

  const fmt = (n) => n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000
    ? (n / 1_000).toFixed(0) + 'k'
    : String(n);

  return (
    <Link to="/Profile" className="flex items-center gap-2">
      {/* Genesis */}
      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
        <span className="text-amber-600 font-bold text-sm leading-none">₲</span>
        <span className="text-amber-800 font-semibold text-sm tabular-nums">{fmt(genesis)}</span>
      </div>
      {/* Credits */}
      <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-full px-3 py-1">
        <span className="text-violet-600 font-bold text-sm leading-none">✦</span>
        <span className="text-violet-800 font-semibold text-sm tabular-nums">{credits}</span>
      </div>
    </Link>
  );
}