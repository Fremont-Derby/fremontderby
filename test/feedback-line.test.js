import test from "node:test";
import assert from "node:assert/strict";
import { feedbackLine } from "../src/feedbackLine.js";

test("tester feedback names the lane", () => {
  assert.match(feedbackLine("DRU"), /DRU/);
});
