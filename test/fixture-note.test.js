import test from "node:test";
import assert from "node:assert/strict";
import { defectCapture, fixtureNote } from "../src/fixtureNote.js";

test("a fixture cannot come from direct SQL", () => {
  assert.equal(fixtureNote({ source: "sql" }).ok, false);
});

test("a failed gate needs a reason", () => {
  assert.equal(defectCapture({ gate: "Score" }).ok, false);
});
