import test from "node:test";
import assert from "node:assert/strict";
import { statusWord } from "../src/statusWord.js";

test("a mismatch names the word", () => {
  assert.match(statusWord("mismatch"), /Mismatch/);
});
