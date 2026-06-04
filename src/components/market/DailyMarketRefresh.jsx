import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { generateRandomGenotype, determineCoatColor, generateStarterHorse } from '@/components/genetics/GeneticsEngine';
import { BREEDS } from '@/components/genetics/GeneticsEngine';

// Noms NPC pour les annonces
const NPC_STABLES = [
  "Haras du Moulin", "Écurie des Alpes", "Domaine Celtique", "Haras Impérial",
  "Écurie Royale", "Haras du Soleil", "Élevage Bordelais", "Haras Normand",
  "Écurie de la Forêt", "Domaine des Vents"
];

const NPC_SELLER_EMAILS = [
  "npc_moulin@equigenesis.game", "npc_alpes@equigenesis.game", "npc_celtique@equigenesis.game",
  "npc_imperial@equigenesis.game", "npc_royal@equigenesis.game", "npc_soleil@equigenesis.game",
  "npc_bordelais@equigenesis.game", "npc_normand@equigenesis.game",
  "npc_foret@equigenesis.game", "npc_vents@equigenesis.game"
];

const MALE_NAMES = [
  "Tornado", "Eclipse", "Sultan", "Orage", "Apollo", "Zéphyr", "Atlas", "Titan",
  "Merlin", "Sirius", "Storm", "Midnight", "Thunder", "Blaze", "Comet",
  "Nero", "Pharaon", "Caesar", "Viking", "Troyen", "Damasco", "Faucon",
  "Kronos", "Ares", "Zeus", "Orion", "Ptolémée", "Hannibal"
];

const FEMALE_NAMES = [
  "Luna", "Aurore", "Perle", "Tempête", "Étoile", "Jade", "Iris", "Stella",
  "Naya", "Olympe", "Cascade", "Mistral", "Sérénade", "Comète", "Galaxie",
  "Harmonie", "Isabelle", "Jasmine", "Katia", "Léa", "Mélodie", "Nora",
  "Ondine", "Pénélope", "Qinara", "Roxane", "Saphir", "Tara"
];

// Clé localStorage pour tracker la dernière génération
const LAST_REFRESH_KEY = 'market_last_refresh_day';

// Générer un cheval NPC aléatoire
function generateNpcHorse() {
  const breed = BREEDS[Math.floor(Math.random() * BREEDS.length)];
  const sex = Math.random() < 0.5 ? 'male' : 'female';
  const name = sex === 'male'
    ? MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)]
    : FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];

  const { stats, coat_color, genotype, health_genes, character, mental_traits, morphology, genetic_potential } = generateStarterHorse(breed);

  // Varier l'âge (0 à 12 ans)
  const age = Math.floor(Math.random() * 13);

  // Améliorer les stats selon l'âge (les chevaux plus vieux ont plus d'expérience)
  if (age >= 3) {
    const boost = Math.min(age * 2, 20);
    Object.keys(stats).forEach(k => { stats[k] = Math.min(100, stats[k] + Math.floor(Math.random() * boost)); });
  }

  const avgStat = Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / 7);

  // Prix variable selon qualité — de très bon marché à très cher
  let price;
  const tier = Math.random();
  if (tier < 0.25) {
    // Bon marché : 300-1500
    price = 300 + Math.floor(Math.random() * 1200);
  } else if (tier < 0.55) {
    // Milieu de gamme : 1500-6000
    price = 1500 + Math.floor(Math.random() * 4500);
  } else if (tier < 0.80) {
    // Supérieur : 6000-20000
    price = 6000 + Math.floor(Math.random() * 14000);
  } else if (tier < 0.95) {
    // Premium : 20000-60000
    price = 20000 + Math.floor(Math.random() * 40000);
  } else {
    // Élite rare : 60000-150000
    price = 60000 + Math.floor(Math.random() * 90000);
  }

  // Arrondir au 50 le plus proche
  price = Math.round(price / 50) * 50;

  const stableIdx = Math.floor(Math.random() * NPC_STABLES.length);

  return {
    name,
    breed,
    sex,
    age,
    coat_color,
    genotype,
    stats,
    health_genes: health_genes || [],
    character,
    mental_traits: mental_traits || [],
    morphology: morphology || [],
    genetic_potential: genetic_potential || {},
    is_for_sale: true,
    price,
    estimated_value: price,
    competition_wins: age >= 3 ? Math.floor(Math.random() * (age - 2) * 2) : 0,
    owner_email: NPC_SELLER_EMAILS[stableIdx],
    energy: 100,
    mental_energy: 100,
  };
}

