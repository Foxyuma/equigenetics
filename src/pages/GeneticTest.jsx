import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Beaker, Dna, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import GeneticPanel from '../components/horse/GeneticPanel';

const TEST_TYPES = {
  health_panel: {
    label: "Health Panel",
    description: "Détecte les maladies génétiques courantes",
    price: 150,
    icon: "🔬",
    reveals: ["HYPP", "PSSM1", "HERDA", "GBED", "SCID", "LFS"]
  },
  coat_test: {
    label: "Coat & Pattern Test",
    description: "Analyse la génétique de la robe et des motifs",
    price: 120,
    icon: "🎨",
    reveals: ["Génotype complet de couleur", "Motifs cachés"]
  },
  full_test: {
    label: "Full Genetic Profile",
    description: "Test génétique complet : santé + robe + tous les loci",
    price: 300,
    icon: "🧬",
    reveals: ["Tous les gènes détectés", "Génotype complet", "Prédictions de descendance"]
  }
};


export default function GeneticTest() {
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showResults, setShowResults] = useState(null);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: horses = [] } = useQuery({
    queryKey: ['horses-mine'],
    queryFn: () => base44.entities.Horse.filter({ created_by: currentUser?.email }, '-created_date', 100),
    enabled: !!currentUser,
  });

  const { data: testHistory = [] } = useQuery({
    queryKey: ['genetic-tests', selectedHorse?.id],
    queryFn: () => selectedHorse ? base44.entities.GeneticTest.filter({ horse_id: selectedHorse.id }, '-created_date', 50) : Promise.resolve([]),
    enabled: !!selectedHorse,
  });

  const performTestMutation = useMutation({
    mutationFn: async (testType) => {
      if (!currentUser || !selectedHorse) throw new Error('Données manquantes');
      
      const testConfig = TEST_TYPES[testType];
      const balance = currentUser.genesis_balance || 0;
      
      if (balance < testConfig.price) {
        throw new Error(`Fonds insuffisants. Coût : ${testConfig.price} ₲`);
      }

      let results = {};
      
      if (testType === 'health_panel') {
        results.health_genes = selectedHorse.health_genes || [];
      } else if (testType === 'coat_test') {
        results.genotype = selectedHorse.genotype || {};
        results.coat_color = selectedHorse.coat_color;
      } else if (testType === 'full_test') {
        results.genotype = selectedHorse.genotype || {};
        results.coat_color = selectedHorse.coat_color;
        results.health_genes = selectedHorse.health_genes || [];
      }

      // Créer l'enregistrement du test
      const test = await base44.entities.GeneticTest.create({
        horse_id: selectedHorse.id,
        horse_name: selectedHorse.name,
        test_type: testType,
        cost: testConfig.price,
        results,
        tested_at: new Date().toISOString(),
      });

      // Débiter le compte
      await base44.auth.updateMe({
        genesis_balance: balance - testConfig.price,
      });

      // Enregistrer la transaction
      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: -testConfig.price,
        balance_after: balance - testConfig.price,
        reason: `Test ADN ${testConfig.label} - ${selectedHorse.name}`,
      });

      // Notifier le joueur du résultat
      await base44.entities.Message.create({
        sender_email: 'system@equigenesis.fr',
        sender_name: 'EquiGenesis',
        recipient_email: currentUser.email,
        recipient_name: currentUser.full_name || 'Joueur',
        subject: `🧬 Résultat test ADN — ${selectedHorse.name}`,
        content: `Le test **${testConfig.label}** pour **${selectedHorse.name}** est terminé.\n\nConsultez les résultats dans le Laboratoire Génétique → Historique des tests.`,
        is_read: false,
      });

      return test;
    },
    onSuccess: (test) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['genetic-tests', selectedHorse.id] });
      queryClient.invalidateQueries({ queryKey: ['messages-nav'] });
      setShowResults(test);
      toast.success(`Test ${TEST_TYPES[selectedTest].label} terminé ! Résultats disponibles.`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!selectedHorse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-blue-50/30 to-stone-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Genetic Laboratory</h1>
            <p className="text-stone-500">Test your horses to discover their genetic secrets</p>
          </div>

          {horses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-stone-400">You have no horses to test</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {horses.map(horse => (
                <button
                  key={horse.id}
                  onClick={() => setSelectedHorse(horse)}
                  className="text-left p-4 rounded-xl border-2 border-transparent hover:border-blue-300 bg-white shadow hover:shadow-md transition-all"
                >
                  {horse.image_url && (
                    <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-stone-100">
                      <img
                        src={horse.image_url}
                        alt={horse.name}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    </div>
                  )}
                  <p className="font-bold text-stone-800">{horse.name}</p>
                  <p className="text-sm text-stone-500">{horse.breed}</p>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{horse.coat_color}</Badge>
                    <Badge className={`text-xs border-0 ${horse.sex === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {horse.sex === 'male' ? '♂' : '♀'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showResults) {
    const testConfig = TEST_TYPES[showResults.test_type];
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="outline" onClick={() => setShowResults(null)}>← Back</Button>

          <Card className="border-0 bg-gradient-to-br from-emerald-50/60 to-blue-50/60">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <span>{testConfig.icon}</span>
                    {testConfig.label} - {selectedHorse.name}
                  </CardTitle>
                  <p className="text-sm text-stone-500 mt-2">DNA test results</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {showResults.test_type === 'health_panel' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Genetic diseases detected
                  </h3>
                  {showResults.results.health_genes && showResults.results.health_genes.length > 0 ? (
                    <div className="space-y-2">
                      {showResults.results.health_genes.map(gene => (
                        <div
                          key={gene.disease}
                          className={`p-3 rounded-lg border-2 ${
                            gene.status === 'affected'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-orange-50 border-orange-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-stone-800">{gene.disease}</p>
                              <p className={`text-sm ${gene.status === 'affected' ? 'text-red-600' : 'text-orange-600'}`}>
                                {gene.status === 'carrier' ? 'Gene carrier' : 'Gene affected'}
                              </p>
                            </div>
                            <Badge className={`border-0 ${gene.status === 'affected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                              {gene.status === 'carrier' ? 'Carrier' : 'Affected'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-emerald-50 border-2 border-emerald-200 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <p className="text-emerald-700 font-semibold">No genetic diseases detected! ✨</p>
                    </div>
                  )}
                </div>
              )}

              {showResults.test_type === 'coat_test' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-stone-800">Coat genetics</h3>
                  <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                    <p className="text-sm text-stone-500 mb-2">Estimated phenotypic color:</p>
                    <p className="text-lg font-bold text-blue-700">{showResults.results.coat_color}</p>
                  </div>
                  <h4 className="font-semibold text-stone-700 mt-4">Full genotype</h4>
                  <GeneticPanel genotype={showResults.results.genotype} />
                </div>
              )}

              {showResults.test_type === 'full_test' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-4">Full genetic profile</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                        <p className="text-sm text-stone-500 mb-2">Phenotypic color:</p>
                        <p className="text-lg font-bold text-blue-700">{showResults.results.coat_color}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
                        <p className="text-sm text-stone-500 mb-2">Breed :</p>
                        <p className="text-lg font-bold text-purple-700">{selectedHorse.breed}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-stone-700 mb-3">Full genotype</h4>
                    <GeneticPanel genotype={showResults.results.genotype} />
                  </div>

                  {showResults.results.health_genes && showResults.results.health_genes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-stone-700">Health genes</h4>
                      <div className="space-y-2">
                        {showResults.results.health_genes.map(gene => (
                          <Badge key={gene.disease} className={`block text-left py-2 px-3 border-0 ${
                            gene.status === 'affected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {gene.disease}: {gene.status === 'carrier' ? 'Porteur' : 'Atteint'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-stone-200 flex gap-3">
                <Button onClick={() => setShowResults(null)} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button onClick={() => { setShowResults(null); setSelectedHorse(null); }} className="flex-1 bg-stone-800 hover:bg-stone-900">
                  Test another horse
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-blue-50/30 to-stone-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Dna className="w-8 h-8 text-blue-600" />
              Tests ADN pour {selectedHorse.name}
            </h1>
            <p className="text-stone-500">{selectedHorse.breed} · {selectedHorse.coat_color}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedHorse(null)}>← Change horse</Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">
            <strong>Available balance:</strong> {(currentUser?.genesis_balance || 0).toLocaleString('en-GB')} ₲
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TEST_TYPES).map(([testKey, testConfig]) => {
            const alreadyTested = testHistory.some(t => t.test_type === testKey);
            const canAfford = (currentUser?.genesis_balance || 0) >= testConfig.price;

            return (
              <Card
                key={testKey}
                className={`border-2 transition-all cursor-pointer ${
                    selectedTest === testKey
                      ? 'border-blue-400 bg-blue-50/50'
                      : 'border-stone-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedTest(selectedTest === testKey ? null : testKey)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-3xl mb-2">{testConfig.icon}</p>
                      <CardTitle className="text-lg">{testConfig.label}</CardTitle>
                    </div>
                    {alreadyTested && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-stone-600">{testConfig.description}</p>

                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Reveals:</p>
                    <ul className="text-sm space-y-1">
                      {testConfig.reveals.map(reveal => (
                        <li key={reveal} className="flex items-center gap-2 text-stone-700">
                          <span className="text-blue-500">✓</span>
                          {reveal}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 space-y-2 border-t border-stone-200">
                    <p className="text-lg font-bold text-blue-600">{testConfig.price} ₲</p>

                    {selectedTest === testKey && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          performTestMutation.mutate(testKey);
                        }}
                        disabled={!canAfford || performTestMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {!canAfford ? '❌ Insufficient funds' : performTestMutation.isPending ? 'Processing...' : `Order this test`}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {testHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="w-5 h-5" />
                Test history
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testHistory.map(test => (
                    <div
                      key={test.id}
                      className="p-3 rounded-lg border flex items-center justify-between bg-emerald-50 border-emerald-200"
                    >
                      <div>
                        <p className="font-semibold text-stone-800">{TEST_TYPES[test.test_type]?.label}</p>
                        <p className="text-xs text-stone-500">
                          {new Date(test.created_date).toLocaleDateString('en-GB')} · {test.cost} ₲
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowResults(test)}>
                        View results
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}