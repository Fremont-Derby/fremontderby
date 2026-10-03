import test from "node:test";
import assert from "node:assert/strict";
import { labelIntegrity } from "../src/labelIntegrity.js";

test("a card keeps one agent label", () => {
  assert.match(labelIntegrity(["agent:dru", "agent:jfl"]), /one agent label/);
});
