import test from "node:test";
import assert from "node:assert/strict";
import { sessionLine } from "../src/sessionLine.js";

test("an expired session keeps the unsaved rack", () => {
  assert.match(sessionLine(), /unsaved rack/);
});
