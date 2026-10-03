import test from "node:test";
import assert from "node:assert/strict";
import { personaLane } from "../src/personaLane.js";

test("a persona mission does not replace a live race", () => {
  assert.match(personaLane(), /does not replace a live race/);
});
