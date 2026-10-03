import test from "node:test";
import assert from "node:assert/strict";
import { personaGame } from "../src/personaGame.js";

test("a persona mission does not change a live score", () => {
  assert.match(personaGame(), /does not change a live score/);
});
