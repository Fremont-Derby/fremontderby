import test from "node:test";
import assert from "node:assert/strict";
import { acceptedWinnerSide } from "../src/druScoreOpen.js";

test("an opened match still accepts a winner side", () => {
  assert.equal(acceptedWinnerSide("B"), "B");
});
