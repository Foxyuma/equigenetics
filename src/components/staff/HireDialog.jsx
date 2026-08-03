import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, Shield, TrendingUp, Heart, Trophy } from 'lucide-react';
import { ROLE_CONFIG, LEVEL_CONFIG, SPECIALITIES, buildStaffMember } from '@/lib/staffConfig';

const BONUS_ICONS = {
  energy_recovery_bonus: { icon: Zap, color: 'text-amber-500', label: 'Energy recovery' },
  illness_risk_reduction: { icon: Shield, color: 'text-blue-500', label: 'Disease risk' },
  training_success_bonus: { icon: TrendingUp, color: 'text-purple-500', label: 'Training' },
  breeding_success_bonus: { icon: Heart, color: 'text-pink-500', label: 'Breeding' },
  competition_score_bonus: { icon: Trophy, color: 'text-emerald-500', label: 'Competition' },
};

const NAMES = {
  groom: ["Lea Martin", "Tom Dupont", "Sara Petit", "Jules Henry"],
  vet: ["Dr. Claire Morin", "Dr. Paul Girard", "Dr. Nina Bernard"],
  trainer: ["Marc Rousseau", "Alice Mercier", "Luc Bonnet"],
  manager: ["Sophie Laurent", "Eric Blanc", "Camille Roy"],
};

export default function HireDialog({ balance, onHire }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('groom');
  const [level, setLevel] = useState('junior');
  const [specialityId, setSpecialityId] = useState(SPECIALITIES.groom[0].id);
  const [name, setName] = useState(NAMES.groom[0]);

  const handleRoleChange = (r) => {
    setRole(r);
    setSpecialityId(SPECIALITIES[r][0].id);
    setName(NAMES[r][0]);
  };

  const preview = buildStaffMember(role, level, specialityId);
  const canAfford = balance >= preview.salary;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-stone-800 hover:bg-stone-900">
          <Plus className="w-4 h-4 mr-2" /> Hire
          </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
          <DialogHeader>
          <DialogTitle>Hire Staff</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* Role */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Role</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleRoleChange(key)}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${role === key ? `${cfg.bg} ${cfg.border} ${cfg.textColor} font-semibold` : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}
                >
                  <span className="text-lg mr-1.5">{cfg.icon}</span>{cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Level</p>
            <div className="flex gap-2">
              {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setLevel(key)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${level === key ? 'bg-stone-800 text-white border-stone-800' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}
                >
                  {Array(cfg.stars).fill('⭐').join('')} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speciality */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Specialty</p>
            <div className="space-y-1.5">
              {SPECIALITIES[role].map(spec => (
                <button
                  key={spec.id}
                  onClick={() => setSpecialityId(spec.id)}
                  className={`w-full p-2.5 rounded-lg border text-left text-sm transition-all ${specialityId === spec.id ? 'bg-stone-100 border-stone-300 font-medium' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'}`}
                >
                  <span className="font-medium text-stone-700">{spec.label}</span>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {Object.entries(spec.bonus).map(([k, v]) => {
                      const cfg = BONUS_ICONS[k];
                      if (!cfg || !v) return null;
                      const Icon = cfg.icon;
                      return (
                        <span key={k} className="flex items-center gap-1 text-xs text-stone-500">
                          <Icon className={`w-3 h-3 ${cfg.color}`} />
                          {k === 'illness_risk_reduction' ? `-${v}%` : `+${v}`}
                        </span>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2">Name</p>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Preview & CTA */}
          <div className={`p-3 rounded-xl border ${canAfford ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Monthly salary</span>
              <span className={`font-bold ${canAfford ? 'text-emerald-700' : 'text-red-600'}`}>💰 {preview.salary} pts</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1 text-stone-500">
              <span>Current balance</span>
              <span>{balance} pts</span>
            </div>
          </div>

          <Button
            onClick={() => { onHire({ ...preview, name }); setOpen(false); }}
            disabled={!name || !canAfford}
            className="w-full bg-stone-800 hover:bg-stone-900"
          >
            {canAfford ? 'Confirm hire' : 'Insufficient balance'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}