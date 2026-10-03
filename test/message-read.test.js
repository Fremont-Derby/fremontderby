import test from "node:test";
import assert from "node:assert/strict";
import { messageRead } from "../src/messageRead.js";

test("a message is read before it is sent", () => {
  assert.match(messageRead({}), /Read the message/);
});
