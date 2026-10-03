import test from "node:test";
import assert from "node:assert/strict";
import { playerIdentity } from "../src/playerIdentity.js";

test("a mission names the player", () => {
  assert.match(playerIdentity(""), /Name the player/);
});
