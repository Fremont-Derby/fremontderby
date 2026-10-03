import test from "node:test";
import assert from "node:assert/strict";
import { auditEmpty, scoreDrive } from "../src/scoreDrive.js";

test("a failed live score names the written backup", () => {
  assert.match(scoreDrive({ failed: true }).text, /write the result down/);
});

test("an empty audit list names a season", () => {
  assert.match(auditEmpty().text, /Open a season/);
});
