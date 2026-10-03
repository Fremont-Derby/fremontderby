import test from "node:test";
import assert from "node:assert/strict";
import { ownBuild } from "../src/ownBuild.js";

test("a lane build does not restamp another lane", () => {
  assert.match(ownBuild("DRU"), /does not restamp/);
});
