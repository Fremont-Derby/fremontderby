import test from "node:test";
import assert from "node:assert/strict";
import { restampLine } from "../src/restampLine.js";

test("a lane must not be restamped as production", () => {
  assert.match(restampLine("DRU"), /must not be restamped/);
});
