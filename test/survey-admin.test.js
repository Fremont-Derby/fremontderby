import test from "node:test";
import assert from "node:assert/strict";
import { surveyAdmin } from "../src/surveyAdmin.js";

test("survey results stay admin only", () => {
  assert.match(surveyAdmin(false), /admin only/);
});
