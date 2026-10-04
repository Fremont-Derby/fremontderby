import test from "node:test";
import assert from "node:assert/strict";
import { adminHealth } from "../src/adminHealth.js";

test("a failed admin health names the exception", () => {
  assert.match(adminHealth({ ok: false }), /Name the exception/);
});
