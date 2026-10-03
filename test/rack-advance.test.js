import test from "node:test";
import assert from "node:assert/strict";
import { lineupLock, rackAdvance } from "../src/rackAdvance.js";

test("a rack win must advance the score", () => {
  assert.match(rackAdvance({ before: 1, after: 1 }).text, /must advance/);
});

test("one lineup does not lock the match", () => {
  assert.equal(lineupLock({ home: true, away: false }).locked, false);
});
