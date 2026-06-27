import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, Heart, AlertTriangle, Pill, Syringe, CheckCircle, XCircle, TrendingDown, Dna, Beaker } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import SeasonManager from '../components/season/SeasonManager';

const ILLNESSES = [
  { name: "Colique", severity: "severe", symptoms: ["Douleur abdominale", "Refus de manger", "Transpiration"], energyPenalty: 40, performancePenalty: 60, treatment: ["Anti-douleur", "Antispasmodique"], duration: 3 },
  { name: "Grippe équine", severity: "moderate", symptoms: ["Fièvre", "Toux", "Écoulement nasal"], energyPenalty: 30, performancePenalty: 40, treatment: ["Antibiotique", "Repos"], duration: 7 },
  { name: "Fourbure", severity: "severe", symptoms: ["Boiterie", "Chaleur au sabot", "Douleur"], energyPenalty: 50, performancePenalty: 70, treatment: ["Anti-inflammatoire", "Maréchalerie"], duration: 14 },
  { name: "Dermite estivale", severity: "mild", symptoms: ["Démangeaisons", "Plaies", "Irritation"], energyPenalty: 10, performancePenalty: 15, treatment: ["Crème apaisante", "Antihistaminique"], duration: 5 },
  { name: "Abcès de pied", severity: "moderate", symptoms: ["Boiterie sévère", "Chaleur", "Pulsation"], energyPenalty: 35, performancePenalty: 50, treatment: ["Cataplasme", "Anti-inflammatoire"], duration: 10 },
  { name: "Emphysème", severity: "moderate", symptoms: ["Toux chronique", "Difficultés respiratoires"], energyPenalty: 25, performancePenalty: 45, treatment: ["Bronchodilatateur", "Environnement sain"], duration: 30 },
];

const MEDICATIONS = [
  { name: "Anti-douleur", price: 150, icon: "💊", doping_risk: true },
  { name: "Antibiotique", price: 200, icon: "💉", doping_risk: false },
  { name: "Anti-inflammatoire", price: 120, icon: "🩹", doping_risk: true },
  { name: "Antispasmodique", price: 180, icon: "💊", doping_risk: false },
  { name: "Antihistaminique", price: 100, icon: "💊", doping_risk: false },
  { name: "Bronchodilatateur", price: 250, icon: "🫁", doping_risk: true },
  { name: "Cataplasme", price: 80, icon: "🧴", doping_risk: false },
  { name: "Crème apaisante", price: 60, icon: "🧴", doping_risk: false },
];

const VACCINATIONS = [
  { name: "Grippe", key: "influenza", price: 80, icon: "💉", validityMonths: 6 },
  { name: "Tétanos", key: "tetanus", price: 70, icon: "💉", validityMonths: 12 },
  { name: "Rhinopneumonie", key: "rhinopneumonie", price: 90, icon: "💉", validityMonths: 6 },
];

const TEST_TYPES = {
  health_panel: {
    label: "Health Panel",
    description: "Détecte les maladies génétiques courantes",
    price: 150,
    icon: "🔬",
    reveals: ["HYPP", "PSSM1", "HERDA", "GBED", "SCID", "LFS"],
    time: "2-3 jours"
  },
  coat_test: {
    label: "Coat & Pattern Test",
    description: "Analyse la génétique de la robe et des motifs",
    price: 120,
    icon: "🎨",
    reveals: ["Génotype complet de couleur", "Motifs cachés"],
    time: "1-2 jours"
  },
  full_test: {
    label: "Full Genetic Profile",
    description: "Test génétique complet : santé + robe + tous les loci",
    price: 300,
    icon: "🧬",
    reveals: ["Tous les gènes détectés", "Génotype complet", "Prédictions de descendance"],
    time: "5-7 jours"
  }
};

