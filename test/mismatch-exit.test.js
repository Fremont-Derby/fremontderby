import test from "node:test";
import assert from "node:assert/strict";
import { mismatchExit } from "../src/mismatchExit.js";

test("a mismatch does not add another rack", () => {
  assert.match(mismatchExit(), /Do not add another rack/);
});
