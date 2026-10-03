import test from "node:test";
import assert from "node:assert/strict";
import { selectedSide } from "../src/selectedSide.js";

test("a selected side is named", () => {
  assert.equal(selectedSide("A"), "Selected side A.");
});
