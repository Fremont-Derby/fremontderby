import test from "node:test";
import assert from "node:assert/strict";
import { labelDrift } from "../src/labelDrift.js";

test("label drift says not to bulk-relabel", () => {
  assert.match(labelDrift(), /Do not bulk-relabel/);
});
