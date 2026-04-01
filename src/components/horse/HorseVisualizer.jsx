import React from 'react';

const BASE_IMAGE = "https://media.base44.com/images/public/69b44c69482b4d9133223b0e/be5f70039_228d75cd-d270-459c-ba6f-9549efdcc916.png";

// Returns CSS filter + SVG overlay config based on genotype
const getCoatStyle = (genotype) => {
  if (!genotype) return { filter: 'none', overlay: null };

  const isBlack = genotype.extension !== "ee";
  const hasAgouti = genotype.agouti !== "aa";
  const hasCream = genotype.cream === "Crn";
  const doubleCream = genotype.cream === "CrCr";
  const hasChampagne = genotype.champagne === "CHn" || genotype.champagne === "CHCH";
  const hasSilver = genotype.silver === "Zz" || genotype.silver === "ZZ";
  const isGrey = genotype.grey === "GG" || genotype.grey === "Gg";
  const hasTobiano = genotype.tobiano !== "nn" && genotype.tobiano;
  const hasRoan = genotype.roan === "RNn" || genotype.roan === "RNRN";
  const hasDun = genotype.dun !== "dd" && genotype.dun;

  let filter = 'none';
  let overlays = [];

  // Base color via CSS filter (base image is bay)
  if (!isBlack) {
    // Chestnut: remove black pigment → warm red-brown, mane same as body
    filter = 'sepia(0.6) saturate(1.4) hue-rotate(-10deg) brightness(1.05)';
    if (hasCream) {
      // Palomino
      filter = 'sepia(0.8) saturate(1.6) hue-rotate(15deg) brightness(1.45)';
    }
    if (doubleCream) {
      // Cremello
      filter = 'sepia(0.3) saturate(0.5) brightness(2.1)';
    }
  } else if (hasAgouti) {
    // Bay (default image) — minimal adjustments
    filter = 'saturate(1.1) brightness(1.0)';
    if (hasCream) {
      // Buckskin
      filter = 'sepia(0.3) saturate(1.1) brightness(1.35)';
    }
    if (doubleCream) {
      // Perlino
      filter = 'sepia(0.15) saturate(0.4) brightness(2.0)';
    }
    if (hasSilver) {
      // Silver bay: mane/tail turn silvery (overlay)
      filter = 'saturate(0.9) brightness(1.05)';
      overlays.push({ type: 'silver' });
    }
  } else {
    // Black
    filter = 'saturate(0.15) brightness(0.45)';
    if (hasCream) {
      // Smoky black
      filter = 'saturate(0.1) brightness(0.55)';
    }
    if (doubleCream) {
      // Smoky cream
      filter = 'sepia(0.2) saturate(0.3) brightness(1.7)';
    }
    if (hasSilver) {
      filter = 'saturate(0.2) brightness(0.5)';
      overlays.push({ type: 'silver' });
    }
  }

  if (hasChampagne) {
    filter += ' sepia(0.4) hue-rotate(20deg) brightness(1.2)';
  }

  if (isGrey) {
    filter = 'saturate(0.1) brightness(1.3) contrast(0.85)';
  }

  if (hasTobiano) overlays.push({ type: 'tobiano' });
  if (hasRoan) overlays.push({ type: 'roan' });
  if (hasDun) overlays.push({ type: 'dun' });

  return { filter, overlays };
};

const LOCUS_CONFIG = {
  extension:  { name: "Extension (E)",   desc: "Pigment noir",            visible: true  },
  agouti:     { name: "Agouti (A)",       desc: "Distribution du noir",    visible: true  },
  cream:      { name: "Crème (Cr)",       desc: "Dilution crème",          visible: true  },
  grey:       { name: "Gris (G)",         desc: "Grisonnement",            visible: true  },
  tobiano:    { name: "Tobiano (TO)",     desc: "Patron pie",              visible: true  },
  roan:       { name: "Roan (RN)",        desc: "Rouannage",               visible: true  },
  dun:        { name: "Dun (D)",          desc: "Dilution dun",            visible: true  },
  champagne:  { name: "Champagne (CH)",   desc: "Dilution champagne",      visible: false },
  silver:     { name: "Silver (Z)",       desc: "Dilution silver (crin)",  visible: false },
};

const HOMO_DOMINANT = { extension: "EE", agouti: "AA", cream: "CrCr", grey: "GG", tobiano: "TOTO", roan: "RNRN", dun: "DD", champagne: "CHCH", silver: "ZZ" };
const HETEROZYGOUS  = { extension: "Ee", agouti: "Aa", cream: "Crn",  grey: "Gg", tobiano: "TOn",  roan: "RNn",  dun: "Dd", champagne: "CHn",  silver: "Zz" };

