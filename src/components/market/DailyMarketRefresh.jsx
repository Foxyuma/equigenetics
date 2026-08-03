import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { generateRandomGenotype, determineCoatColor, generateStarterHorse } from '@/components/genetics/GeneticsEngine';
import { BREEDS } from '@/components/genetics/GeneticsEngine';
import { generateNPCStallions } from '../../pages/StallionMarket';

// NPC names for listings
const NPC_STABLES = [
  "Mill Stud", "Alpine Stable", "Celtic Domain", "Imperial Stud",
  "Royal Stable", "Sun Stud", "Bordeaux Breeding", "Norman Stud",
  "Forest Stable", "Winds Domain"
];

const NPC_SELLER_EMAILS = [
  "npc_moulin@equigenesis.game", "npc_alpes@equigenesis.game", "npc_celtique@equigenesis.game",
  "npc_imperial@equigenesis.game", "npc_royal@equigenesis.game", "npc_soleil@equigenesis.game",
  "npc_bordelais@equigenesis.game", "npc_normand@equigenesis.game",
  "npc_foret@equigenesis.game", "npc_vents@equigenesis.game"
];

const MALE_NAMES = [
  "Tornado", "Eclipse", "Sultan", "Storm", "Apollo", "Zephyr", "Atlas", "Titan",
  "Merlin", "Sirius", "Storm", "Midnight", "Thunder", "Blaze", "Comet",
  "Nero", "Pharaoh", "Caesar", "Viking", "Troy", "Damasco", "Falcon",
  "Kronos", "Ares", "Zeus", "Orion", "Ptolemy", "Hannibal"
];

const FEMALE_NAMES = [
  "Luna", "Aurora", "Pearl", "Tempest", "Star", "Jade", "Iris", "Stella",
  "Naya", "Olympia", "Cascade", "Mistral", "Serenade", "Comet", "Galaxy",
  "Harmony", "Isabelle", "Jasmine", "Katia", "Lea", "Melody", "Nora",
  "Undine", "Penelope", "Qinara", "Roxane", "Sapphire", "Tara"
];

// localStorage key to track the last generation
const LAST_REFRESH_KEY = 'market_last_refresh_day';

// Generate a random NPC horse
function generateNpcHorse() {
  const breed = BREEDS[Math.floor(Math.random() * BREEDS.length)];
  const sex = Math.random() < 0.5 ? 'male' : 'female';
  const name = sex === 'male'
    ? MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)]
    : FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];

  const { stats, coat_color, genotype, health_genes, character, mental_traits, morphology, genetic_potential } = generateStarterHorse(breed);

  // Vary age (0 to 12 years)
  const age = Math.floor(Math.random() * 13);
  // Recalculate coat based on age: foals show their birth color,
  // adults (≥ 3 years) grey for grey horses.
  coat_color = determineCoatColor(genotype, age);

  // Improve stats based on age (older horses have more experience)
  if (age >= 3) {
    const boost = Math.min(age * 2, 20);
    Object.keys(stats).forEach(k => { stats[k] = Math.min(100, stats[k] + Math.floor(Math.random() * boost)); });
  }

  const avgStat = Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / 7);

  // Variable price by quality — from very cheap to very expensive
  let price;
  const tier = Math.random();
  if (tier < 0.25) {
    // Budget: 300-1500
    price = 300 + Math.floor(Math.random() * 1200);
  } else if (tier < 0.55) {
    // Mid-range: 1500-6000
    price = 1500 + Math.floor(Math.random() * 4500);
  } else if (tier < 0.80) {
    // Superior: 6000-20000
    price = 6000 + Math.floor(Math.random() * 14000);
  } else if (tier < 0.95) {
    // Premium: 20000-60000
    price = 20000 + Math.floor(Math.random() * 40000);
  } else {
    // Rare elite: 60000-150000
    price = 60000 + Math.floor(Math.random() * 90000);
  }

  // Round to nearest 50
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

// Generate an NPC auction
function generateNpcAuction(horse, stableName, sellerEmail) {
  // Starting price = 30-70% of value
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
    // Unique key per game day
    const todayKey = `${clock.year}-${clock.month}-${clock.day}`;
    const lastKey = localStorage.getItem(LAST_REFRESH_KEY);

    // Trigger only if new game day and not already done today
    if (lastKey === todayKey) return;

    // Check if it's "2am" in game — we simulate this by checking that the day has changed
    // (GameClock advances by daily tick, so each new day = refresh)
    const runRefresh = async () => {
      try {
        localStorage.setItem(LAST_REFRESH_KEY, todayKey);

        // Clean up old NPC sales (owner_email starts with npc_)
        const existingNpcSales = await base44.entities.Horse.filter({ is_for_sale: true }, '-created_date', 200);
        const npcHorsesToRemove = existingNpcSales.filter(h =>
          h.owner_email?.startsWith('npc_') || h.created_by_id === 'npc'
        );
        // We don't delete real player horses, just NPCs lasting > 3 days
        // (we simply mark them off-sale)
        const oldNpcIds = npcHorsesToRemove.filter(h => {
          const createdAt = new Date(h.created_date);
          const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays > 3;
        }).map(h => h.id);

        await Promise.all(oldNpcIds.map(id =>
          base44.entities.Horse.update(id, { is_for_sale: false })
        ));

        // Generate 4-7 new NPC direct sales
        const nbSales = 4 + Math.floor(Math.random() * 4);
        const salesPromises = Array.from({ length: nbSales }, async () => {
          const horse = generateNpcHorse();
          return base44.entities.Horse.create(horse);
        });
        await Promise.all(salesPromises);

        // ─── BREEDING MARKET ──────────────────────────────
        // Clean up old NPC offers
        const existingStallions = await base44.entities.StallionOffer.filter(
          { is_npc: true, owner_email: "haras@national.equigenesis" },
          '-created_date', 200
        );
        const oldStallionIds = existingStallions.filter(s => {
          const createdAt = new Date(s.created_date);
          const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays > 1;
        }).map(s => s.id);

        await Promise.all(oldStallionIds.map(id =>
          base44.entities.StallionOffer.delete(id)
        ));

        // Check how many NPC stallions remain
        const remaining = existingStallions.filter(s => !oldStallionIds.includes(s.id)).length;
        if (remaining < 12) {
          const newStallions = generateNPCStallions();
          const toCreate = Math.min(newStallions.length, 18 - remaining);
          const chosen = newStallions.sort(() => Math.random() - 0.5).slice(0, toCreate);
          await Promise.all(chosen.map(s => base44.entities.StallionOffer.create(s)));
        }

        // Generate 3-5 new NPC auctions
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
      // Silent — don't block the app
      console.warn('DailyMarketRefresh error:', err);
      // Reset key to retry on next render
      localStorage.removeItem(LAST_REFRESH_KEY);
      }
    };

    runRefresh();
  }, [gameClock]);

  return null; // Invisible component
}