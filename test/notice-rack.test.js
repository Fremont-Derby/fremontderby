import test from "node:test";
import assert from "node:assert/strict";
import { noticeRack } from "../src/noticeRack.js";

test("a notice comes before the disputed rack", () => {
  assert.match(noticeRack({}), /Serve the notice/);
});
