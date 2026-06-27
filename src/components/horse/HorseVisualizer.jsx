import React from 'react';

const BASE_IMAGE = "https://media.base44.com/images/public/69b44c69482b4d9133223b0e/be5f70039_228d75cd-d270-459c-ba6f-9549efdcc916.png";

// Derive coat background color + image filter from genotype
// Base image is a BAY horse (brown body + black mane/legs)
// mix-blend-mode:multiply on image × background color = tinted result
const getCoatStyle = (genotype) => {
  if (!genotype) return { bg: '#c47a3a', imgFilter: 'none' };

  const isBlack  = genotype.extension !== "ee";
  const hasAgouti = genotype.agouti !== "aa";
  const hasCream  = genotype.cream === "Crn";
  const doubleCream = genotype.cream === "CrCr";
  const isGrey    = genotype.grey === "GG" || genotype.grey === "Gg";
  const hasChampagne = genotype.champagne === "CHn" || genotype.champagne === "CHCH";
  const hasSilver = genotype.silver === "Zz" || genotype.silver === "ZZ";
  const hasDun    = genotype.dun === "Dd" || genotype.dun === "DD";
  const hasTobiano = genotype.tobiano && genotype.tobiano !== "nn";
  const hasRoan   = genotype.roan === "RNn" || genotype.roan === "RNRN";

  let bg = '#c47a3a';           // Default bay-ish tint
  let imgFilter = 'none';

  if (isGrey) {
    bg = '#e0ddd8';
    imgFilter = 'saturate(0.05) brightness(1.2)';
  } else if (!isBlack) {
    // Chestnut family (no black pigment → no black mane)
    if (doubleCream) {
      bg = '#fff8e7';
      imgFilter = 'saturate(0.25) brightness(1.6) sepia(0.15)';
    } else if (hasCream) {
      bg = '#f0c060';           // Palomino gold
      imgFilter = 'saturate(0.6) brightness(1.3) sepia(0.3)';
    } else if (hasChampagne) {
      bg = '#d4a840';
      imgFilter = 'saturate(0.8) brightness(1.15) sepia(0.25)';
    } else {
      bg = '#c46030';           // Chestnut
      imgFilter = 'saturate(1.1) brightness(1.0) hue-rotate(-8deg)';
    }
  } else if (hasAgouti) {
    // Bay family
    if (doubleCream) {
      bg = '#f0e0b8';
      imgFilter = 'saturate(0.3) brightness(1.7)';
    } else if (hasCream) {
      bg = '#d4b870';           // Buckskin
      imgFilter = 'saturate(0.7) brightness(1.25)';
    } else if (hasChampagne) {
      bg = '#c89040';
      imgFilter = 'saturate(0.9) brightness(1.1) sepia(0.15)';
    } else if (hasSilver) {
      bg = '#a08050';
      imgFilter = 'saturate(0.6) brightness(1.05)';
    } else {
      bg = '#c47a3a';           // Bay (base, minimal tint)
      imgFilter = 'saturate(1.05) brightness(1.0)';
    }
  } else {
    // Black family
    if (doubleCream) {
      bg = '#e8d5c0';
      imgFilter = 'saturate(0.15) brightness(1.6)';
    } else if (hasCream) {
      bg = '#505050';           // Smoky black
      imgFilter = 'saturate(0.1) brightness(0.75)';
    } else {
      bg = '#383838';           // Black
      imgFilter = 'saturate(0.05) brightness(0.5)';
    }
  }

  if (hasDun && !isGrey) {
    imgFilter += ' contrast(1.05)';
  }

  return { bg, imgFilter, hasTobiano, hasRoan, hasDun, hasSilver, hasCream, doubleCream };
};

const GENE_LABELS = {
  extension:  { label: "Extension (E)",  visible: true  },
  agouti:     { label: "Agouti (A)",      visible: true  },
  cream:      { label: "Crème (Cr)",      visible: true  },
  grey:       { label: "Gris (G)",        visible: true  },
  tobiano:    { label: "Tobiano (TO)",    visible: true  },
  roan:       { label: "Rouan (RN)",      visible: true  },
  dun:        { label: "Dun (D)",         visible: true  },
  champagne:  { label: "Champagne (CH)",  visible: false },
  silver:     { label: "Silver (Z)",      visible: false },
};

const NEUTRAL = {
  extension: 'ee', agouti: 'aa', cream: 'nn', grey: 'gg',
  tobiano: 'nn', roan: 'nn', dun: 'dd', champagne: 'nn', silver: 'zz',
};

export default function HorseVisualizer({ genotype, coatColor, size = 320, showGenotype = true }) {
  const style = getCoatStyle(genotype);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Horse with genetic color */}
      <div className="relative rounded-2xl overflow-hidden shadow-md" style={{ width: size, height: size, background: style.bg }}>

        {/* Horse silhouette — emoji, zero network, instant */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: size * 0.5 }} className="opacity-40 select-none">🐎</span>
        </div>

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