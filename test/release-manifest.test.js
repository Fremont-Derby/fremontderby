import test from "node:test";
import assert from "node:assert/strict";
import { releaseManifest, reversibleGate } from "../src/releaseManifest.js";

test("an empty manifest names the missing page", () => {
  assert.match(releaseManifest([]).text, /Name the page/);
});

test("a gate can be turned off alone", () => {
  assert.match(reversibleGate("Score").text, /without turning off the rest/);
});
