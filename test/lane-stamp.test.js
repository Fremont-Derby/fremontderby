import test from "node:test";
import assert from "node:assert/strict";
import { deployCommand, laneStamp } from "../src/laneStamp.js";

test("a lane must not be restamped as production", () => {
  assert.equal(laneStamp({ lane: "DRU", stamped: "production" }).ok, false);
});

test("a deploy command stays on the lane branch", () => {
  assert.match(deployCommand("DRU").text, /branch command/);
});
