import test from "node:test";
import assert from "node:assert/strict";
import { refreshLine } from "../src/refreshLine.js";

test("the score page names the refresh wait", () => {
  assert.match(refreshLine(), /wait for Saved/);
});
