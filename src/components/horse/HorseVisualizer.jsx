import React, { useState } from 'react';
import { getHorsePhotoUrl } from '@/lib/horsePhotos';

// Derive coat background color from genotype (for fallback / accent)
const getCoatBg = (genotype) => {
  if (!genotype) return '#c47a3a';

  const isBlack  = genotype.extension !== "ee";
  const hasAgouti = genotype.agouti !== "aa";
  const hasCream  = genotype.cream === "Crn";
  const doubleCream = genotype.cream === "CrCr";
  const isGrey    = genotype.grey === "GG" || genotype.grey === "Gg";
  const hasChampagne = genotype.champagne === "CHn" || genotype.champagne === "CHCH";
  const hasSilver = genotype.silver === "Zz" || genotype.silver === "ZZ";

  if (isGrey) return '#e0ddd8';
  if (!isBlack) {
    if (doubleCream) return '#fff8e7';
    if (hasCream) return '#f0c060';
    if (hasChampagne) return '#d4a840';
    return '#c46030';
  }
  if (hasAgouti) {
    if (doubleCream) return '#f0e0b8';
    if (hasCream) return '#d4b870';
    if (hasChampagne) return '#c89040';
    if (hasSilver) return '#a08050';
    return '#c47a3a';
  }
  if (doubleCream) return '#e8d5c0';
  if (hasCream) return '#505050';
  return '#383838';
};

const GENE_LABELS = {
  extension:  { label: "Extension (E)",  visible: true  },
  agouti:     { label: "Agouti (A)",      visible: true  },
  cream:      { label: "Crème (Cr)",      visible: true  },
  grey:       { label: "Gris (G)",        visible: true  },
  tobiano:    { label: "Tobiano (TO)",    visible: true  },
  sabino:     { label: "Sabino (Sb)",     visible: true  },
  splash:     { label: "Splash (Spl)",    visible: true  },
  overo:      { label: "Overo/Frame (Fr)",visible: true  },
  roan:       { label: "Rouan (RN)",      visible: true  },
  dun:        { label: "Dun (D)",         visible: true  },
  champagne:  { label: "Champagne (CH)",  visible: false },
  silver:     { label: "Silver (Z)",      visible: false },
};

const NEUTRAL = {
  extension: 'ee', agouti: 'aa', cream: 'nn', grey: 'gg',
  tobiano: 'nn', sabino: 'nn', splash: 'nn', overo: 'nn',
  roan: 'nn', dun: 'dd', champagne: 'nn', silver: 'zz',
};

export default function HorseVisualizer({ genotype, coatColor, horseId, breed, size = 320, showGenotype = true }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getHorsePhotoUrl(genotype, horseId, breed);
  const bg = getCoatBg(genotype);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Horse photo matching genetics + breed */}
      <div className="relative rounded-2xl overflow-hidden shadow-md" style={{ width: size, height: size, background: bg }}>
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: size * 0.5 }} className="opacity-40 select-none">🐎</span>
          </div>
        ) : (
          <img
            src={photoUrl}
            alt={coatColor || 'Cheval'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}

        {/* Coat label — hidden in compact mode (card shows it below) */}
        {showGenotype && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-sm">
            {coatColor || 'Couleur inconnue'}
          </div>
        )}
      </div>

      {/* Genotype badges */}
      {genotype && showGenotype && (
        <div className="w-full max-w-xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Génotype</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(GENE_LABELS).map(([key, cfg]) => {
              const value = genotype[key];
              if (!value) return null;
              const neutral = NEUTRAL[key];
              const expressed = value !== neutral;
              return (
                <span
                  key={key}
                  title={cfg.label}
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    expressed
                      ? cfg.visible
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-violet-100 border-violet-300 text-violet-800'
                      : 'bg-stone-100 border-stone-200 text-stone-400'
                  }`}
                >
                  {value}
                </span>
              );
            })}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-200 border border-amber-400 inline-block" />
              Gène visible
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-200 border border-violet-400 inline-block" />
              Gène caché
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