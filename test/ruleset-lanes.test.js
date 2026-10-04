import test from "node:test";
import assert from "node:assert/strict";
import { rulesetLanes } from "../src/rulesetLanes.js";

test("an empty ruleset copy names the lanes", () => {
  assert.match(rulesetLanes([]), /Main, Gamma, and JFL/);
});
