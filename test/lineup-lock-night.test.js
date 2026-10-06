import test from "node:test";
import assert from "node:assert/strict";
import { lineupLockNight } from "../src/lineupLockNight.js";

test("three players can lock", () => {
  assert.match(lineupLockNight(3), /can lock/);
});
