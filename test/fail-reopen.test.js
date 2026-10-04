import test from "node:test";
import assert from "node:assert/strict";
import { failReopen, sharedShell } from "../src/failReopen.js";

test("a human fail keeps the gate open", () => {
  assert.equal(failReopen({ verdict: "fail", gate: "Score" }).open, true);
});

test("a page names the shared shell", () => {
  assert.match(sharedShell("Playoffs").text, /Schedule/);
});
