import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SeasonManager from '../components/season/SeasonManager';
import { Calendar, Flower, Sun, CloudRain, Snowflake } from 'lucide-react';

const SEASON_DETAILS = {
  spring: {
    icon: Flower,
    benefits: [
      "Fertility increased by 20%",
      "Low disease risk (12%)",
      "Spring competitions available"
    ],
    tips: [
      "Ideal period for breeding",
      "Foals born in spring are more robust",
      "Enjoy outdoor competitions"
    ]
  },
  summer: {
    icon: Sun,
    benefits: [
      "Normal fertility (100%)",
      "Moderate disease risk (20%)",
      "Endurance and speed competitions"
    ],
    tips: [
      "Watch for heatstroke",
      "Hydration is key",
      "Endurance competitions favored"
    ]
  },
  autumn: {
    icon: CloudRain,
    benefits: [
      "Slightly reduced fertility (90%)",
      "Moderate disease risk (18%)",
      "Cross-country competitions"
    ],
    tips: [
      "Prepare horses for winter",
      "Boost vaccinations",
      "Outdoor competitions before winter"
    ]
  },
  winter: {
    icon: Snowflake,
    benefits: [
      "Fertility reduced by 30%",
      "High disease risk (25%)",
      "Indoor competitions only"
    ],
    tips: [
      "Increased health monitoring",
      "Prioritize indoor competitions",
      "Maintain good nutrition"
    ]
  }
};

export default function SeasonCalendar() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Season Calendar</h1>
        <p className="text-stone-500 mt-1">Manage the annual cycle and adapt your strategy</p>
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
                  {season === 'spring' && 'Spring'}
                  {season === 'summer' && 'Summer'}
                  {season === 'autumn' && 'Autumn'}
                  {season === 'winter' && 'Winter'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-stone-700 text-sm mb-2">Effects</h4>
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
                  <h4 className="font-semibold text-stone-700 text-sm mb-2">Tips</h4>
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