import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BREEDS, determineCoatColor, generateFoalTraits } from '../genetics/GeneticsEngine';
import { buildHorseImagePrompt, extractMarkingsDescription } from '../../lib/horseImagePrompt';
import { toast } from 'sonner';

// Gènes visibles que le joueur peut choisir (seulement Extension et Agouti)
const VISIBLE_LOCI = [
  {
    key: 'extension',
    label: 'Extension (E locus)',
    desc: 'Détermine si le cheval exprime le noir ou le châtain',
    options: [
      { value: 'EE', label: 'EE — Noir dominant homozygote' },
      { value: 'Ee', label: 'Ee — Noir dominant hétérozygote' },
      { value: 'ee', label: 'ee — Châtain (alezan)' },
    ],
  },
  {
    key: 'agouti',
    label: 'Agouti (A locus)',
    desc: 'Restreint le noir aux extrémités → bai',
    options: [
      { value: 'AA', label: 'AA — Bai homozygote' },
      { value: 'Aa', label: 'Aa — Bai porteur' },
      { value: 'aa', label: 'aa — Pas d\'agouti (noir total si E/_)' },
    ],
  },
];

// Gènes cachés (tirés aléatoirement — grey, cream, tobiano, roan, dun, champagne, silver)
const HIDDEN_LOCI = ['grey', 'cream', 'tobiano', 'roan', 'dun', 'champagne', 'silver'];

const HIDDEN_OPTIONS = {
  grey: ['gg', 'Gg', 'GG'],
  cream: ['nn', 'Crn', 'CrCr'],
  tobiano: ['nn', 'TOn', 'TOTO'],
  roan: ['nn', 'RNn'],
  dun: ['dd', 'Dd', 'DD'],
  champagne: ['nn', 'CHn', 'CHCH'],
  silver: ['zz', 'Zz', 'ZZ'],
};

// Poids de probabilité : la majorité des loci seront à la valeur neutre
function pickRandomHidden() {
  const result = {};
  HIDDEN_LOCI.forEach(l => {
    const opts = HIDDEN_OPTIONS[l];
    // 70% chance valeur neutre (index 0), 30% chance valeur non-neutre
    const roll = Math.random();
    if (roll < 0.70) {
      result[l] = opts[0];
    } else {
      result[l] = opts[1 + Math.floor(Math.random() * (opts.length - 1))];
    }
  });
  return result;
}

function generateBaseStats() {
  const stats = {};
  ['speed', 'endurance', 'agility', 'strength', 'temperament', 'jumping', 'dressage'].forEach(s => {
    stats[s] = Math.round(25 + Math.random() * 35); // 25-60 pour un cheval de départ
  });
  return stats;
}

const STEPS = ['Identité', 'Génétique', 'Confirmation'];

