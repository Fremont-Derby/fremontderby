import test from "node:test";
import assert from "node:assert/strict";
import { staleSecret } from "../src/staleSecret.js";

test("a stale override secret is named before deploy", () => {
  assert.match(staleSecret({ name: "DRU_OVERRIDE", ageDays: 9 }), /Remove it/);
});
