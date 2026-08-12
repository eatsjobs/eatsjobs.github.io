export const RETRO8_PALETTE = [
  [20, 12, 28],
  [68, 36, 52],
  [48, 52, 109],
  [78, 74, 78],
  [133, 76, 48],
  [82, 129, 43],
  [172, 148, 89],
  [217, 87, 99],
];

export function nearestPaletteColor(r, g, b, palette = RETRO8_PALETTE) {
  let best = palette[0];
  let bestDist = Infinity;
  for (const candidate of palette) {
    const [pr, pg, pb] = candidate;
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best;
}
