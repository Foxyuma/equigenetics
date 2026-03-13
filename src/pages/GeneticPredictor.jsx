import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calculator, Dna, Palette, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Genetic prediction functions
function predictCoatColors(fatherGenotype, motherGenotype) {
  if (!fatherGenotype || !motherGenotype) return [];

  const results = new Map();

  // Simplified simulation - generate 100 offspring
  for (let i = 0; i < 100; i++) {
    const loci = ["extension", "agouti", "cream", "grey", "tobiano", "roan", "dun", "champagne", "silver"];
    const childGenotype = {};

    loci.forEach(locus => {
      const fatherAlleles = parseGenotype(locus, fatherGenotype[locus]);
      const motherAlleles = parseGenotype(locus, motherGenotype[locus]);
      const a1 = fatherAlleles[Math.floor(Math.random() * 2)];
      const a2 = motherAlleles[Math.floor(Math.random() * 2)];
      childGenotype[locus] = combineAlleles(locus, a1, a2);
    });

    const color = determineCoatColor(childGenotype);
    results.set(color, (results.get(color) || 0) + 1);
  }

  return Array.from(results.entries())
    .map(([color, count]) => ({ color, probability: count }))
    .sort((a, b) => b.probability - a.probability);
}

function parseGenotype(locus, genotypeStr) {
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
  return mappings[locus]?.[genotypeStr] || ["n", "n"];
}

function combineAlleles(locus, a1, a2) {
  const dominant = { extension: "E", agouti: "A", cream: "Cr", grey: "G", tobiano: "TO", roan: "RN", dun: "D", champagne: "CH", silver: "Z" };
  const recessive = { extension: "e", agouti: "a", cream: "n", grey: "g", tobiano: "n", roan: "n", dun: "d", champagne: "n", silver: "z" };
  const d = dominant[locus], r = recessive[locus];
  
  if (a1 === d && a2 === d) return d + d;
  if ((a1 === d && a2 === r) || (a1 === r && a2 === d)) return d + r;
  return r + r;
}

function determineCoatColor(genotype) {
  if (!genotype) return "Inconnu";
  
  if (genotype.grey === "GG" || genotype.grey === "Gg") return "Gris";
  
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
    base = "Alezan";
    if (hasCream) base = "Palomino";
    if (doubleCream) base = "Cremello";
    if (hasChampagne) base = "Alezan Champagne";
  } else if (hasAgouti) {
    base = "Bai";
    if (hasCream) base = "Isabelle";
    if (doubleCream) base = "Perlino";
    if (hasChampagne) base = "Ambre Champagne";
    if (hasSilver) base = "Bai Silver";
  } else {
    base = "Noir";
    if (hasCream) base = "Smoky Black";
    if (doubleCream) base = "Smoky Cream";
    if (hasChampagne) base = "Noir Champagne";
    if (hasSilver) base = "Noir Silver";
  }
  
  if (hasDun) base += " Dun";
  if (hasTobiano) base += " Tobiano";
  if (hasRoan) base += " Roan";
  
  return base;
}

function predictStatRange(fatherStats, motherStats) {
  if (!fatherStats || !motherStats) return {};
  
  const statNames = ["speed", "endurance", "agility", "strength", "temperament", "jumping", "dressage"];
  const predictions = {};
  
  statNames.forEach(stat => {
    const fVal = fatherStats[stat] || 50;
    const mVal = motherStats[stat] || 50;
    const avg = (fVal + mVal) / 2;
    const min = Math.max(5, Math.round(avg - 15));
    const max = Math.min(100, Math.round(avg + 15));
    predictions[stat] = { min, max, avg: Math.round(avg) };
  });
  
  return predictions;
}

function predictDiseaseRisk(fatherHealth, motherHealth) {
  if (!fatherHealth || !motherHealth) return [];
  
  const risks = [];
  const allDiseases = new Set([...fatherHealth.map(h => h.disease), ...motherHealth.map(h => h.disease)]);
  
  allDiseases.forEach(disease => {
    const fatherGene = fatherHealth.find(h => h.disease === disease);
    const motherGene = motherHealth.find(h => h.disease === disease);
    
    const fatherCarrier = fatherGene?.status === "carrier" || fatherGene?.status === "affected";
    const motherCarrier = motherGene?.status === "carrier" || motherGene?.status === "affected";
    
    let affectedRisk = 0;
    let carrierRisk = 0;
    let clearRisk = 0;
    
    if (fatherCarrier && motherCarrier) {
      affectedRisk = 25;
      carrierRisk = 50;
      clearRisk = 25;
    } else if (fatherCarrier || motherCarrier) {
      carrierRisk = 50;
      clearRisk = 50;
    } else {
      clearRisk = 100;
    }
    
    if (affectedRisk > 0 || carrierRisk > 0) {
      risks.push({ disease, affectedRisk, carrierRisk, clearRisk });
    }
  });
  
  return risks;
}

