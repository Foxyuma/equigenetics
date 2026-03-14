import React from 'react';

// Color mapping based on genetics
const getBaseColor = (genotype) => {
  if (!genotype) return { body: '#8B4513', mane: '#654321' };

  const isBlack = genotype.extension !== "ee";
  const hasAgouti = genotype.agouti !== "aa";
  const hasCream = genotype.cream === "Crn";
  const doubleCream = genotype.cream === "CrCr";
  const hasChampagne = genotype.champagne === "CHn" || genotype.champagne === "CHCH";
  const hasSilver = genotype.silver !== "zz";

  let bodyColor = '#8B4513';
  let maneColor = '#654321';
  let lightenFactor = 1;

  // Base color determination
  if (!isBlack) {
    // Chestnut base
    bodyColor = '#A0522D';
    maneColor = '#8B4513';
    
    if (hasCream) {
      bodyColor = '#F4C430'; // Palomino
      maneColor = '#FFF8DC';
      lightenFactor = 1.3;
    }
    if (doubleCream) {
      bodyColor = '#FFF5E1'; // Cremello
      maneColor = '#FFFACD';
      lightenFactor = 1.5;
    }
    if (hasChampagne) {
      bodyColor = '#DAA520';
      maneColor = '#F0E68C';
    }
  } else if (hasAgouti) {
    // Bay base
    bodyColor = '#8B4513';
    maneColor = '#2F1F0F';
    
    if (hasCream) {
      bodyColor = '#D2B48C'; // Buckskin
      maneColor = '#654321';
      lightenFactor = 1.2;
    }
    if (doubleCream) {
      bodyColor = '#F5DEB3'; // Perlino
      maneColor = '#DEB887';
      lightenFactor = 1.4;
    }
    if (hasChampagne) {
      bodyColor = '#CD853F';
      maneColor = '#8B4513';
    }
    if (hasSilver) {
      bodyColor = '#A0522D';
      maneColor = '#C0C0C0';
    }
  } else {
    // Black base
    bodyColor = '#2F2F2F';
    maneColor = '#1A1A1A';
    
    if (hasCream) {
      bodyColor = '#4A4A4A'; // Smoky Black
      lightenFactor = 1.1;
    }
    if (doubleCream) {
      bodyColor = '#E8D5C4'; // Smoky Cream
      maneColor = '#C8B5A4';
      lightenFactor = 1.3;
    }
    if (hasChampagne) {
      bodyColor = '#5C5C5C';
      maneColor = '#3C3C3C';
    }
    if (hasSilver) {
      bodyColor = '#2F2F2F';
      maneColor = '#B0B0B0';
    }
  }

  // Grey overrides (progressive greying)
  if (genotype.grey === "GG" || genotype.grey === "Gg") {
    bodyColor = '#D3D3D3';
    maneColor = '#C0C0C0';
  }

  return { body: bodyColor, mane: maneColor, lightenFactor };
};

const getPatternColors = (genotype) => {
  const hasTobiano = genotype?.tobiano !== "nn";
  const hasRoan = genotype?.roan === "RNn" || genotype?.roan === "RNRN";
  const hasDun = genotype?.dun !== "dd";

  return { hasTobiano, hasRoan, hasDun };
};

