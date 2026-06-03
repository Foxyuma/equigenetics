// Descriptions morphologiques détaillées par race pour guider la génération d'image
const BREED_DESCRIPTORS = {
  'Arabian': {
    body: 'purebred Arabian horse with a distinctly dished concave face, large expressive eyes, wide forehead, arched elegant neck with high crest, short strong back, high tail carriage, fine refined bone structure, clean dry legs, desert-bred appearance',
    height: 'medium-sized horse, around 150-155 cm at the withers',
    movement: 'floating elevated trot, very light on its feet',
  },
  'Thoroughbred': {
    body: 'Thoroughbred racehorse with a lean athletic build, long fine legs, deep wide chest, refined elegant head, prominent withers, straight profile, very muscular hindquarters',
    height: 'tall horse, 162-168 cm at the withers',
    movement: 'powerful extended gallop, athletic and ground-covering',
  },
  'Friesian': {
    body: 'Friesian horse with a noble slightly convex profile, very thick arched neck, powerful baroque muscular body, abundant long wavy black mane and tail flowing to the ground, heavily feathered black legs, broad powerful hindquarters',
    height: 'medium-tall horse, 158-165 cm at the withers',
    movement: 'high-stepping dramatic trot, very elevated and cadenced',
  },
  'Andalusian': {
    body: 'Andalusian (PRE) horse with a convex sub-convex profile, thick arched crested neck, compact muscular baroque body, long thick wavy mane and tail, broad chest, rounded hindquarters, short strong back',
    height: 'medium horse, 155-162 cm at the withers',
    movement: 'collected elevated movement, natural cadence',
  },
  'Appaloosa': {
    body: 'Appaloosa horse with a broad forehead, wide chest, strongly muscled hindquarters, striped hooves, mottled skin around muzzle and eyes, visible white sclera, athletic western horse build',
    height: 'medium horse, 148-158 cm at the withers',
    movement: 'agile versatile movement',
  },
  'Quarter Horse': {
    body: 'American Quarter Horse with a broad short head, wide jowls, very muscular neck, wide chest, heavily muscled rounded hindquarters, short back, stocky powerful build, defined muscles',
    height: 'medium horse, 148-160 cm at the withers',
    movement: 'explosive burst of speed, quick agile stops',
  },
  'Warmblood': {
    body: 'sport Warmblood horse with a rectangular well-proportioned frame, well-muscled hindquarters, expressive noble head, long neck, well-defined withers, strong back, suitable for high-level sport',
    height: 'tall sport horse, 162-170 cm at the withers',
    movement: 'powerful rhythmic gaits, good suspension',
  },
  'Selle Français': {
    body: 'Selle Français sport horse with an athletic elegant build, well-proportioned refined head, strong sloped shoulders, powerful hindquarters, long legs, refined sport horse conformation',
    height: 'tall sport horse, 160-170 cm at the withers',
    movement: 'scope and power in jumping, elastic trot',
  },
  'Lusitano': {
    body: 'Lusitano horse with a sub-convex ram-like profile, very muscular arched neck, compact rounded baroque body, high-stepping expressive gaits, broad chest, rounded croup, typically grey or bay',
    height: 'medium horse, 155-162 cm at the withers',
    movement: 'very collected high-stepping gaits, natural collection',
  },
  'Hanoverian': {
    body: 'Hanoverian warmblood with a noble expressive head, long well-set neck, clearly defined withers, strong back, powerful hindquarters, well-angled joints, classical sport horse',
    height: 'tall horse, 162-172 cm at the withers',
    movement: 'expressive elastic gaits, powerful hindquarters engagement',
  },
  'KWPN': {
    body: 'KWPN Dutch Warmblood sport horse with a very expressive refined head, long arched neck, athletic well-proportioned body, powerful hindquarters, modern sport horse build',
    height: 'tall sport horse, 162-172 cm at the withers',
    movement: 'very expressive suspension in trot, powerful scope over fences',
  },
  'Trakehner': {
    body: 'Trakehner with a refined noble thoroughbred-influenced head, clearly defined high withers, long harmonious back, elegant neck, thoroughbred-influenced warmblood build, fine elegant legs',
    height: 'tall horse, 160-168 cm at the withers',
    movement: 'very elastic and light gaits, floating trot',
  },
  'Oldenburg': {
    body: 'Oldenburg warmblood with a large powerful rectangular frame, strong well-set neck, well-muscled body, broad chest, powerful hindquarters, classical heavyweight sport horse',
    height: 'very tall horse, 165-175 cm at the withers',
    movement: 'powerful expressive gaits, good impulsion',
  },
  'Standardbred': {
    body: 'Standardbred harness horse with a longer slightly lower body, strong deep hindquarters, slightly lower head carriage, muscular neck, harness racing horse conformation',
    height: 'medium horse, 150-162 cm at the withers',
    movement: 'very fast extended trot or pace, low ground-covering action',
  },
  'Morgan': {
    body: 'Morgan horse with a compact cresty well-arched neck, broad forehead, expressive eyes, refined clean legs, compact muscular body, well-rounded croup, versatile American breed',
    height: 'small-medium horse, 144-157 cm at the withers',
    movement: 'animated collected gaits, energetic and willing',
  },
  'Tennessee Walker': {
    body: 'Tennessee Walking Horse with a long sloping shoulder, refined elegant head, elegant arched neck, well-muscled body, known for its smooth running walk gait',
    height: 'medium horse, 152-165 cm at the withers',
    movement: 'natural smooth gliding running walk, very comfortable',
  },
  'Paint': {
    body: 'American Paint Horse with tobiano or overo pinto coat pattern, Quarter Horse-type body, broad chest, muscular hindquarters, western horse build with bold colorful coat markings',
    height: 'medium horse, 148-160 cm at the withers',
    movement: 'agile quick western movements',
  },
  'Pinto': {
    body: 'Pinto horse with large bold patches of white and another color, colorful pinto coat markings covering large areas of the body',
    height: 'medium horse, 148-165 cm at the withers',
    movement: 'versatile movement',
  },
  'Mustang': {
    body: 'wild American Mustang with a short strong back, sturdy hard hooves, primitive dun or varied coloring, lean efficient conformation, feral horse appearance, tough and hardy',
    height: 'small-medium horse, 142-155 cm at the withers',
    movement: 'enduring tough free movement',
  },
  'Percheron': {
    body: 'Percheron draft horse with a large very powerful muscular body, broad forehead, refined head for a draft, well-arched strong neck, wide deep chest, heavily feathered legs',
    height: 'very large draft horse, 160-178 cm at the withers',
    movement: 'powerful energetic movement for a draft',
  },
  'Clydesdale': {
    body: 'Clydesdale draft horse with massive heavily feathered white legs, broad flat round hooves, very kind soft expression, very large powerful broad body, gentle giant appearance',
    height: 'very large draft horse, 162-180 cm at the withers',
    movement: 'strong high-stepping draft movement',
  },
  'Shire': {
    body: 'Shire horse, the tallest and most massive draft breed, with very abundant white silky feathering on all four legs, extremely broad back and hindquarters, massive muscular body, gentle kind expression',
    height: 'enormous draft horse, 168-195 cm at the withers, very imposing size',
    movement: 'very powerful massive draft movement',
  },
  'Mérens': {
    body: 'Mérens (Ariégeois) horse, always solid jet black coat, small sturdy compact mountain horse from the French Pyrenees, thick full black mane and tail, primitive robust appearance, strong short back',
    height: 'small horse, 142-155 cm at the withers',
    movement: 'sure-footed mountain movement',
  },
  'Camargue': {
    body: 'Camargue horse, always grey to white adult coat, semi-wild French breed from the Rhône delta marshes, short compact body, large round hooves adapted to marsh terrain, thick mane and tail',
    height: 'small horse, 135-148 cm at the withers',
    movement: 'hardy free movement',
  },
  'Haflinger': {
    body: 'Haflinger with a chestnut coat with a flaxen mane and tail, compact and well-muscled mountain pony, broad forehead, short strong neck, wide deep chest, kind intelligent expression',
    height: 'small mountain horse, 138-150 cm at the withers',
    movement: 'energetic energetic movement, sure-footed',
  },
  'Welsh Pony': {
    body: 'Welsh Pony with a fine quality head, large bright eyes, strong arched neck, compact hardy body, lively spirited temperament, elegant refined small horse',
    height: 'small pony, 122-148 cm at the withers',
    movement: 'active lively pony movement',
  },
  'Connemara': {
    body: 'Connemara pony with a quality dished head, strong arched neck, compact hardy body, deep through the girth, sturdy Irish mountain pony, well-made joints',
    height: 'small pony, 130-148 cm at the withers',
    movement: 'athletic pony movement, very scopey for its size',
  },
  'New Forest': {
    body: 'New Forest Pony with a quality refined head, strong compact body, good bone, sturdy legs, typical British native pony appearance',
    height: 'small pony, 120-148 cm at the withers',
    movement: 'active hardy movement',
  },
  'Icelandic': {
    body: 'Icelandic Horse with a very thick heavy winter coat, very full thick forelock and mane, stocky compact strong body, short thick neck, known for its natural tölt gait',
    height: 'very small stocky horse, 130-145 cm at the withers',
    movement: 'smooth tölt gait, very comfortable',
  },
  'Fjord': {
    body: 'Norwegian Fjord Horse with a distinctive dun coat, clear dorsal stripe running from forelock to tail, characteristic black-centered erect trimmed mane, compact sturdy body, broad forehead',
    height: 'small stocky horse, 135-150 cm at the withers',
    movement: 'powerful energetic movement',
  },
  'Akhal-Teke': {
    body: 'Akhal-Teke with a distinctly metallic shimmering coat, very fine narrow build, very long neck, almond-shaped oblique eyes, greyhound-like very lean elegant body, fine skin showing veins',
    height: 'medium horse, 152-162 cm at the withers',
    movement: 'extremely smooth floating gliding movement',
  },
  'Lipizzaner': {
    body: 'Lipizzaner horse with a convex baroque profile, very muscular powerful arched neck, compact rounded baroque body, typically born dark grey then turning nearly white with age, broad chest',
    height: 'medium horse, 148-162 cm at the withers',
    movement: 'very collected high-stepping airs above the ground, classical haute école',
  },
  'Holsteiner': {
    body: 'Holsteiner warmblood with a slightly convex powerful head, strong muscular neck, powerful wide chest, well-muscled hindquarters, solid bone structure, excellent jumping conformation',
    height: 'tall sport horse, 162-172 cm at the withers',
    movement: 'very powerful and scopey over fences, strong athletic movement',
  },
  'Shetland': {
    body: 'Shetland Pony, the smallest breed, with very thick long mane and tail, very compact and round body, very short legs relative to body, very strong for its tiny size, kind expression',
    height: 'tiny pony, 80-107 cm at the withers, very small',
    movement: 'lively tiny pony movement',
  },
  'Anglo-Arabian': {
    body: 'Anglo-Arabian horse with a refined head showing Arabian influence, elegant long neck, athletic lean body, deep chest, fine bone structure, combining Thoroughbred athleticism and Arabian refinement',
    height: 'medium-tall horse, 155-168 cm at the withers',
    movement: 'light elastic athletic movement',
  },
  'Belgian Warmblood': {
    body: 'Belgian Warmblood sport horse with an athletic powerful build, well-proportioned head, strong muscular body, powerful hindquarters, modern sport horse conformation for jumping',
    height: 'tall sport horse, 160-170 cm at the withers',
    movement: 'powerful athletic sport movement',
  },
  'default': {
    body: 'well-built horse with correct conformation and proportions',
    height: 'medium horse',
    movement: 'regular rhythmic gaits',
  },
};

