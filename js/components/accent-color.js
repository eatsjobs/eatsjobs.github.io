const LIGHT_BACKGROUND = "#f8fafc";
const MIN_CONTRAST = 4.5;

const HUE_NAMES = [
  [14, "Red"],
  [45, "Orange"],
  [68, "Yellow"],
  [165, "Green"],
  [190, "Teal"],
  [255, "Blue"],
  [285, "Purple"],
  [325, "Pink"],
  [345, "Rose"],
  [360, "Red"],
];

export function parseColorList(value) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.substring(0, 2), 16),
    Number.parseInt(normalized.substring(2, 4), 16),
    Number.parseInt(normalized.substring(4, 6), 16),
  ];
}

function rgbToHex(r, g, b) {
  const toHex = (value) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }
  return [h, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb;
  if (h < 60) {
    rgb = [c, x, 0];
  } else if (h < 120) {
    rgb = [x, c, 0];
  } else if (h < 180) {
    rgb = [0, c, x];
  } else if (h < 240) {
    rgb = [0, x, c];
  } else if (h < 300) {
    rgb = [x, 0, c];
  } else {
    rgb = [c, 0, x];
  }
  return rgb.map((value) => (value + m) * 255);
}

function channelLuminance(channel) {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

// Keeps the input's hue, floors saturation so muted colors still read as
// punchy, then walks lightness down until it clears WCAG AA (4.5:1) against
// the site's light background - so any accent color works without a
// hand-picked "on light" pair.
export function deriveAccentOnLight(hex, background = LIGHT_BACKGROUND) {
  const [h, s] = rgbToHsl(...hexToRgb(hex));
  const boostedS = Math.max(s, 55);
  let l = 45;
  let candidate = rgbToHex(...hslToRgb(h, boostedS, l));
  while (contrastRatio(candidate, background) < MIN_CONTRAST && l > 5) {
    l -= 1;
    candidate = rgbToHex(...hslToRgb(h, boostedS, l));
  }
  return candidate;
}

export function nameFromColor(hex) {
  const [h, s] = rgbToHsl(...hexToRgb(hex));
  if (s < 12) {
    return "Gray";
  }
  const bucket = HUE_NAMES.find(([maxHue]) => h <= maxHue);
  return bucket ? bucket[1] : "Red";
}
