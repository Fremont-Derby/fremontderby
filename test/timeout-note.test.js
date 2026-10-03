import test from "node:test";
import assert from "node:assert/strict";
import { timeoutNote } from "../src/timeoutNote.js";

test("a restart says to check the player save", () => {
  assert.match(timeoutNote({ killed: true }), /failed save/);
});
