import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SeasonManager from '../components/season/SeasonManager';
import { Calendar, Leaf, Sun, CloudRain, Snowflake } from 'lucide-react';

const SEASON_DETAILS = {
  spring: {
    icon: Leaf,
    benefits: [
      "Fertilité augmentée de 20%",
      "Risque de maladie faible (12%)",
      "Compétitions de printemps disponibles"
    ],
    tips: [
      "Période idéale pour la reproduction",
      "Les poulains nés au printemps sont plus robustes",
      "Profitez des compétitions outdoor"
    ]
  },
  summer: {
    icon: Sun,
    benefits: [
      "Fertilité normale (100%)",
      "Risque de maladie modéré (20%)",
      "Compétitions d'endurance et vitesse"
    ],
    tips: [
      "Attention aux coups de chaleur",
      "Hydratation importante",
      "Compétitions d'endurance favorisées"
    ]
  },
  autumn: {
    icon: CloudRain,
    benefits: [
      "Fertilité légèrement réduite (90%)",
      "Risque de maladie modéré (18%)",
      "Compétitions cross-country"
    ],
    tips: [
      "Préparez les chevaux pour l'hiver",
      "Renforcez les vaccinations",
      "Compétitions outdoor avant l'hiver"
    ]
  },
  winter: {
    icon: Snowflake,
    benefits: [
      "Fertilité réduite de 30%",
      "Risque élevé de maladie (25%)",
      "Compétitions indoor uniquement"
    ],
    tips: [
      "Surveillance accrue de la santé",
      "Privilégiez les compétitions indoor",
      "Maintenez une bonne alimentation"
    ]
  }
};

export default function SeasonCalendar() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Calendrier des Saisons</h1>
        <p className="text-stone-500 mt-1">Gérez le cycle annuel et adaptez votre stratégie</p>
      </div>

      <SeasonManager />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(SEASON_DETAILS).map(([season, details]) => {
          const Icon = details.icon;
          return (
            <Card key={season} className="border-0 bg-white/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {season === 'spring' && 'Printemps'}
                  {season === 'summer' && 'Été'}
                  {season === 'autumn' && 'Automne'}
                  {season === 'winter' && 'Hiver'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-stone-700 text-sm mb-2">Effets</h4>
                  <ul className="space-y-1">
                    {details.benefits.map((b, i) => (
                      <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-stone-700 text-sm mb-2">Conseils</h4>
                  <ul className="space-y-1">
                    {details.tips.map((t, i) => (
                      <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">→</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}