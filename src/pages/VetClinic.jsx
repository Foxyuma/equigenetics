import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, Heart, AlertTriangle, Pill, Syringe, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
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
  { name: "Anti-douleur", price: 150, icon: "💊" },
  { name: "Antibiotique", price: 200, icon: "💉" },
  { name: "Anti-inflammatoire", price: 120, icon: "🩹" },
  { name: "Antispasmodique", price: 180, icon: "💊" },
  { name: "Antihistaminique", price: 100, icon: "💊" },
  { name: "Bronchodilatateur", price: 250, icon: "🫁" },
  { name: "Cataplasme", price: 80, icon: "🧴" },
  { name: "Crème apaisante", price: 60, icon: "🧴" },
];

const VACCINATIONS = [
  { name: "Grippe", key: "influenza", price: 80, icon: "💉", validityMonths: 6 },
  { name: "Tétanos", key: "tetanus", price: 70, icon: "💉", validityMonths: 12 },
  { name: "Rhinopneumonie", key: "rhinopneumonie", price: 90, icon: "💉", validityMonths: 6 },
];

const conditionConfig = {
  excellent: { label: "Excellent", color: "bg-green-100 text-green-700", icon: CheckCircle },
  good: { label: "Bon", color: "bg-blue-100 text-blue-700", icon: Heart },
  fair: { label: "Moyen", color: "bg-yellow-100 text-yellow-700", icon: Activity },
  poor: { label: "Faible", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  critical: { label: "Critique", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function VetClinic() {
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [treatmentDialog, setTreatmentDialog] = useState(false);
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
      toast.success('Contrôle vétérinaire effectué');
    },
  });

  const treatMutation = useMutation({
    mutationFn: async ({ record, horse }) => {
      const illness = ILLNESSES.find(i => i.name === record.current_illness);
      
      // Update health record
      await base44.entities.HealthRecord.update(record.id, {
        current_illness: null,
        illness_severity: null,
        symptoms: [],
        energy_penalty: 0,
        performance_penalty: 0,
        condition: "good",
        treatment_plan: illness?.treatment.map(t => ({ medication: t, duration_days: illness.duration, administered: true })) || [],
      });

      // Restore horse energy
      const newEnergy = Math.min(100, (horse.energy || 0) + record.energy_penalty);
      await base44.entities.Horse.update(horse.id, { energy: newEnergy });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      setTreatmentDialog(false);
      toast.success('Traitement appliqué avec succès !');
    },
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
      toast.success('Vaccination effectuée');
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
                <p className="text-stone-600">Symptômes: {record.symptoms?.join(', ')}</p>
                <div className="flex gap-3">
                  <span className="text-red-600">-{record.energy_penalty}% énergie</span>
                  <span className="text-orange-600">-{record.performance_penalty}% performance</span>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-200">
                <p className="text-xs font-semibold text-stone-700 mb-1">Traitement requis:</p>
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
                Traiter ({illness?.duration || 0} jours)
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {record?.last_checkup ? (
                <p className="text-xs text-stone-500">
                  Dernier contrôle: {format(new Date(record.last_checkup), 'dd/MM/yyyy')}
                </p>
              ) : (
                <p className="text-xs text-stone-400 italic">Aucun contrôle effectué</p>
              )}
              <Button
                onClick={() => checkupMutation.mutate(horse)}
                variant="outline"
                className="w-full text-sm"
                size="sm"
              >
                <Activity className="w-3 h-3 mr-1" />
                Contrôle vétérinaire (Gratuit)
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
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Clinique Vétérinaire</h1>
        <p className="text-stone-500 mt-1">Soignez vos chevaux et maintenez-les en bonne santé</p>
      </div>

      <SeasonManager compact />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Heart className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-800">{horses.length}</p>
            <p className="text-xs text-blue-600">Chevaux total</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-800">{horses.length - sickHorses.length}</p>
            <p className="text-xs text-green-600">En bonne santé</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-800">{sickHorses.length}</p>
            <p className="text-xs text-red-600">Malades</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-purple-50">
          <CardContent className="p-4 text-center">
            <Syringe className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-800">
              {healthRecords.filter(r => r.vaccination_status).length}
            </p>
            <p className="text-xs text-purple-600">Vaccinés</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="bg-stone-100/80">
          <TabsTrigger value="health">
            <Activity className="w-4 h-4 mr-2" />
            État de Santé
          </TabsTrigger>
          <TabsTrigger value="medications">
            <Pill className="w-4 h-4 mr-2" />
            Médicaments
          </TabsTrigger>
          <TabsTrigger value="vaccinations">
            <Syringe className="w-4 h-4 mr-2" />
            Vaccinations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {horses.length === 0 ? (
              <Card className="border-0 bg-stone-50 col-span-2">
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-400">Aucun cheval dans votre écurie</p>
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
                  <p className="text-xs text-stone-500 italic">Disponible en boutique</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-6">
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
                              {isValid ? 'À jour' : `${vac.price} €`}
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
            <DialogTitle>Traiter {selectedHorse?.name}</DialogTitle>
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
                  <p className="text-sm text-red-600">Durée du traitement: {illness?.duration} jours</p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-700 mb-2">Médicaments requis:</h4>
                  <div className="space-y-2">
                    {illness?.treatment.map(med => {
                      const medication = MEDICATIONS.find(m => m.name === med);
                      return (
                        <div key={med} className="flex items-center justify-between p-2 bg-stone-50 rounded">
                          <span className="text-sm">{medication?.icon} {med}</span>
                          <span className="font-semibold text-stone-700">{medication?.price} €</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-stone-700">Coût total:</span>
                    <span className="text-xl font-bold text-indigo-600">{totalCost} €</span>
                  </div>
                  <Button
                    onClick={() => treatMutation.mutate({ record, horse: selectedHorse })}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Pill className="w-4 h-4 mr-2" />
                    Appliquer le traitement
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