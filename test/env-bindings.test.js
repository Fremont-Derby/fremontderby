import test from "node:test";
import assert from "node:assert/strict";
import { envBindings, onionEpic } from "../src/envBindings.js";

test("a lane cannot use another schema", () => {
  assert.equal(envBindings({ lane: "DRU", schema: "gamma" }).ok, false);
});

test("the onion epic is not the proof", () => {
  assert.match(onionEpic().text, /own proof/);
});
