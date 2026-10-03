import test from "node:test";
import assert from "node:assert/strict";
import { weekPass } from "../src/weekPass.js";

test("an open week does not name a winner", () => {
  assert.match(weekPass(false), /Do not name a winner/);
});
