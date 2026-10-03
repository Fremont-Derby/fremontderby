import test from "node:test";
import assert from "node:assert/strict";
import { checkName } from "../src/checkName.js";

test("a missing check is named before merge", () => {
  assert.match(checkName(""), /Name the required check/);
});
