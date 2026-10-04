import test from "node:test";
import assert from "node:assert/strict";
import { tapTarget } from "../src/tapTarget.js";

test("a tap target names the button", () => {
  assert.match(tapTarget("Save rack"), /button/);
});