// Races forcément noires
const ALWAYS_BLACK_BREEDS = ['Friesian', 'Mérens'];
// Races toujours grises/blanches adultes
const ALWAYS_GREY_BREEDS = ['Camargue'];
// Races avec robe imposée chestnut flaxen
const ALWAYS_CHESTNUT_FLAXEN_BREEDS = ['Haflinger'];

// Races reconnues pures (croisement impossible à afficher)
const KNOWN_PURE_BREEDS = new Set(Object.keys(BREED_DESCRIPTORS).filter(k => k !== 'default'));

/**
 * Retourne true si la race est un croisement ou inconnue
 */
function isCrossbreed(breed) {
  if (!breed) return true;
  // Contient "x", "cross", "/" ou "origines" → croisement
  if (/\s*[xX×\/]\s*/.test(breed)) return true;
  if (/origines|cross|métis/i.test(breed)) return true;
  // Race connue pure → pas un croisement
  return !KNOWN_PURE_BREEDS.has(breed);
}

/**
 * Retourne la description de stade selon l'âge
 */
function getAgeStageDescription(age) {
  if (age < 1.5) {
    return {
      stage: 'foal',
      desc: 'very young foal, approximately 6 to 10 months old, with distinctively long gangly legs disproportionate to the body, fluffy soft baby coat, large head relative to body, small stature, wobbly movement, clearly a baby horse',
      labelFR: '🐣 Poulain',
    };
  } else if (age < 3) {
    return {
      stage: 'yearling',
      desc: 'young yearling horse, 1.5 to 2.5 years old, still growing, legs are still slightly long relative to body, transitioning from foal coat to adult coat, immature unfinished body, adolescent horse appearance, clearly not yet fully grown',
      labelFR: '🐴 Jeune cheval',
    };
  } else {
    return {
      stage: 'adult',
      desc: 'mature adult horse in prime condition, fully developed musculature, fully grown, showing the full characteristics of the breed',
      labelFR: '🏇 Adulte',
    };
  }
}

