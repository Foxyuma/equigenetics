import React from 'react';

const statColors = {
  speed: "from-sky-400 to-sky-500",
  endurance: "from-emerald-400 to-emerald-500",
  agility: "from-violet-400 to-violet-500",
  strength: "from-red-400 to-red-500",
  temperament: "from-amber-400 to-amber-500",
  jumping: "from-blue-400 to-blue-500",
  dressage: "from-pink-400 to-pink-500",
};

const statLabels = {
  speed: "Vitesse",
  endurance: "Endurance",
  agility: "Agilité",
  strength: "Force",
  temperament: "Tempérament",
  jumping: "Saut",
  dressage: "Dressage",
};

export default function StatBar({ stat, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-stone-500 w-24 text-right">
        {statLabels[stat] || stat}
      </span>
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${statColors[stat] || "from-stone-400 to-stone-500"} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold text-stone-700 w-8">{value}</span>
    </div>
  );
}