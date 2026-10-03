import test from "node:test";
import assert from "node:assert/strict";
import { privacyList, roleBoundary } from "../src/privacyList.js";

test("the privacy list does not include a phone value", () => {
  assert.equal(privacyList().text.includes("555"), false);
});

test("a player cannot open an admin tool", () => {
  assert.equal(roleBoundary({ role: "player", action: "open admin" }).ok, false);
});
