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
    title: 'Welcome to EquiGenesis!',
    description: 'This interactive guide will teach you the basics of the game. Each step rewards you!',
    color: 'from-amber-500 to-yellow-500',
    content: `
      Welcome, young breeder! You're about to discover everything you need to run your stud farm,
      understand equine genetics, perform breedings, train your horses and enter competitions.
      
      This tutorial will guide you step by step. Complete each stage to unlock rewards:
      reputation points, money, items... and a horse at the end!
    `
  },
  {
    id: 'cycle',
    icon: Clock,
    title: 'Horse Life Cycle',
    description: 'Understand how horses are born, grow, and age.',
    color: 'from-sky-500 to-blue-500',
    content: `
      In EquiGenesis, time moves forward continuously. Horses are born at 0 years (foals),
      become adults at 3-4 years, and can live up to about 30 years depending on their genetic health.
      
      The game has its own calendar: 1 game month = 14 real days,
      1 game year = 168 real days. Every day at 3:30 AM UTC, an automatic tick
      ages horses, advances seasons and processes competitions.
      
      Seasons (spring, summer, autumn, winter) each last 3 game months.
      Some events and competitions vary by season.
    `
  },
  {
    id: 'genetics',
    icon: Dna,
    title: 'Genetics Basics',
    description: 'Understand how genes, coat colors and heredity work.',
    color: 'from-purple-500 to-violet-500',
    content: `
      Every horse has a complete genome that determines its coat, patterns and health.
      
      The basics: each gene exists in two copies (alleles), one from the sire and one from the dam.
      - Homozygous: both alleles are identical (e.g. EE or ee)
      - Heterozygous: the two alleles are different (e.g. Ee)
      
      A DOMINANT (uppercase) allele expresses itself even in a single copy.
      A RECESSIVE (lowercase) allele only expresses itself in two copies.
      
      Base colors:
      \u2022 Bay (E_ + A_) — brown body, black mane/tail
      \u2022 Chestnut (ee) — red body and mane/tail
      \u2022 Black (E_ + aa) — black body and mane/tail
      \u2022 Grey (G_) — coat that lightens with age
      
      Dilutions: Cream (Palomino, Buckskin), Dun (primitive markings),
      Champagne (golden sheen), Silver (lightened mane/tail).
      
      Patterns: Tobiano (large white patches), Sabino (high stockings),
      Roan (mixed white hairs), Leopard (Appaloosa spots).
    `
  },
  {
    id: 'reproduction',
    icon: Heart,
    title: 'Breeding',
    description: 'How to breed your horses to create the next generation.',
    color: 'from-rose-500 to-pink-500',
    content: `
      Breeding is at the heart of the game. Here is the full process:
      
      1. The mare must be at least 3 years old
      2. Go to her detailed profile \u2192 "Breeding" tab
      3. Choose a stallion: your own males (free) or via the Stallion Market (paid)
      4. Simulate the cross to see genetic predictions
      5. Confirm the breeding — it costs 25 energy from the mare
      6. Birth takes place after 11 game months (158 real days)
      
      The foal randomly inherits one allele from each parent for every gene
      (Mendel's law: 50% from the sire, 50% from the dam). Stats are an average
      of the parents with a random variation.
      
      Note: stallions must be approved for their foals to be registered
      in the studbook. An unapproved stallion produces an OC foal
      (Observed Origins).
      
      Approval levels:
      \u2022 Elite (\u00d72.5) \u2022 Sport (\u00d71.8) \u2022 Approved (\u00d71.4) \u2022 Rejected (\u00d70.7)
    `
  },
  {
    id: 'training',
    icon: TrendingUp,
    title: 'Training',
    description: 'Improve your horses\' skills to prepare them for competitions.',
    color: 'from-emerald-500 to-green-500',
    content: `
      Training improves the 7 skills: speed, endurance, agility,
      strength, temperament, jumping and dressage.
      
      Key points:
      \u2022 Each session consumes physical AND mental energy
      \u2022 A tired horse has reduced performance
      \u2022 Energy regenerates over time or with items
      \u2022 Stats CANNOT exceed the maximum genetic potential
      \u2022 The horse's character influences training efficiency
      \u2022 Foals (<3 years) have special training (handling, desensitization)
    `
  },
  {
    id: 'competitions',
    icon: Trophy,
    title: 'Competitions',
    description: 'Enter your horses in competitions to earn prestige and money.',
    color: 'from-amber-500 to-orange-500',
    content: `
      Competitions are the main source of income and prestige.
      
      Available disciplines:
      \u2022 Dressage \u2014 dressage + temperament
      \u2022 Show Jumping (CSO) \u2014 jumping + agility + speed
      \u2022 Cross Country \u2014 endurance + jumping + speed
      \u2022 Endurance \u2014 endurance +++
      \u2022 Barrel Racing \u2014 speed + agility
      \u2022 Reining \u2014 agility + strength
      \u2022 Conformation & Movement \u2014 beauty and conformation by breed
      
      Winnings increase with difficulty level. Victories improve
      your farm's reputation! Register from the Competitions tab.
    `
  },
  {
    id: 'economy',
    icon: ShoppingCart,
    title: 'Economy & Progression',
    description: 'Manage your finances, buy and sell horses.',
    color: 'from-yellow-500 to-amber-500',
    content: `
      The game uses two currencies:
      
      \u2022 GENESIS (\u20b2) \u2014 main currency, earned through competitions and sales
      \u2022 CREDITS \u2014 premium currency to speed up certain actions
      
      Where to spend?
      \u2022 Buy horses at auction (Market)
      \u2022 Pay for breedings at the Stallion Market
      \u2022 Buy items at the Shop (care, food)
      \u2022 Hire staff (grooms, vets, trainers)
      \u2022 Genetic tests at the Genetics Lab
      
      Tip: start with a versatile breed like the Selle Français
      or KWPN, train it, enter competitions, then invest
      in breeding to improve your line generation after generation.
    `
  },
  {
    id: 'final',
    icon: Gift,
    title: 'Rewards!',
    description: 'Congratulations! You finished the guide. Claim your rewards.',
    color: 'from-amber-500 to-rose-500',
    content: `
      You've covered all the basics of EquiGenesis! You now know:
      \u2713 The horse life cycle
      \u2713 The fundamentals of genetics
      \u2713 How breeding works
      \u2713 Training and competitions
      \u2713 Managing your stud farm's economy
      
      Time to put it all into practice. Good luck, breeder!
    `
  }
];

