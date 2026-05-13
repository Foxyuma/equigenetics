// Descriptions morphologiques par race pour guider la génération d'image
const BREED_DESCRIPTORS = {
  'Arabian': 'purebred Arabian horse with a dished face, large eyes, arched neck, high tail carriage, fine bone structure, desert-bred appearance',
  'Thoroughbred': 'Thoroughbred racehorse with a lean athletic build, long legs, deep chest, refined head, elegant racing conformation',
  'Friesian': 'Friesian horse, jet black coat, long flowing mane and tail, feathered hooves, powerful baroque body, arched neck, majestic appearance — almost always solid black',
  'Andalusian': 'Andalusian horse (PRE) with a convex profile, thick arched neck, compact muscular body, long wavy mane and tail, baroque conformation',
  'Appaloosa': 'Appaloosa horse with spotted coat pattern, mottled skin, striped hooves, visible sclera around eyes',
  'Quarter Horse': 'American Quarter Horse with a broad forehead, wide chest, heavily muscled hindquarters, short back, stocky powerful build',
  'Warmblood': 'sport Warmblood horse with a rectangular frame, well-muscled hindquarters, expressive head, suitable for dressage or show jumping',
  'Selle Français': 'Selle Français sport horse with an athletic elegant build, well-proportioned head, strong hindquarters, refined sport horse conformation',
  'Lusitano': 'Lusitano horse with a sub-convex profile, muscular arched neck, compact body, high-stepping gaits, baroque Iberian conformation',
  'Hanoverian': 'Hanoverian warmblood with a noble head, long neck, strong back, powerful hindquarters, classical dressage sport horse',
  'KWPN': 'KWPN Dutch Warmblood sport horse with an expressive head, athletic body, strong hindquarters, elegant sport horse build',
  'Trakehner': 'Trakehner with a refined noble head, high withers, long harmonious back, thoroughbred-influenced elegant warmblood',
  'Oldenburg': 'Oldenburg warmblood with a powerful rectangular frame, strong neck, well-muscled body, classical sport horse',
  'Standardbred': 'Standardbred harness racing horse with a longer body, strong hindquarters, slightly lower head carriage, trotting horse conformation',
  'Morgan': 'Morgan horse with a compact cresty neck, broad forehead, expressive eyes, refined legs, versatile American breed',
  'Tennessee Walker': 'Tennessee Walking Horse with a long sloping shoulder, refined head, elegant neck, natural running walk gait',
  'Paint': 'American Paint Horse with pinto tobiano or overo coat pattern, Quarter Horse body type, colorful coat markings',
  'Pinto': 'Pinto horse with large patches of white and another color, bold coat markings',
  'Mustang': 'wild Mustang with a short back, sturdy legs, primitive markings, tough hardy conformation, feral horse appearance',
  'Percheron': 'Percheron draft horse with a large powerful body, broad forehead, arched neck, feathered hooves, impressive draft conformation',
  'Clydesdale': 'Clydesdale draft horse with massive feathered legs, broad flat hooves, kind expression, very large powerful body',
  'Shire': 'Shire horse, the tallest draft breed, with abundant white feathering on legs, broad back, massive muscular body',
  'Mérens': 'Mérens horse (Ariégeois pony), always solid black coat, small sturdy mountain horse from the Pyrenees, thick mane and tail, primitive appearance — must be black',
  'Camargue': 'Camargue horse, always grey to white coat, semi-wild French breed from the Rhône delta marshes, short compact body, large hooves',
  'Haflinger': 'Haflinger with a chestnut coat and flaxen mane and tail, compact and muscular mountain pony, kind expression',
  'Welsh Pony': 'Welsh Pony with a fine head, large eyes, strong compact body, lively temperament, elegant small horse',
  'Connemara': 'Connemara pony with a dished head, strong neck, compact hardy body, Irish mountain pony',
  'New Forest': 'New Forest Pony with a quality head, strong compact body, sturdy legs, British native pony appearance',
  'Icelandic': 'Icelandic Horse with a thick heavy winter coat, full mane and forelock, stocky compact body, natural tölt gait',
  'Fjord': 'Norwegian Fjord Horse with a distinctive dun coat, dorsal stripe, black-centered erect mane, compact sturdy body',
  'Akhal-Teke': 'Akhal-Teke with a metallic shimmering coat, fine build, long neck, almond-shaped eyes, greyhound-like lean elegant body',
  'default': 'horse with correct breed conformation and proportions',
};

