import test from "node:test";
import assert from "node:assert/strict";
import { fieldList } from "../src/fieldList.js";

test("the field list has no phone value", () => {
  assert.equal(fieldList().includes("555"), false);
});
