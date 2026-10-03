import test from "node:test";
import assert from "node:assert/strict";
import { adminSeasonEmpty, messageWheel } from "../src/messageWheel.js";

test("an overflowing message list takes the wheel", () => {
  assert.equal(messageWheel({ overflow: true, delta: 20 }).scroll, true);
});

test("an empty season list names setup", () => {
  assert.match(adminSeasonEmpty().text, /season setup/);
});
