import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, Shield, TrendingUp, Heart, Trophy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import StaffCard from '../components/staff/StaffCard';
import HireDialog from '../components/staff/HireDialog';
import { ROLE_CONFIG, getStaffBonuses } from '@/lib/staffConfig';

const BONUS_DISPLAY = [
  { key: 'energy_recovery_bonus', icon: Zap, color: 'text-amber-500', label: 'Récupération énergie', suffix: '' },
  { key: 'illness_risk_reduction', icon: Shield, color: 'text-blue-500', label: 'Réduction maladies', suffix: '%' },
  { key: 'training_success_bonus', icon: TrendingUp, color: 'text-purple-500', label: 'Bonus entraînement', suffix: '%' },
  { key: 'breeding_success_bonus', icon: Heart, color: 'text-pink-500', label: 'Bonus élevage', suffix: '%' },
  { key: 'competition_score_bonus', icon: Trophy, color: 'text-emerald-500', label: 'Bonus compétition', suffix: ' pts' },
];

export default function Staff() {
  const queryClient = useQueryClient();

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list('-created_date', 50),
  });

  const { data: finances = [] } = useQuery({
    queryKey: ['finances'],
    queryFn: () => base44.entities.StableFinances.list('-created_date', 1),
  });

  const finance = finances[0];
  const balance = finance?.balance ?? 5000;

  // Ensure finances record exists
  const initFinancesMutation = useMutation({
    mutationFn: () => base44.entities.StableFinances.create({ balance: 5000, total_earned: 0, total_spent: 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finances'] }),
  });

  useEffect(() => {
    if (!isLoading && finances.length === 0) initFinancesMutation.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, finances.length]);

  const hireMutation = useMutation({
    mutationFn: async (staffData) => {
      const newStaff = await base44.entities.Staff.create(staffData);
      if (finance) {
        await base44.entities.StableFinances.update(finance.id, {
          balance: balance - staffData.salary,
          total_spent: (finance.total_spent || 0) + staffData.salary,
        });
      }
      return newStaff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      toast.success('Employé embauché !');
    },
  });

  const fireMutation = useMutation({
    mutationFn: (id) => base44.entities.Staff.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Employé licencié.');
    },
  });

  const payrollMutation = useMutation({
    mutationFn: async () => {
      const totalSalary = staffList.filter(s => s.is_active).reduce((acc, s) => acc + s.salary, 0);
      if (balance < totalSalary) throw new Error('Solde insuffisant');
      await base44.entities.StableFinances.update(finance.id, {
        balance: balance - totalSalary,
        total_spent: (finance.total_spent || 0) + totalSalary,
        last_payroll_at: new Date().toISOString(),
      });
      // Reduce morale slightly if not paid on time (future: use date diff)
      return totalSalary;
    },
    onSuccess: (total) => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      toast.success(`Paie versée : ${total} pts déduits.`);
    },
    onError: () => toast.error('Solde insuffisant pour verser les salaires !'),
  });

  const totalSalary = staffList.filter(s => s.is_active).reduce((acc, s) => acc + s.salary, 0);
  const bonuses = getStaffBonuses(staffList);
  const byRole = Object.keys(ROLE_CONFIG).reduce((acc, r) => ({ ...acc, [r]: staffList.filter(s => s.role === r) }), {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Personnel de l'Écurie</h1>
          <p className="text-stone-500 mt-1">Gérez votre équipe et bénéficiez de bonus passifs</p>
        </div>
        <div className="flex gap-2">
          <HireDialog balance={balance} onHire={(data) => hireMutation.mutate(data)} />
        </div>
      </div>

      {/* Finance banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 bg-white/60 sm:col-span-2">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-500">Solde disponible</p>
              <p className="text-3xl font-bold text-stone-800">💰 {balance.toLocaleString()} pts</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-500">Masse salariale / mois</p>
              <p className={`text-xl font-bold ${totalSalary > balance ? 'text-red-500' : 'text-stone-700'}`}>
                -{totalSalary} pts
              </p>
              {totalSalary > 0 && (
                <button
                  onClick={() => payrollMutation.mutate()}
                  disabled={payrollMutation.isPending}
                  className="mt-1 text-xs text-emerald-600 underline hover:text-emerald-800"
                >
                  Verser la paie
                </button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/60">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-stone-500" />
            <div>
              <p className="text-2xl font-bold text-stone-800">{staffList.length}</p>
              <p className="text-xs text-stone-500">Employés</p>
            </div>
          </CardContent>
        </Card>
        {balance < totalSalary ? (
          <Card className="border-0 bg-red-50 border border-red-200">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-700">Déficit !</p>
                <p className="text-xs text-red-500">Solde insuffisant</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-white/60">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-stone-800">{Math.round(balance / (totalSalary || 1))} mois</p>
                <p className="text-xs text-stone-500">Autonomie</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active bonuses summary */}
      {staffList.length > 0 && (
        <Card className="border-0 bg-gradient-to-r from-stone-50 to-amber-50/30 border border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-stone-700">✨ Bonus passifs actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {BONUS_DISPLAY.map(({ key, icon: Icon, color, label, suffix }) => {
                const val = bonuses[key];
                if (!val) return null;
                const isReduction = key === 'illness_risk_reduction';
                return (
                  <div key={key} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-stone-100">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <div>
                      <p className="text-xs text-stone-500">{label}</p>
                      <p className={`text-sm font-bold ${isReduction ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {isReduction ? `-${val}${suffix}` : `+${val}${suffix}`}
                      </p>
                    </div>
                  </div>
                );
              })}
              {Object.values(bonuses).every(v => v === 0) && (
                <p className="text-sm text-stone-400 italic">Aucun bonus actif pour le moment</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff by role */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-stone-100 animate-pulse" />)}
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">👥</span>
          <h3 className="text-lg font-semibold text-stone-600">Aucun employé</h3>
          <p className="text-stone-400 mt-1">Embauchez du personnel pour améliorer votre écurie.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(ROLE_CONFIG).map(([roleKey, roleCfg]) => {
            const members = byRole[roleKey] || [];
            if (!members.length) return null;
            return (
              <div key={roleKey}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{roleCfg.icon}</span>
                  <h3 className="font-semibold text-stone-700">{roleCfg.label}s</h3>
                  <Badge variant="outline" className="text-xs">{members.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map(s => (
                    <StaffCard key={s.id} staff={s} onFire={(s) => fireMutation.mutate(s.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}