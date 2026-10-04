import test from "node:test";
import assert from "node:assert/strict";
import { abortMission } from "../src/abortMission.js";

test("abort does not save a score", () => {
  assert.match(abortMission(), /does not save a score/);
});
