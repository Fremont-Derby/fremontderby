import test from "node:test";
import assert from "node:assert/strict";
import { disputeLine } from "../src/disputeLine.js";

test("a dispute is not the race result", () => {
  assert.match(disputeLine(), /not the race result/);
});
