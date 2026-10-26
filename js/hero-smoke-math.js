// Pure helpers for js/hero-smoke.js, kept apart so they can be unit tested
// without a GPU.

// With the smoke's fade rate, a thick puff is invisible about 5s after the
// last mouse move. Past this the sim stops and clears instead of animating
// an empty canvas.
const IDLE_MS = 8000;

const RGB_PATTERN = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/;
const HEX_PATTERN = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

// Returns [r, g, b] in 0-1, or null. --accent is a registered <color>, so
// its computed value is rgb(); a plain hex covers it being unregistered.
export function parseCssColor(value) {
  const color = value.trim();
  const rgb = RGB_PATTERN.exec(color);
  if (rgb) {
    return rgb.slice(1, 4).map((channel) => Number(channel) / 255);
  }
  const hex = HEX_PATTERN.exec(color);
  if (hex) {
    return hex.slice(1, 4).map((channel) => Number.parseInt(channel, 16) / 255);
  }
  return null;
}

export function pointerToUv(clientX, clientY, rect) {
  return [(clientX - rect.left) / rect.width, (clientY - rect.top) / rect.height];
}

// The sim's velocity is measured in grid cells, and a wide grid has more
// cells across than down. Scaling the longer axis keeps the push
// proportional to how far the mouse actually travelled on screen.
export function splatForce(from, to, aspect, push) {
  let dx = to[0] - from[0];
  let dy = to[1] - from[1];
  if (aspect < 1) {
    dx *= aspect;
  } else {
    dy /= aspect;
  }
  return [dx * push, dy * push];
}

export function gridSize(resolution, width, height) {
  const aspect = width / height;
  return aspect >= 1
    ? [Math.round(resolution * aspect), resolution]
    : [resolution, Math.round(resolution / aspect)];
}

export function isSmokeActive({ now, lastMoveAt, isVisible }) {
  return isVisible && now - lastMoveAt < IDLE_MS;
}
