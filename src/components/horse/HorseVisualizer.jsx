import React, { useState } from 'react';
import { getHorsePhotoUrl, getCoatInfo } from '@/lib/horsePhotos';
import { isPrimitiveMarked, migrateKit, getKitLabel } from '@/components/genetics/GeneticsEngine';

const GENE_LABELS = {
  extension:  { label: "Extension (E)",  visible: true  },
  agouti:     { label: "Agouti (A)",     visible: true  },
  cream:      { label: "Cream (Cr)",     visible: true  },
  grey:       { label: "Grey (G)",        visible: true  },
  kit:        { label: "KIT gene",        visible: true  },
  splash:     { label: "Splash (SW)",    visible: true  },
  overo:      { label: "Overo (LWO)",    visible: true  },
  frame:      { label: "Frame (LWO)",    visible: true  },
  dun:        { label: "Dun (D)",        visible: true  },
  champagne:  { label: "Champagne (CH)", visible: true  },
  silver:     { label: "Silver (Z)",     visible: true  },
  mushroom:   { label: "Mushroom (mu)",  visible: true  },
  rabicano:   { label: "Rabicano (Rb)",  visible: true  },
  leopard:    { label: "Leopard (LP)",   visible: true  },
  pattern1:   { label: "Pattern1",       visible: true  },
  sooty:      { label: "Sooty",          visible: true  },
  flaxen:     { label: "Flaxen (f)",     visible: true  },
  pangare:    { label: "Pangare (P)",    visible: true  },
  bringe:     { label: "Brindle (BR1)",  visible: true  },
};

const NEUTRAL = {
  extension: 'ee', agouti: 'aa', cream: 'nn', grey: 'gg',
  kit: 'toto', splash: 'nn', overo: 'nn', frame: 'nn',
  dun: 'nd2nd2', champagne: 'nn', silver: 'zz', mushroom: 'MuMu',
  rabicano: 'rbrb', leopard: 'lplp', pattern1: 'patn1patn1',
  sooty: 'soso', flaxen: 'FF', pangare: 'pp', bringe: 'br1br1',
};

// Pasture background: sky → grass gradient
const pastureBg = 'linear-gradient(to bottom, #aed4e8 0%, #cee5d0 38%, #8cc66f 62%, #6ba858 100%)';

export default function HorseVisualizer({ genotype, coatColor, horseId, breed, age, size = 320, showGenotype = true, fill = false }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getHorsePhotoUrl(genotype, horseId, breed, age);
  const isFoal = typeof age === "number" && age < 3;
  const coatInfo = genotype ? getCoatInfo(genotype) : null;
  const showBirth = coatInfo && coatInfo.isGrey && coatInfo.birth !== "Gris" && coatInfo.birth !== coatInfo.display;
  const hasPrimitiveMarkings = genotype ? isPrimitiveMarked(genotype) : false;

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
        className={`relative rounded-2xl overflow-hidden shadow-md ${fill ? 'w-full h-full' : ''}`}
        style={fill ? { background: pastureBg } : { width: size, height: size, background: pastureBg }}
      >
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: size * 0.5 }} className="opacity-40 select-none">🐎</span>
          </div>
        ) : (
          <img
            src={photoUrl}
            alt={coatColor || 'Horse'}
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

          {/* Primitive markings (Stripes/dun markings/stonewalling) */}
          {hasPrimitiveMarkings && (
          <div title="Primitive markings (nd1)" className="absolute bottom-4 right-3 flex flex-col gap-0.5 opacity-80">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-6 h-1 rounded bg-amber-700/70" style={{ transform: `rotate(${((i / 4) * 60 - 30)}deg)` }} />
            ))}
          </div>
        )}

      {/* Coat label */}
        {showGenotype && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold text-center backdrop-blur-sm">
            <div className="whitespace-nowrap">{coatInfo?.display || coatColor || 'Unknown color'}</div>
            {showBirth && (
              <div className="whitespace-nowrap text-[9px] text-stone-300/80 font-normal mt-0.5">
               Under: {coatInfo.birth}
              </div>
            )}
          </div>
        )}

        {/* Foal badge */}
        {isFoal && (
          <div className="absolute top-2 right-2 bg-amber-500/90 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow">
           🍼 Foal
          </div>
        )}
      </div>

      {/* Legend */}
      {genotype && showGenotype && (
        <div className="w-full max-w-xs">
          <div className="flex gap-3 flex-wrap justify-center">
            <span className="flex items-center gap-1 text-xs text-stone-400">
             <span className="w-2.5 h-2.5 rounded-full bg-amber-200 border border-amber-400 inline-block" />
             Visible gene
            </span>
            <span className="flex items-center gap-1 text-xs text-stone-400">
             <span className="w-2.5 h-2.5 rounded-full bg-stone-100 border border-stone-300 inline-block" />
             Recessive
            </span>
          </div>
        </div>
      )}
    </div>
  );
}