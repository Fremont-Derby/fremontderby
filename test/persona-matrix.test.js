import test from "node:test";
import assert from "node:assert/strict";
import { personaMatrix, workersBuild } from "../src/personaMatrix.js";

test("an empty tester list names the minimum", () => {
  assert.match(personaMatrix([]).text, /captain and a player/);
});

test("a lane build does not restamp another lane", () => {
  assert.match(workersBuild("DRU").text, /does not restamp/);
});
