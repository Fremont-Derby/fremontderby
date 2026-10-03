import test from "node:test";
import assert from "node:assert/strict";
import { throttleNote } from "../src/throttleNote.js";

test("throttling stays a human step", () => {
  assert.match(throttleNote(), /human step/);
});
