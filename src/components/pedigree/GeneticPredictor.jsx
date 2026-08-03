import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Percent } from 'lucide-react';

// Genetic prediction engine
function predictOffspring(fatherGenotype, motherGenotype) {
  if (!fatherGenotype || !motherGenotype) return null;

  const loci = ["extension", "agouti", "cream", "grey", "tobiano", "roan", "dun", "champagne", "silver"];
  const outcomes = [];

  // Generate all possible combinations (Punnett square logic)
  function getAllelePair(genotype, locus) {
    const g = genotype[locus] || "nn";
    const mappings = {
      extension: { "EE": ["E","E"], "Ee": ["E","e"], "ee": ["e","e"] },
      agouti: { "AA": ["A","A"], "Aa": ["A","a"], "aa": ["a","a"] },
      cream: { "CrCr": ["Cr","Cr"], "Crn": ["Cr","n"], "nn": ["n","n"] },
      grey: { "GG": ["G","G"], "Gg": ["G","g"], "gg": ["g","g"] },
      tobiano: { "TOTO": ["TO","TO"], "TOn": ["TO","n"], "nn": ["n","n"] },
      roan: { "RNn": ["RN","n"], "nn": ["n","n"], "RNRN": ["RN","RN"] },
      dun: { "DD": ["D","D"], "Dd": ["D","d"], "dd": ["d","d"] },
      champagne: { "CHn": ["CH","n"], "nn": ["n","n"], "CHCH": ["CH","CH"] },
      silver: { "ZZ": ["Z","Z"], "Zz": ["Z","z"], "zz": ["z","z"] },
    };
    return mappings[locus]?.[g] || ["n", "n"];
  }

  function combineAlleles(locus, a1, a2) {
    const dominant = { extension: "E", agouti: "A", cream: "Cr", grey: "G", tobiano: "TO", roan: "RN", dun: "D", champagne: "CH", silver: "Z" };
    const d = dominant[locus];
    if (!d) return "nn";
    if (a1 === d && a2 === d) return d + d;
    if ((a1 === d && a2 !== d) || (a1 !== d && a2 === d)) return d + (a2 === d ? a1 : a2);
    return (a1 === "n" ? "n" : a1) + (a2 === "n" ? "n" : a2);
  }

  function determineCoatColor(genotype) {
    if (genotype.grey === "GG" || genotype.grey === "Gg") return "Grey";
    
    const isBlack = genotype.extension !== "ee";
    const hasAgouti = genotype.agouti !== "aa";
    const hasCream = genotype.cream === "Crn";
    const doubleCream = genotype.cream === "CrCr";
    const hasDun = genotype.dun !== "dd";
    const hasChampagne = genotype.champagne === "CHn" || genotype.champagne === "CHCH";
    const hasSilver = genotype.silver !== "zz";
    const hasTobiano = genotype.tobiano !== "nn";
    const hasRoan = genotype.roan === "RNn" || genotype.roan === "RNRN";
    
    let base = "";
    
    if (!isBlack) {
      base = "Chestnut";
      if (hasCream) base = "Palomino";
      if (doubleCream) base = "Cremello";
      if (hasChampagne) base = "Chestnut Champagne";
    } else if (hasAgouti) {
      base = "Bay";
      if (hasCream) base = "Buckskin";
      if (doubleCream) base = "Perlino";
      if (hasChampagne) base = "Amber Champagne";
      if (hasSilver) base = "Bay Silver";
    } else {
      base = "Black";
      if (hasCream) base = "Smoky Black";
      if (doubleCream) base = "Smoky Cream";
      if (hasChampagne) base = "Black Champagne";
      if (hasSilver) base = "Black Silver";
    }
    
    if (hasDun) base += " Dun";
    if (hasTobiano) base += " Tobiano";
    if (hasRoan) base += " Roan";
    
    return base;
  }

  // Generate outcomes for each locus combination
  const generateOutcomes = (locusIndex, currentGenotype) => {
    if (locusIndex >= loci.length) {
      const color = determineCoatColor(currentGenotype);
      const existing = outcomes.find(o => o.color === color);
      if (existing) {
        existing.count++;
      } else {
        outcomes.push({ color, count: 1, genotype: currentGenotype });
      }
      return;
    }

    const locus = loci[locusIndex];
    const fatherAlleles = getAllelePair(fatherGenotype, locus);
    const motherAlleles = getAllelePair(motherGenotype, locus);

    for (let fa of fatherAlleles) {
      for (let ma of motherAlleles) {
        const combined = combineAlleles(locus, fa, ma);
        generateOutcomes(locusIndex + 1, { ...currentGenotype, [locus]: combined });
      }
    }
  };

  generateOutcomes(0, {});

  // Calculate probabilities
  const total = outcomes.reduce((sum, o) => sum + o.count, 0);
  return outcomes.map(o => ({
    ...o,
    probability: (o.count / total) * 100
  })).sort((a, b) => b.probability - a.probability);
}

