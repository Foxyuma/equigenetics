import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe, Dna, ClipboardList } from 'lucide-react';

const VACCINE_LABELS = {
  influenza: 'Grippe équine',
  tetanus: 'Tétanos',
  rhinopneumonie: 'Rhinopneumonie',
};

const TEST_TYPE_LABELS = {
  health_panel: 'Panel santé',
  coat_test: 'Test couleur',
  full_test: 'Test complet',
};

export default function VetHistoryPanel({ horseId }) {
  const { data: healthRecord } = useQuery({
    queryKey: ['health-record', horseId],
    queryFn: () => base44.entities.HealthRecord.filter({ horse_id: horseId }).then(r => r[0]),
    enabled: !!horseId,
  });

  const { data: geneticTests = [] } = useQuery({
    queryKey: ['genetic-tests', horseId],
    queryFn: () => base44.entities.GeneticTest.filter({ horse_id: horseId }, '-created_date', 50),
    enabled: !!horseId,
  });

  const vaccinations = healthRecord?.vaccination_status || {};
  const hasVaccinations = Object.values(vaccinations).some(v => v);
  const hasTests = geneticTests.length > 0;

  if (!hasVaccinations && !hasTests) {
    return (
      <div className="text-center py-8 text-stone-400">
        <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Aucun soin vétérinaire enregistré</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasVaccinations && (
        <Card className="border-0 bg-white/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Syringe className="w-4 h-4 text-teal-600" />
              Vaccinations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(vaccinations).filter(([, date]) => date).map(([key, date]) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0">
                <span className="text-sm text-stone-700 font-medium">{VACCINE_LABELS[key] || key}</span>
                <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50 text-xs">
                  {new Date(date).toLocaleDateString('fr-FR')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasTests && (
        <Card className="border-0 bg-white/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Dna className="w-4 h-4 text-violet-600" />
              Tests ADN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {geneticTests.map(test => (
              <div key={test.id} className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0">
                <div>
                  <span className="text-sm text-stone-700 font-medium">{TEST_TYPE_LABELS[test.test_type] || test.test_type}</span>
                  <p className="text-xs text-stone-400">{test.cost} ₲</p>
                </div>
                <Badge variant="outline" className="text-violet-700 border-violet-200 bg-violet-50 text-xs">
                  {new Date(test.tested_at || test.created_date).toLocaleDateString('fr-FR')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}