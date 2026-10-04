import test from "node:test";
import assert from "node:assert/strict";
import { lineupLock } from "../src/lineupLock.js";

test("a locked lineup asks an admin", () => {
  assert.match(lineupLock(true), /Ask an admin/);
});
