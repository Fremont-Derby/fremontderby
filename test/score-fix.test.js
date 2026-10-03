import test from "node:test";
import assert from "node:assert/strict";
import { scoreFix } from "../src/scoreFix.js";

test("a mismatch asks a captain to fix the rack", () => {
  assert.match(scoreFix(false), /captain must fix/);
});
