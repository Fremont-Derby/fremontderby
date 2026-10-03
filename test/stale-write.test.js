import test from "node:test";
import assert from "node:assert/strict";
import { impossibleState, staleWrite } from "../src/staleWrite.js";

test("a stale page names a refresh", () => {
  assert.match(staleWrite({ revision: "1", current: "2" }).text, /Refresh/);
});

test("a retry does not add a second result", () => {
  assert.match(staleWrite({ retry: true }).text, /does not add a second result/);
});

test("a scheduled race cannot already have racks", () => {
  assert.equal(impossibleState({ status: "scheduled", racks: 2 }).ok, false);
});
