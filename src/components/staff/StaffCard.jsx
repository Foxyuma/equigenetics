import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Shield, TrendingUp, Star, Heart, Trophy, UserX } from 'lucide-react';
import { ROLE_CONFIG, LEVEL_CONFIG, SPECIALITIES } from '@/lib/staffConfig';

const BONUS_ICONS = {
  energy_recovery_bonus: { icon: Zap, color: 'text-amber-500', label: 'Energy recovery' },
  illness_risk_reduction: { icon: Shield, color: 'text-blue-500', label: 'Disease risk' },
  training_success_bonus: { icon: TrendingUp, color: 'text-purple-500', label: 'Training' },
  breeding_success_bonus: { icon: Heart, color: 'text-pink-500', label: 'Breeding' },
  competition_score_bonus: { icon: Trophy, color: 'text-emerald-500', label: 'Competition' },
};

export default function StaffCard({ staff, onFire }) {
  const role = ROLE_CONFIG[staff.role];
  const level = LEVEL_CONFIG[staff.level];
  const spec = SPECIALITIES[staff.role]?.find(s => s.id === staff.speciality);

  const activeBonuses = Object.entries(staff.bonuses || {}).filter(([, v]) => v > 0);

  return (
    <Card className={`border ${role.border} ${role.bg} overflow-hidden`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-xl shadow`}>
              {role.icon}
            </div>
            <div>
              <p className="font-bold text-stone-800 text-sm">{staff.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge className={`text-xs border-0 px-1.5 py-0 ${role.bg} ${role.textColor}`}>{role.label}</Badge>
                <span className="text-xs text-stone-400">{Array(level.stars).fill('⭐').join('')}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-300 hover:text-red-400" onClick={() => onFire(staff)}>
            <UserX className="w-4 h-4" />
          </Button>
        </div>

        {spec && (
          <p className="text-xs text-stone-500 italic">✨ {SPECIALITIES[staff.role]?.find(s => s.id === staff.speciality)?.label}</p>
        )}

        {/* Bonuses */}
        <div className="space-y-1.5">
          {activeBonuses.map(([key, value]) => {
            const cfg = BONUS_ICONS[key];
            if (!cfg) return null;
            const Icon = cfg.icon;
            const isReduction = key === 'illness_risk_reduction';
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-stone-600">
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  {cfg.label}
                </div>
                <span className={`font-semibold ${isReduction ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {isReduction ? `-${value}%` : `+${value}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Morale & Salary */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
          <div className="flex items-center gap-1 text-xs text-stone-500">
            <Heart className="w-3 h-3 text-rose-400" />
            Morale: <span className="font-medium text-stone-700">{staff.morale || 100}%</span>
            </div>
            <Badge variant="outline" className="text-xs font-semibold text-stone-700">
            💰 {staff.salary} pts/month
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}