export default function OnboardingWizard({ onComplete }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('');
  const [visibleGenes, setVisibleGenes] = useState({
    extension: 'Ee',
    agouti: 'Aa',
  });

  // Hidden genes stable across renders
  const [hiddenGenes] = useState(() => pickRandomHidden());

  const fullGeno = { ...visibleGenes, ...hiddenGenes };
  const previewColor = determineCoatColor(fullGeno);

  const createMutation = useMutation({
    mutationFn: async () => {
      const genotype = { ...visibleGenes, ...hiddenGenes };
      const coat_color = determineCoatColor(genotype);
      const stats = generateBaseStats();

      // Générer une image poulain via IA
      const markings = extractMarkingsDescription(coat_color, genotype);
      let image_url = null;
      let foal_image_url = null;
      try {
        const prompt = buildHorseImagePrompt({ breed, coat_color, sex, isFoal: true, markings });
        const result = await base44.integrations.Core.GenerateImage({ prompt });
        // Re-upload pour URL permanente
        const response = await fetch(result.url);
        const blob = await response.blob();
        const file = new File([blob], `horse_foal_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        image_url = file_url;
        foal_image_url = file_url;
      } catch (e) {
        // image non bloquante
      }

      const foalTraits = generateFoalTraits(null, null, breed);
      await base44.entities.Horse.create({
        name: name.trim(),
        breed,
        sex,
        age: 0,
        genotype,
        coat_color,
        markings_description: markings,
        foal_image_url,
        stats,
        health_genes: [],
        energy: 100,
        competition_wins: 0,
        is_for_sale: false,
        price: 0,
        character: foalTraits.character,
        mental_traits: foalTraits.mental_traits,
        morphology: foalTraits.morphology,
        genetic_potential: foalTraits.genetic_potential,
        ...(image_url && { image_url }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success(`${name} a rejoint votre écurie ! 🐴`);
      onComplete?.();
    },
  });

  const canNextStep0 = name.trim().length >= 2 && breed && sex;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-500 p-8 text-white">
          <p className="text-amber-100 text-sm font-medium uppercase tracking-widest mb-1">Bienvenue dans EquiGenesis</p>
          <h2 className="text-3xl font-bold">Créez votre premier cheval</h2>
          <p className="text-amber-100 mt-2 text-sm">Définissez son identité et sa génétique visible — quelques gènes resteront mystérieux…</p>
          {/* Steps */}
          <div className="flex gap-2 mt-6">
            {STEPS.map((s, i) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-xs ${i === step ? 'text-white font-semibold' : 'text-amber-200'}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-8">

          {/* STEP 0 — Identité */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-stone-700 block mb-1.5">Nom du cheval</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Sultan, Luna, Eclipse…"
                  className="bg-stone-50 text-lg"
                  maxLength={32}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-stone-700 block mb-1.5">Race</label>
                  <Select value={breed} onValueChange={setBreed}>
                    <SelectTrigger className="bg-stone-50"><SelectValue placeholder="Choisir une race…" /></SelectTrigger>
                    <SelectContent>
                      {BREEDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-stone-700 block mb-1.5">Sexe</label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger className="bg-stone-50"><SelectValue placeholder="Sexe…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">♂ Mâle (Étalon)</SelectItem>
                      <SelectItem value="female">♀ Femelle (Jument)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Génétique */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Robe estimée avec ces gènes :</p>
                  <p className="text-xl font-bold text-stone-800">{previewColor}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    🧬 {Object.keys(hiddenGenes).length} gènes cachés
                  </Badge>
                  <p className="text-xs text-stone-400 mt-1">révélés par test génétique</p>
                </div>
              </div>

              <div className="space-y-4">
                {VISIBLE_LOCI.map(locus => (
                  <div key={locus.key}>
                    <label className="text-sm font-semibold text-stone-700 block mb-0.5">{locus.label}</label>
                    <p className="text-xs text-stone-400 mb-1.5">{locus.desc}</p>
                    <Select
                      value={visibleGenes[locus.key]}
                      onValueChange={val => setVisibleGenes(prev => ({ ...prev, [locus.key]: val }))}
                    >
                      <SelectTrigger className="bg-stone-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locus.options.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Confirmation */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-stone-50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{sex === 'male' ? '🐴' : '🐎'}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-800">{name}</h3>
                    <p className="text-stone-500 text-sm">{breed} — {sex === 'male' ? 'Étalon' : 'Jument'}</p>
                  </div>
                </div>
                <div className="border-t border-stone-200 pt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-stone-400">Robe</span>
                    <p className="font-semibold text-stone-800">{previewColor}</p>
                  </div>
                  <div>
                    <span className="text-stone-400">Gènes visibles</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(visibleGenes).map(([k, v]) => (
                        <Badge key={k} className="bg-blue-100 text-blue-700 border-0 text-xs">{k}: {v}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-400">Gènes cachés ({Object.keys(hiddenGenes).length} loci)</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.keys(hiddenGenes).map(k => (
                        <Badge key={k} className="bg-stone-200 text-stone-500 border-0 text-xs">🔒 {k}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-stone-400 text-center">
                Les gènes cachés seront révélés uniquement par un test génétique en Clinique Vétérinaire.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 gap-3">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}>Retour</Button>
            ) : <div />}
            {step < 2 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && !canNextStep0}
                className="bg-amber-500 hover:bg-amber-600 text-white ml-auto"
              >
                Suivant →
              </Button>
            ) : (
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white ml-auto px-8"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Génération de la robe…
                  </span>
                ) : '🐴 Créer mon cheval'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}