import test from "node:test";
import assert from "node:assert/strict";
import { fargoReport, leftoverPage } from "../src/uiCoherence.js";

test("a leftover page names the schedule", () => {
  assert.match(leftoverPage("Audit").text, /schedule/);
});

test("a missing Fargo id names the next action", () => {
  assert.match(fargoReport({}).text, /Add it/);
});
