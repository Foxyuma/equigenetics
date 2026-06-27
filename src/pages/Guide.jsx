import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Book, Clock, Heart, Dna, TrendingUp, Trophy, Baby, Sparkles, Gift, CheckCircle, ArrowRight, Star, ChevronRight, Info, Zap, Calendar, Award, Activity, ShoppingCart, AlertTriangle, MapPin, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { determineCoatColor, generateFoalTraits } from '../components/genetics/GeneticsEngine';

const STEPS = [
  {
    id: 'intro',
    icon: Star,
    title: 'Bienvenue dans EquiGenesis !',
    description: 'Le guide interactif va te faire découvrir les bases du jeu. À chaque étape, tu gagneras des récompenses !',
    color: 'from-amber-500 to-yellow-500',
    content: `
      Bienvenue, jeune éleveur ! Tu vas découvrir tout ce qu'il faut savoir pour gérer ton haras,
      comprendre la génétique équine, réaliser des croisements, entraîner tes chevaux et les faire concourir.
      
      Ce tutoriel te guidera pas à pas. Termine chaque étape pour débloquer des récompenses :
      points de réputation, argent, objets... et un cheval à la fin !
    `
  },
  {
    id: 'cycle',
    icon: Clock,
    title: 'Le cycle de vie des chevaux',
    description: 'Comprends comment les chevaux naissent, grandissent, et vieillissent.',
    color: 'from-sky-500 to-blue-500',
    content: `
      Dans EquiGenesis, le temps passe en continu. Les chevaux naissent à 0 an (poulains), 
      deviennent adultes à 3-4 ans, et peuvent vivre jusqu'à environ 30 ans selon leur santé génétique.
      
      Le jeu a son propre calendrier : 1 mois de jeu = 14 jours réels, 
      1 année de jeu = 168 jours réels. Chaque jour à 3h30, un tick automatique 
      fait vieillir les chevaux, avance les saisons et traite les concours.
      
      Les saisons (printemps, été, automne, hiver) durent 3 mois de jeu chacune.
      Certains événements et compétitions varient selon la saison.
    `
  },
  {
    id: 'genetics',
    icon: Dna,
    title: 'Les bases de la génétique',
    description: 'Comprends comment fonctionnent les gènes, les robes et l\'hérédité.',
    color: 'from-purple-500 to-violet-500',
    content: `
      Chaque cheval possède un génome complet qui détermine sa robe, ses motifs et sa santé.
      
      Les bases : chaque gène existe en deux copies (allèles), une du père et une de la mère.
      - Homozygote : les deux allèles sont identiques (ex: EE ou ee)
      - Hétérozygote : les deux allèles sont différents (ex: Ee)
      
      Un allèle DOMINANT (majuscule) s'exprime même en un seul exemplaire.
      Un allèle RÉCESSIF (minuscule) ne s'exprime qu'en deux copies.
      
      Couleurs de base :
      • Bai (E_ + A_) — corps brun, crins noirs
      • Alezan (ee) — corps et crins roux
      • Noir (E_ + aa) — corps et crins noirs
      • Gris (G_) — robe qui grisonne avec l'âge
      
      Dilutions : Crème (Palomino, Isabelle), Dun (marques primitives),
      Champagne (reflets dorés), Silver (crins clairs).
      
      Motifs : Tobiano (grandes taches blanches), Sabino (balzanes hautes),
      Roan (poils blancs mélangés), Léopard (taches Appaloosa).
    `
  },
  {
    id: 'reproduction',
    icon: Heart,
    title: 'Les saillies',
    description: 'Comment faire reproduire tes chevaux pour créer la génération suivante.',
    color: 'from-rose-500 to-pink-500',
    content: `
      La reproduction est au cœur du jeu. Voici le processus complet :
      
      1. La jument doit avoir au moins 3 ans
      2. Va dans sa fiche détaillée → onglet "Reproduction"
      3. Choisis un étalon : tes propres mâles (gratuit) ou via le Marché des Saillies (payant)
      4. Simule le croisement pour voir les prévisions génétiques
      5. Confirme la saillie — elle coûte 25 d'énergie à la jument
      6. La naissance a lieu après 11 mois de jeu (158 jours réels)
      
      Le poulain hérite aléatoirement un allèle de chaque parent pour chaque gène 
      (loi de Mendel : 50% du père, 50% de la mère). Les stats sont une moyenne 
      des parents avec une variation aléatoire.
      
      Attention : les étalons doivent être approuvés pour que leurs poulains soient
      inscrits au studbook. Un étalon non approuvé produit un poulain OC 
      (Origines Constatées).
      
      Niveau d'approbation :
      • Élite (×2.5) • Sport (×1.8) • Approuvé (×1.4) • Refusé (×0.7)
    `
  },
  {
    id: 'training',
    icon: TrendingUp,
    title: 'L\'entraînement',
    description: 'Améliore les compétences de tes chevaux pour les préparer aux concours.',
    color: 'from-emerald-500 to-green-500',
    content: `
      L'entraînement permet d'améliorer les 7 compétences : vitesse, endurance, agilité,
      force, tempérament, saut et dressage.
      
      Points clés :
      • Chaque séance consomme de l'énergie physique ET mentale
      • Un cheval fatigué a des performances réduites
      • L'énergie se régénère avec le temps ou avec des objets
      • Les stats ne peuvent PAS dépasser le potentiel génétique maximum
      • Le caractère du cheval influence l'efficacité de l'entraînement
      • Les poulains (<3 ans) ont un entraînement spécial (manipulation, désensibilisation)
    `
  },
  {
    id: 'competitions',
    icon: Trophy,
    title: 'Les concours',
    description: 'Inscris tes chevaux dans des compétitions pour gagner prestige et argent.',
    color: 'from-amber-500 to-orange-500',
    content: `
      Les concours sont la principale source de revenus et de prestige.
      
      Disciplines disponibles :
      • Dressage — dressage + tempérament
      • CSO (Saut d'obstacles) — saut + agilité + vitesse
      • Cross — endurance + saut + vitesse
      • Endurance — endurance +++
      • Barrel Racing — vitesse + agilité
      • Reining — agilité + force
      • Modèles & Allures — beauté et conformation par race
      
      Les gains augmentent avec le niveau de difficulté. Les victoires améliorent
      la réputation de ton élevage ! Inscris-toi depuis l'onglet Concours.
    `
  },
  {
    id: 'economy',
    icon: ShoppingCart,
    title: 'Économie et progression',
    description: 'Gère tes finances, achète et vends des chevaux.',
    color: 'from-yellow-500 to-amber-500',
    content: `
      Le jeu utilise deux monnaies :
      
      • GENESIS (₲) — monnaie principale, gagnée en concours et ventes
      • CREDITS — monnaie premium pour accélérer certaines actions
      
      Où dépenser ?
      • Acheter des chevaux aux enchères (Marché)
      • Payer des saillies au Marché des Saillies
      • Acheter des objets à la Boutique (soins, aliments)
      • Embaucher du personnel (palefreniers, vétérinaires, entraîneurs)
      • Tests génétiques au Labo Génétique
      
      Conseil : commence avec une race polyvalente comme le Selle Français
      ou le KWPN, entraîne-toi, participe à des concours, puis investis
      dans la reproduction pour améliorer ta lignée génération après génération.
    `
  },
  {
    id: 'final',
    icon: Gift,
    title: 'Récompenses !',
    description: 'Félicitations ! Tu as terminé le guide. Reçois tes récompenses.',
    color: 'from-amber-500 to-rose-500',
    content: `
      Tu as parcouru toutes les bases d'EquiGenesis ! Tu connais maintenant :
      ✓ Le cycle de vie des chevaux
      ✓ Les fondamentaux de la génétique
      ✓ Le fonctionnement des saillies
      ✓ L'entraînement et les concours
      ✓ La gestion économique de ton haras
      
      Il est temps de mettre tout ça en pratique. Bonne chance, éleveur !
    `
  }
];

