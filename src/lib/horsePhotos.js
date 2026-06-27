// Lightweight horse photos by coat color category — Unsplash CDN, no API key, no credits
// Each entry: array of photo IDs; pick deterministically by horse id hash
const PARAMS = "?w=400&h=400&fit=crop&q=70&auto=format";

const PHOTO_IDS = {
  // Bay — brown body, black mane/tail
  bay: [
    "photo-1595675759778-dcfbbc6629bd",
    "flagged/photo-1568379862828-8c413c4cc981",
    "photo-1640744367492-183192f5d356",
    "flagged/photo-1568380277404-2c76d21ff9a9",
    "photo-1733100911277-53de988c0a74",
  ],
  // Chestnut / Sorrel — reddish brown all over
  chestnut: [
    "photo-1514861889637-9f51bc99fc19",
    "flagged/photo-1557296126-953ce119454c",
    "photo-1573751056139-2ab65b6b03be",
    "photo-1504310977373-186d29f99322",
    "flagged/photo-1557296126-ae91316e5746",
    "photo-1605138673093-e333752f46df",
  ],
  // Black
  black: [
    "photo-1566762492163-271805d66b63",
    "photo-1670212433014-b2435aca06a4",
    "photo-1578616660168-00c572ede4ff",
  ],
  // Grey / White
  grey: [
    "photo-1641226469021-f81abb75108c",
    "photo-1645688917394-cfc228b20324",
    "photo-1588424978994-25105f27bb92",
    "photo-1654139799808-5ca3226cf92d",
    "photo-1654609346025-5b50ec12324d",
    "photo-1751715773655-2140695a3a9b",
  ],
  // Palomino — golden body, white mane
  palomino: [
    "photo-1657150946362-3aee0bbc8163",
    "photo-1657150938812-5795362bc0d9",
    "photo-1665900487465-2b8e7894bfc7",
    "photo-1665900487324-97ac2c874da9",
    "photo-1751716213075-29ad825f0bc6",
  ],
  // Buckskin — tan/yellow body, black mane
  buckskin: [
    "photo-1612404082219-0db5129f0e5a",
    "photo-1595675759825-6b73f7b37cda",
  ],
  // Pinto / Paint — patches of white + color
  pinto: [
    "photo-1598974357801-cbca100e65d3",
    "photo-1610315311683-ef1706f00523",
  ],
};

// Determine coat color category from genotype (mirrors HorseVisualizer logic)
export function getCoatCategory(genotype) {
  if (!genotype) return "bay";

  const isBlack = genotype.extension !== "ee";
  const hasAgouti = genotype.agouti !== "aa";
  const hasCream = genotype.cream === "Crn";
  const doubleCream = genotype.cream === "CrCr";
  const isGrey = genotype.grey === "GG" || genotype.grey === "Gg";
  const hasTobiano = genotype.tobiano && genotype.tobiano !== "nn";

  if (isGrey) return "grey";
  if (hasTobiano) return "pinto";
  if (doubleCream) return isBlack ? "grey" : "palomino";
  if (!isBlack) {
    // Chestnut family
    if (hasCream) return "palomino";
    return "chestnut";
  }
  if (hasAgouti) {
    // Bay family
    if (hasCream) return "buckskin";
    return "bay";
  }
  // Black family
  if (hasCream) return "black";
  return "black";
}

// Deterministic hash from horse id → stable photo pick
function hashId(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getHorsePhotoUrl(genotype, horseId = "") {
  const category = getCoatCategory(genotype);
  const ids = PHOTO_IDS[category] || PHOTO_IDS.bay;
  const pick = ids[hashId(horseId) % ids.length];
  return `https://images.unsplash.com/${pick}${PARAMS}`;
}