/**
 * Construit un prompt de génération d'image pour un cheval.
 * @param {object} params
 * @param {string} params.breed - Race du cheval
 * @param {string} params.coat_color - Robe
 * @param {string} params.sex - 'male' | 'female'
 * @param {number|null} params.age - Âge en années (null = traité comme poulain/onboarding)
 * @param {boolean} params.isFoal - Rétrocompat: true = poulain
 * @param {string|null} params.markings - Description des marquages
 * @param {string[]|null} params.morphology - Traits morphologiques du cheval (hidden morphology)
 * @param {string[]|null} params.mental_traits - Traits mentaux (ignorés pour l'image)
 */
export function buildHorseImagePrompt({ breed, coat_color, sex, age = null, isFoal = false, markings = null, morphology = null }) {
  // Rétrocompatibilité : si age non fourni mais isFoal = true
  const resolvedAge = (age !== null && age !== undefined) ? age : (isFoal ? 0 : 4);
  const ageStage = getAgeStageDescription(resolvedAge);

  // Gestion des races à couleur imposée
  let colorDesc = coat_color || 'bay';
  if (ALWAYS_BLACK_BREEDS.includes(breed)) {
    colorDesc = 'solid jet black, no other color';
  } else if (ALWAYS_GREY_BREEDS.includes(breed)) {
    colorDesc = 'light grey to white (Camargue grey)';
  } else if (ALWAYS_CHESTNUT_FLAXEN_BREEDS.includes(breed)) {
    colorDesc = 'chestnut with a flaxen cream-white mane and tail';
  }

  // Gestion des croisements
  const isCross = isCrossbreed(breed);
  let breedDesc;
  let breedLabel;

  if (isCross) {
    // Pas de descripteur racial précis, on utilise un cheval générique
    breedDesc = BREED_DESCRIPTORS['default'].body;
    breedLabel = 'horse of unknown mixed origins, no specific breed characteristics, generic horse';
  } else {
    const desc = BREED_DESCRIPTORS[breed] || BREED_DESCRIPTORS['default'];
    breedDesc = desc.body;
    breedLabel = `${breed} breed horse`;
  }

  const sexLabel = ageStage.stage === 'foal'
    ? (sex === 'male' ? 'male colt foal' : 'female filly foal')
    : ageStage.stage === 'yearling'
      ? (sex === 'male' ? 'young male horse' : 'young female horse')
      : (sex === 'male' ? 'stallion' : 'mare');

  const markingsDesc = markings
    ? `The horse has these exact coat markings which must be carefully preserved: ${markings}.`
    : '';

  // Traits morphologiques individuels (si fournis et cheval adulte)
  let morphologyHints = '';
  if (morphology && morphology.length > 0 && ageStage.stage === 'adult') {
    // On traduit uniquement les traits visuels pertinents en anglais pour le prompt
    const visualMorphMap = {
      'epaules_inclinees': 'clearly sloped well-angled shoulders',
      'dos_court': 'short compact back',
      'jarrets_puissants': 'very powerful well-angulated hocks',
      'encolure_arquee': 'naturally well-arched elegant neck',
      'poitrine_large': 'very wide deep chest',
      'aplombs_parfaits': 'very correct straight limb alignment',
    };
    const hints = morphology.map(t => visualMorphMap[t]).filter(Boolean);
    if (hints.length > 0) morphologyHints = `Individual physical traits to highlight: ${hints.join(', ')}.`;
  }

  return `Professional equine photography of a ${colorDesc} ${sexLabel}. ${breedLabel}. ${breedDesc}. ${ageStage.desc}. ${markingsDesc} ${morphologyHints} Full body side view showing the complete horse from head to tail, natural outdoor lighting, green meadow or pasture background, sharp focus, high resolution realistic equine photography, no text, no watermark, no humans. The coat color must be exactly ${colorDesc}.`.trim();
}

/**
 * Extrait une description simple des marquages à partir du coat_color et du genotype.
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

/**
 * Retourne le label d'âge à afficher (FR)
 */
export function getAgeStageLabel(age) {
  return getAgeStageDescription(age || 0).labelFR;
}

/**
 * Retourne la race à afficher sur le profil public (masque les croisements)
 */
export function getDisplayBreed(breed) {
  if (isCrossbreed(breed)) return 'Origines constatées';
  return breed;
}