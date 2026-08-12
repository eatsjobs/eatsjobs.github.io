import { nearestPaletteColor } from "./pixel-cam-palette.js";

const CONTRAST_FACTOR = 1.6;
const SATURATION_FACTOR = 1.35;

function clamp255(value) {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}

// Push each pixel's contrast and saturation up before palette matching, so
// low-contrast camera input snaps to punchier, more distinct retro-8 colors
// instead of muddy ones.
function boostContrast(r, g, b) {
  const br = clamp255((r - 128) * CONTRAST_FACTOR + 128);
  const bg = clamp255((g - 128) * CONTRAST_FACTOR + 128);
  const bb = clamp255((b - 128) * CONTRAST_FACTOR + 128);
  const lum = 0.299 * br + 0.587 * bg + 0.114 * bb;
  return [
    clamp255(lum + (br - lum) * SATURATION_FACTOR),
    clamp255(lum + (bg - lum) * SATURATION_FACTOR),
    clamp255(lum + (bb - lum) * SATURATION_FACTOR),
  ];
}

export function quantizeFrame(srcData, width, height) {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const [br, bg, bb] = boostContrast(srcData[o], srcData[o + 1], srcData[o + 2]);
    const [r, g, b] = nearestPaletteColor(br, bg, bb);
    out[o] = r;
    out[o + 1] = g;
    out[o + 2] = b;
    out[o + 3] = 255;
  }
  return out;
}
