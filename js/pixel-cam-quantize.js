import { nearestPaletteColor } from "./pixel-cam-palette.js";

export function quantizeFrame(srcData, width, height) {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const [r, g, b] = nearestPaletteColor(srcData[o], srcData[o + 1], srcData[o + 2]);
    out[o] = r;
    out[o + 1] = g;
    out[o + 2] = b;
    out[o + 3] = 255;
  }
  return out;
}