export default function GeneticPredictor() {
  const [fatherId, setFatherId] = useState('');
  const [motherId, setMotherId] = useState('');
  const [predictions, setPredictions] = useState(null);

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 200),
  });

  const males = horses.filter(h => h.sex === 'male');
  const females = horses.filter(h => h.sex === 'female');
  const father = males.find(h => h.id === fatherId);
  const mother = females.find(h => h.id === motherId);

  const runPrediction = () => {
    if (!father || !mother) return;

    const colorPredictions = predictCoatColors(father.genotype, mother.genotype);
    const statPredictions = predictStatRange(father.stats, mother.stats);
    const diseasePredictions = predictDiseaseRisk(father.health_genes, mother.health_genes);

    setPredictions({
      colors: colorPredictions,
      stats: statPredictions,
      diseases: diseasePredictions,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Prédiction Génétique</h1>
        <p className="text-stone-500 mt-1">Calculez les probabilités de traits pour un croisement</p>
      </div>

      {/* Parent Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 bg-white/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">♂</span>
              Étalon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={fatherId} onValueChange={setFatherId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {males.map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} — {h.coat_color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {father && (
              <div className="mt-3 space-y-1">
                <Badge className="bg-stone-100 text-stone-600 border-0 text-xs">{father.coat_color}</Badge>
                {father.health_genes?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {father.health_genes.map(g => (
                      <Badge key={g.disease} className="bg-orange-100 text-orange-700 border-0 text-xs">
                        {g.disease}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs">♀</span>
              Jument
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={motherId} onValueChange={setMotherId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {females.map(h => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} — {h.coat_color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mother && (
              <div className="mt-3 space-y-1">
                <Badge className="bg-stone-100 text-stone-600 border-0 text-xs">{mother.coat_color}</Badge>
                {mother.health_genes?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mother.health_genes.map(g => (
                      <Badge key={g.disease} className="bg-orange-100 text-orange-700 border-0 text-xs">
                        {g.disease}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={runPrediction}
          disabled={!father || !mother}
          size="lg"
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calculer les probabilités
        </Button>
      </div>

      {/* Predictions */}
      {predictions && (
        <div className="space-y-6">
          {/* Coat Colors */}
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-600" />
                Probabilités de robes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {predictions.colors.slice(0, 8).map(({ color, probability }) => (
                <div key={color} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700">{color}</span>
                    <span className="font-bold text-amber-700">{probability}%</span>
                  </div>
                  <Progress value={probability} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Stats Prediction */}
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Prévision des statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(predictions.stats).map(([stat, range]) => (
                <div key={stat} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700 capitalize">{stat}</span>
                    <span className="text-xs text-stone-500">
                      {range.min} - {range.max} (moy: {range.avg})
                    </span>
                  </div>
                  <div className="relative h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                      style={{ left: `${range.min}%`, width: `${range.max - range.min}%` }}
                    />
                    <div
                      className="absolute w-1 h-full bg-blue-600"
                      style={{ left: `${range.avg}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Disease Risks */}
          {predictions.diseases.length > 0 && (
            <Card className="border-0 bg-gradient-to-br from-red-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Risques génétiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictions.diseases.map(({ disease, affectedRisk, carrierRisk, clearRisk }) => (
                  <div key={disease} className="p-3 rounded-lg bg-white/60">
                    <p className="font-semibold text-stone-800 mb-2 text-sm">{disease}</p>
                    <div className="space-y-2">
                      {affectedRisk > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-600">Poulain atteint</span>
                          <span className="font-bold text-red-700">{affectedRisk}%</span>
                        </div>
                      )}
                      {carrierRisk > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-orange-600">Poulain porteur</span>
                          <span className="font-bold text-orange-700">{carrierRisk}%</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-600">Poulain sain</span>
                        <span className="font-bold text-emerald-700">{clearRisk}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Alert className="border-violet-200 bg-violet-50">
            <Dna className="h-4 w-4 text-violet-600" />
            <AlertDescription className="text-sm text-violet-700">
              Ces probabilités sont basées sur les lois de Mendel et une simulation de 100 croisements. 
              Les résultats réels peuvent varier selon la chance génétique de chaque poulain.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}