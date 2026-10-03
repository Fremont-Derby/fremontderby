import test from "node:test";
import assert from "node:assert/strict";
import { missionStep } from "../src/missionStep.js";

test("a mission names itself before the step", () => {
  assert.match(missionStep(""), /Name the mission/);
});
