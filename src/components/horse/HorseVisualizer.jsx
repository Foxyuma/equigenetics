import React, { useState } from 'react';
import { getHorsePhotoUrl } from '@/lib/horsePhotos';

const GENE_LABELS = {
  extension:  { label: "Extension (E)",  visible: true  },
  agouti:     { label: "Agouti (A)",     visible: true  },
  cream:      { label: "Crème (Cr)",     visible: true  },
  grey:       { label: "Gris (G)",       visible: true  },
  tobiano:    { label: "Tobiano (TO)",   visible: true  },
  sabino:     { label: "Sabino (Sb)",    visible: true  },
  splash:     { label: "Splash (Spl)",   visible: true  },
  overo:      { label: "Overo (Fr)",     visible: true  },
  roan:       { label: "Rouan (RN)",     visible: true  },
  dun:        { label: "Dun (D)",        visible: true  },
  champagne:  { label: "Champagne (CH)", visible: true  },
  silver:     { label: "Silver (Z)",     visible: true  },
};

const NEUTRAL = {
  extension: 'ee', agouti: 'aa', cream: 'nn', grey: 'gg',
  tobiano: 'nn', sabino: 'nn', splash: 'nn', overo: 'nn',
  roan: 'nn', dun: 'dd', champagne: 'nn', silver: 'zz',
};

// Pasture background: sky → grass gradient
const pastureBg = 'linear-gradient(to bottom, #aed4e8 0%, #cee5d0 38%, #8cc66f 62%, #6ba858 100%)';

export default function HorseVisualizer({ genotype, coatColor, horseId, breed, age, size = 320, showGenotype = true }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getHorsePhotoUrl(genotype, horseId, breed, age);
  const isFoal = typeof age === "number" && age < 3;

  // Collect expressed visible genes for on-image overlay
  const expressedGenes = genotype
    ? Object.entries(GENE_LABELS)
        .filter(([key, cfg]) => {
          const val = genotype[key];
          return val && val !== NEUTRAL[key] && cfg.visible;
        })
        .map(([key, cfg]) => ({ key, label: cfg.label, value: genotype[key] }))
    : [];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Horse photo with pasture background + gene overlays */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-md"
        style={{ width: size, height: size, background: pastureBg }}
      >
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: size * 0.5 }} className="opacity-40 select-none">🐎</span>
          </div>
        ) : (
          <img
            src={photoUrl}
            alt={coatColor || 'Cheval'}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}

        {/* Expressed visible gene badges — overlaid on image (top) */}
        {showGenotype && expressedGenes.length > 0 && (
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
            {expressedGenes.map(g => (
              <span
                key={g.key}
                title={g.label}
                className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/55 text-amber-200 border border-amber-300/40 backdrop-blur-sm"
              >
                {g.value}
              </span>
            ))}
          </div>
        )}

        {/* Coat label */}
        {showGenotype && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-sm">
            {coatColor || 'Couleur inconnue'}
          </div>
        )}

        {/* Foal badge */}
        {isFoal && (
          <div className="absolute top-2 right-2 bg-amber-500/90 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow">
            🍼 Poulain
          </div>
        )}
      </div>

      {/* Legend */}
      {genotype && showGenotype && (
        <div className="w-full max-w-xs">
          <div className="flex gap-3 flex-wrap justify-center">
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-200 border border-amber-400 inline-block" />
              Gène visible
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-100 border border-stone-300 inline-block" />
              Récessif
            </span>
          </div>
        </div>
      )}
    </div>
  );
}