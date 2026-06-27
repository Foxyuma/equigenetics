// Horse aging service — ages horses by game months (14 real days = 1 game month)
// Runs each daily tick. Horses age 1 year per game month, capped at 35.
import { base44 } from '@/api/base44Client';
import { estimateHorseValue } from '@/components/genetics/GeneticsEngine';

const MAX_AGE = 35;

export async function ageHorses(userEmail, newMonth) {
  if (!userEmail || newMonth == null) return 0; // Undefined guard

  let agedCount = 0;

  // Process up to 250 horses per tick. Horses beyond that age on the next daily tick.
  const horses = await base44.entities.Horse.filter(
    { owner_email: userEmail },
    '-created_date',
    250
  );

  for (const horse of horses || []) {
    const lastAgeMonth = horse.last_age_update_month;
    // First age: set initial age update marker
    if (lastAgeMonth == null) {
      await base44.entities.Horse.update(horse.id, {
        last_age_update_month: newMonth,
      });
      continue;
    }

    // Calculate months elapsed since last age update
    let monthsElapsed = newMonth - lastAgeMonth;
    if (monthsElapsed <= 0) continue;

    // Handle year wrap: current month < last update month means a year rolled
    if (monthsElapsed < 0) {
      monthsElapsed += 8; // 8 months per game year
    }

    const newAge = Math.min(MAX_AGE, (horse.age || 0) + monthsElapsed);
    const update = {
      age: newAge,
      last_age_update_month: newMonth,
    };

    // Recalculate value if age changed
    if (newAge !== (horse.age || 0)) {
      update.estimated_value = estimateHorseValue({
        ...horse,
        age: newAge,
      });
      agedCount++;
    }

    await base44.entities.Horse.update(horse.id, update);
  }

  return agedCount;
}