const GIFT_ITEMS = [
  { name: 'Energy Feed', icon: '\uD83E\uDD5A', type: 'food', description: 'Restores 30 energy points' },
  { name: 'Healing Balm', icon: '\uD83E\uDDEE', type: 'care', description: 'Heals minor injuries' },
];

export default function Guide() {
  const [currentStep, setCurrentStep] = useState(-1);
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

  const { data: tutorialCompleted } = useQuery({
    queryKey: ['tutorial-completed'],
    queryFn: async () => {
      try {
        const val = localStorage.getItem('equigenesis_tutorial_completed');
        return val === 'true';
      } catch { return false; }
    },
  });

  const stepRewards = [
    { rep: 5, genesis: 50 },
    { rep: 5, genesis: 100 },
    { rep: 10, genesis: 150 },
    { rep: 10, genesis: 200 },
    { rep: 5, genesis: 100 },
    { rep: 10, genesis: 250 },
    { rep: 5, genesis: 150 },
  ];

  const completeStep = async (stepIndex) => {
    if (!currentUser || completedSteps.has(stepIndex)) return;
    
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepIndex);
    setCompletedSteps(newCompleted);

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
        reason: `Guide step ${stepIndex + 1} - ${STEPS[stepIndex].title}`,
      });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (e) {
      // continue
    }

    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      setCurrentStep(STEPS.length);
    }
  };

  const collectFinalRewards = async () => {
    if (!currentUser || isCollectingGift || rewardsCollected) return;
    setIsCollectingGift(true);

    try {
      const userEmail = currentUser.email;

      const currentRep = currentUser.breeding_reputation ?? 0;
      await base44.auth.updateMe({ breeding_reputation: currentRep + 30 });

      const currentBal = currentUser.genesis_balance ?? 0;
      await base44.auth.updateMe({ genesis_balance: currentBal + 5000 });
      await base44.entities.Transaction.create({
        user_email: userEmail,
        currency: 'genesis',
        amount: 5000,
        balance_after: currentBal + 5000,
        reason: 'Beginner\'s guide reward',
      });

      for (const item of GIFT_ITEMS) {
        await base44.entities.Inventory.create({
          item_name: item.name,
          item_icon: item.icon,
          item_type: item.type,
          quantity: 2,
          effect: { description: item.description },
        });
      }

      const BREEDS = [
        "Arabian", "Thoroughbred", "Friesian", "Lipizzaner",
        "Anglo-Arabian", "Haflinger", "Connemara",
        "Selle Français", "KWPN", "Hanoverian", "Holsteiner", "Oldenburg", "Belgian Warmblood",
        "Quarter Horse", "Paint Horse", "Appaloosa", "Shire", "Shetland"
      ];
      const breed = BREEDS[Math.floor(Math.random() * BREEDS.length)];
      const femaleNames = ["Luna", "Aurora", "Pearl", "Tempest", "Star", "Jade", "Iris", "Stella", "Naya", "Olympia", "Diva", "Bella", "Ruby", "Velvet"];
      const maleNames = ["Orion", "Tornado", "Apache", "Spirit", "Shadow", "King", "Thor", "Zeus", "Apache", "Diablo", "Ringo", "Flash", "Storm", "Rocket"];
      const isMale = Math.random() > 0.5;
      const namePool = isMale ? maleNames : femaleNames;
      const name = namePool[Math.floor(Math.random() * namePool.length)];

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
        let base = 15 + Math.floor(Math.random() * 15);
        if (primeStats.includes(s)) base += 20 + Math.floor(Math.random() * 15);
        stats[s] = Math.min(100, base);
      });

      const foalTraits = generateFoalTraits(null, null, breed);
      const characters = ["energique", "anxieux", "intelligent", "paresseux", "courageux", "docile"];

      const horseData = {
        name: name + ' Gift',
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
        items: GIFT_ITEMS.map(i => `${i.name} \u00d72`),
      });
      setRewardsCollected(true);
      localStorage.setItem('equigenesis_tutorial_completed', 'true');
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('\uD83C\uDF89 Tutorial complete! All rewards are yours!');
    } catch (e) {
      toast.error('Error collecting rewards');
    }
    setIsCollectingGift(false);
  };

  if (tutorialCompleted && rewardData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-amber-50 via-rose-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-8 text-center space-y-4">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-stone-800">Guide Complete!</h2>
          <p className="text-stone-500">You already received your rewards. Find your horse in the stable.</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate('/Stable')} className="bg-stone-800 hover:bg-stone-900">
              View My Stable
            </Button>
            <Button variant="outline" onClick={() => { localStorage.removeItem('equigenesis_tutorial_completed'); setRewardData(null); setCompletedSteps(new Set()); setCurrentStep(-1); }}>
              Redo the Guide
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (tutorialCompleted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-8 text-center space-y-4">
          <div className="text-6xl">🎓</div>
          <h2 className="text-2xl font-bold text-stone-800">You already completed the guide!</h2>
          <p className="text-stone-500">You can redo it to review the basics.</p>
          <Button onClick={() => { localStorage.removeItem('equigenesis_tutorial_completed'); setCompletedSteps(new Set()); setCurrentStep(-1); setRewardData(null); }} className="bg-stone-800 hover:bg-stone-900">
            Redo the Guide
          </Button>
        </div>
      </div>
    );
  }

  const renderStep = (stepIndex) => {
    if (stepIndex === -1) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-rose-50 rounded-2xl border-2 border-amber-200 p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-200/50">
              <Book className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">Beginner's Guide</h1>
              <p className="text-stone-500 mt-2 max-w-md mx-auto">
                An interactive 7-step tutorial to master the basics of EquiGenesis.
                Each completed step rewards you!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-amber-600">50 \u20b2</p>
                <p className="text-xs text-stone-400">per step</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-purple-600">+5 rep.</p>
                <p className="text-xs text-stone-400">per step</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-600">+5 000 \u20b2</p>
                <p className="text-xs text-stone-400">at the end</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-rose-600">🎁 Horse</p>
                <p className="text-xs text-stone-400">30 000 \u20b2</p>
              </div>
            </div>
            <Button
              onClick={() => setCurrentStep(0)}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-8 py-6 text-lg rounded-2xl shadow-lg"
            >
              Start the Guide
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      );
    }

    if (stepIndex >= STEPS.length) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          {rewardsCollected && rewardData ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-50 via-rose-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-8 text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <h2 className="text-2xl font-bold text-stone-800">Congratulations!</h2>
                <p className="text-stone-500">You completed the guide and received all your rewards.</p>
                <div className="bg-white/80 rounded-xl p-4 space-y-2 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="text-sm"><strong>{rewardData.rep}</strong> reputation points</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm"><strong>{rewardData.genesis.toLocaleString('en-US')} \u20b2</strong> Genesis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-rose-500" />
                    <span className="text-sm">{rewardData.items.join(' \u00b7 ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <span className="text-sm"><strong>{rewardData.horse.name}</strong> \u2014 {rewardData.horse.breed} {rewardData.horse.sex === 'male' ? '\u2642' : '\u2640'}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={() => navigate('/Stable')} className="bg-stone-800 hover:bg-stone-900">
                  <Heart className="w-4 h-4 mr-2" /> View My Stable
                </Button>
                <Button variant="outline" onClick={() => navigate('/HorseDetail?id=' + rewardData.horse.id)}>
                  View My New Horse
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto text-center space-y-6 py-12">
              <div className="text-6xl">🎁</div>
              <h2 className="text-2xl font-bold text-stone-800">Guide Complete!</h2>
              <p className="text-stone-500">All steps are finished. Time to claim your rewards.</p>
              <div className="bg-white/80 rounded-xl p-4 text-left space-y-2 max-w-sm mx-auto border border-stone-200">
                <h3 className="font-semibold text-stone-700 text-sm">Final Rewards:</h3>
                <div className="flex items-center gap-2 text-sm"><Trophy className="w-4 h-4 text-amber-500" /> 30 reputation points</div>
                <div className="flex items-center gap-2 text-sm"><ShoppingCart className="w-4 h-4 text-emerald-500" /> 5 000 \u20b2 Genesis</div>
                <div className="flex items-center gap-2 text-sm"><Gift className="w-4 h-4 text-rose-500" /> Gift items \u00d74</div>
                <div className="flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4 text-purple-500" /> 🎁 A mystery horse!</div>
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
                    Assigning rewards...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" /> Collect My Rewards
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
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-stone-500 font-medium">Step {stepIndex + 1}/{STEPS.length}</p>
            <p className="text-xs text-stone-400">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} className="h-2 bg-stone-100 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-rose-400" />
        </div>

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

        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="whitespace-pre-line text-sm text-stone-700 leading-relaxed space-y-3">
              {step.content.split('\n').map((line, i) => {
                if (line.startsWith('\u2022')) {
                  return <div key={i} className="flex items-start gap-2 ml-2"><span className="text-amber-500 mt-0.5">\u2022</span><span>{line.slice(1)}</span></div>;
                }
                if (line.startsWith('\u2713')) {
                  return <div key={i} className="flex items-start gap-2 ml-2"><CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-emerald-700">{line.slice(1)}</span></div>;
                }
                if (line.match(/^[\w\u00e9\u00e8\u00ea\u00eb\u00e0\u00e2\u00e4\u00f9\u00fb\u00fc\u00ee\u00ef\u00f4\u00f6\u00e7]+\s*[:：]/)) {
                  const [title, ...rest] = line.split(/[:：]/);
                  return <p key={i} className="font-semibold text-stone-800 mt-3"><span className="text-amber-600">{title}</span> : {rest.join(':')}</p>;
                }
                if (line.trim()) return <p key={i}>{line}</p>;
                return <div key={i} className="h-2" />;
              })}
            </div>
          </CardContent>
        </Card>

        {stepIndex < stepRewards.length && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 flex items-center gap-3">
            <Gift className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              <strong>Step bonus:</strong> {stepRewards[stepIndex].rep} rep points + {stepRewards[stepIndex].genesis} \u20b2
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {completedSteps.size > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                let prev = currentStep - 1;
                while (prev >= 0 && completedSteps.has(prev)) prev--;
                if (prev < 0) prev = Math.max(0, currentStep - 1);
                const prevCompleted = Array.from(completedSteps).sort((a, b) => b - a);
                const lastVisited = prevCompleted.length > 0 ? prevCompleted[prevCompleted.length - 1] : 0;
                setCurrentStep(lastVisited - 1 >= 0 ? lastVisited - 1 : 0);
              }}
            >
              \u2190 Back
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
              Next Step <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => completeStep(stepIndex)}
              className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete Step
            </Button>
          )}
        </div>
      </div>
    );
  };

  return renderStep(currentStep);
}