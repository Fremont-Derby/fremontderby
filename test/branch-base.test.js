import test from "node:test";
import assert from "node:assert/strict";
import { branchBase } from "../src/branchBase.js";

test("a DRU request names its branch base", () => {
  assert.match(branchBase("DRU"), /fremontderby-dru/);
});
