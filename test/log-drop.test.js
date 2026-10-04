import test from "node:test";
import assert from "node:assert/strict";
import { logDrop } from "../src/logDrop.js";

test("a log drop omits a phone", () => {
  const line = logDrop({ action: "save", lane: "DRU", phone: "5550100" });
  assert.equal(Object.hasOwn(line, "phone"), false);
});
