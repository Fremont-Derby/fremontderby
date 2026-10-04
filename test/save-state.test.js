import test from "node:test";
import assert from "node:assert/strict";
import { saveState } from "../src/saveState.js";

test("a failed save says to try again", () => {
  assert.match(saveState("failed"), /Try again/);
});