// Générer une enchère NPC
function generateNpcAuction(horse, stableName, sellerEmail) {
  // Prix de départ = 30-70% de la valeur
  const startRatio = 0.3 + Math.random() * 0.4;
  const startingPrice = Math.max(100, Math.round((horse.price * startRatio) / 50) * 50);
  const durationHours = [12, 24, 48][Math.floor(Math.random() * 3)];
  const endsAt = new Date(Date.now() + durationHours * 3600000).toISOString();

  return {
    horse_name: horse.name,
    horse_breed: horse.breed,
    horse_coat_color: horse.coat_color,
    horse_stats: horse.stats,
    horse_image_url: null,
    seller_email: sellerEmail,
    seller_name: stableName,
    starting_price: startingPrice,
    current_bid: 0,
    bid_count: 0,
    ends_at: endsAt,
    status: 'active',
  };
}

export default function DailyMarketRefresh() {
  const { data: gameClock } = useQuery({
    queryKey: ['game-clock'],
    queryFn: () => base44.entities.GameClock.list('-created_date', 1),
    staleTime: 60000,
  });

  useEffect(() => {
    if (!gameClock?.length) return;

    const clock = gameClock[0];
    // Clé unique par jour de jeu
    const todayKey = `${clock.year}-${clock.month}-${clock.day}`;
    const lastKey = localStorage.getItem(LAST_REFRESH_KEY);

    // Déclencher seulement si nouveau jour de jeu et pas déjà fait aujourd'hui
    if (lastKey === todayKey) return;

    // Vérifier si c'est "2h du matin" en jeu — on le simule en vérifiant que le jour a changé
    // (le GameClock avance par tick journalier, donc chaque nouveau jour = refresh)
    const runRefresh = async () => {
      try {
        localStorage.setItem(LAST_REFRESH_KEY, todayKey);

        // Nettoyer les anciennes ventes NPC (owner_email commence par npc_)
        const existingNpcSales = await base44.entities.Horse.filter({ is_for_sale: true }, '-created_date', 200);
        const npcHorsesToRemove = existingNpcSales.filter(h =>
          h.owner_email?.startsWith('npc_') || h.created_by_id === 'npc'
        );
        // On ne supprime pas les vrais chevaux de joueurs, juste les NPC qui durent > 3 jours
        // (on les marque simplement hors vente)
        const oldNpcIds = npcHorsesToRemove.filter(h => {
          const createdAt = new Date(h.created_date);
          const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays > 3;
        }).map(h => h.id);

        await Promise.all(oldNpcIds.map(id =>
          base44.entities.Horse.update(id, { is_for_sale: false })
        ));

        // Générer 4-7 nouvelles ventes directes NPC
        const nbSales = 4 + Math.floor(Math.random() * 4);
        const salesPromises = Array.from({ length: nbSales }, async () => {
          const horse = generateNpcHorse();
          return base44.entities.Horse.create(horse);
        });
        await Promise.all(salesPromises);

        // Générer 3-5 nouvelles enchères NPC
        const nbAuctions = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < nbAuctions; i++) {
          const stableIdx = Math.floor(Math.random() * NPC_STABLES.length);
          const auctionHorse = generateNpcHorse();
          auctionHorse.is_for_sale = false; // Pas en vente directe, en enchère

          const createdHorse = await base44.entities.Horse.create(auctionHorse);
          const auctionData = generateNpcAuction(
            auctionHorse,
            NPC_STABLES[stableIdx],
            NPC_SELLER_EMAILS[stableIdx]
          );
          await base44.entities.Auction.create({
            ...auctionData,
            horse_id: createdHorse.id,
          });
        }

      } catch (err) {
        // Silencieux — ne pas bloquer l'app
        console.warn('DailyMarketRefresh error:', err);
        // Reset la clé pour retenter au prochain rendu
        localStorage.removeItem(LAST_REFRESH_KEY);
      }
    };

    runRefresh();
  }, [gameClock]);

  return null; // Composant invisible
}