const getAlleleClass = (locus, value) => {
  if (value === HOMO_DOMINANT[locus]) return 'homo';
  if (value === HETEROZYGOUS[locus])  return 'hetero';
  return 'recessive';
};

export default function HorseVisualizer({ genotype, coatColor, size = 320 }) {
  const { filter, overlays } = getCoatStyle(genotype);

  const hasTobiano = overlays?.some(o => o.type === 'tobiano');
  const hasRoan = overlays?.some(o => o.type === 'roan');
  const hasDun = overlays?.some(o => o.type === 'dun');
  const hasSilver = overlays?.some(o => o.type === 'silver');

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Horse image with genetic overlays */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Base image */}
        <img
          src={BASE_IMAGE}
          alt="Cheval"
          className="w-full h-full object-contain"
          style={{ filter }}
        />

        {/* SVG overlays for patterns */}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        >
          <defs>
            {hasRoan && (
              <pattern id="roanDots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="transparent" />
                <circle cx="1.5" cy="1.5" r="1" fill="white" opacity="0.55" />
                <circle cx="4.5" cy="4.5" r="1" fill="white" opacity="0.55" />
              </pattern>
            )}
          </defs>

          {/* Tobiano white patches */}
          {hasTobiano && (
            <g opacity="0.88">
              <ellipse cx="200" cy="170" rx="90" ry="55" fill="white" />
              <ellipse cx="150" cy="300" rx="30" ry="50" fill="white" />
              <ellipse cx="260" cy="310" rx="25" ry="45" fill="white" />
            </g>
          )}

          {/* Roan stippling over body */}
          {hasRoan && (
            <ellipse cx="200" cy="210" rx="140" ry="100" fill="url(#roanDots)" />
          )}

          {/* Dun dorsal stripe */}
          {hasDun && (
            <path
              d="M 195 80 Q 198 150 200 230 Q 202 150 205 80"
              fill="rgba(80,40,10,0.45)"
              strokeWidth="0"
            />
          )}
        </svg>

        {/* Silver mane shimmer (top overlay, screen blend) */}
        {hasSilver && (
          <div
            className="absolute inset-0 pointer-events-none rounded"
            style={{
              background: 'linear-gradient(120deg, rgba(220,220,230,0.22) 0%, rgba(180,180,200,0.08) 60%, transparent 100%)',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Coat color label */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap backdrop-blur-sm">
          {coatColor || 'Couleur inconnue'}
        </div>
      </div>

      {/* Genetic markers — aligned with GeneticPanel */}
      {genotype && (
        <div className="w-full max-w-xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Génotype</p>
          <div className="space-y-1">
            {Object.entries(LOCUS_CONFIG).map(([locus, cfg]) => {
              const value = genotype[locus];
              if (!value) return null;
              const alleleClass = getAlleleClass(locus, value);
              const isRecessive = alleleClass === 'recessive';
              return (
                <div key={locus} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                  isRecessive ? 'bg-stone-100' : cfg.visible ? 'bg-amber-50' : 'bg-violet-50'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      alleleClass === 'homo' ? 'bg-emerald-400' :
                      alleleClass === 'hetero' ? 'bg-amber-400' : 'bg-stone-300'
                    }`} />
                    <span className={`font-medium ${
                      isRecessive ? 'text-stone-400' : cfg.visible ? 'text-amber-800' : 'text-violet-700'
                    }`}>{cfg.name}</span>
                    <span className="text-stone-400 hidden sm:inline">{cfg.desc}</span>
                  </div>
                  <span className={`font-mono font-bold ${
                    alleleClass === 'homo' ? 'text-emerald-700' :
                    alleleClass === 'hetero' ? 'text-amber-700' : 'text-stone-400'
                  }`}>{value}</span>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-3 mt-2 flex-wrap">
            {[
              { color: 'bg-emerald-400', label: 'Hom. dominant' },
              { color: 'bg-amber-400',   label: 'Hétérozygote' },
              { color: 'bg-stone-300',   label: 'Récessif' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1 text-xs text-stone-400">
                <span className={`w-2 h-2 rounded-full ${color} inline-block`} />
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-3 mt-1 flex-wrap">
            {[
              { color: 'bg-amber-50 border border-amber-200', label: 'Visible' },
              { color: 'bg-violet-50 border border-violet-200', label: 'Caché/porté' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1 text-xs text-stone-400">
                <span className={`w-3 h-3 rounded ${color} inline-block`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}