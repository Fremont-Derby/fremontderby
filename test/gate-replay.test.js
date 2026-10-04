import test from "node:test";
import assert from "node:assert/strict";
import { gateReplay, rulesetJson } from "../src/gateReplay.js";

test("an unpassed gate must be replayed", () => {
  assert.match(gateReplay({ gate: "Score", passed: false }).text, /Replay it/);
});

test("an empty ruleset copy names the lanes", () => {
  assert.match(rulesetJson([]).text, /Main, Gamma, and JFL/);
});
