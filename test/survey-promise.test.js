import test from "node:test";
import assert from "node:assert/strict";
import { surveyPromise } from "../src/surveyPromise.js";

test("the survey does not change the score", () => {
  assert.match(surveyPromise(), /does not change the score/);
});
