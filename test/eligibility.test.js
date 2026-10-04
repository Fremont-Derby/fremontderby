import test from "node:test";
import assert from "node:assert/strict";
import { eligibility } from "../src/eligibility.js";

test("a player sees when they are not eligible", () => {
  assert.match(eligibility(false), /not eligible/);
});
