import React from 'react';
import {
  Wind, Zap, Activity, Dumbbell, Brain, TrendingUp, Sparkles,
  Crown, Trophy, Dna, Shield,
} from 'lucide-react';
import { computeAchievements } from '@/lib/horseAchievements';

const ICONS = { Wind, Zap, Activity, Dumbbell, Brain, TrendingUp, Sparkles, Crown, Trophy, Dna, Shield };

const TIER_STYLES = {
  gold: {
    badge: 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white border-0 shadow-md shadow-amber-200/50',
    ring: 'ring-amber-300',
    glow: 'from-amber-100 to-yellow-50',
    label: 'text-amber-700',
  },
  silver: {
    badge: 'bg-gradient-to-br from-slate-300 to-slate-500 text-white border-0 shadow-md shadow-slate-200/50',
    ring: 'ring-slate-300',
    glow: 'from-slate-50 to-stone-50',
    label: 'text-slate-600',
  },
  bronze: {
    badge: 'bg-gradient-to-br from-orange-300 to-amber-700 text-white border-0 shadow-md shadow-orange-200/50',
    ring: 'ring-orange-300',
    glow: 'from-orange-50 to-amber-50',
    label: 'text-orange-700',
  },
};

export default function AchievementBadges({ horse }) {
  const badges = computeAchievements(horse);
  if (badges.length === 0) return null;

  return (
    <div className={`rounded-xl border border-amber-200 bg-gradient-to-r ${badges.some(b => b.tier === 'gold') ? 'from-amber-50 to-yellow-50' : 'from-stone-50 to-amber-50/50'} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-amber-600" />
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Achievements</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map(badge => {
          const Icon = ICONS[badge.icon] || Crown;
          const tier = TIER_STYLES[badge.tier];
          return (
            <div
              key={badge.id}
              className="group relative"
              title={badge.description}
            >
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${tier.badge} ${tier.ring} cursor-help`}>
                <Icon className="w-3.5 h-3.5" />
                {badge.label}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 w-56">
                <div className="rounded-lg bg-stone-900 text-white text-xs p-3 shadow-xl">
                  <p className="font-semibold mb-0.5">{badge.label}</p>
                  <p className="text-stone-300 leading-relaxed">{badge.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}