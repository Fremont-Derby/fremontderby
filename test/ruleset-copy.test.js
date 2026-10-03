import test from "node:test";
import assert from "node:assert/strict";
import { rulesetCopy, validationData } from "../src/rulesetCopy.js";

test("a ruleset names the required check", () => {
  assert.match(rulesetCopy("DRU").text, /required check/);
});

test("validation data cannot use a real league season", () => {
  assert.equal(validationData({ purpose: "league" }).ok, false);
});
