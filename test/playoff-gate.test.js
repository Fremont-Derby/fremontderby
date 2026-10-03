import test from "node:test";
import assert from "node:assert/strict";
import { playoffGate } from "../src/playoffGate.js";

test("playoffs wait for the weeks", () => {
  assert.match(playoffGate(false), /Finish the weeks/);
});
