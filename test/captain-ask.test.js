import test from "node:test";
import assert from "node:assert/strict";
import { captainAsk } from "../src/captainAsk.js";

test("a lineup change asks the captain", () => {
  assert.match(captainAsk(""), /Ask the captain/);
});
