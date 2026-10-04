import test from "node:test";
import assert from "node:assert/strict";
import { finalLock, releaseReady } from "../src/finalLock.js";

test("a player cannot edit a finalized result", () => {
  assert.equal(finalLock({ status: "finalized", viewer: "player" }).ok, false);
});

test("an open gate blocks release", () => {
  assert.equal(releaseReady([{ name: "Score", passed: false }]).ok, false);
});
