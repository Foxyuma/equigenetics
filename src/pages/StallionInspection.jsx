import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Award, Zap, TrendingUp, Gift, Frown } from 'lucide-react';
import { toast } from 'sonner';
import { calculateInspectionScore, getApprovalStatus, getScoreColor, SCORING_CRITERIA, GENETIC_BONUSES } from '../components/breeding/InspectionScoring';

const INSPECTION_CRITERIA = {
  'Arabian': {
    label: 'Arabian Inspection',
    icon: '🐎',
    minAge: 3,
    criteria: [
      { name: 'Type racial', weight: 0.2, description: 'Conformité au type arabe' },
      { name: 'Conformation', weight: 0.2, description: 'Structure osseuse et musculaire' },
      { name: 'Locomotion', weight: 0.2, description: 'Qualité des allures' },
      { name: 'Élégance', weight: 0.2, description: 'Élégance générale' },
      { name: 'Profil de tête', weight: 0.2, description: 'Profil distinctif arabe' }
    ],
    statWeights: { agility: 0.1, temperament: 0.2, strength: 0.2, dressage: 0.3, endurance: 0.2 }
  },
  'Pur-Sang Anglais': {
    label: 'Thoroughbred Approval',
    icon: '🏇',
    minAge: 4,
    criteria: [
      { name: 'Modèle', weight: 0.2, description: 'Structure de coureur' },
      { name: 'Locomotion', weight: 0.25, description: 'Efficacité des foulées' },
      { name: 'Aptitude course', weight: 0.25, description: 'Potentiel athlétique' },
      { name: 'Lignée/Pedigree', weight: 0.15, description: 'Qualité des ascendants' },
      { name: 'Conformité studbook', weight: 0.15, description: 'Registre et authenticité' }
    ],
    statWeights: { speed: 0.3, endurance: 0.3, strength: 0.2, agility: 0.2 }
  },
  'Selle Français': {
    label: 'Selle Français Evaluation',
    icon: '🏆',
    minAge: 3,
    criteria: [
      { name: 'Allures', weight: 0.2, description: 'Qualité des trois allures' },
      { name: 'Aptitude saut', weight: 0.25, description: 'Potentiel de sauteur' },
      { name: 'Modèle', weight: 0.2, description: 'Proportions sportives' },
      { name: 'Comportement', weight: 0.15, description: 'Tempérament et docilité' },
      { name: 'Potentiel sport', weight: 0.2, description: 'Capacité compétitive' }
    ],
    statWeights: { jumping: 0.25, agility: 0.2, temperament: 0.2, dressage: 0.2, speed: 0.15 }
  },
  'KWPN': {
    label: 'KWPN Licensing',
    icon: '🇳🇱',
    minAge: 3,
    criteria: [
      { name: 'Allures', weight: 0.2, description: 'Élasticité et régularité' },
      { name: 'Aptitude saut', weight: 0.25, description: 'Technique de saut' },
      { name: 'Modèle', weight: 0.2, description: 'Type sportif' },
      { name: 'Comportement', weight: 0.15, description: 'Fiabilité mentale' },
      { name: 'Potentiel sport', weight: 0.2, description: 'Capacité sportive' }
    ],
    statWeights: { jumping: 0.25, agility: 0.2, temperament: 0.2, dressage: 0.2, speed: 0.15 }
  },
  'Frison': {
    label: 'Frison Inspection',
    icon: '⚫',
    minAge: 3,
    criteria: [
      { name: 'Type racial', weight: 0.2, description: 'Pureté du type frison' },
      { name: 'Allures', weight: 0.2, description: 'Élévation et cadence' },
      { name: 'Port d\'encolure', weight: 0.2, description: 'Port distinctif' },
      { name: 'Modèle', weight: 0.2, description: 'Proportions frisonnes' },
      { name: 'Pureté du type', weight: 0.2, description: 'Conformité au standard' }
    ],
    statWeights: { dressage: 0.3, agility: 0.2, temperament: 0.25, strength: 0.25 }
  },
  'Holsteiner': {
    label: 'Holsteiner Inspection',
    icon: '🐴',
    minAge: 3,
    criteria: [
      { name: 'Allures', weight: 0.2, description: 'Qualité des mouvements' },
      { name: 'Aptitude saut', weight: 0.25, description: 'Capacité de saut' },
      { name: 'Modèle', weight: 0.2, description: 'Type sportif' },
      { name: 'Conformation', weight: 0.2, description: 'Structure solide' },
      { name: 'Tempérament', weight: 0.15, description: 'Caractère stable' }
    ],
    statWeights: { jumping: 0.3, agility: 0.2, strength: 0.2, temperament: 0.2, speed: 0.1 }
  }
};

