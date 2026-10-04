import test from "node:test";
import assert from "node:assert/strict";
import { captainPhone, readOnlyMode } from "../src/readOnlyMode.js";

test("read-only mode names a later refresh", () => {
  assert.match(readOnlyMode({ enabled: true, reason: "incident" }).text, /Refresh later/);
});

test("a captain does not see the phone", () => {
  assert.equal(captainPhone({ viewer: "captain" }).show, false);
});
