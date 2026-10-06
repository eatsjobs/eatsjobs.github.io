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

export function nameFromColor(hex) {
  const [h, s] = rgbToHsl(...hexToRgb(hex));
  if (s < 12) {
    return "Gray";
  }
  const bucket = HUE_NAMES.find(([maxHue]) => h <= maxHue);
  return bucket ? bucket[1] : "Red";
}