// Thresholds moved to InspectionScoring component

export default function StallionInspection() {
  const [selectedStallion, setSelectedStallion] = useState(null);
  const [inspectionResults, setInspectionResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.list('-created_date', 200),
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['health-records'],
    queryFn: () => base44.entities.HealthRecord.list('-created_date', 200),
  });

  const { data: geneticTests = [] } = useQuery({
    queryKey: ['genetic-tests'],
    queryFn: () => base44.entities.GeneticTest.list('-created_date', 500),
  });

  // Filter eligible stallions
  const eligibleStallions = horses.filter(h => {
    if (h.sex !== 'male') return false;
    if (!INSPECTION_CRITERIA[h.breed]) return false;
    if (h.breed === 'OC') return false;
    const minAge = INSPECTION_CRITERIA[h.breed].minAge;
    if ((h.age || 0) < minAge) return false;
    const healthRecord = healthRecords.find(r => r.horse_id === h.id);
    if (healthRecord?.current_illness) return false;
    return true;
  });

  // Check if stallion has full genetic test
  const hasFullGeneticTest = (stallionId) => {
    return geneticTests.some(test => test.horse_id === stallionId && test.test_type === 'full_test');
  };

  const performInspectionMutation = useMutation({
    mutationFn: async (stallion) => {
      const criteria = INSPECTION_CRITERIA[stallion.breed];
      if (!criteria) throw new Error('Race non inspectable');

      // Vérifier test ADN complet obligatoire
      if (!hasFullGeneticTest(stallion.id)) {
        throw new Error('Test ADN complet obligatoire avant inspection. Veuillez effectuer le test à la clinique vétérinaire.');
      }

      // Facturer les radios vétérinaires (200 genesis pour première inspection, 150 pour réinspection)
      const isReInspection = stallion.breeding_approval_status && stallion.breeding_approval_status !== 'not_evaluated';
      const vetRadioCost = isReInspection ? 150 : 200;
      const balance = currentUser?.genesis_balance || 0;
      if (balance < vetRadioCost) {
        throw new Error(`Fonds insuffisants. Radios vétérinaires : ${vetRadioCost} ₲`);
      }

      // Débiter les radios
      await base44.auth.updateMe({ genesis_balance: balance - vetRadioCost });
      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: -vetRadioCost,
        balance_after: balance - vetRadioCost,
        reason: `Radios vétérinaires - Inspection ${stallion.name}`,
      });

      // Calculate score using comprehensive scoring system
      const scoreData = calculateInspectionScore(stallion);
      const finalScore = scoreData.total;

      // Determine approval status
      const approvalData = getApprovalStatus(finalScore);
      const approvalStatus = approvalData.status;

      // Update horse with approval status
      await base44.entities.Horse.update(stallion.id, {
        breeding_approval_status: approvalStatus,
        breeding_approval_breed: stallion.breed,
        breeding_approval_date: new Date().toISOString().split('T')[0],
      });

      // Record inspection transaction
      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: 0,
        balance_after: balance - vetRadioCost,
        reason: `Inspection - ${stallion.name} (${approvalStatus})`,
      });

      return { stallion, score: finalScore, status: approvalStatus, scoreData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      setInspectionResults(data);
      const approvalData = getApprovalStatus(data.score);
      toast.success(`${data.stallion.name}: ${approvalData.icon} ${approvalData.label} (${Math.round(data.score)}/100)`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (inspectionResults) {
    const { stallion, score, status, scoreData } = inspectionResults;
    const criteria = INSPECTION_CRITERIA[stallion.breed];
    const approvalData = getApprovalStatus(score);
    const colorGradient = getScoreColor(score);
    const statusConfig = {
      elite: { color: 'bg-yellow-50 border-yellow-300', text: 'text-yellow-800' },
      provisional: { color: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800' },
      approved: { color: 'bg-blue-50 border-blue-300', text: 'text-blue-800' },
      approved_restricted: { color: 'bg-orange-50 border-orange-300', text: 'text-orange-800' },
      not_approved: { color: 'bg-red-50 border-red-300', text: 'text-red-800' }
    };
    const config = statusConfig[status];

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className={`border-2 ${config.color}`}>
          <CardHeader>
            <CardTitle className={`text-2xl flex items-center gap-2 ${config.text}`}>
              <span>{approvalData.icon}</span>
              {stallion.name} - {approvalData.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score visuel */}
            <div className={`bg-gradient-to-r ${colorGradient} rounded-xl p-6 text-white`}>
              <div className="text-center">
                <p className="text-5xl font-bold mb-2">{Math.round(score)}</p>
                <p className="text-lg opacity-90">Score d'approbation</p>
              </div>
            </div>

            {/* Infos chevaux */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-lg font-bold text-stone-800">{stallion.breed}</p>
                <p className="text-xs text-stone-500">Race</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-lg font-bold text-stone-800">{stallion.age}y</p>
                <p className="text-xs text-stone-500">Âge</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-lg font-bold text-stone-800">
                  {Math.round(Object.values(stallion.stats || {}).reduce((a, b) => a + b, 0) / Object.keys(stallion.stats || {}).length)}
                </p>
                <p className="text-xs text-stone-500">Moy. Stats</p>
              </div>
            </div>

            {/* Breakdown du score */}
            <div className="p-4 rounded-lg bg-stone-50 border border-stone-200">
              <h4 className="font-semibold text-stone-700 mb-3">Détail du scoring (/100)</h4>
              <div className="space-y-2">
                {scoreData && Object.entries(scoreData.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-white rounded-full h-2 border border-stone-300 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-full" style={{width: `${(value / 20) * 100}%`}}></div>
                      </div>
                      <span className="font-bold text-stone-800 w-6 text-right">{value}/20</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bonus et pénalités */}
            {scoreData && (scoreData.bonuses.length > 0 || scoreData.penalties.length > 0) && (
              <div className="space-y-2">
                {scoreData.bonuses.length > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                      <Gift className="w-4 h-4" /> Bonus génétiques
                    </h5>
                    <ul className="space-y-1 text-sm text-emerald-700">
                      {scoreData.bonuses.map((b, i) => (
                        <li key={i} className="flex items-center gap-2">✓ {b.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {scoreData.penalties.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <h5 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <Frown className="w-4 h-4" /> Pénalités génétiques
                    </h5>
                    <ul className="space-y-1 text-sm text-red-700">
                      {scoreData.penalties.map((p, i) => (
                        <li key={i} className="flex items-center gap-2">✗ {p.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setInspectionResults(null);
                  setSelectedStallion(null);
                }}
                className="flex-1 bg-stone-800 hover:bg-stone-900"
              >
                Inspectez un autre étalon
              </Button>
              <Button
                onClick={() => setSelectedStallion(null)}
                variant="outline"
                className="flex-1"
              >
                Retour à la liste
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedStallion) {
    const criteria = INSPECTION_CRITERIA[selectedStallion.breed];
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => setSelectedStallion(null)}>← Retour</Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <span>{criteria.icon}</span>
              {selectedStallion.name} - {criteria.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-sm font-semibold text-stone-700">Âge</p>
                <p className="text-2xl font-bold text-stone-800">{selectedStallion.age}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-sm font-semibold text-stone-700">Race</p>
                <p className="text-lg font-bold text-stone-800">{selectedStallion.breed}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-sm font-semibold text-stone-700">Statistiques moy.</p>
                <p className="text-2xl font-bold text-stone-800">
                  {Math.round(
                    Object.values(selectedStallion.stats || {}).reduce((a, b) => a + b, 0) /
                    Object.keys(selectedStallion.stats || {}).length
                  )}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Critères d'évaluation</h4>
              <div className="space-y-2">
                {criteria.criteria.map((c, idx) => (
                  <div key={idx} className="flex items-start justify-between p-2 bg-white/50 rounded border border-blue-100">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{c.name}</p>
                      <p className="text-xs text-stone-600">{c.description}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-0">{Math.round(c.weight * 100)}%</Badge>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => performInspectionMutation.mutate(selectedStallion)}
              disabled={performInspectionMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12"
              size="lg"
            >
              <Award className="w-5 h-5 mr-2" />
              Lancer l'inspection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800">Inspection des Étalons</h1>
        <p className="text-stone-500 mt-1">Evaluez et certifiez vos étalons pour les saillies approuvées</p>
      </div>

      <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Conditions de participation
          </h3>
          <ul className="space-y-2 text-sm text-stone-700">
            <li>✓ Étalon (sexe : mâle)</li>
            <li>✓ Âge minimum: selon la race (3-4 ans)</li>
            <li>✓ Race inspectable (Arabian, Thoroughbred, Selle Français, KWPN, Holsteiner, Frison)</li>
            <li>✓ Pas d'enregistrement OC</li>
            <li>✓ Santé correcte (pas de maladie active)</li>
            <li>✓ <strong>Test ADN complet obligatoire</strong> (effectué une seule fois)</li>
            <li>✓ <strong>Radios vétérinaires : 200 ₲</strong></li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-stone-800">Étalons éligibles ({eligibleStallions.length})</h2>
        {eligibleStallions.length === 0 ? (
        <Card className="border-0 bg-stone-50">
        <CardContent className="p-12 text-center">
          <Zap className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400">Aucun étalon éligible pour l'inspection</p>
        </CardContent>
        </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eligibleStallions.map(stallion => {
          const criteria = INSPECTION_CRITERIA[stallion.breed];
          const avgStat = Math.round(
            Object.values(stallion.stats || {}).reduce((a, b) => a + b, 0) /
            Object.keys(stallion.stats || {}).length
          );
          const isApproved = stallion.breeding_approval_status && stallion.breeding_approval_status !== 'not_evaluated' && stallion.breeding_approval_status !== 'rejected';

          return (
            <Card
              key={stallion.id}
              className={`border-2 cursor-pointer transition-all ${
                isApproved
                  ? 'border-green-300 bg-green-50/50'
                  : stallion.breeding_approval_status === 'rejected'
                  ? 'border-red-300 bg-red-50/50'
                  : 'border-stone-200 hover:border-amber-300'
              }`}
                  onClick={() => setSelectedStallion(stallion)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-stone-800">{stallion.name}</p>
                        <p className="text-sm text-stone-500">{stallion.breed}</p>
                      </div>
                      <span className="text-2xl">{criteria.icon}</span>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="outline">{stallion.age}y</Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-0">Moy. {avgStat}</Badge>
                    </div>

                    {stallion.breeding_approval_status && stallion.breeding_approval_status !== 'not_evaluated' && (
                      <div className={`p-2 rounded text-xs font-semibold ${
                        stallion.breeding_approval_status === 'elite_approved'
                          ? 'bg-yellow-100 text-yellow-700'
                          : stallion.breeding_approval_status === 'approved_for_sport_breeding'
                          ? 'bg-green-100 text-green-700'
                          : stallion.breeding_approval_status === 'approved_for_breeding'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {stallion.breeding_approval_status === 'elite_approved' ? '⭐ Elite Approved' : stallion.breeding_approval_status === 'approved_for_sport_breeding' ? '✅ Approved for Sport' : stallion.breeding_approval_status === 'approved_for_breeding' ? '📋 Approved for Breeding' : '❌ Rejected'}
                      </div>
                    )}

                    <Button className="w-full text-sm" size="sm">
                      {stallion.breeding_approval_status && stallion.breeding_approval_status !== 'not_evaluated' ? 'Voir résultats' : 'Inspecter'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}