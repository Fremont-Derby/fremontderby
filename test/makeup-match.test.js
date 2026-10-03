import test from "node:test";
import assert from "node:assert/strict";
import { makeupMatch } from "../src/makeupMatch.js";

test("a makeup match names both teams", () => {
  assert.match(makeupMatch(false), /Name both teams/);
});
