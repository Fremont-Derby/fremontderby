import test from "node:test";
import assert from "node:assert/strict";
import { lineupFixture } from "../src/lineupFixture.js";

test("a live score check needs both lineup fixtures", () => {
  assert.match(lineupFixture({ home: true }), /both lineup fixtures/);
});
