import test from "node:test";
import assert from "node:assert/strict";
import { levelSubmit } from "../src/levelSubmit.js";

test("an unfinished level keeps submit off", () => {
  assert.match(levelSubmit(false), /stays off/);
});
