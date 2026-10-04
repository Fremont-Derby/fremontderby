import test from "node:test";
import assert from "node:assert/strict";
import { laneSchema } from "../src/laneSchema.js";

test("a lane cannot use another schema", () => {
  assert.match(laneSchema({ lane: "DRU", schema: "gamma" }), /cannot use/);
});
