import test from "node:test";
import assert from "node:assert/strict";
import { auditFields, canaryStatus } from "../src/auditFields.js";

test("a privileged change needs a reason", () => {
  assert.equal(auditFields({ actor: "admin", before: "a", after: "b" }).ok, false);
});

test("a failed canary names the lane", () => {
  assert.match(canaryStatus({ ok: false }).text, /Check the lane/);
});
