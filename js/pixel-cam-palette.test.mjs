import { test } from "node:test";
import assert from "node:assert/strict";
import { RETRO8_PALETTE, nearestPaletteColor } from "./pixel-cam-palette.js";

test("palette has exactly 8 colors", () => {
  assert.equal(RETRO8_PALETTE.length, 8);
});

test("an exact palette color matches itself", () => {
  for (const color of RETRO8_PALETTE) {
    assert.deepEqual(nearestPaletteColor(color[0], color[1], color[2]), color);
  }
});

test("a color nudged slightly off-palette still matches its nearest neighbor", () => {
  // [217, 87, 99] is the palette's pink; a small nudge should still win over
  // every other entry (nearest palette entries are far away by comparison).
  assert.deepEqual(nearestPaletteColor(210, 90, 95), [217, 87, 99]);
});

test("pure black matches the darkest palette entry", () => {
  assert.deepEqual(nearestPaletteColor(0, 0, 0), [20, 12, 28]);
});
