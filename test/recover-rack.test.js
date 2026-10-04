import test from "node:test";
import assert from "node:assert/strict";
import { recoverRack } from "../src/recoverRack.js";

test("a bad rack can be undone", () => {
  assert.match(recoverRack(), /Undo the last rack/);
});
