import test from "node:test";
import assert from "node:assert/strict";
import { profileNote } from "../src/profileNote.js";

test("profile polish waits for a human retest", () => {
  assert.match(profileNote(), /human retests/);
});