export default function GeneticPredictor({ father, mother }) {
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    if (father?.genotype && mother?.genotype) {
      const result = predictOffspring(father.genotype, mother.genotype);
      setPredictions(result);
    } else {
      setPredictions(null);
    }
  }, [father, mother]);

  if (!father || !mother) {
    return (
      <Card className="border-0 bg-gradient-to-br from-violet-50 to-purple-50">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-violet-300 mb-3" />
          <p className="text-stone-500">Select a sire and a dam to see predictions</p>
        </CardContent>
      </Card>
    );
  }

  if (!predictions) {
    return (
      <Card className="border-0 bg-white/60">
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-stone-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const topPredictions = predictions.slice(0, 10);
  const othersProbability = predictions.slice(10).reduce((sum, p) => sum + p.probability, 0);

  return (
    <Card className="border-0 bg-gradient-to-br from-violet-50 to-purple-50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          Genetic Predictions
          </CardTitle>
          <p className="text-sm text-stone-500 mt-1">
          Coat color probabilities for {father.name} × {mother.name}
          </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {topPredictions.map((pred, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={`border-0 ${
                  pred.probability > 25 ? 'bg-violet-600 text-white' :
                  pred.probability > 12 ? 'bg-violet-100 text-violet-700' :
                  pred.probability > 6 ? 'bg-purple-100 text-purple-700' :
                  'bg-stone-100 text-stone-600'
                }`}>
                  #{i + 1}
                </Badge>
                <span className="font-medium text-stone-700 text-sm">{pred.color}</span>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="w-3 h-3 text-violet-400" />
                <span className="font-bold text-violet-700">{pred.probability.toFixed(1)}%</span>
              </div>
            </div>
            <Progress value={pred.probability} className="h-2 bg-violet-100" />
          </div>
        ))}
        
        {othersProbability > 0 && (
          <div className="pt-3 border-t border-violet-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Other possible combinations</span>
              <span className="font-semibold text-stone-600">{othersProbability.toFixed(1)}%</span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-violet-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-white/50">
              <p className="text-xs text-stone-500 mb-1">Total combinations</p>
              <p className="text-2xl font-bold text-violet-700">{predictions.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/50">
              <p className="text-xs text-stone-500 mb-1">Most likely outcome</p>
              <p className="text-sm font-semibold text-violet-700">{predictions[0]?.color}</p>
            </div>
          </div>
        </div>

        <div className="pt-3 text-xs text-stone-500 bg-white/50 p-3 rounded-lg">
          <p className="font-medium mb-1">ℹ️ Note on predictions:</p>
          <p>These probabilities are calculated using Mendel's laws based on the parents' genotypes. Actual results may vary slightly due to the complexity of genetic interactions.</p>
        </div>
      </CardContent>
    </Card>
  );
}