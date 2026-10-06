import assert from "node:assert/strict";
import { test } from "node:test";
import { nameFromColor, parseColorList } from "./accent-color.js";

test("parseColorList splits, trims, and drops empty entries", () => {
  assert.deepEqual(parseColorList("#f97316,#38bdf8,#00ff41"), ["#f97316", "#38bdf8", "#00ff41"]);
  assert.deepEqual(parseColorList(" #ffffff , #000000 "), ["#ffffff", "#000000"]);
  assert.deepEqual(parseColorList("#fff,,#000"), ["#fff", "#000"]);
});

test("parseColorList returns an empty array for missing/blank input", () => {
  assert.deepEqual(parseColorList(null), []);
  assert.deepEqual(parseColorList(undefined), []);
  assert.deepEqual(parseColorList(""), []);
  assert.deepEqual(parseColorList("   "), []);
});

test("nameFromColor buckets known hues into friendly names", () => {
  assert.equal(nameFromColor("#f97316"), "Orange");
  assert.equal(nameFromColor("#38bdf8"), "Blue");
  assert.equal(nameFromColor("#00ff41"), "Green");
  assert.equal(nameFromColor("#ef4444"), "Red");
  assert.equal(nameFromColor("#a855f7"), "Purple");
});

test("nameFromColor calls low-saturation colors Gray", () => {
  assert.equal(nameFromColor("#888888"), "Gray");
  assert.equal(nameFromColor("#ffffff"), "Gray");
  assert.equal(nameFromColor("#000000"), "Gray");
});