const conditionConfig = {
  excellent: { label: "Excellent", color: "bg-green-100 text-green-700", icon: CheckCircle },
  good: { label: "Good", color: "bg-blue-100 text-blue-700", icon: Heart },
  fair: { label: "Fair", color: "bg-yellow-100 text-yellow-700", icon: Activity },
  poor: { label: "Poor", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  critical: { label: "Critical", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function VetClinic() {
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [treatmentDialog, setTreatmentDialog] = useState(false);
  const [selectedTestHorse, setSelectedTestHorse] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTestResults, setShowTestResults] = useState(null);
  const [bulkTestType, setBulkTestType] = useState('full_test');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses'],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['health-records'],
    queryFn: () => base44.entities.HealthRecord.filter({ created_by: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons-vet'],
    queryFn: () => base44.entities.Season.list('-created_date', 1),
  });

  const { data: testHistory = [] } = useQuery({
    queryKey: ['genetic-tests-vet', selectedTestHorse?.id],
    queryFn: () => selectedTestHorse ? base44.entities.GeneticTest.filter({ horse_id: selectedTestHorse.id }, '-created_date', 50) : Promise.resolve([]),
    enabled: !!selectedTestHorse,
  });

  const { data: allGeneticTests = [] } = useQuery({
    queryKey: ['all-genetic-tests'],
    queryFn: () => base44.entities.GeneticTest.filter({ created_by: currentUser?.email }, '-created_date', 500),
    enabled: !!currentUser,
  });

  const untestedHorses = horses.filter(horse =>
    !allGeneticTests.some(t => t.horse_id === horse.id && t.test_type === bulkTestType)
  );

  const currentSeason = seasons[0];
  const illnessProbability = (currentSeason?.illness_probability || 15) / 100;

  const checkupMutation = useMutation({
    mutationFn: async (horse) => {
      const existingRecord = healthRecords.find(r => r.horse_id === horse.id);
      
      // Random chance of illness based on season
      const hasIllness = !existingRecord?.current_illness && Math.random() < illnessProbability;
      const illness = hasIllness ? ILLNESSES[Math.floor(Math.random() * ILLNESSES.length)] : null;

      const data = {
        horse_id: horse.id,
        horse_name: horse.name,
        condition: illness ? "poor" : "good",
        current_illness: illness?.name || null,
        illness_severity: illness?.severity || null,
        illness_started: illness ? new Date().toISOString() : null,
        symptoms: illness?.symptoms || [],
        energy_penalty: illness?.energyPenalty || 0,
        performance_penalty: illness?.performancePenalty || 0,
        last_checkup: new Date().toISOString(),
      };

      if (existingRecord) {
        return base44.entities.HealthRecord.update(existingRecord.id, data);
      } else {
        return base44.entities.HealthRecord.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      toast.success('Veterinary checkup completed');
    },
  });

  const treatMutation = useMutation({
    mutationFn: async ({ record, horse }) => {
      const illness = ILLNESSES.find(i => i.name === record.current_illness);
      const hasDopingRisk = illness?.treatment.some(t => MEDICATIONS.find(m => m.name === t)?.doping_risk);

      await base44.entities.HealthRecord.update(record.id, {
        current_illness: null,
        illness_severity: null,
        symptoms: [],
        energy_penalty: 0,
        performance_penalty: 0,
        condition: "good",
        treatment_plan: illness?.treatment.map(t => ({ medication: t, duration_days: illness.duration, administered: true })) || [],
      });

      const newEnergy = Math.min(100, (horse.energy || 0) + record.energy_penalty);
      // Mark horse with doping risk flag and treatment date
      await base44.entities.Horse.update(horse.id, {
        energy: newEnergy,
        ...(hasDopingRisk ? { doping_risk_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      setTreatmentDialog(false);
      toast.success('Treatment applied successfully!');
    },
  });

  const bulkTreatMutation = useMutation({
    mutationFn: async () => {
      for (const horse of sickHorses) {
        const record = getHealthRecord(horse.id);
        if (!record) continue;
        const illness = ILLNESSES.find(i => i.name === record.current_illness);
        const hasDopingRisk = illness?.treatment.some(t => MEDICATIONS.find(m => m.name === t)?.doping_risk);

        await base44.entities.HealthRecord.update(record.id, {
          current_illness: null,
          illness_severity: null,
          symptoms: [],
          energy_penalty: 0,
          performance_penalty: 0,
          condition: "good",
          treatment_plan: illness?.treatment.map(t => ({ medication: t, duration_days: illness.duration, administered: true })) || [],
        });

        const newEnergy = Math.min(100, (horse.energy || 0) + (record.energy_penalty || 0));
        await base44.entities.Horse.update(horse.id, {
          energy: newEnergy,
          ...(hasDopingRisk ? { doping_risk_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() } : {}),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success(`${sickHorses.length} horse(s) treated!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const performTestMutation = useMutation({
    mutationFn: async (testType) => {
      if (!currentUser || !selectedTestHorse) throw new Error('Missing data');
      
      const testConfig = TEST_TYPES[testType];
      const balance = currentUser.genesis_balance || 0;
      
      if (balance < testConfig.price) {
        throw new Error(`Insufficient funds. Cost: ${testConfig.price} ₲`);
      }

      let results = {};
      
      if (testType === 'health_panel') {
        results.health_genes = selectedTestHorse.health_genes || [];
      } else if (testType === 'coat_test') {
        results.genotype = selectedTestHorse.genotype || {};
        results.coat_color = selectedTestHorse.coat_color;
      } else if (testType === 'full_test') {
        results.genotype = selectedTestHorse.genotype || {};
        results.coat_color = selectedTestHorse.coat_color;
        results.health_genes = selectedTestHorse.health_genes || [];
      }

      const test = await base44.entities.GeneticTest.create({
        horse_id: selectedTestHorse.id,
        horse_name: selectedTestHorse.name,
        test_type: testType,
        cost: testConfig.price,
        results,
        tested_at: new Date().toISOString(),
      });

      await base44.auth.updateMe({
        genesis_balance: balance - testConfig.price,
      });

      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: -testConfig.price,
        balance_after: balance - testConfig.price,
        reason: `DNA Test ${testConfig.label} - ${selectedTestHorse.name}`,
      });

      return test;
    },
    onSuccess: (test) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['genetic-tests-vet', selectedTestHorse.id] });
      setShowTestResults(test);
      setSelectedTest(null);
      toast.success(`Test ${TEST_TYPES[selectedTest]?.label} in progress!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const testAllHorsesMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || untestedHorses.length === 0)         throw new Error('No untested horses for this type');

      const testConfig = TEST_TYPES[bulkTestType];
      const totalCost = testConfig.price * untestedHorses.length;
      const balance = currentUser.genesis_balance || 0;

      if (balance < totalCost) {
        throw new Error(`Insufficient funds. Total cost: ${totalCost} ₲ (balance: ${balance} ₲)`);
      }

      for (const horse of untestedHorses) {
        let results = {};
        if (bulkTestType === 'health_panel') {
          results.health_genes = horse.health_genes || [];
        } else if (bulkTestType === 'coat_test') {
          results.genotype = horse.genotype || {};
          results.coat_color = horse.coat_color;
        } else if (bulkTestType === 'full_test') {
          results.genotype = horse.genotype || {};
          results.coat_color = horse.coat_color;
          results.health_genes = horse.health_genes || [];
        }

        await base44.entities.GeneticTest.create({
          horse_id: horse.id,
          horse_name: horse.name,
          test_type: bulkTestType,
          cost: testConfig.price,
          results,
          tested_at: new Date().toISOString(),
        });
      }

      await base44.auth.updateMe({
        genesis_balance: balance - totalCost,
      });

      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: -totalCost,
        balance_after: balance - totalCost,
        reason: `DNA Test ${testConfig.label} - ${untestedHorses.length} horses`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['genetic-tests-vet'] });
      queryClient.invalidateQueries({ queryKey: ['all-genetic-tests'] });
      toast.success(`${TEST_TYPES[bulkTestType]?.label} tests ordered for ${untestedHorses.length} horses!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkCheckupMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || horses.length === 0)         throw new Error('No horses to check');

      const today = new Date().toISOString().split('T')[0];
      if (currentUser.last_bulk_checkup_date === today) {
        throw new Error('Bulk checkup already done today');
      }

      for (const horse of horses) {
        const existingRecord = healthRecords.find(r => r.horse_id === horse.id);
        const hasIllness = !existingRecord?.current_illness && Math.random() < illnessProbability;
        const illness = hasIllness ? ILLNESSES[Math.floor(Math.random() * ILLNESSES.length)] : null;

        const data = {
          horse_id: horse.id,
          horse_name: horse.name,
          condition: illness ? "poor" : "good",
          current_illness: illness?.name || null,
          illness_severity: illness?.severity || null,
          illness_started: illness ? new Date().toISOString() : null,
          symptoms: illness?.symptoms || [],
          energy_penalty: illness?.energyPenalty || 0,
          performance_penalty: illness?.performancePenalty || 0,
          last_checkup: new Date().toISOString(),
        };

        if (existingRecord) {
          await base44.entities.HealthRecord.update(existingRecord.id, data);
        } else {
          await base44.entities.HealthRecord.create(data);
        }
      }

      await base44.auth.updateMe({ last_bulk_checkup_date: today });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success(`Veterinary checkup done for ${horses.length} horses!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkVaccinateMutation = useMutation({
    mutationFn: async (vaccine) => {
      const today = new Date().toISOString().split('T')[0];
      for (const horse of horses) {
        const existingRecord = healthRecords.find(r => r.horse_id === horse.id);
        const lastVaccine = existingRecord?.vaccination_status?.[vaccine.key];
        const isValid = lastVaccine &&
          new Date(lastVaccine) > new Date(Date.now() - vaccine.validityMonths * 30 * 24 * 60 * 60 * 1000);
        if (isValid) continue; // skip already up-to-date

        const vaccinations = { ...(existingRecord?.vaccination_status || {}), [vaccine.key]: today };
        if (existingRecord) {
          await base44.entities.HealthRecord.update(existingRecord.id, {
            vaccination_status: vaccinations,
            last_checkup: new Date().toISOString(),
          });
        } else {
          await base44.entities.HealthRecord.create({
            horse_id: horse.id,
            horse_name: horse.name,
            condition: 'good',
            vaccination_status: vaccinations,
            last_checkup: new Date().toISOString(),
          });
        }
      }
    },
    onSuccess: (_, vaccine) => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      toast.success(`${vaccine.name} vaccination done for the whole stable!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const vaccinateMutation = useMutation({
    mutationFn: async ({ horse, vaccine }) => {
      const existingRecord = healthRecords.find(r => r.horse_id === horse.id);
      const vaccinations = existingRecord?.vaccination_status || {};
      vaccinations[vaccine.key] = new Date().toISOString().split('T')[0];

      if (existingRecord) {
        return base44.entities.HealthRecord.update(existingRecord.id, {
          vaccination_status: vaccinations,
          last_checkup: new Date().toISOString(),
        });
      } else {
        return base44.entities.HealthRecord.create({
          horse_id: horse.id,
          horse_name: horse.name,
          condition: "good",
          vaccination_status: vaccinations,
          last_checkup: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      toast.success('Vaccination done');
    },
  });

  const getHealthRecord = (horseId) => healthRecords.find(r => r.horse_id === horseId);
  const sickHorses = horses.filter(h => {
    const record = getHealthRecord(h.id);
    return record?.current_illness;
  });

  const HealthCard = ({ horse }) => {
    const record = getHealthRecord(horse.id);
    const config = conditionConfig[record?.condition || 'good'];
    const Icon = config.icon;
    const illness = ILLNESSES.find(i => i.name === record?.current_illness);

    return (
      <Card className={`border-0 ${record?.current_illness ? 'bg-red-50/50' : 'bg-white/60'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <Link to={`/HorseDetail?id=${horse.id}`} className="font-semibold text-stone-800 hover:text-indigo-600">
                {horse.name}
              </Link>
              <p className="text-xs text-stone-500">{horse.breed}</p>
            </div>
            <Badge className={`${config.color} border-0 flex items-center gap-1`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>

          {record?.current_illness ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-red-700">{record.current_illness}</span>
                <Badge variant="outline" className="text-xs">{record.illness_severity}</Badge>
              </div>
              <div className="text-xs space-y-1">
                <p className="text-stone-600">Symptoms: {record.symptoms?.join(', ')}</p>
                <div className="flex gap-3">
                  <span className="text-red-600">-{record.energy_penalty}% energy</span>
                  <span className="text-orange-600">-{record.performance_penalty}% performance</span>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-200">
                <p className="text-xs font-semibold text-stone-700 mb-1">Required treatment:</p>
                <div className="flex flex-wrap gap-1">
                  {illness?.treatment.map(med => (
                    <Badge key={med} variant="outline" className="text-xs">{med}</Badge>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedHorse(horse);
                  setTreatmentDialog(true);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-sm mt-2"
                size="sm"
              >
                <Pill className="w-3 h-3 mr-1" />
                Treat ({illness?.duration || 0} days)
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {record?.last_checkup ? (
                <p className="text-xs text-stone-500">
                  Last checkup: {format(new Date(record.last_checkup), 'dd/MM/yyyy')}
                </p>
              ) : (
                <p className="text-xs text-stone-400 italic">No checkup done</p>
              )}
              <Button
                onClick={() => checkupMutation.mutate(horse)}
                variant="outline"
                className="w-full text-sm"
                size="sm"
              >
                <Activity className="w-3 h-3 mr-1" />
                Veterinary checkup (Free)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Veterinary Clinic</h1>
        <p className="text-stone-500 mt-1">Care for your horses and keep them healthy</p>
      </div>

      <SeasonManager compact />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Heart className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-800">{horses.length}</p>
            <p className="text-xs text-blue-600">Total horses</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-800">{horses.length - sickHorses.length}</p>
            <p className="text-xs text-green-600">Healthy</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-800">{sickHorses.length}</p>
            <p className="text-xs text-red-600">Sick</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-purple-50">
          <CardContent className="p-4 text-center">
            <Syringe className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-800">
              {healthRecords.filter(r => r.vaccination_status).length}
            </p>
            <p className="text-xs text-purple-600">Vaccinated</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="health">
          <Activity className="w-4 h-4 mr-2" />
          Health Status
          </TabsTrigger>
          <TabsTrigger value="genetic-tests">
          <Dna className="w-4 h-4 mr-2" />
          DNA Tests
          </TabsTrigger>
          <TabsTrigger value="medications">
          <Pill className="w-4 h-4 mr-2" />
          Medications
          </TabsTrigger>
          <TabsTrigger value="vaccinations">
          <Syringe className="w-4 h-4 mr-2" />
          Vaccinations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="genetic-tests" className="mt-6">
          {!selectedTestHorse ? (
            <div className="space-y-6">
              {horses.length > 0 && (
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/60">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Beaker className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-800">Test my untested horses</h3>
                          <p className="text-sm text-stone-500">
                            {untestedHorses.length > 0
                              ? `${untestedHorses.length} horse(s) remaining to test for this type`
                              : 'All your horses have already been tested for this type'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                          value={bulkTestType}
                          onChange={(e) => setBulkTestType(e.target.value)}
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {Object.entries(TEST_TYPES).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label} — {cfg.price} ₲</option>
                          ))}
                        </select>
                        <Button
                          onClick={() => testAllHorsesMutation.mutate()}
                          disabled={testAllHorsesMutation.isPending || untestedHorses.length === 0}
                          className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                        >
                          {testAllHorsesMutation.isPending
                            ? 'In progress...'
                            : untestedHorses.length === 0
                              ? '✓ All tested'
                              : `Test (${untestedHorses.length} — ${TEST_TYPES[bulkTestType].price * untestedHorses.length} ₲)`}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {horses.length === 0 ? (
                <Card className="border-0 bg-stone-50 col-span-3">
                  <CardContent className="p-12 text-center">
                    <Dna className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                    <p className="text-stone-400">No horses to test</p>
                  </CardContent>
                </Card>
              ) : (
                horses.map(horse => (
                  <button
                    key={horse.id}
                    onClick={() => setSelectedTestHorse(horse)}
                    className="text-left p-4 rounded-xl border-2 border-transparent hover:border-blue-300 bg-white shadow hover:shadow-md transition-all"
                  >
                    {horse.image_url && (
                      <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-stone-100">
                        <img src={horse.image_url} alt={horse.name} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = 'none')} />
                      </div>
                    )}
                    <p className="font-bold text-stone-800">{horse.name}</p>
                    <p className="text-sm text-stone-500">{horse.breed}</p>
                  </button>
                ))
              )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <Dna className="w-6 h-6 text-blue-600" />
                    DNA Tests for {selectedTestHorse.name}
                  </h2>
                </div>
                <Button variant="outline" onClick={() => setSelectedTestHorse(null)}>← Change horse</Button>
              </div>

              {showTestResults ? (
                <Card className="border-0 bg-gradient-to-br from-emerald-50/60 to-blue-50/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {TEST_TYPES[showTestResults.test_type]?.icon} {TEST_TYPES[showTestResults.test_type]?.label}
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showTestResults.test_type === 'health_panel' && (
                      <div>
                        <h3 className="font-semibold text-stone-800 mb-3">Genetic diseases detected</h3>
                        {showTestResults.results.health_genes && showTestResults.results.health_genes.length > 0 ? (
                          <div className="space-y-2">
                            {showTestResults.results.health_genes.map(gene => (
                              <Badge key={gene.disease} className={`block text-left py-2 px-3 border-0 ${gene.status === 'affected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                {gene.disease}: {gene.status === 'carrier' ? 'Carrier' : 'Affected'}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                            <p className="text-emerald-700">✨ No disease detected!</p>
                          </div>
                        )}
                      </div>
                    )}
                    <Button onClick={() => { setShowTestResults(null); setSelectedTestHorse(null); }} className="w-full bg-stone-800 hover:bg-stone-900">Test another horse</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(TEST_TYPES).map(([testKey, testConfig]) => {
                    const alreadyTested = testHistory.some(t => t.test_type === testKey);
                    const canAfford = (currentUser?.genesis_balance || 0) >= testConfig.price;

                    return (
                      <Card key={testKey} className={`border-2 transition-all cursor-pointer ${selectedTest === testKey ? 'border-blue-400 bg-blue-50/50' : 'border-stone-200 hover:border-blue-300'}`} onClick={() => setSelectedTest(selectedTest === testKey ? null : testKey)}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-3xl mb-2">{testConfig.icon}</p>
                              <CardTitle className="text-base">{testConfig.label}</CardTitle>
                            </div>
                            {alreadyTested && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-xs text-stone-600">{testConfig.description}</p>
                          <p className="text-sm font-bold text-blue-600">{testConfig.price} ₲</p>
                          {selectedTest === testKey && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                performTestMutation.mutate(testKey);
                              }}
                              disabled={!canAfford || performTestMutation.isPending}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                            >
                              {!canAfford ? '❌ Insufficient funds' : performTestMutation.isPending ? 'In progress...' : 'Order this test'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          {horses.length > 0 && (
            <div className="space-y-3 mb-6">
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-teal-50/60">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-800">Full stable checkup</h3>
                        <p className="text-sm text-stone-500">
                          {currentUser?.last_bulk_checkup_date === new Date().toISOString().split('T')[0]
                            ? "✓ Bulk checkup already done today — come back tomorrow"
                            : `Check health of your ${horses.length} horses in one click (1x/day)`}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => bulkCheckupMutation.mutate()}
                      disabled={bulkCheckupMutation.isPending || currentUser?.last_bulk_checkup_date === new Date().toISOString().split('T')[0]}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                    >
                      {bulkCheckupMutation.isPending ? 'In progress...' : currentUser?.last_bulk_checkup_date === new Date().toISOString().split('T')[0] ? "✓ Done today" : `Check (${horses.length} horses)`}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {sickHorses.length > 0 && (
                <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50/60 to-orange-50/60">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                          <Pill className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-800">Treat all sick horses</h3>
                          <p className="text-sm text-stone-500">{sickHorses.length} horse(s) need treatment</p>
                          {sickHorses.some(h => {
                            const r = getHealthRecord(h.id);
                            const ill = ILLNESSES.find(i => i.name === r?.current_illness);
                            return ill?.treatment.some(t => MEDICATIONS.find(m => m.name === t)?.doping_risk);
                          }) && (
                            <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Some treatments contain doping-risk substances (14-day restriction)
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => bulkTreatMutation.mutate()}
                        disabled={bulkTreatMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                      >
                        {bulkTreatMutation.isPending ? 'In progress...' : `Treat (${sickHorses.length} sick)`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {horses.length === 0 ? (
              <Card className="border-0 bg-stone-50 col-span-2">
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-400">No horses in your stable</p>
                </CardContent>
              </Card>
            ) : (
              horses.map(horse => <HealthCard key={horse.id} horse={horse} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MEDICATIONS.map(med => (
              <Card key={med.name} className="border-0 bg-white/60">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">{med.icon}</div>
                  <h3 className="font-semibold text-stone-800 text-sm mb-1">{med.name}</h3>
                  <p className="text-lg font-bold text-indigo-600 mb-3">{med.price} €</p>
                  <p className="text-xs text-stone-500 italic">Available in Shop</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-6">
          {horses.length > 0 && (
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/60 to-violet-50/60 mb-6">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Syringe className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800">Vaccinate the whole stable</h3>
                      <p className="text-sm text-stone-500">Apply the chosen vaccine to all horses not up to date</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {VACCINATIONS.map(vac => {
                      const needVaccCount = horses.filter(h => {
                        const r = getHealthRecord(h.id);
                        const last = r?.vaccination_status?.[vac.key];
                        return !last || new Date(last) <= new Date(Date.now() - vac.validityMonths * 30 * 24 * 60 * 60 * 1000);
                      }).length;
                      return (
                        <Button
                          key={vac.key}
                          onClick={() => bulkVaccinateMutation.mutate(vac)}
                          disabled={bulkVaccinateMutation.isPending || needVaccCount === 0}
                          size="sm"
                          variant={needVaccCount === 0 ? 'outline' : 'default'}
                          className={needVaccCount > 0 ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                        >
                          <Syringe className="w-3 h-3 mr-1" />
                          {vac.name} {needVaccCount > 0 ? `(${needVaccCount})` : '✓'}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4">
            {horses.map(horse => {
              const record = getHealthRecord(horse.id);
              return (
                <Card key={horse.id} className="border-0 bg-white/60">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{horse.name}</span>
                      <Badge variant="outline">{horse.breed}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {VACCINATIONS.map(vac => {
                        const lastVaccine = record?.vaccination_status?.[vac.key];
                        const isValid = lastVaccine && 
                          new Date(lastVaccine) > new Date(Date.now() - vac.validityMonths * 30 * 24 * 60 * 60 * 1000);
                        
                        return (
                          <div key={vac.key} className={`p-3 rounded-lg border-2 ${isValid ? 'border-green-200 bg-green-50' : 'border-stone-200 bg-stone-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">{vac.name}</span>
                              {isValid ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            {lastVaccine && (
                              <p className="text-xs text-stone-500 mb-2">
                                {format(new Date(lastVaccine), 'dd/MM/yyyy')}
                              </p>
                            )}
                            <Button
                              onClick={() => vaccinateMutation.mutate({ horse, vaccine: vac })}
                              disabled={isValid}
                              className="w-full text-xs"
                              size="sm"
                              variant={isValid ? "outline" : "default"}
                            >
                              <Syringe className="w-3 h-3 mr-1" />
                              {isValid ? 'Up to date' : `${vac.price} €`}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Treatment Dialog */}
      <Dialog open={treatmentDialog} onOpenChange={setTreatmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Treat {selectedHorse?.name}</DialogTitle>
          </DialogHeader>
          {selectedHorse && (() => {
            const record = getHealthRecord(selectedHorse.id);
            const illness = ILLNESSES.find(i => i.name === record?.current_illness);
            const totalCost = illness?.treatment.reduce((sum, med) => {
              const medication = MEDICATIONS.find(m => m.name === med);
              return sum + (medication?.price || 0);
            }, 0) || 0;

            return (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">{record?.current_illness}</h3>
                  <p className="text-sm text-red-600">Treatment duration: {illness?.duration} days</p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-700 mb-2">Required medication:</h4>
                  <div className="space-y-2">
                    {illness?.treatment.map(med => {
                      const medication = MEDICATIONS.find(m => m.name === med);
                      return (
                        <div key={med} className="flex items-center justify-between p-2 bg-stone-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{medication?.icon} {med}</span>
                            {medication?.doping_risk && (
                              <Badge className="bg-orange-100 text-orange-700 border-0 text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />Doping
                              </Badge>
                            )}
                          </div>
                          <span className="font-semibold text-stone-700">{medication?.price} €</span>
                        </div>
                      );
                    })}
                  </div>
                  {illness?.treatment.some(t => MEDICATIONS.find(m => m.name === t)?.doping_risk) && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                      ⚠️ This treatment contains substances detectable during doping controls. Your horse will be restricted from competitions for 14 days.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-stone-700">Total cost:</span>
                    <span className="text-xl font-bold text-indigo-600">{totalCost} €</span>
                  </div>
                  <Button
                    onClick={() => treatMutation.mutate({ record, horse: selectedHorse })}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Pill className="w-4 h-4 mr-2" />
                    Apply treatment
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}