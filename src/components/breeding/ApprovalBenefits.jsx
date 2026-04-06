import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, TrendingUp, Lock, Zap, Award } from 'lucide-react';

const APPROVAL_BENEFITS = {
  elite_approved: {
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-800',
    icon: '⭐',
    title: 'Elite Approved',
    benefits: [
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Inscription studbook complète des poulains' },
      { icon: <TrendingUp className="w-4 h-4" />, text: 'Valeur multipliée par 2.0' },
      { icon: <Award className="w-4 h-4" />, text: 'Prix de saillie majoré de 50%' },
      { icon: <Zap className="w-4 h-4" />, text: 'Bonus de réputation augmenté' },
      { icon: <Award className="w-4 h-4" />, text: 'Filtre premium sur le marché' },
      { icon: <Award className="w-4 h-4" />, text: 'Visibilité maximale des poulains' }
    ]
  },
  approved_for_sport_breeding: {
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-800',
    icon: '✅',
    title: 'Approved for Sport Breeding',
    benefits: [
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Inscription studbook complète des poulains' },
      { icon: <TrendingUp className="w-4 h-4" />, text: 'Valeur multipliée par 1.5' },
      { icon: <Award className="w-4 h-4" />, text: 'Prix de saillie normal' },
      { icon: <Zap className="w-4 h-4" />, text: 'Bonus de réputation standard' },
      { icon: <Award className="w-4 h-4" />, text: 'Accès au marché spécialisé' }
    ]
  },
  approved_for_breeding: {
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    icon: '📋',
    title: 'Approved for Breeding',
    benefits: [
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Inscription studbook complète des poulains' },
      { icon: <TrendingUp className="w-4 h-4" />, text: 'Valeur multipliée par 1.2' },
      { icon: <Award className="w-4 h-4" />, text: 'Prix de saillie standard' },
      { icon: <Zap className="w-4 h-4" />, text: 'Bonus de réputation réduit' }
    ]
  },
  rejected: {
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-800',
    icon: '❌',
    title: 'Rejected',
    benefits: [
      { icon: <XCircle className="w-4 h-4" />, text: 'Reproduction possible mais poulains en OC' },
      { icon: <TrendingUp className="w-4 h-4" />, text: 'Valeur multipliée par 0.6' },
      { icon: <Lock className="w-4 h-4" />, text: 'Pas de reconnaissance studbook du père' },
      { icon: <XCircle className="w-4 h-4" />, text: 'Marché fermé aux poulains approuvés' }
    ]
  },
  not_evaluated: {
    color: 'from-stone-400 to-stone-500',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-300',
    textColor: 'text-stone-800',
    icon: '❓',
    title: 'Not Yet Evaluated',
    benefits: [
      { icon: <Zap className="w-4 h-4" />, text: 'Reproduction avec poulains potentiellement OC' },
      { icon: <Award className="w-4 h-4" />, text: 'Valeur neutre' },
      { icon: <Award className="w-4 h-4" />, text: 'Accès à l\'inspection pour le statut' }
    ]
  }
};

export default function ApprovalBenefits({ status, compact = false }) {
  const benefits = APPROVAL_BENEFITS[status] || APPROVAL_BENEFITS.not_evaluated;

  if (compact) {
    return (
      <div className={`p-3 rounded-lg ${benefits.bgColor} border ${benefits.borderColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{benefits.icon}</span>
          <p className={`font-semibold ${benefits.textColor} text-sm`}>{benefits.title}</p>
        </div>
        <ul className="space-y-1">
          {benefits.benefits.slice(0, 3).map((b, idx) => (
            <li key={idx} className={`flex items-center gap-2 text-xs ${benefits.textColor}`}>
              {React.cloneElement(b.icon, { className: 'w-3 h-3' })}
              {b.text}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Card className={`border-2 ${benefits.borderColor} ${benefits.bgColor}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{benefits.icon}</span>
          <div>
            <h3 className={`text-xl font-bold ${benefits.textColor}`}>{benefits.title}</h3>
            <p className={`text-sm ${benefits.textColor} opacity-75`}>Avantages du statut</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {benefits.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-white/50">
              <div className={`mt-0.5 ${benefits.textColor} flex-shrink-0`}>
                {React.cloneElement(benefit.icon, { className: 'w-4 h-4' })}
              </div>
              <p className={`text-sm ${benefits.textColor}`}>{benefit.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}