import test from "node:test";
import assert from "node:assert/strict";
import { laneBuild, publicPullIsolation } from "../src/laneBuild.js";

test("a lane cannot build with another profile", () => {
  assert.equal(laneBuild({ lane: "DRU", profile: "production" }).ok, false);
});

test("a public pull request cannot start a lane build", () => {
  assert.equal(publicPullIsolation({ fromFork: true }).ok, false);
});
