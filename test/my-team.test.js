import test from "node:test";
import assert from "node:assert/strict";
import { myTeam } from "../src/myTeam.js";

test("a missing team is named", () => {
  assert.match(myTeam(""), /not on this page/);
});
