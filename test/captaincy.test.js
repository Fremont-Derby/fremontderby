import test from "node:test";
import assert from "node:assert/strict";
import { captaincy } from "../src/captaincy.js";

test("a transfer names the new captain", () => {
  assert.match(captaincy(""), /Name the new captain/);
});
