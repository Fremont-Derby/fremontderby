import test from "node:test";
import assert from "node:assert/strict";
import { forkBuild } from "../src/forkBuild.js";

test("a public pull request cannot start a lane build", () => {
  assert.match(forkBuild(true), /cannot start a lane build/);
});
