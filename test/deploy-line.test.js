import test from "node:test";
import assert from "node:assert/strict";
import { deployLine } from "../src/deployLine.js";

test("a deploy line names the lane branch", () => {
  assert.match(deployLine("DRU"), /own branch command/);
});
