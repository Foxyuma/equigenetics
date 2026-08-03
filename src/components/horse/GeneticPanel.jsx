import React from 'react';
import { Badge } from "@/components/ui/badge";
import { migrateKit, getKitLabel } from '../genetics/GeneticsEngine';

const locusNames = {
  extension: { name: "Extension (E)", desc: "Black pigment A" },
  agouti: { name: "Agouti (A)", desc: "Black distribution" },
  cream: { name: "Cream (Cr)", desc: "E (MATP)" },
  grey: { name: "Grey (G)", desc: "Greying" },
  kit: { name: "KIT gene", desc: "Tobiano/roan/sabino alleles" },
  dun: { name: "Dun (D)", desc: "D locus" },
  champagne: { name: "Champagne (CH)", desc: "Champagne dilution" },
  silver: { name: "Silver (Z)", desc: "Silver dilution" },
  splash: { name: "Splash (SW)", desc: "Broad splash" },
  overo: { name: "Overo (LWO)", desc: "Frame pattern (2 = lethal)" },
  mushroom: { name: "Mushroom (mu)", desc: "Phaeomelanin dilution" },
};

function isHomozygousDominant(locus, value) {
  const dominant = { extension: "EE", agouti: "AA", cream: "CrCr", grey: "GG", kit: "ToTo", dun: "DD", champagne: "CHCH", silver: "ZZ", mushroom: "MuMu" };
  return value === dominant[locus];
}

function isHeterozygous(locus, value) {
  const hetero = { extension: "Ee", agouti: "Aa", cream: "Crn", grey: "Gg", kit: "Toto", dun: "Dnd1", champagne: "CHn", silver: "Zz", mushroom: "Mumu" };
  return value === hetero[locus];
}

// Improves KIT locus readability
function kitDisplayLabel(val) {
  const label = getKitLabel(val);
  return label ? `${val} (${label})` : val;
}

export default function GeneticPanel({ genotype }) {
  if (!genotype) return <p className="text-stone-400 text-sm italic">Genotype not available</p>;

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