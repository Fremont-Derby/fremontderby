import test from "node:test";
import assert from "node:assert/strict";
import { levelResult } from "../src/levelResult.js";

test("an unfinished level does not submit", () => {
  assert.match(levelResult(false), /Do not submit/);
});
