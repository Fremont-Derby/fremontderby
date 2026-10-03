import test from "node:test";
import assert from "node:assert/strict";
import { leagueAdmin, opsEmpty } from "../src/leagueAdmin.js";

test("an admin cannot open another league", () => {
  assert.equal(leagueAdmin({ viewerLeague: "a", targetLeague: "b" }).ok, false);
});

test("an empty operations list names the schedule", () => {
  assert.match(opsEmpty().text, /schedule/);
});
