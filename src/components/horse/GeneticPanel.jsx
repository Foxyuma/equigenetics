import React from 'react';
import { Badge } from "@/components/ui/badge";

const locusNames = {
  extension: { name: "Extension (E)", desc: "Pigment noir" },
  agouti: { name: "Agouti (A)", desc: "Distribution du noir" },
  cream: { name: "Crème (Cr)", desc: "Dilution crème" },
  grey: { name: "Gris (G)", desc: "Grisonnement" },
  tobiano: { name: "Tobiano (TO)", desc: "Patron pie" },
  roan: { name: "Roan (RN)", desc: "Rouannage" },
  dun: { name: "Dun (D)", desc: "Dilution dun" },
  champagne: { name: "Champagne (CH)", desc: "Dilution champagne" },
  silver: { name: "Silver (Z)", desc: "Dilution silver" },
  sabino: { name: "Sabino (Sb)", desc: "Marquage blanc diffus" },
  splash: { name: "Splash (Spl)", desc: "Marquage blanc« éclaboussure »" },
  overo: { name: "Overo (Fr)", desc: "Marquage pie gauche" },
  mushroom: { name: "Mushroom (mu)", desc: "Dilution phéomélanine" },
};

function isHomozygousDominant(locus, value) {
  const dominant = { extension: "EE", agouti: "AA", cream: "CrCr", grey: "GG", tobiano: "TOTO", roan: "RNRN", dun: "DD", champagne: "CHCH",     silver: "ZZ", mushroom: "MuMu" };
  return value === dominant[locus];
}

function isHeterozygous(locus, value) {
  const hetero = { extension: "Ee", agouti: "Aa", cream: "Crn", grey: "Gg", tobiano: "TOn", roan: "RNn", dun: "Dd", champagne: "CHn", silver: "Zz", mushroom: "Mumu" };
  return value === hetero[locus];
}

export default function GeneticPanel({ genotype }) {
  if (!genotype) return <p className="text-stone-400 text-sm italic">Génotype non disponible</p>;

  return (
    <div className="space-y-2">
      {Object.entries(genotype).map(([locus, value]) => {
        const info = locusNames[locus];
        if (!info) return null;
        const isHomoD = isHomozygousDominant(locus, value);
        const isHetero = isHeterozygous(locus, value);
        
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
              {value}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}