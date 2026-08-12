import assert from "node:assert/strict";
import { test } from "node:test";
import { quantizeFrame } from "./pixel-cam-quantize.js";

test("quantizes a 2x1 buffer to the nearest retro-8 colors", () => {
  // pixel 0: near-black -> [20,12,28]; pixel 1: near-pink -> [217,87,99]
  const src = new Uint8ClampedArray([
    5,
    5,
    5,
    255,
    210,
    90,
    95,
    128, // alpha should be forced to 255 regardless of input
  ]);
  const out = quantizeFrame(src, 2, 1);
  assert.deepEqual(Array.from(out), [20, 12, 28, 255, 217, 87, 99, 255]);
});

test("output buffer is the same length as the input", () => {
  const src = new Uint8ClampedArray(4 * 4 * 4);
  const out = quantizeFrame(src, 4, 4);
  assert.equal(out.length, src.length);
});

test("a low-contrast, muddy pixel snaps to a punchier palette color once boosted", () => {
  // (100, 110, 90) is nearest (unboosted) to the dull gray [78, 74, 78], but
  // contrast+saturation boosting before matching pushes it to the greener,
  // more saturated [82, 129, 43] instead — this is the "more defined" fix.
  const src = new Uint8ClampedArray([100, 110, 90, 255]);
  const out = quantizeFrame(src, 1, 1);
  assert.deepEqual(Array.from(out), [82, 129, 43, 255]);
});
