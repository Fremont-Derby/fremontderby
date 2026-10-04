import test from "node:test";
import assert from "node:assert/strict";
import { bothTeams } from "../src/bothTeams.js";

test("score validation needs both teams", () => {
  assert.match(bothTeams({ home: true }), /both teams/);
});