// Races forcément noires (ou presque)
const ALWAYS_BLACK_BREEDS = ['Friesian', 'Mérens'];
// Races toujours grises/blanches
const ALWAYS_GREY_BREEDS = ['Camargue'];
// Races avec robe imposée (chestnut flaxen)
const ALWAYS_CHESTNUT_FLAXEN_BREEDS = ['Haflinger'];

/**
 * Construit un prompt de génération d'image pour un cheval.
 * @param {object} params
 * @param {string} params.breed
 * @param {string} params.coat_color
 * @param {string} params.sex  'male' | 'female'
 * @param {boolean} params.isFoal  true = poulain, false = adulte
 * @param {string|null} params.markings  description des marquages du poulain (pour continuité adulte)
 */
export function buildHorseImagePrompt({ breed, coat_color, sex, isFoal, markings = null }) {
  const breedDesc = BREED_DESCRIPTORS[breed] || BREED_DESCRIPTORS['default'];

  // Gestion des races à couleur imposée
  let colorDesc = coat_color;
  if (ALWAYS_BLACK_BREEDS.includes(breed)) {
    colorDesc = 'solid jet black';
  } else if (ALWAYS_GREY_BREEDS.includes(breed)) {
    colorDesc = 'light grey to white';
  } else if (ALWAYS_CHESTNUT_FLAXEN_BREEDS.includes(breed)) {
    colorDesc = 'chestnut with flaxen mane and tail';
  }

  const sexLabel = isFoal
    ? (sex === 'male' ? 'colt foal' : 'filly foal')
    : (sex === 'male' ? 'stallion' : 'mare');

  const ageDesc = isFoal
    ? 'young foal, approximately 6 months old, gangly long legs, fluffy coat, small stature'
    : 'mature adult horse in prime condition';

  const markingsDesc = markings
    ? `The horse has these exact markings which must be preserved: ${markings}.`
    : '';

  return `Professional equine photography of a ${colorDesc} ${breed} ${sexLabel}. ${breedDesc}. ${ageDesc}. ${markingsDesc} Full body side view, natural outdoor lighting, green meadow or stable background, sharp focus, high resolution equine photography, realistic photograph, no text, no watermark. The horse must clearly look like a ${breed} breed with accurate morphology and coat color.`;
}

/**
 * Extrait une description simple des marquages à partir du coat_color et du genotype.
 * Utilisée pour la continuité poulain → adulte.
 */
export function extractMarkingsDescription(coat_color, genotype) {
  const parts = [coat_color];
  if (!genotype) return coat_color;

  if (genotype.tobiano && genotype.tobiano !== 'nn') parts.push('tobiano pinto pattern');
  if (genotype.roan && genotype.roan !== 'nn') parts.push('roan pattern');
  if (genotype.grey && genotype.grey !== 'gg') parts.push('greying pattern');
  if (genotype.dun && genotype.dun !== 'dd') parts.push('dun factor with dorsal stripe');
  if (genotype.cream && genotype.cream !== 'nn') {
    if (genotype.cream === 'CrCr') parts.push('double cream dilute');
    else parts.push('single cream dilute');
  }
  if (genotype.champagne && genotype.champagne !== 'nn') parts.push('champagne dilute');
  if (genotype.silver && genotype.silver !== 'zz') parts.push('silver dapple mane and tail');

  return parts.join(', ');
}