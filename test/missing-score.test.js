import test from "node:test";
import assert from "node:assert/strict";
import { missingScore } from "../src/missingScore.js";

test("a missing score date says it is not on the list", () => {
  assert.match(missingScore({}), /date is not on the list/);
});

test("a missing score link says it is not on the list", () => {
  assert.match(missingScore({ date: "Oct 3" }), /link is not on the list/);
});
