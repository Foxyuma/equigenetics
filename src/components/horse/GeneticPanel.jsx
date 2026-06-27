import React from 'react';
import { Badge } from "@/components/ui/badge";
import { migrateKit, getKitLabel } from '../genetics/GeneticsEngine';

const locusNames = {
  extension: { name: "Extension (E)", desc: "Pigment noir A" },
  agouti: { name: "Agouti (A)", desc: "Distribution du noir" },
  cream: { name: "Crème (Cr)", desc: "E (MATP)" },
  grey: { name: "Gris (G)", desc: "Grisonnement" },
  kit: { name: "Gène KIT", desc: "Allèles tobiano/roan/sabino" },
  dun: { name: "Dun (D)", desc: "Locus D" },
  champagne: { name: "Champagne (CH)", desc: "Dilution champagne" },
  silver: { name: "Silver (Z)", desc: "Dilution silver" },
  splash: { name: "Splash (SW)", desc: "Éclaboussure large" },
  overo: { name: "Overo (LWO)", desc: "Patron frame (2 = létal)" },
  mushroom: { name: "Mushroom (mu)", desc: "Dilution phéomélanine" },
};

function isHomozygousDominant(locus, value) {
  const dominant = { extension: "EE", agouti: "AA", cream: "CrCr", grey: "GG", kit: "ToTo", dun: "DD", champagne: "CHCH", silver: "ZZ", mushroom: "MuMu" };
  return value === dominant[locus];
}

function isHeterozygous(locus, value) {
  const hetero = { extension: "Ee", agouti: "Aa", cream: "Crn", grey: "Gg", kit: "Toto", dun: "Dnd1", champagne: "CHn", silver: "Zz", mushroom: "Mumu" };
  return value === hetero[locus];
}

// Améliore la lisibilité du locus KIT
function kitDisplayLabel(val) {
  const label = getKitLabel(val);
  return label ? `${val} (${label})` : val;
}

export default function GeneticPanel({ genotype }) {
  if (!genotype) return <p className="text-stone-400 text-sm italic">Génotype non disponible</p>;

  // Filtrer les anciens locus pie obsolètes (tobiano/roan/sabino déplacés dans kit)
  const OBSOLETE = ['tobiano', 'roan', 'sabino'];
  return (
    <div className="space-y-2">
      {Object.entries(genotype).filter(([l]) => !OBSOLETE.includes(l)).map(([locus, value]) => {
        const info = locusNames[locus];
        if (!info) return null;
        const isHomoD = isHomozygousDominant(locus, value);
        const isHetero = isHeterozygous(locus, value);
        
        const displayValue = (locus === 'kit') ? kitDisplayLabel(value) : value;
        return (
          <div key={locus} className="flex items-center justify-between py-2 px-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
            <div>
              <span className="text-sm font-medium text-stone-700">{info.name}</span>
              <span className="text-xs text-stone-400 ml-2">{info.desc}</span>
            </div>
            <Badge className={`font-mono text-xs border-0 ${
              isHomoD ? 'bg-emerald-100 text-emerald-700' :
              isHetero ? 'bg-amber-100 text-amber-700' :
              'bg-stone-100 text-stone-500'
            }`}>
              {displayValue}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}