import test from "node:test";
import assert from "node:assert/strict";
import { bindingNote } from "../src/bindingNote.js";

test("a lane must keep its own binding", () => {
  assert.match(bindingNote("DRU"), /own Supabase binding/);
});