export default function HorseVisualizer({ genotype, coatColor, size = 300 }) {
  const colors = getBaseColor(genotype);
  const patterns = getPatternColors(genotype);

  // Lighten color for highlights
  const lighten = (color, amount = 0.2) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.floor(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.floor(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.floor(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const darken = (color, amount = 0.2) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) - Math.floor(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.floor(255 * amount));
    const b = Math.max(0, (num & 0xff) - Math.floor(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const bodyColor = colors.body;
  const maneColor = colors.mane;
  const highlightColor = lighten(bodyColor, 0.15 * colors.lightenFactor);
  const shadowColor = darken(bodyColor, 0.15);

  return (
    <div className="relative w-full flex items-center justify-center">
      <svg
        viewBox="0 0 400 300"
        className="w-full h-auto"
        style={{ maxWidth: `${size}px` }}
      >
        <defs>
          {/* Gradients for depth */}
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: highlightColor, stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: bodyColor, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: shadowColor, stopOpacity: 1 }} />
          </linearGradient>

          <radialGradient id="muscleGradient" cx="50%" cy="50%">
            <stop offset="0%" style={{ stopColor: highlightColor, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: bodyColor, stopOpacity: 1 }} />
          </radialGradient>

          {/* Tobiano pattern */}
          {patterns.hasTobiano && (
            <pattern id="tobianoPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill={bodyColor} />
              <circle cx="20" cy="20" r="25" fill="white" opacity="0.9" />
              <circle cx="60" cy="60" r="20" fill="white" opacity="0.9" />
              <ellipse cx="40" cy="70" rx="30" ry="15" fill="white" opacity="0.85" />
            </pattern>
          )}

          {/* Roan pattern */}
          {patterns.hasRoan && (
            <pattern id="roanPattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill={bodyColor} />
              <circle cx="1" cy="1" r="0.5" fill="white" opacity="0.4" />
              <circle cx="3" cy="3" r="0.5" fill="white" opacity="0.4" />
            </pattern>
          )}
        </defs>

        {/* Ground shadow */}
        <ellipse cx="200" cy="280" rx="140" ry="15" fill="black" opacity="0.1" />

        {/* Body */}
        <ellipse 
          cx="200" 
          cy="180" 
          rx="110" 
          ry="75" 
          fill={patterns.hasTobiano ? "url(#tobianoPattern)" : "url(#bodyGradient)"}
        />
        
        {/* Roan overlay */}
        {patterns.hasRoan && (
          <ellipse cx="200" cy="180" rx="110" ry="75" fill="url(#roanPattern)" />
        )}

        {/* Dun stripe */}
        {patterns.hasDun && (
          <line 
            x1="200" 
            y1="120" 
            x2="200" 
            y2="240" 
            stroke={darken(bodyColor, 0.3)} 
            strokeWidth="8"
            opacity="0.6"
          />
        )}

        {/* Neck */}
        <path
          d="M 120 160 Q 90 140 85 100 L 100 95 Q 110 130 130 150 Z"
          fill="url(#muscleGradient)"
        />

        {/* Head */}
        <ellipse cx="75" cy="80" rx="25" ry="35" fill="url(#muscleGradient)" />
        
        {/* Muzzle */}
        <ellipse cx="68" cy="95" rx="15" ry="18" fill={lighten(bodyColor, 0.3)} />
        
        {/* Nostril */}
        <ellipse cx="65" cy="98" rx="3" ry="4" fill="#2F2F2F" />

        {/* Eye */}
        <circle cx="80" cy="72" r="5" fill="#2F2F2F" />
        <circle cx="82" cy="70" r="2" fill="white" />

        {/* Ear */}
        <path
          d="M 75 55 Q 70 45 75 40 Q 80 45 78 55 Z"
          fill={bodyColor}
        />

        {/* Mane */}
        <path
          d="M 85 65 Q 95 70 100 95 Q 95 75 90 70 Q 95 85 95 100 Q 92 80 88 72 Z"
          fill={maneColor}
        />

        {/* Legs - Front Left */}
        <rect x="140" y="240" width="16" height="60" rx="8" fill={bodyColor} />
        <rect x="142" y="290" width="12" height="10" fill="#2F2F2F" />

        {/* Legs - Front Right */}
        <rect x="180" y="240" width="16" height="60" rx="8" fill={shadowColor} />
        <rect x="182" y="290" width="12" height="10" fill="#2F2F2F" />

        {/* Legs - Back Left */}
        <rect x="240" y="240" width="16" height="60" rx="8" fill={bodyColor} />
        <rect x="242" y="290" width="12" height="10" fill="#2F2F2F" />

        {/* Legs - Back Right */}
        <rect x="280" y="240" width="16" height="60" rx="8" fill={shadowColor} />
        <rect x="282" y="290" width="12" height="10" fill="#2F2F2F" />

        {/* Tail */}
        <path
          d="M 300 200 Q 340 210 350 250 Q 335 220 320 215 Q 345 235 355 270 Q 340 240 325 220"
          fill={maneColor}
          opacity="0.9"
        />

        {/* White markings on legs (for tobiano) */}
        {patterns.hasTobiano && (
          <>
            <rect x="140" y="270" width="16" height="30" fill="white" opacity="0.85" />
            <rect x="240" y="270" width="16" height="30" fill="white" opacity="0.85" />
          </>
        )}
      </svg>

      {/* Color label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
        {coatColor || 'Couleur inconnue'}
      </div>
    </div>
  );
}