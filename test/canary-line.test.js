import test from "node:test";
import assert from "node:assert/strict";
import { canaryLine } from "../src/canaryLine.js";

test("a failed public page names the lane", () => {
  assert.match(canaryLine(false), /Check the lane/);
});
