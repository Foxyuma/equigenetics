import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Award, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

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

const APPROVAL_THRESHOLDS = {
  elite_approved: 85,
  approved_for_sport_breeding: 70,
  approved_for_breeding: 55,
  rejected: 0
};

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

  const performInspectionMutation = useMutation({
    mutationFn: async (stallion) => {
      const criteria = INSPECTION_CRITERIA[stallion.breed];
      if (!criteria) throw new Error('Race non inspectable');

      // Calculate score based on stats and race-specific weights
      let statScore = 0;
      if (stallion.stats) {
        Object.entries(criteria.statWeights).forEach(([stat, weight]) => {
          statScore += (stallion.stats[stat] || 50) * weight;
        });
        statScore = statScore / Object.values(criteria.statWeights).reduce((a, b) => a + b, 0);
      } else {
        statScore = 50;
      }

      // Add genetic health bonus
      const hasHealthGenes = stallion.health_genes?.some(h => h.status !== 'clear') ? -5 : 5;
      const baseScore = statScore + hasHealthGenes;

      // Random variation
      const finalScore = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 20));

      // Determine approval status
      let approvalStatus = 'rejected';
      if (finalScore >= APPROVAL_THRESHOLDS.elite_approved) {
        approvalStatus = 'elite_approved';
      } else if (finalScore >= APPROVAL_THRESHOLDS.approved_for_sport_breeding) {
        approvalStatus = 'approved_for_sport_breeding';
      } else if (finalScore >= APPROVAL_THRESHOLDS.approved_for_breeding) {
        approvalStatus = 'approved_for_breeding';
      }

      // Update horse with approval status
      await base44.entities.Horse.update(stallion.id, {
        breeding_approval_status: approvalStatus,
        breeding_approval_breed: stallion.breed,
        breeding_approval_date: new Date().toISOString().split('T')[0],
      });

      // Record in transaction/notification
      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: 0,
        balance_after: currentUser.genesis_balance || 0,
        reason: `Stallion Inspection - ${stallion.name} (${approvalStatus})`,
      });

      return { stallion, score: finalScore, status: approvalStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      setInspectionResults(data);
      const statusLabel = {
        elite_approved: '⭐ Elite Approved',
        approved: '✅ Approved',
        approved_with_restrictions: '⚠️ Approved with Restrictions',
        not_approved: '❌ Not Approved'
      };
      toast.success(`${data.stallion.name}: ${statusLabel[data.status]} (${Math.round(data.score)}/100)`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (inspectionResults) {
    const { stallion, score, status } = inspectionResults;
    const criteria = INSPECTION_CRITERIA[stallion.breed];
    const statusConfig = {
      elite_approved: { color: 'bg-yellow-50 border-yellow-300', text: 'text-yellow-800', icon: '⭐', label: 'Elite Approved' },
      approved_for_sport_breeding: { color: 'bg-green-50 border-green-300', text: 'text-green-800', icon: '✅', label: 'Approved for Sport Breeding' },
      approved_for_breeding: { color: 'bg-blue-50 border-blue-300', text: 'text-blue-800', icon: '📋', label: 'Approved for Breeding' },
      rejected: { color: 'bg-red-50 border-red-300', text: 'text-red-800', icon: '❌', label: 'Rejected' }
    };
    const config = statusConfig[status];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className={`border-2 ${config.color}`}>
          <CardHeader>
            <CardTitle className={`text-2xl flex items-center gap-2 ${config.text}`}>
              <span>{config.icon}</span>
              {stallion.name} - {config.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-stone-800">{Math.round(score)}</p>
                <p className="text-xs text-stone-500">Score Final</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-stone-700">{stallion.breed}</p>
                <p className="text-xs text-stone-500">Race</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-stone-700">{stallion.age}y</p>
                <p className="text-xs text-stone-500">Âge</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/50 border border-stone-200">
              <h4 className="font-semibold text-stone-700 mb-2">Critères d'évaluation</h4>
              <div className="space-y-2">
                {criteria.criteria.map(c => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-700">{c.name}</p>
                      <p className="text-xs text-stone-500">{c.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{Math.round(c.weight * 100)}%</Badge>
                  </div>
                ))}
              </div>
            </div>

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