const GIFT_ITEMS = [
  { name: 'Aliment énergétique', icon: '🥩', type: 'food', description: 'Restaure 30 points d\'énergie' },
  { name: 'Baume réparateur', icon: '🧴', type: 'care', description: 'Soigne les blessures légères' },
];

export default function Guide() {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isCollectingGift, setIsCollectingGift] = useState(false);
  const [rewardsCollected, setRewardsCollected] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Check if tutorial already completed
  const { data: tutorialCompleted } = useQuery({
    queryKey: ['tutorial-completed'],
    queryFn: async () => {
      try {
        const val = localStorage.getItem('equigenesis_tutorial_completed');
        return val === 'true';
      } catch { return false; }
    },
  });

  // Bonus reputation et argent par étape
  const stepRewards = [
    { rep: 5, genesis: 50 },     // intro
    { rep: 5, genesis: 100 },    // cycle
    { rep: 10, genesis: 150 },   // genetics
    { rep: 10, genesis: 200 },   // reproduction
    { rep: 5, genesis: 100 },    // training
    { rep: 10, genesis: 250 },   // competitions
    { rep: 5, genesis: 150 },    // economy
  ];

  const completeStep = async (stepIndex) => {
    if (!currentUser || completedSteps.has(stepIndex)) return;
    
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepIndex);
    setCompletedSteps(newCompleted);

    // Grant step reward
    const reward = stepRewards[stepIndex] || { rep: 5, genesis: 50 };
    try {
      const currentRep = currentUser.breeding_reputation ?? 0;
      const currentBal = currentUser.genesis_balance ?? 0;
      await base44.auth.updateMe({
        breeding_reputation: currentRep + reward.rep,
        genesis_balance: currentBal + reward.genesis,
      });
      await base44.entities.Transaction.create({
        user_email: currentUser.email,
        currency: 'genesis',
        amount: reward.genesis,
        balance_after: currentBal + reward.genesis,
        reason: `Guide étape ${stepIndex + 1} - ${STEPS[stepIndex].title}`,
      });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (e) {
      // continue
    }

    // Move to next step
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      // Completed all steps
      setCurrentStep(STEPS.length);
    }
  };

  const collectFinalRewards = async () => {
    if (!currentUser || isCollectingGift || rewardsCollected) return;
    setIsCollectingGift(true);

    try {
      const userEmail = currentUser.email;

      // 1. Reputation bonus
      const currentRep = currentUser.breeding_reputation ?? 0;
      await base44.auth.updateMe({ breeding_reputation: currentRep + 30 });

      // 2. Genesis bonus
      const currentBal = currentUser.genesis_balance ?? 0;
      await base44.auth.updateMe({ genesis_balance: currentBal + 5000 });
      await base44.entities.Transaction.create({
        user_email: userEmail,
        currency: 'genesis',
        amount: 5000,
        balance_after: currentBal + 5000,
        reason: 'Récompense guide du débutant',
      });

      // 3. Gift items (add to Inventory)
      for (const item of GIFT_ITEMS) {
        await base44.entities.Inventory.create({
          item_name: item.name,
          item_icon: item.icon,
          item_type: item.type,
          quantity: 2,
          effect: { description: item.description },
        });
      }

      // 4. Gift horse — 8 years old, random genes, pre-trained in a discipline
      const BREEDS = [
        "Arabian", "Thoroughbred", "Friesian", "Lipizzaner",
        "Anglo-Arabian", "Haflinger", "Connemara",
        "Selle Français", "KWPN", "Hanoverian", "Holsteiner", "Oldenburg", "Belgian Warmblood",
        "Quarter Horse", "Paint Horse", "Appaloosa", "Shire", "Shetland"
      ];
      const breed = BREEDS[Math.floor(Math.random() * BREEDS.length)];
      const femaleNames = ["Luna", "Aurore", "Perle", "Tempête", "Étoile", "Jade", "Iris", "Stella", "Naya", "Olympe", "Diva", "Bella", "Ruby", "Velvet"];
      const maleNames = ["Orion", "Tornado", "Apache", "Spirit", "Shadow", "King", "Thor", "Zeus", "Apache", "Diablo", "Ringo", "Flash", "Storm", "Rocket"];
      const isMale = Math.random() > 0.5;
      const namePool = isMale ? maleNames : femaleNames;
      const name = namePool[Math.floor(Math.random() * namePool.length)];

      // Random genotype — both visible and hidden genes are randomized
      const extOpts = ['EE', 'Ee', 'ee'];
      const agoutiOpts = ['AA', 'Aa', 'aa'];
      const ext = extOpts[Math.floor(Math.random() * extOpts.length)];
      const agouti = agoutiOpts[Math.floor(Math.random() * agoutiOpts.length)];
      const creamOpts = ['nn', 'Crn', 'CrCr'];
      const greyOpts = ['gg', 'Gg', 'GG'];
      const kitOpts = ['toto', 'Toto', 'ToTo', 'Sb1sb1', 'Sb1Sb1', 'Rnrn', 'RnRn'];
      const dunOpts = ['nd2nd2', 'Dnd1', 'Dnd2', 'DD'];
      const champagneOpts = ['nn', 'CHn', 'CHCH'];
      const silverOpts = ['zz', 'Zz', 'ZZ'];
      const leopardOpts = ['lplp', 'Lplp', 'LpLp'];
      const pattern1Opts = ['patn1patn1', 'PATN1patn1', 'PATN1PATN1'];
      const splashOpts = ['nn', 'SplSpl'];

      const geno = {
        extension: ext,
        agouti,
        cream: creamOpts[Math.floor(Math.random() * creamOpts.length)],
        grey: greyOpts[Math.floor(Math.random() * greyOpts.length)],
        kit: kitOpts[Math.floor(Math.random() * kitOpts.length)],
        dun: dunOpts[Math.floor(Math.random() * dunOpts.length)],
        champagne: champagneOpts[Math.floor(Math.random() * champagneOpts.length)],
        silver: silverOpts[Math.floor(Math.random() * silverOpts.length)],
        leopard: leopardOpts[Math.floor(Math.random() * leopardOpts.length)],
        pattern1: pattern1Opts[Math.floor(Math.random() * pattern1Opts.length)],
        sooty: 'soso', flaxen: 'FF', pangare: 'pp', mushroom: 'MuMu',
        splash: splashOpts[Math.floor(Math.random() * splashOpts.length)],
        overo: 'nn', rabicano: 'rbrb',
      };
      const color = determineCoatColor(geno);

      // Stats — already trained in a random discipline (boosted)
      const statNames = ["speed", "endurance", "agility", "strength", "temperament", "jumping", "dressage"];
      const disciplinePrimeStats = {
        speed: ['speed', 'agility'],
        endurance: ['endurance', 'strength'],
        agility: ['agility', 'speed'],
        strength: ['strength', 'endurance'],
        temperament: ['temperament', 'dressage'],
        jumping: ['jumping', 'agility', 'speed'],
        dressage: ['dressage', 'temperament', 'agility'],
      };
      const disciplines = Object.keys(disciplinePrimeStats);
      const trainedDiscipline = disciplines[Math.floor(Math.random() * disciplines.length)];
      const primeStats = disciplinePrimeStats[trainedDiscipline];

      const stats = {};
      statNames.forEach(s => {
        let base = 15 + Math.floor(Math.random() * 15); // 15-29 base
        if (primeStats.includes(s)) base += 20 + Math.floor(Math.random() * 15); // +20-34 training boost
        stats[s] = Math.min(100, base);
      });

      // Generate proper foal traits for genetic potential / character / morphology
      const foalTraits = generateFoalTraits(null, null, breed);
      const characters = ["energique", "anxieux", "intelligent", "paresseux", "courageux", "docile"];

      const horseData = {
        name: name + ' Cadeau',
        breed,
        sex: isMale ? 'male' : 'female',
        age: 8,
        genotype: geno,
        coat_color: color,
        stats,
        genetic_potential: foalTraits.genetic_potential,
        health_genes: [],
        energy: 100,
        mental_energy: 100,
        character: characters[Math.floor(Math.random() * characters.length)],
        mental_traits: foalTraits.mental_traits || [],
        morphology: foalTraits.morphology || [],
        owner_email: userEmail,
        competition_wins: 0,
        is_for_sale: false,
        estimated_value: 30000,
      };

      const created = await base44.entities.Horse.create(horseData);

      // Create a training record to document the discipline training
      await base44.entities.Training.create({
        horse_id: created.id,
        horse_name: created.name,
        training_type: trainedDiscipline,
        stat_trained: trainedDiscipline,
        stats_gained: { [trainedDiscipline]: Math.round(25 + Math.random() * 10) },
        difficulty: 'hard',
        energy_cost: 0,
        mental_energy_cost: 0,
        success: true,
        stat_gain: primeStats.length * 10,
        side_effects: [],
        training_date: new Date().toISOString().split('T')[0],
      });

      setRewardData({
        horse: created,
        genesis: 5000,
        rep: 30,
        items: GIFT_ITEMS.map(i => `${i.name} ×2`),
      });
      setRewardsCollected(true);
      localStorage.setItem('equigenesis_tutorial_completed', 'true');
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('🎉 Tutoriel terminé ! Toutes les récompenses sont à toi !');
    } catch (e) {
      toast.error('Erreur lors de la collecte des récompenses');
    }
    setIsCollectingGift(false);
  };

  if (tutorialCompleted && rewardData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-amber-50 via-rose-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-8 text-center space-y-4">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-stone-800">Guide terminé !</h2>
          <p className="text-stone-500">Tu as déjà reçu tes récompenses. Retrouve ton cheval dans l'écurie.</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate('/Stable')} className="bg-stone-800 hover:bg-stone-900">
              Voir mon écurie
            </Button>
            <Button variant="outline" onClick={() => { localStorage.removeItem('equigenesis_tutorial_completed'); setRewardData(null); setCompletedSteps(new Set()); setCurrentStep(-1); }}>
              Refaire le guide
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Already completed
  if (tutorialCompleted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-8 text-center space-y-4">
          <div className="text-6xl">🎓</div>
          <h2 className="text-2xl font-bold text-stone-800">Tu as déjà terminé le guide !</h2>
          <p className="text-stone-500">Tu peux le refaire pour réviser les bases.</p>
          <Button onClick={() => { localStorage.removeItem('equigenesis_tutorial_completed'); setCompletedSteps(new Set()); setCurrentStep(-1); setRewardData(null); }} className="bg-stone-800 hover:bg-stone-900">
            Refaire le guide
          </Button>
        </div>
      </div>
    );
  }

  // Step content display
  const renderStep = (stepIndex) => {
    if (stepIndex === -1) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-rose-50 rounded-2xl border-2 border-amber-200 p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-200/50">
              <Book className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">Guide du Débutant</h1>
              <p className="text-stone-500 mt-2 max-w-md mx-auto">
                Un tutoriel interactif en 7 étapes pour maîtriser les bases d'EquiGenesis.
                Chaque étape complétée te rapporte des récompenses !
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-amber-600">50 ₲</p>
                <p className="text-xs text-stone-400">par étape</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-purple-600">+5 réput.</p>
                <p className="text-xs text-stone-400">par étape</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-600">+5 000 ₲</p>
                <p className="text-xs text-stone-400">à la fin</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-rose-600">🎁 Cheval</p>
                <p className="text-xs text-stone-400">30 000 ₲</p>
              </div>
            </div>
            <Button
              onClick={() => setCurrentStep(0)}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-8 py-6 text-lg rounded-2xl shadow-lg"
            >
              Commencer le guide
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      );
    }

    if (stepIndex >= STEPS.length) {
      // Final — collect rewards
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          {rewardsCollected && rewardData ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-50 via-rose-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-8 text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <h2 className="text-2xl font-bold text-stone-800">Félicitations !</h2>
                <p className="text-stone-500">Tu as terminé le guide et reçu toutes tes récompenses.</p>
                <div className="bg-white/80 rounded-xl p-4 space-y-2 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="text-sm"><strong>{rewardData.rep}</strong> points de réputation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm"><strong>{rewardData.genesis.toLocaleString('fr-FR')} ₲</strong> Genesis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-rose-500" />
                    <span className="text-sm">{rewardData.items.join(' · ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="text-sm"><strong>{rewardData.horse.name}</strong> — {rewardData.horse.breed} {rewardData.horse.sex === 'male' ? '♂' : '♀'}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={() => navigate('/Stable')} className="bg-stone-800 hover:bg-stone-900">
                  <Heart className="w-4 h-4 mr-2" /> Voir mon écurie
                </Button>
                <Button variant="outline" onClick={() => navigate('/HorseDetail?id=' + rewardData.horse.id)}>
                  Voir mon nouveau cheval
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto text-center space-y-6 py-12">
              <div className="text-6xl">🎁</div>
              <h2 className="text-2xl font-bold text-stone-800">Guide terminé !</h2>
              <p className="text-stone-500">Toutes les étapes sont complétées. Il est temps de récupérer tes récompenses.</p>
              <div className="bg-white/80 rounded-xl p-4 text-left space-y-2 max-w-sm mx-auto border border-stone-200">
                <h3 className="font-semibold text-stone-700 text-sm">Récompenses finales :</h3>
                <div className="flex items-center gap-2 text-sm"><Trophy className="w-4 h-4 text-amber-500" /> 30 points de réputation</div>
                <div className="flex items-center gap-2 text-sm"><ShoppingCart className="w-4 h-4 text-emerald-500" /> 5 000 ₲ Genesis</div>
                <div className="flex items-center gap-2 text-sm"><Gift className="w-4 h-4 text-rose-500" /> Objets cadeaux ×4</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-purple-500" /> 🎁 Un cheval mystère !</div>
              </div>
              <Button
                onClick={collectFinalRewards}
                disabled={isCollectingGift}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-8 py-6 text-lg rounded-2xl shadow-lg"
              >
                {isCollectingGift ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Attribution des récompenses...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" /> Collecter mes récompenses
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      );
    }

    const step = STEPS[stepIndex];
    const isCompleted = completedSteps.has(stepIndex);
    const Icon = step.icon;
    const progress = ((stepIndex) / STEPS.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-stone-500 font-medium">Étape {stepIndex + 1}/{STEPS.length}</p>
            <p className="text-xs text-stone-400">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2 bg-stone-100 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-rose-400" />
        </div>

        {/* Step card */}
        <div className={`bg-gradient-to-br ${step.color} rounded-2xl p-8 text-white shadow-lg`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{step.title}</h2>
              <p className="text-sm text-white/80 mt-1">{step.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="whitespace-pre-line text-sm text-stone-700 leading-relaxed space-y-3">
              {step.content.split('\n').map((line, i) => {
                if (line.startsWith('•')) {
                  return <div key={i} className="flex items-start gap-2 ml-2"><span className="text-amber-500 mt-0.5">•</span><span>{line.slice(1)}</span></div>;
                }
                if (line.startsWith('✓')) {
                  return <div key={i} className="flex items-start gap-2 ml-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-emerald-700">{line.slice(1)}</span></div>;
                }
                if (line.match(/^[\wéèêëàâäùûüîïôöç]+\s*[:：]/)) {
                  const [title, ...rest] = line.split(/[:：]/);
                  return <p key={i} className="font-semibold text-stone-800 mt-3"><span className="text-amber-600">{title}</span> : {rest.join(':')}</p>;
                }
                if (line.trim()) return <p key={i}>{line}</p>;
                return <div key={i} className="h-2" />;
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step bonus */}
        {stepIndex < stepRewards.length && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-center gap-3">
            <Gift className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              <strong>Bonus étape :</strong> {stepRewards[stepIndex].rep} pts de réputation + {stepRewards[stepIndex].genesis} ₲
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {completedSteps.size > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                // Find the last incomplete before current
                let prev = currentStep - 1;
                while (prev >= 0 && completedSteps.has(prev)) prev--;
                if (prev < 0) prev = Math.max(0, currentStep - 1);
                // Actually go to previous step that user has visited
                const prevCompleted = Array.from(completedSteps).sort((a, b) => b - a);
                const lastVisited = prevCompleted.length > 0 ? prevCompleted[prevCompleted.length - 1] : 0;
                setCurrentStep(lastVisited - 1 >= 0 ? lastVisited - 1 : 0);
              }}
            >
              ← Retour
            </Button>
          )}
          <div className="flex-1" />
          {isCompleted ? (
            <Button
              onClick={() => {
                if (stepIndex < STEPS.length - 1) {
                  setCurrentStep(stepIndex + 1);
                } else {
                  setCurrentStep(STEPS.length);
                }
              }}
              className="bg-stone-800 hover:bg-stone-900"
            >
              Étape suivante <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => completeStep(stepIndex)}
              className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Terminer l'étape
            </Button>
          )}
        </div>
      </div>
    );
  };

  return renderStep(currentStep);
}