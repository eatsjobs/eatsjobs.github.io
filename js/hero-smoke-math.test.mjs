import assert from "node:assert/strict";
import { test } from "node:test";
import {
  gridSize,
  isSmokeActive,
  parseCssColor,
  pointerToUv,
  splatForce,
} from "./hero-smoke-math.js";

test("parseCssColor reads the rgb() form a registered --accent computes to", () => {
  assert.deepEqual(parseCssColor("rgb(249, 115, 22)"), [249 / 255, 115 / 255, 22 / 255]);
  assert.deepEqual(parseCssColor(" rgb(0 255 65) "), [0, 1, 65 / 255]);
  assert.deepEqual(parseCssColor("rgba(249, 115, 22, 0.5)"), [249 / 255, 115 / 255, 22 / 255]);
});

test("parseCssColor reads hex, the form an unregistered --accent keeps", () => {
  assert.deepEqual(parseCssColor("#38bdf8"), [56 / 255, 189 / 255, 248 / 255]);
});

test("parseCssColor returns null for anything it can't read", () => {
  assert.equal(parseCssColor(""), null);
  assert.equal(parseCssColor("color(display-p3 1 0 0)"), null);
  assert.equal(parseCssColor("#fff"), null);
});

test("pointerToUv maps a client position to 0-1 across the hero", () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };
  assert.deepEqual(pointerToUv(150, 75, rect), [0.25, 0.25]);
  assert.deepEqual(pointerToUv(300, 150, rect), [1, 1]);
});

// Coordinates are powers of two so the expected forces are exact.
test("splatForce pushes equally hard for equal on-screen moves on a wide hero", () => {
  // aspect 2: moving 0.125 across covers as much screen as moving 0.25 down
  assert.deepEqual(splatForce([0.25, 0.5], [0.375, 0.5], 2, 1000), [125, 0]);
  assert.deepEqual(splatForce([0.5, 0.25], [0.5, 0.5], 2, 1000), [0, 125]);
});

test("splatForce pushes equally hard for equal on-screen moves on a tall hero", () => {
  // aspect 0.5: moving 0.25 across covers as much screen as moving 0.125 down
  assert.deepEqual(splatForce([0.25, 0.5], [0.5, 0.5], 0.5, 1000), [125, 0]);
  assert.deepEqual(splatForce([0.5, 0.25], [0.5, 0.375], 0.5, 1000), [0, 125]);
});

test("gridSize keeps the short side at the given resolution", () => {
  assert.deepEqual(gridSize(128, 1600, 800), [256, 128]);
  assert.deepEqual(gridSize(128, 800, 1600), [128, 256]);
  assert.deepEqual(gridSize(128, 1000, 1000), [128, 128]);
});

test("isSmokeActive stays on shortly after the mouse moved", () => {
  assert.equal(isSmokeActive({ now: 11_000, lastMoveAt: 10_000, isVisible: true }), true);
});

test("isSmokeActive switches off once the mouse has been still for a while", () => {
  assert.equal(isSmokeActive({ now: 70_000, lastMoveAt: 10_000, isVisible: true }), false);
  assert.equal(isSmokeActive({ now: 1_000, lastMoveAt: -Infinity, isVisible: true }), false);
});

test("isSmokeActive switches off while the hero is out of view", () => {
  assert.equal(isSmokeActive({ now: 11_000, lastMoveAt: 10_000, isVisible: false }), false);
});
