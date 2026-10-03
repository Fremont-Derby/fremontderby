import test from "node:test";
import assert from "node:assert/strict";
import { completion } from "../src/completion.js";

test("an unfinished mission says it is not complete", () => {
  assert.match(completion(false), /not complete/);
});
