import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Award, Zap, TrendingUp, Gift, Frown, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { calculateInspectionScore, getApprovalStatus, getScoreColor, SCORING_CRITERIA } from '../components/breeding/InspectionScoring';
import { isStallionCompetitionOpen, SEASON_LABELS, getStallionCompetitionName, getNextStallionSeason } from '../lib/competitionCalendar';

const INSPECTION_CRITERIA = {
  'Arabian': {
    label: 'Arabian Inspection',
    icon: '🐎',
    minAge: 3,
    criteria: [
      { name: 'Breed Type', weight: 0.2, description: 'Conformity to Arabian type' },
      { name: 'Conformation', weight: 0.2, description: 'Bone and muscle structure' },
      { name: 'Locomotion', weight: 0.2, description: 'Gait quality' },
      { name: 'Elegance', weight: 0.2, description: 'Overall elegance' },
      { name: 'Head Profile', weight: 0.2, description: 'Distinctive Arabian profile' }
    ],
  },
  'Thoroughbred': {
    label: 'Thoroughbred Approval',
    icon: '🏇',
    minAge: 4,
    criteria: [
      { name: 'Model', weight: 0.2, description: 'Racer structure' },
      { name: 'Locomotion', weight: 0.25, description: 'Stride efficiency' },
      { name: 'Racing Aptitude', weight: 0.25, description: 'Athletic potential' },
      { name: 'Lineage/Pedigree', weight: 0.15, description: 'Quality of ancestors' },
      { name: 'Studbook Compliance', weight: 0.15, description: 'Registry and authenticity' }
    ],
  },
  'Selle Français': {
    label: 'Selle Français Evaluation',
    icon: '🏆',
    minAge: 3,
    criteria: [
      { name: 'Gaits', weight: 0.2, description: 'Quality of all three gaits' },
      { name: 'Jumping Aptitude', weight: 0.25, description: 'Jumping potential' },
      { name: 'Model', weight: 0.2, description: 'Sporting proportions' },
      { name: 'Temperament', weight: 0.15, description: 'Behavior and docility' },
      { name: 'Sport Potential', weight: 0.2, description: 'Competitive ability' }
    ],
  },
  'KWPN': {
    label: 'KWPN Licensing',
    icon: '🇳🇱',
    minAge: 3,
    criteria: [
      { name: 'Gaits', weight: 0.2, description: 'Elasticity and regularity' },
      { name: 'Jumping Aptitude', weight: 0.25, description: 'Jumping technique' },
      { name: 'Model', weight: 0.2, description: 'Sporting type' },
      { name: 'Temperament', weight: 0.15, description: 'Mental reliability' },
      { name: 'Sport Potential', weight: 0.2, description: 'Sporting ability' }
    ],
  },
  'Friesian': {
    label: 'Friesian Inspection',
    icon: '⚫',
    minAge: 3,
    criteria: [
      { name: 'Breed Type', weight: 0.2, description: 'Purity of Friesian type' },
      { name: 'Gaits', weight: 0.2, description: 'Elevation and cadence' },
      { name: 'Neck Carriage', weight: 0.2, description: 'Distinctive neck set' },
      { name: 'Model', weight: 0.2, description: 'Friesian proportions' },
      { name: 'Type Purity', weight: 0.2, description: 'Standard compliance' }
    ],
  },
  'Holsteiner': {
    label: 'Holsteiner Inspection',
    icon: '🐴',
    minAge: 3,
    criteria: [
      { name: 'Gaits', weight: 0.2, description: 'Movement quality' },
      { name: 'Jumping Aptitude', weight: 0.25, description: 'Jumping ability' },
      { name: 'Model', weight: 0.2, description: 'Sporting type' },
      { name: 'Conformation', weight: 0.2, description: 'Solid structure' },
      { name: 'Temperament', weight: 0.15, description: 'Stable character' }
    ],
  },
  'Hanoverian': {
    label: 'Hanoverian Inspection',
    icon: '🐴',
    minAge: 3,
    criteria: [
      { name: 'Gaits', weight: 0.25, description: 'Impulsion and regularity' },
      { name: 'Dressage Aptitude', weight: 0.25, description: 'Dressage potential' },
      { name: 'Model', weight: 0.2, description: 'Noble type' },
      { name: 'Conformation', weight: 0.15, description: 'Harmonious structure' },
      { name: 'Temperament', weight: 0.15, description: 'Balanced character' }
    ],
  },
  'Oldenburg': {
    label: 'Oldenburg Inspection',
    icon: '🐴',
    minAge: 3,
    criteria: [
      { name: 'Gaits', weight: 0.25, description: 'Elasticity and amplitude' },
      { name: 'Jumping Aptitude', weight: 0.2, description: 'Jumping ability' },
      { name: 'Model', weight: 0.2, description: 'Expressive type' },
      { name: 'Conformation', weight: 0.2, description: 'Powerful structure' },
      { name: 'Temperament', weight: 0.15, description: 'Reliable character' }
    ],
  },
  'Belgian Warmblood': {
    label: 'BWP Inspection',
    icon: '🐴',
    minAge: 3,
    criteria: [
      { name: 'Gaits', weight: 0.25, description: 'Gait quality' },
      { name: 'Jumping Aptitude', weight: 0.25, description: 'Jumping technique' },
      { name: 'Model', weight: 0.2, description: 'Sporting type' },
      { name: 'Conformation', weight: 0.15, description: 'Solid structure' },
      { name: 'Sport Potential', weight: 0.15, description: 'Competitive ability' }
    ],
  },
  'Anglo-Arabian': {
    label: 'Anglo-Arabian Inspection',
    icon: '🐎',
    minAge: 3,
    criteria: [
      { name: 'Breed Type', weight: 0.2, description: 'Arabian/TB blend' },
      { name: 'Gaits', weight: 0.2, description: 'Gait quality' },
      { name: 'Eventing Aptitude', weight: 0.25, description: 'Cross country potential' },
      { name: 'Model', weight: 0.2, description: 'Sporting proportions' },
      { name: 'Endurance', weight: 0.15, description: 'Endurance capacity' }
    ],
  },
  'Lipizzaner': {
    label: 'Lipizzaner Inspection',
    icon: '⚪',
    minAge: 3,
    criteria: [
      { name: 'Breed Type', weight: 0.25, description: 'Baroque type purity' },
      { name: 'Gaits', weight: 0.25, description: 'Cadence and elevation' },
      { name: 'Model', weight: 0.2, description: 'Classic proportions' },
      { name: 'Dressage Aptitude', weight: 0.2, description: 'School potential' },
      { name: 'Temperament', weight: 0.1, description: 'Noble character' }
    ],
  },
  'Haflinger': {
    label: 'Haflinger Inspection',
    icon: '🐴',
    minAge: 3,
    criteria: [
      { name: 'Breed Type', weight: 0.25, description: 'Type purity' },
      { name: 'Model', weight: 0.2, description: 'Pony proportions' },
      { name: 'Gaits', weight: 0.2, description: 'Regularity' },
      { name: 'Conformation', weight: 0.2, description: 'Soundness' },
      { name: 'Temperament', weight: 0.15, description: 'Docility' }
    ],
  },
  'Connemara': {
    label: 'Connemara Inspection',
    icon: '🐴',
    minAge: 3,
    criteria: [
      { name: 'Breed Type', weight: 0.2, description: 'Sporting pony type' },
      { name: 'Gaits', weight: 0.2, description: 'Gait quality' },
      { name: 'Jumping Aptitude', weight: 0.25, description: 'Jumping ability' },
      { name: 'Model', weight: 0.2, description: 'Proportions' },
      { name: 'Temperament', weight: 0.15, description: 'Reliable character' }
    ],
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
    queryKey: ['horses', currentUser?.email],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['health-records', currentUser?.email],
    queryFn: () => base44.entities.HealthRecord.filter({ created_by: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser?.email,
  });

  const { data: geneticTests = [] } = useQuery({
    queryKey: ['genetic-tests'],
    queryFn: () => base44.entities.GeneticTest.list('-created_date', 500),
  });

  const { data: clocks = [] } = useQuery({
    queryKey: ['game-clock-stallion'],
    queryFn: () => base44.entities.GameClock.list('-created_date', 1),
  });
  const currentSeason = clocks[0]?.season || 'spring';
  const gameYear = clocks[0]?.year || 1;
  const stallionSeasonOpen = isStallionCompetitionOpen(currentSeason);

  // Filter eligible stallions — minimum age by breed
  const eligibleStallions = horses.filter(h => {
    if (h.sex !== 'male') return false;
    if (!INSPECTION_CRITERIA[h.breed]) return false;
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
      if (!criteria) throw new Error('Breed not inspectable');

      // Check mandatory full DNA test
      if (!hasFullGeneticTest(stallion.id)) {
        throw new Error('Full DNA test required before inspection. Please run the test at the Vet Clinic.');
      }

      // Charge inspection enrollment fee (150 genesis)
      const testingEnrollmentCost = 150;
      const balance = currentUser?.genesis_balance || 0;
      if (balance < testingEnrollmentCost) {
        throw new Error(`Insufficient funds. Inspection enrollment fee: ${testingEnrollmentCost} ₲`);
      }

      // Deduct enrollment fee
      await base44.auth.updateMe({ genesis_balance: balance - testingEnrollmentCost });
      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: -testingEnrollmentCost,
        balance_after: balance - testingEnrollmentCost,
        reason: `Inspection enrollment fee - ${stallion.name}`,
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
        balance_after: balance - testingEnrollmentCost,
        reason: `Inspection - ${stallion.name} (${approvalStatus})`,
      });

      return { stallion, score: finalScore, status: approvalStatus, scoreData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      setInspectionResults(data);
      const approvalData = getApprovalStatus(data.score, data.stallion);
      toast.success(`${data.stallion.name}: ${approvalData.icon} ${approvalData.label} (${Math.round(data.score)}/100)`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (inspectionResults) {
    const { stallion, score, status, scoreData } = inspectionResults;
    const criteria = INSPECTION_CRITERIA[stallion.breed];
    const approvalData = getApprovalStatus(score, stallion);
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
            {/* Visual score */}
            <div className={`bg-gradient-to-r ${colorGradient} rounded-xl p-6 text-white`}>
              <div className="text-center">
                <p className="text-5xl font-bold mb-2">{Math.round(score)}</p>
                <p className="text-lg opacity-90">Approval Score</p>
              </div>
            </div>

            {/* Horse info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-lg font-bold text-stone-800">{stallion.breed}</p>
                <p className="text-xs text-stone-500">Race</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-lg font-bold text-stone-800">{stallion.age}y</p>
                <p className="text-xs text-stone-500">Age</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-lg font-bold text-stone-800">
                  {Math.round(Object.values(stallion.stats || {}).reduce((a, b) => a + b, 0) / Object.keys(stallion.stats || {}).length)}
                </p>
                <p className="text-xs text-stone-500">Avg Stats</p>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="p-4 rounded-lg bg-stone-50 border border-stone-200">
              <h4 className="font-semibold text-stone-700 mb-3">Scoring Breakdown (/100)</h4>
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

            {/* Bonuses and penalties */}
            {scoreData && (scoreData.bonuses.length > 0 || scoreData.penalties.length > 0) && (
              <div className="space-y-2">
                {scoreData.bonuses.length > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                      <Gift className="w-4 h-4" /> Genetic Bonuses
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
                      <Frown className="w-4 h-4" /> Genetic Penalties
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
                Inspect Another Stallion
              </Button>
              <Button
                onClick={() => setSelectedStallion(null)}
                variant="outline"
                className="flex-1"
              >
                Back to List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedStallion) {
    const criteria = INSPECTION_CRITERIA[selectedStallion.breed];
    const hasTest = hasFullGeneticTest(selectedStallion.id);
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => setSelectedStallion(null)}>← Back</Button>

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
                <p className="text-sm font-semibold text-stone-700">Age</p>
                <p className="text-2xl font-bold text-stone-800">{selectedStallion.age}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-sm font-semibold text-stone-700">Breed</p>
                <p className="text-lg font-bold text-stone-800">{selectedStallion.breed}</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 text-center">
                <p className="text-sm font-semibold text-stone-700">Avg Stats</p>
                <p className="text-2xl font-bold text-stone-800">
                  {Math.round(
                    Object.values(selectedStallion.stats || {}).reduce((a, b) => a + b, 0) /
                    Object.keys(selectedStallion.stats || {}).length
                  )}
                </p>
              </div>
            </div>

            {/* Missing DNA test alert */}
            {!hasTest && (
              <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
                <div className="flex items-center gap-2 text-red-700 font-semibold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Mandatory Full DNA Test Missing</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  You must first run a <strong>Full Genetic Profile</strong> at the Genetics Lab before starting the inspection.
                </p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Evaluation Criteria</h4>
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
              disabled={performInspectionMutation.isPending || !hasTest}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 disabled:opacity-50"
              size="lg"
            >
              <Award className="w-5 h-5 mr-2" />
              {hasTest ? "Start Inspection" : 'DNA Test Required'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800">Stallion Inspection</h1>
        <p className="text-stone-500 mt-1">Evaluate and certify your stallions for approved breedings</p>
      </div>

      <Card className={`border-0 bg-gradient-to-r ${stallionSeasonOpen ? 'from-emerald-50 to-green-50' : 'from-amber-50 to-orange-50'}`}>
        <CardContent className="p-6">
          <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Competition Calendar
          </h3>
          {stallionSeasonOpen ? (
            <div className="space-y-2 text-sm text-stone-700">
              <p className="text-emerald-700 font-semibold">
                🏆 {getStallionCompetitionName(currentSeason)} — Year {gameYear}
              </p>
              <p>Current season: <strong>{SEASON_LABELS[currentSeason]}</strong>. Registrations are open!</p>
              <p className="text-xs text-stone-500 mt-2">2 competitions per year: one in autumn, one in winter.</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-stone-700">
              <p className="text-amber-700 font-semibold">
                ⏳ Stallion competitions take place in autumn and winter.
              </p>
              <p>Current season: <strong>{SEASON_LABELS[currentSeason]}</strong>. Come back in autumn for the next competition.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Entry Requirements
          </h3>
          <ul className="space-y-2 text-sm text-stone-700">
            <li>✓ Stallion (male sex)</li>
            <li>✓ Minimum age: by breed (3-4 years)</li>
            <li>✓ Inspectable breed (Arabian, Thoroughbred, Selle Français, KWPN, Holsteiner, Friesian)</li>
            <li>✓ No OC registration</li>
            <li>✓ Healthy (no active illness)</li>
            <li>✓ <strong>Mandatory full DNA test</strong> (performed once)</li>
            <li>✓ <strong>Inspection enrollment fee: 150 ₲</strong></li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-stone-800">Eligible Stallions ({eligibleStallions.length})</h2>
        {eligibleStallions.length === 0 ? (
        <Card className="border-0 bg-stone-50">
        <CardContent className="p-12 text-center">
          <Zap className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400">No eligible stallions for inspection</p>
        </CardContent>
        </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eligibleStallions.map(stallion => {
          // Off-season: stallions shown but inspection disabled
          const criteria = INSPECTION_CRITERIA[stallion.breed];
          const avgStat = Math.round(
            Object.values(stallion.stats || {}).reduce((a, b) => a + b, 0) /
            Object.keys(stallion.stats || {}).length
          );
          const isApproved = stallion.breeding_approval_status && stallion.breeding_approval_status !== 'not_evaluated' && stallion.breeding_approval_status !== 'rejected';
          const hasTest = hasFullGeneticTest(stallion.id);

          return (
            <Card
              key={stallion.id}
              className={`border-2 transition-all ${
                !stallionSeasonOpen ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isApproved
                  ? 'border-green-300 bg-green-50/50'
                  : stallion.breeding_approval_status === 'rejected'
                  ? 'border-red-300 bg-red-50/50'
                  : 'border-stone-200 hover:border-amber-300'
              }`}
                  onClick={() => stallionSeasonOpen && setSelectedStallion(stallion)}
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
                      <Badge variant="outline">{stallion.age} yrs</Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-0">Avg {avgStat}</Badge>
                    </div>

                    {/* DNA test status */}
                    {!hasTest && (
                      <div className="p-2 rounded bg-red-50 border border-red-300 text-xs font-semibold text-red-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Missing DNA Test
                      </div>
                    )}
                    {hasTest && !isApproved && stallion.breeding_approval_status === 'not_evaluated' && (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        DNA Test OK — ready for inspection
                      </div>
                    )}

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

                    <Button className="w-full text-sm" size="sm" disabled={!stallionSeasonOpen}>
                      {stallion.breeding_approval_status && stallion.breeding_approval_status !== 'not_evaluated'
                        ? 'View Results'
                        : stallionSeasonOpen
                        ? 'Inspect'
                        : 'Off-Season'}
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